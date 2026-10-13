import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FlashcardSession from "@/components/flashcards/FlashcardSession";
import { hasFullAccess, todayKeyEastern } from "@/lib/access";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function FlashcardSessionPage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // sessionId encodes the filters: "book__chapter" or "all" or "due"
  const [bookEncoded, chapterEncoded] = sessionId.split("__");
  let book: string | null =
    bookEncoded === "all" ? null : decodeURIComponent(bookEncoded);
  let chapter: string | null =
    chapterEncoded === "none" || !chapterEncoded
      ? null
      : decodeURIComponent(chapterEncoded);
  let isDueOnly = sessionId === "due";

  // Only this student's track (plus "both"), matching the filtering used
  // by /api/sessions and Study Mode.
  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_type, role, subscription_status, trial_ends_at, trial_extended_days")
    .eq("id", user.id)
    .single();

  // After the trial: one "card of the day", picked from the student's whole
  // track (book/chapter/due filters ignored) so switching filters or
  // refreshing can't hand out more cards.
  const fullAccess = hasFullAccess(profile);
  if (!fullAccess) {
    book = null;
    chapter = null;
    isDueOnly = false;
  }
  const examTypes = profile?.exam_type
    ? [profile.exam_type, "both"]
    : ["lieutenant", "captain", "both"];

  // Paginated with .range() — an unbounded select caps at 1000 rows by
  // default, and the unfiltered "all books" / "due" pool can exceed that.
  const PAGE_SIZE = 1000;
  let questions: any[] = [];
  let from = 0;
  while (true) {
    let query = supabase
      .from("questions")
      .select(
        `
        id, question_text, answer_a, answer_b, answer_c, answer_d,
        correct_answer, explanation, book_title, chapter, topic,
        page_start, page_end, difficulty
      `,
      )
      .eq("is_active", true)
      .eq("flashcard_eligible", true)
      .in("exam_type", examTypes)
      .range(from, from + PAGE_SIZE - 1);
    if (book) query = query.eq("book_title", book);
    if (chapter) query = query.eq("chapter", chapter);
    const { data, error } = await query;
    if (error || !data || data.length === 0) break;
    questions = questions.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  if (questions.length === 0) redirect("/flashcards");

  // Get spaced repetition progress for these questions
  const questionIds = questions.map((q) => q.id);
  const { data: progress } = await supabase
    .from("flashcard_progress")
    .select("*")
    .eq("user_id", user.id)
    .in("question_id", questionIds);

  const progressMap: Record<string, any> = {};
  for (const p of progress || []) {
    progressMap[p.question_id] = p;
  }

  // Sort: due cards first, then new cards
  const now = new Date();
  const sorted = [...questions].sort((a, b) => {
    const pa = progressMap[a.id];
    const pb = progressMap[b.id];
    if (!pa && !pb) return 0;
    if (!pa) return -1;
    if (!pb) return 1;
    const aDue = new Date(pa.next_review_at) <= now;
    const bDue = new Date(pb.next_review_at) <= now;
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    return (
      new Date(pa.next_review_at).getTime() -
      new Date(pb.next_review_at).getTime()
    );
  });

  // Filter to only due + new if isDueOnly
  const filtered = isDueOnly
    ? sorted.filter((q) => {
        const p = progressMap[q.id];
        return !p || new Date(p.next_review_at) <= now;
      })
    : sorted;

  if (filtered.length === 0) redirect("/flashcards");

  let cards = filtered;
  if (!fullAccess) {
    // Stable pick per user per Eastern day: same card all day long.
    const seed = `${user.id}:${todayKeyEastern()}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const pool = [...questions].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    cards = [pool[hash % pool.length]];
  }

  return (
    <FlashcardSession
      questions={cards}
      progressMap={progressMap}
      userId={user.id}
      book={book}
      chapter={chapter}
      limitedNotice={
        fullAccess
          ? undefined
          : "Your trial has ended, so you get 1 free flashcard a day. Subscribe for the full deck."
      }
    />
  );
}
