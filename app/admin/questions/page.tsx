"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

const PAGE_SIZE = 25;

export default function QuestionsPage() {
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "admin") { router.push("/dashboard"); return; }

      setUser(session.user);
      await loadQuestions(1, "");
      setLoading(false);
    };
    init();
  }, []);

  const loadQuestions = async (p: number, q: string) => {
    const from = (p - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = supabase.from("questions").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
    if (q) query = query.ilike("question_text", `%${q}%`);
    const { data, count } = await query;
    setQuestions(data || []);
    setTotal(count || 0);
  };

  const handleSearch = async (val: string) => {
    setSearch(val);
    setPage(1);
    await loadQuestions(1, val);
  };

  const handlePage = async (p: number) => {
    setPage(p);
    await loadQuestions(p, search);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("questions").update({ is_active: !current }).eq("id", id);
    setQuestions(questions.map(q => q.id === id ? { ...q, is_active: !current } : q));
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Loading...</div>;

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar userName={userName} userEmail={user?.email || ""} userRole="admin" />
      <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 1200 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Questions</div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 24 }}>{total} questions total</div>

        <input
          placeholder="Search questions..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, marginBottom: 20, background: "var(--white)", color: "var(--foreground)" }}
        />

        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                {["Question", "Book", "Chapter", "Difficulty", "Active"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>No questions found.</td></tr>
              ) : questions.map((q, i) => (
                <tr key={q.id} style={{ borderBottom: i < questions.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px", fontSize: 13, maxWidth: 400 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question_text}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>{q.book_title}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>{q.chapter}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: q.difficulty === "hard" ? "var(--red-light)" : q.difficulty === "medium" ? "var(--blue-light)" : "var(--green-light)", color: q.difficulty === "hard" ? "var(--red)" : q.difficulty === "medium" ? "var(--blue)" : "var(--green)", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                      {q.difficulty || "easy"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div onClick={() => toggleActive(q.id, q.is_active)} style={{ width: 36, height: 20, borderRadius: 10, background: q.is_active ? "var(--green)" : "var(--border)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                      <div style={{ position: "absolute", top: 2, left: q.is_active ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
            <button onClick={() => handlePage(page - 1)} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--white)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}>←</button>
            <span style={{ padding: "6px 14px", fontSize: 13 }}>Page {page} of {totalPages}</span>
            <button onClick={() => handlePage(page + 1)} disabled={page === totalPages} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--white)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1 }}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}
