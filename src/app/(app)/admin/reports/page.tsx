import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_answer: string | null;
  note: string | null;
  status: string;
  created_at: string;
  questions: {
    question_number: number;
    book_title: string;
    chapter: string | null;
    page_start: number | null;
    question_text: string;
    correct_answer: string;
  } | null;
  profiles: { email: string | null } | null;
};

export default async function ReportsPage() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("question_reports")
    .select(
      "id, user_answer, note, status, created_at, questions(question_number, book_title, chapter, page_start, question_text, correct_answer), profiles:user_id(email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => r.status === "open");

  // Same question reported by several students is the strongest signal of a bad key.
  const counts = new Map<number, number>();
  for (const r of open) {
    const n = r.questions?.question_number;
    if (n != null) counts.set(n, (counts.get(n) ?? 0) + 1);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0]">Reported Questions</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {open.length} open &middot; {rows.length} total. Check each against the book, fix the
          question, then set its status to fixed or dismissed in SQL.
        </p>
      </div>
      <div className="space-y-3">
        {rows.length === 0 && (
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-400 dark:text-gray-500">
            No reports yet
          </div>
        )}
        {rows.map((r) => {
          const q = r.questions;
          const times = q ? counts.get(q.question_number) ?? 0 : 0;
          return (
            <div
              key={r.id}
              className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]">
                  Q{q?.question_number ?? "?"}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.status === "open"
                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {r.status}
                </span>
                {r.status === "open" && times > 1 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                    reported by {times} students
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-900 dark:text-gray-100 mb-2">{q?.question_text}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {q?.book_title}
                {q?.chapter ? `, ${q.chapter}` : ""}
                {q?.page_start ? `, p.${q.page_start}` : ""} &middot; Key: {q?.correct_answer}{" "}
                &middot; Student chose: {r.user_answer ?? "n/a"} &middot; {r.profiles?.email ?? "unknown"}
              </div>
              {r.note && (
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5">
                  {r.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
