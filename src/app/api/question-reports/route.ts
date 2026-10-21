import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_ANSWERS = ["A", "B", "C", "D"];
const MAX_NOTE = 1000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { question_id?: unknown; user_answer?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const questionId = typeof body.question_id === "string" ? body.question_id : "";
  if (!questionId)
    return NextResponse.json({ error: "question_id required" }, { status: 400 });

  const userAnswer =
    typeof body.user_answer === "string" && VALID_ANSWERS.includes(body.user_answer)
      ? body.user_answer
      : null;
  const note =
    typeof body.note === "string" ? body.note.trim().slice(0, MAX_NOTE) || null : null;

  // RLS enforces user_id = auth.uid(). Upsert so re-reporting updates the note
  // and reopens a report that was previously dismissed or marked fixed.
  const { error } = await supabase.from("question_reports").upsert(
    {
      question_id: questionId,
      user_id: user.id,
      user_answer: userAnswer,
      note,
      status: "open",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,question_id" },
  );

  if (error) {
    console.error("question report failed", error.message);
    return NextResponse.json({ error: "Could not save report" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
