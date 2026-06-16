import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FlashcardConfig from "@/components/flashcards/FlashcardConfig";

export const dynamic = "force-dynamic";

// Natural sort: numeric chapters ascend numerically, suffixed chapters like
// "26A" sort near their numeric neighbor, non-numeric values (e.g. "N/A")
// sort last.
function chapterSort(a: string, b: string) {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  const aNum = !isNaN(na);
  const bNum = !isNaN(nb);
  if (aNum && bNum) return na !== nb ? na - nb : a.localeCompare(b);
  if (aNum) return -1;
  if (bNum) return 1;
  return a.localeCompare(b);
}

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only show this student's track (plus "both"), matching the same
  // exam_type filtering used by /api/sessions and Study Mode.
  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_type")
    .eq("id", user.id)
    .single();
  const examTypes = profile?.exam_type
    ? [profile.exam_type, "both"]
    : ["lieutenant", "captain", "both"];

  // Paginated with .range() because an unbounded select is capped at 1000
  // rows by Supabase/PostgREST by default — without this, books/chapters
  // past row 1000 silently never make it into the dropdowns.
  const PAGE_SIZE = 1000;
  let questions: { book_title: string; chapter: any }[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("book_title, chapter")
      .eq("is_active", true)
      .eq("flashcard_eligible", true)
      .in("exam_type", examTypes)
      .range(from, from + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    questions = questions.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const books = [...new Set(questions.map((q) => q.book_title))].sort();

  const bookChapters: Record<string, string[]> = {};
  for (const q of questions) {
    if (!bookChapters[q.book_title]) bookChapters[q.book_title] = [];
    const ch = String(q.chapter);
    if (!bookChapters[q.book_title].includes(ch)) {
      bookChapters[q.book_title].push(ch);
    }
  }
  for (const b of Object.keys(bookChapters)) {
    bookChapters[b].sort(chapterSort);
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Flashcards</h1>
        <p className="text-gray-500 text-sm mt-1">
          Spaced repetition — cards you miss come back sooner
        </p>
      </div>
      <FlashcardConfig books={books} bookChapters={bookChapters} userId={user.id} />
    </div>
  );
}
