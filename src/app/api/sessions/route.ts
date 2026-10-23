import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ACTIVE_EXAM_CYCLE, FREE_DAILY_QUESTION_LIMIT, EXAM_QUESTION_COUNT, DEFAULT_STUDY_COUNT } from "@/lib/constants";
import { hasFullAccess as checkFullAccess, startOfTodayEastern } from "@/lib/access";

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

  // Admins, active subscribers, and users still inside their trial (incl.
  // bonus days) get full access. Rules live in src/lib/access.ts.
  const hasFullAccess = checkFullAccess(profile);

  // After the trial, Exam Mode is subscribers-only — a 1-question
  // "practice exam" isn't a real simulation.
  if (!hasFullAccess && mode === "exam") {
    return NextResponse.json(
      {
        error: "Your trial has ended. Exam Mode is for subscribers — subscribe to take full timed practice exams.",
        code: "TRIAL_EXPIRED",
      },
      { status: 403 },
    );
  }

  let remainingToday = Infinity;
  if (!hasFullAccess) {
    // The free allowance resets at midnight Eastern, not midnight UTC.
    const startOfDay = startOfTodayEastern();

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
    .eq("exam_cycle", ACTIVE_EXAM_CYCLE)
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

  // Starting a new session means any of the user's previous unfinished
  // sessions are abandoned (this UI never resumes an old in_progress row) —
  // clean those up so exam_sessions.status stays accurate for admin reporting.
  await supabase
    .from("exam_sessions")
    .update({ status: "abandoned" })
    .eq("user_id", user.id)
    .eq("status", "in_progress");

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
