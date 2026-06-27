import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { FREE_DAILY_QUESTION_LIMIT, EXAM_QUESTION_COUNT, DEFAULT_STUDY_COUNT } from "@/lib/constants";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, exam_type, subscription_status, trial_ends_at, trial_extended_days")
    .eq("id", user.id)
    .single();

  const { mode, filters } = await request.json();

  // Admins and active subscribers always have full access. Otherwise, full
  // access requires being within the trial window (including any bonus days).
  let hasFullAccess =
    profile?.role === "admin" || profile?.subscription_status === "active";

  if (!hasFullAccess && profile?.trial_ends_at) {
    const trialEndsAt = new Date(profile.trial_ends_at);
    trialEndsAt.setDate(trialEndsAt.getDate() + (profile.trial_extended_days || 0));
    hasFullAccess = new Date() < trialEndsAt;
  } else if (!hasFullAccess && !profile?.trial_ends_at) {
    // No trial data on record — don't lock the user out unexpectedly.
    hasFullAccess = true;
  }

  let remainingToday = Infinity;
  if (!hasFullAccess) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: todaySessions } = await supabase
      .from("exam_sessions")
      .select("total_questions")
      .eq("user_id", user.id)
      .gte("started_at", startOfDay.toISOString());

    const usedToday = (todaySessions || []).reduce(
      (sum, s) => sum + (s.total_questions || 0),
      0,
    );
    remainingToday = Math.max(0, FREE_DAILY_QUESTION_LIMIT - usedToday);

    if (remainingToday <= 0) {
      return NextResponse.json(
        {
          error: `Daily limit reached. Your trial has ended — free access is limited to ${FREE_DAILY_QUESTION_LIMIT} question${FREE_DAILY_QUESTION_LIMIT === 1 ? "" : "s"} per day. Subscribe for full access.`,
          code: "DAILY_LIMIT_REACHED",
        },
        { status: 403 },
      );
    }
  }

  const userExamType = profile?.exam_type;
  const examTypes = userExamType
    ? [userExamType, "both"]
    : ["lieutenant", "captain", "both"];

  // Exam Mode must draw from exam_eligible questions, Study Mode from
  // study_eligible — these pools can differ, so the field has to track mode.
  const eligibilityField = mode === "exam" ? "exam_eligible" : "study_eligible";
  const defaultCount = mode === "exam" ? EXAM_QUESTION_COUNT : DEFAULT_STUDY_COUNT;

  let query = supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .eq("review_status", "approved")
    .eq(eligibilityField, true)
    .in("exam_type", examTypes);

  if (filters?.book_title) query = query.eq("book_title", filters.book_title);
  if (filters?.chapter) query = query.eq("chapter", filters.chapter);
  if (filters?.topic) query = query.eq("topic", filters.topic);
  if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);

  const { data: questions, error } = await query.limit(5000);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!questions?.length)
    return NextResponse.json(
      { error: "No questions found matching your filters" },
      { status: 404 },
    );

  const shuffled = questions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(
    0,
    Math.min(filters?.question_count || defaultCount, shuffled.length, remainingToday),
  );

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

  if (sessionError)
    return NextResponse.json({ error: sessionError.message }, { status: 500 });

  const questionRows = selected.map((q: any, i: number) => ({
    session_id: session.id,
    question_id: q.id,
    question_order: i + 1,
  }));

  const { error: qError } = await supabase
    .from("exam_session_questions")
    .insert(questionRows);

  if (qError)
    return NextResponse.json({ error: qError.message }, { status: 500 });

  return NextResponse.json({ session_id: session.id });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { session_question_id, user_answer, flagged } = body;

  if (!session_question_id) {
    return NextResponse.json(
      { error: "session_question_id required" },
      { status: 400 },
    );
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

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
