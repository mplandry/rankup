import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FlashcardConfig from "@/components/flashcards/FlashcardConfig";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: questions } = await supabase
    .from("questions")
    .select("book_title, chapter")
    .eq("is_active", true)
    .eq("flashcard_eligible", true);

  const books = [...new Set((questions || []).map((q) => q.book_title))].sort();

  const bookChapters: Record<string, string[]> = {};
  for (const q of questions || []) {
    if (!bookChapters[q.book_title]) bookChapters[q.book_title] = [];
    const ch = String(q.chapter);
    if (!bookChapters[q.book_title].includes(ch)) {
      bookChapters[q.book_title].push(ch);
    }
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
