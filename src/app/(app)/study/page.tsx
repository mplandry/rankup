import { createClient } from "@/lib/supabase/server";
import StudyConfigClient from "@/components/study/StudyConfig";

export default async function StudyPage() {
  const supabase = await createClient();

  // Get user's exam_type
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_type")
    .eq("id", user!.id)
    .single();

  const userExamType = profile?.exam_type;

  // Fetch distinct books, chapters, topics filtered by exam_type
  const [booksRes, chaptersRes, topicsRes] = await Promise.all([
    userExamType
      ? supabase
          .from("questions")
          .select("book_title")
          .eq("is_active", true)
          .eq("study_eligible", true)
          .in("exam_type", [userExamType, "both"])
      : supabase
          .from("questions")
          .select("book_title")
          .eq("is_active", true)
          .eq("study_eligible", true),
    userExamType
      ? supabase
          .from("questions")
          .select("chapter")
          .eq("is_active", true)
          .eq("study_eligible", true)
          .in("exam_type", [userExamType, "both"])
      : supabase
          .from("questions")
          .select("chapter")
          .eq("is_active", true)
          .eq("study_eligible", true),
    userExamType
      ? supabase
          .from("questions")
          .select("topic")
          .eq("is_active", true)
          .eq("study_eligible", true)
          .in("exam_type", [userExamType, "both"])
      : supabase
          .from("questions")
          .select("topic")
          .eq("is_active", true)
          .eq("study_eligible", true),
  ]);

  const books = [
    ...new Set(
      (booksRes.data || [])
        .map((r: { book_title: string }) => r.book_title)
        .filter(Boolean),
    ),
  ].sort();
  const chapters = [
    ...new Set(
      (chaptersRes.data || [])
        .map((r: { chapter: string }) => r.chapter)
        .filter(Boolean),
    ),
  ].sort();
  const topics = [
    ...new Set(
      (topicsRes.data || [])
        .map((r: { topic: string }) => r.topic)
        .filter(Boolean),
    ),
  ].sort();

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-[#1B2A4A]'>Study Mode</h1>
        <p className='text-gray-500 mt-1'>
          Practice with instant feedback and chapter references
        </p>
      </div>
      <StudyConfigClient books={books} chapters={chapters} topics={topics} />
    </div>
  );
}
