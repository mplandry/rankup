"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function QuestionsPage() {
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      await loadQuestions();
      setLoading(false);
    };
    init();
  }, []);

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("is_active", true)
      .order("question_number", { ascending: true });
    setQuestions(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this question?")) return;
    await supabase.from("questions").update({ is_active: false }).eq("id", id);
    await loadQuestions();
  };

  const handleRemoveDupes = async () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    questions.forEach((q) => {
      const key = q.question_text.trim().toLowerCase();
      if (seen.has(key)) dupes.push(q.id);
      else seen.add(key);
    });
    if (dupes.length === 0) {
      alert("No duplicates found!");
      return;
    }
    if (!confirm(`Remove ${dupes.length} duplicate question(s)?`)) return;
    await supabase
      .from("questions")
      .update({ is_active: false })
      .in("id", dupes);
    await loadQuestions();
    alert(`Removed ${dupes.length} duplicate(s).`);
  };

  const filtered = questions.filter(
    (q) =>
      !search || q.question_text.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return null;
  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Firefighter";

  return (
    <div style={{ display: "flex" }}>
      <Sidebar userName={userName} userEmail={user?.email || ""} />
      <div
        style={{
          marginLeft: "var(--sidebar-w)",
          flex: 1,
          padding: "36px 40px",
          maxWidth: 1100,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>
              Questions
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {questions.length} active questions
            </div>
          </div>
          <button
            onClick={handleRemoveDupes}
            style={{
              padding: "9px 18px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Remove Duplicates
          </button>
        </div>

        <input
          type='text'
          placeholder='Search question text...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13.5,
            marginBottom: 20,
          }}
        />

        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafbfc" }}>
                {[
                  "QUESTION",
                  "BOOK / CHAPTER",
                  "DIFFICULTY",
                  "STUDY",
                  "EXAM",
                  "DELETE",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((q) => (
                <tr key={q.id}>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: 13.5,
                      maxWidth: 320,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {q.question_text.substring(0, 70)}
                    {q.question_text.length > 70 ? "..." : ""}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {q.book_title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Ch. {q.chapter}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 13,
                    }}
                  >
                    {q.difficulty}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 13,
                    }}
                  >
                    {q.study_eligible ? "Yes" : "No"}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 13,
                    }}
                  >
                    {q.exam_eligible ? "Yes" : "No"}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <button
                      onClick={() => handleDelete(q.id)}
                      style={{
                        padding: "4px 10px",
                        background: "var(--red-light)",
                        color: "var(--red)",
                        border: "1px solid #f1948a",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 50 && (
            <div
              style={{
                padding: "12px 16px",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Showing 50 of {filtered.length} questions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
