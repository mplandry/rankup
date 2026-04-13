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

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier === "multiple_choice") {
    redirect("/dashboard?upgrade=flashcards");
  }

  // Fetch books and chapters
  let allRows: any[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data: batch } = await supabase
      .from("questions")
      .select("book_title, chapter")
      .eq("is_active", true)
      .eq("flashcard_eligible", true)
      .range(from, from + batchSize - 1);

    if (!batch || batch.length === 0) break;
    allRows = allRows.concat(batch);
    if (batch.length < batchSize) break;
    from += batchSize;
  }

  const bookChapters: Record<string, string[]> = {};
  for (const row of allRows) {
    if (!row.book_title) continue;
    if (!bookChapters[row.book_title]) bookChapters[row.book_title] = [];
    if (
      row.chapter &&
      row.chapter.trim() !== "" &&
      row.chapter.trim().toUpperCase() !== "N/A" &&
      !bookChapters[row.book_title].includes(row.chapter)
    ) {
      bookChapters[row.book_title].push(row.chapter);
    }
  }

  for (const book of Object.keys(bookChapters)) {
    bookChapters[book].sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }

  const books = Object.keys(bookChapters).sort();

  // Get due card counts per book
  const { data: dueCards } = await supabase
    .from("flashcard_progress")
    .select("question_id")
    .eq("user_id", user.id)
    .lte("next_review_at", new Date().toISOString());

  return (
    <div className='px-4 py-6 sm:p-8 max-w-2xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-[#1B2A4A]'>Flashcards</h1>
        <p className='text-gray-500 mt-1'>
          Spaced repetition — cards you miss come back sooner
        </p>
        {dueCards && dueCards.length > 0 && (
          <div className='mt-3 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-3 py-1.5 rounded-lg'>
            <span className='font-semibold'>{dueCards.length}</span> cards due
            for review
          </div>
        )}
      </div>
      <FlashcardConfig
        books={books}
        bookChapters={bookChapters}
        userId={user.id}
      />
    </div>
  );
}
