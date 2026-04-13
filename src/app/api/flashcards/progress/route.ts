import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question_id, knew, ease_factor, interval_days, next_review_at } =
    await req.json();

  const { error } = await supabase.from("flashcard_progress").upsert(
    {
      user_id: user.id,
      question_id,
      ease_factor,
      interval_days,
      repetitions: knew ? 1 : 0,
      next_review_at,
      last_reviewed_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,question_id",
    },
  );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
