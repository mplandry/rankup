import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { EXAM_QUESTION_COUNT, EXAM_TIME_LIMIT_SECS } from "@/lib/constants";
import { shuffleArray } from "@/lib/utils/score";
import type { StudyFilters } from "@/types";

// POST /api/sessions — create study or exam session
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { mode, filters }: { mode: "study" | "exam"; filters?: StudyFilters } =
    body;

  if (!["study", "exam"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  // Get user's exam_type from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_type")
    .eq("id", user.id)
    .single();

  const userExamType = profile?.exam_type; // 'lieutenant' or 'captain'

  // Build question query
  let query = supabase
    .from("questions")
    .select(
      "id, question_text, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, book_title, edition, chapter, topic, page_start, page_end, difficulty, study_eligible, exam_eligible, source_id, is_active, created_by, created_at, updated_at",
    )
    .eq("is_active", true);

  // Filter by exam_type — show questions matching user's exam or tagged 'both'
  if (userExamType) {
    query = query.in("exam_type", [userExamType, "both"]);
  }

  if (mode === "exam") {
    query = query.eq("exam_eligible", true);
  } else {
    query = query.eq("study_eligible", true);
    if (filters?.book_title) query = query.eq("book_title", filters.book_title);
    if (filters?.chapter) query = query.eq("chapter", filters.chapter);
    if (filters?.topic) query = query.eq("topic", filters.topic);
    if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);
  }

  const { data: allQuestions, error: qErr } = await query;
  if (qErr || !allQuestions) {
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }

  const questionCount =
    mode === "exam" ? EXAM_QUESTION_COUNT : (filters?.question_count ?? 20);

  if (mode === "exam" && allQuestions.length < EXAM_QUESTION_COUNT) {
    return NextResponse.json(
      {
        error: `Not enough exam-eligible questions. Need ${EXAM_QUESTION_COUNT}, have ${allQuestions.length}.`,
      },
      { status: 400 },
    );
  }

  if (mode === "study" && allQuestions.length === 0) {
    return NextResponse.json(
      { error: "No questions match your filters" },
      { status: 400 },
    );
  }

  // Shuffle and select
  const shuffled = shuffleArray(allQuestions);
  const selected = shuffled.slice(0, questionCount);

  // Create exam_session
  const { data: session, error: sErr } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      mode,
      total_questions: selected.length,
      time_limit_secs: mode === "exam" ? EXAM_TIME_LIMIT_SECS : null,
      filters: mode === "study" ? (filters ?? null) : null,
    })
    .select("id")
    .single();

  if (sErr || !session) {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }

  // Insert session questions
  const sessionQuestions = selected.map((q, i) => ({
    session_id: session.id,
    question_id: q.id,
    question_order: i + 1,
  }));

  const { error: sqErr } = await supabase
    .from("exam_session_questions")
    .insert(sessionQuestions);
  if (sqErr) {
    return NextResponse.json(
      { error: "Failed to create session questions" },
      { status: 500 },
    );
  }

  return NextResponse.json({ session_id: session.id, total: selected.length });
}

// PATCH /api/sessions — save a single answer or flag
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
      { error: "Missing session_question_id" },
      { status: 400 },
    );
  }

  // Verify ownership
  const { data: sq } = await supabase
    .from("exam_session_questions")
    .select("id, session_id")
    .eq("id", session_question_id)
    .single();

  if (!sq) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (user_answer !== undefined) {
    updateData.user_answer = user_answer;
    updateData.answered_at = new Date().toISOString();
  }
  if (flagged !== undefined) {
    updateData.flagged = flagged;
  }

  const { error } = await supabase
    .from("exam_session_questions")
    .update(updateData)
    .eq("id", session_question_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
