import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calcScorePercent } from "@/lib/utils/score";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export async function POST(_request: Request, { params }: Props) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status === "completed") return NextResponse.json({ ok: true, already_complete: true });

  const { data: sessionQuestions, error: sqErr } = await supabase
    .from("exam_session_questions")
    .select("id, question_id, user_answer, question:questions(correct_answer)")
    .eq("session_id", sessionId);

  if (sqErr || !sessionQuestions) {
    return NextResponse.json({ error: "Failed to load session questions" }, { status: 500 });
  }

  const scored = sessionQuestions.map((sq: any) => {
    const raw = Array.isArray(sq.question) ? sq.question?.[0]?.correct_answer : sq.question?.correct_answer;
    const correctAnswer = typeof raw === "string" ? raw.trim().toUpperCase() : raw;
    const userAnswer = typeof sq.user_answer === "string" ? sq.user_answer.trim().toUpperCase() : sq.user_answer;
    const is_correct = userAnswer != null && correctAnswer != null && userAnswer === correctAnswer;
    return { id: sq.id, is_correct };
  });

  const correctCount = scored.filter((s: any) => s.is_correct).length;
  const totalCount = sessionQuestions.length;
  const scorePct = calcScorePercent(correctCount, totalCount);
  const elapsedSecs = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

  await Promise.all(
    scored.map((s: any) =>
      supabase.from("exam_session_questions").update({ is_correct: s.is_correct }).eq("id", s.id)
    )
  );

  const { error: updateErr } = await supabase
    .from("exam_sessions")
    .update({
      status: "completed",
      score: correctCount,
      score_percent: scorePct,
      time_elapsed_secs: elapsedSecs,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  try {
    await supabase.rpc("refresh_user_stats", { p_user_id: user.id });
  } catch {
    // Non-critical
  }

  return NextResponse.json({ ok: true, score: correctCount, total: totalCount, score_percent: scorePct });
}
