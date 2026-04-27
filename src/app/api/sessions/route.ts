import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, exam_type")
    .eq("id", user.id)
    .single();

  const { mode, filters } = await request.json();

  const userExamType = profile?.exam_type;
  const examTypes = userExamType ? [userExamType, "both"] : ["lieutenant", "captain", "both"];

  let query = supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .eq("study_eligible", true)
    .in("exam_type", examTypes);

  if (filters?.book_title) query = query.eq("book_title", filters.book_title);
  if (filters?.chapter) query = query.eq("chapter", filters.chapter);
  if (filters?.topic) query = query.eq("topic", filters.topic);
  if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);

  const { data: questions, error } = await query.limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!questions?.length) return NextResponse.json({ error: "No questions found matching your filters" }, { status: 404 });

  const shuffled = questions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(filters?.question_count || 20, shuffled.length));

  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      mode,
      status: "in_progress",
      total_questions: selected.length,
      filters: filters || {},
    })
    .select()
    .single();

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  const questionRows = selected.map((q: any, i: number) => ({
    session_id: session.id,
    question_id: q.id,
    question_order: i + 1,
  }));

  const { error: qError } = await supabase
    .from("exam_session_questions")
    .insert(questionRows);

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  return NextResponse.json({ session_id: session.id });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { session_question_id, user_answer, flagged } = body;

  if (!session_question_id) {
    return NextResponse.json({ error: "session_question_id required" }, { status: 400 });
  }

  // Verify ownership via join
  const { data: sq } = await supabase
    .from("exam_session_questions")
    .select("id, session:exam_sessions!inner(user_id)")
    .eq("id", session_question_id)
    .single();

  if (!sq || (sq.session as any).user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (user_answer !== undefined) {
    updates.user_answer = user_answer;
    updates.answered_at = new Date().toISOString();
  }
  if (flagged !== undefined) updates.flagged = flagged;

  const { error } = await supabase
    .from("exam_session_questions")
    .update(updates)
    .eq("id", session_question_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
