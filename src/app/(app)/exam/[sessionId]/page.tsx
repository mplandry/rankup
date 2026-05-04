import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page({ params }: any) {
  const supabase = await createClient();
  const { sessionId } = await params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data } = await supabase
    .from("exam_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", session.user.id)
    .single();

  if (!data) redirect("/dashboard");

  redirect(`/exam/${sessionId}/results`);
}
