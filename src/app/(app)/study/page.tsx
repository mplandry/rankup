import { createClient } from "@/lib/supabase/server";
import StudyConfigClient from "@/components/study/StudyConfig";

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
  const examTypes = ["lieutenant", "captain", "both"];

  const { data: allData } = await supabase
    .from("questions")
    .select("book_title, chapter, topic")
    .eq("is_active", true)
    .eq("study_eligible", true)
    .in("exam_type", examTypes)
    .range(0, 9999);

  const rows = allData || [];

  const books = [
    ...new Set(rows.map((r: any) => r.book_title).filter(Boolean)),
  ].sort() as string[];

  const chapters = [
    ...new Set(
      rows.map((r: any) => r.chapter).filter((c: any) => c && c.trim() !== ""),
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

    if (row.chapter && row.chapter.trim() !== "") {
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
