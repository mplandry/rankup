import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExamSession from "@/components/exam/ExamSession";
import type { Question } from "@/types";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function ExamSessionPage({ params }: Props) {
  const supabase = await createClient();

  // Await params (Next.js 15 requirement)
  const { sessionId } = await params;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch session data
  const { data: sessionData } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", session.user.id)
    .single();

  if (!sessionData) {
    redirect("/dashboard");
  }

  // Fetch session questions with question details
  const { data: sessionQuestions } = await supabase
    .from("exam_session_questions")
    .select(
      `
      *,
      question:questions(*)
    `,
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (
    <ExamSession session={sessionData} questions={sessionQuestions || []} />
  );
}
