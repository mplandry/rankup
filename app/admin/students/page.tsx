"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
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
      await loadStudents();
      setLoading(false);
    };
    init();
  }, []);

  const loadStudents = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const studentsWithStats = await Promise.all(
      (profiles || []).map(async (p) => {
        const { data: sessions } = await supabase
          .from("exam_sessions")
          .select("score, completed_at")
          .eq("user_id", p.id)
          .eq("mode", "exam")
          .order("completed_at", { ascending: false });

        const scores = (sessions || [])
          .map((s: any) => s.score)
          .filter((s: any) => s !== null);
        const avgScore = scores.length
          ? Math.round(
              scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
            )
          : null;
        const bestScore = scores.length ? Math.max(...scores) : null;
        const lastActive =
          sessions && sessions.length > 0
            ? new Date(sessions[0].completed_at).toLocaleDateString()
            : "Never";

        return {
          ...p,
          exams: scores.length,
          avg_score: avgScore !== null ? `${avgScore}%` : "—",
          best_score: bestScore !== null ? `${bestScore}%` : "—",
          last_active: lastActive,
        };
      }),
    );
    setStudents(studentsWithStats);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system?`)) return;
    await supabase.from("profiles").delete().eq("id", id);
    await loadStudents();
  };

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
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
          Students
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginBottom: 28,
          }}
        >
          {students.length} registered students
        </div>

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
                  "NAME",
                  "DEPARTMENT",
                  "EXAMS",
                  "AVG SCORE",
                  "BEST SCORE",
                  "LAST ACTIVE",
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
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "24px 16px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: 13,
                    }}
                  >
                    No students registered yet.
                  </td>
                </tr>
              ) : (
                students.map((s, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        padding: "13px 16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {s.full_name || s.email?.split("@")[0]}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {s.email}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: 13,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {s.department || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: 13,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {s.exams}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: 13,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {s.avg_score}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: 13,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {s.best_score}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: 13,
                        color: "var(--text-muted)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {s.last_active}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <button
                        onClick={() =>
                          handleDelete(s.id, s.full_name || s.email)
                        }
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
