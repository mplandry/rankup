import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  // Fetch session data to verify ownership
  const { data: sessionData } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", session.user.id)
    .single();

  if (!sessionData) {
    redirect("/dashboard");
  }

  // Just redirect to results for now - the exam session page might not be needed
  redirect(`/exam/${sessionId}/results`);
}
