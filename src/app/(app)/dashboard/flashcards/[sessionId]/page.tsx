import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FlashcardSession from "@/components/flashcards/FlashcardSession";

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
  const book = bookEncoded === "all" ? null : decodeURIComponent(bookEncoded);
  const chapter =
    chapterEncoded === "none" || !chapterEncoded
      ? null
      : decodeURIComponent(chapterEncoded);
  const isDueOnly = sessionId === "due";

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
    .eq("flashcard_eligible", true);

  if (book) query = query.eq("book_title", book);
  if (chapter) query = query.eq("chapter", chapter);

  const { data: questions } = await query;
  if (!questions || questions.length === 0) redirect("/flashcards");

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

  return (
    <FlashcardSession
      questions={filtered}
      progressMap={progressMap}
      userId={user.id}
      book={book}
      chapter={chapter}
    />
  );
}
