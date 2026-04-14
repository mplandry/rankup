import { createClient } from "@/lib/supabase/server";
import StudyConfigClient from "@/components/study/StudyConfig";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_type")
    .eq("id", user!.id)
    .single();

  const userExamType = profile?.exam_type;
  const examTypes = userExamType
    ? [userExamType, "both"]
    : ["lieutenant", "captain", "both"];

  // Fetch distinct books via RPC
  const { data: booksData } = await supabase.rpc("get_distinct_books", {
    exam_types: examTypes,
  });

  // Fetch in batches to work around Supabase 1000 row default limit
  let allRows: any[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data: batch } = await supabase
      .from("questions")
      .select("book_title, chapter, topic")
      .eq("is_active", true)
      .eq("study_eligible", true)
      .in("exam_type", examTypes)
      .range(from, from + batchSize - 1);

    if (!batch || batch.length === 0) break;
    allRows = allRows.concat(batch);
    if (batch.length < batchSize) break;
    from += batchSize;
  }

  // Deduplicate rows by book_title + chapter + topic
  const seen = new Set<string>();
  const rows = allRows.filter((row) => {
    const key = `${row.book_title}|${row.chapter}|${row.topic}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const books = [
    ...new Set((booksData || []).map((r: any) => r.book_title).filter(Boolean)),
  ].sort() as string[];

  const chapters = [
    ...new Set(
      rows
        .map((r: any) => r.chapter)
        .filter(
          (c: any) => c && c.trim() !== "" && c.trim().toUpperCase() !== "N/A",
        ),
    ),
  ].sort((a: any, b: any) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  }) as string[];

  const topics = [
    ...new Set(rows.map((r: any) => r.topic).filter(Boolean)),
  ].sort() as string[];

  const bookChapters: Record<string, string[]> = {};
  const bookTopics: Record<string, string[]> = {};

  for (const row of rows as any[]) {
    if (!row.book_title) continue;

    if (
      row.chapter &&
      row.chapter.trim() !== "" &&
      row.chapter.trim().toUpperCase() !== "N/A"
    ) {
      if (!bookChapters[row.book_title]) bookChapters[row.book_title] = [];
      if (!bookChapters[row.book_title].includes(row.chapter)) {
        bookChapters[row.book_title].push(row.chapter);
      }
    }

    if (row.topic && row.topic.trim() !== "") {
      if (!bookTopics[row.book_title]) bookTopics[row.book_title] = [];
      if (!bookTopics[row.book_title].includes(row.topic)) {
        bookTopics[row.book_title].push(row.topic);
      }
    }
  }

  for (const book of Object.keys(bookChapters)) {
    bookChapters[book].sort((a: string, b: string) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }

  for (const book of Object.keys(bookTopics)) {
    bookTopics[book].sort();
  }

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-[#1B2A4A]'>Study Mode</h1>
        <p className='text-gray-500 mt-1'>
          Practice with instant feedback and chapter references
        </p>
      </div>
      <StudyConfigClient
        books={books}
        chapters={chapters}
        topics={topics}
        bookChapters={bookChapters}
        bookTopics={bookTopics}
      />
    </div>
  );
}
