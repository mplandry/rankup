import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = "mplandry77@gmail.com";
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

  // Heads-up email to the admin. Never lets a mail problem fail the report.
  try {
    await notifyAdmin({
      questionId,
      userId: user.id,
      userAnswer,
      note,
    });
  } catch (err) {
    console.error("report notification failed", err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ ok: true });
}

function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function notifyAdmin(args: {
  questionId: string;
  userId: string;
  userAnswer: string | null;
  note: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const admin = createServiceRoleClient();
  const [{ data: q }, { data: p }, { count }] = await Promise.all([
    admin
      .from("questions")
      .select("question_number, book_title, chapter, page_start, question_text, correct_answer")
      .eq("id", args.questionId)
      .single(),
    admin.from("profiles").select("email, full_name").eq("id", args.userId).single(),
    admin
      .from("question_reports")
      .select("*", { count: "exact", head: true })
      .eq("question_id", args.questionId)
      .eq("status", "open"),
  ]);

  const qNum = q?.question_number ?? "?";
  const repeat = (count ?? 0) > 1 ? ` (${count} open reports on this question)` : "";
  const where = [q?.book_title, q?.chapter, q?.page_start ? `p.${q.page_start}` : null]
    .filter(Boolean)
    .join(", ");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RankUp <support@rankupfire.com>",
      to: ADMIN_EMAIL,
      subject: `Question reported: Q${qNum}${repeat}`,
      html:
        `<p><strong>Q${esc(String(qNum))}</strong> was reported by ${esc(p?.full_name || p?.email || "a student")}.</p>` +
        `<p>${esc(q?.question_text)}</p>` +
        `<p>${esc(where)}<br>Key: ${esc(q?.correct_answer)} &middot; Student chose: ${esc(args.userAnswer ?? "n/a")}</p>` +
        (args.note ? `<p><em>Student note:</em> ${esc(args.note)}</p>` : "") +
        `<p><a href="https://rankupfire.com/admin/reports">Open reported questions</a></p>`,
    }),
  });
  if (!res.ok) console.error("resend report email failed", res.status);
}
