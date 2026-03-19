"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function ProgressPage() {
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
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
      const { data } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("completed_at", { ascending: false });
      setSessions(data || []);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return null;

  const exams = sessions.filter((s) => s.mode === "exam");
  const studies = sessions.filter((s) => s.mode === "study");
  const scores = exams.map((s) => s.score).filter((s) => s !== null);
  const avgExam = scores.length
    ? Math.round(
        scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
      )
    : null;
  const bestExam = scores.length ? Math.max(...scores) : null;
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
          My Progress
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginBottom: 28,
          }}
        >
          Track your performance over time
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {[
            { num: exams.length, label: "Exams Taken" },
            { num: studies.length, label: "Study Sessions" },
            {
              num: avgExam !== null ? `${avgExam}%` : "—",
              label: "Avg Exam Score",
            },
            {
              num: bestExam !== null ? `${bestExam}%` : "—",
              label: "Best Exam Score",
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "22px 24px",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                {stat.num}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* No exams yet */}
        {exams.length === 0 && (
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>
              No completed exams yet.
            </div>
            <span
              onClick={() => router.push("/exam")}
              style={{
                color: "var(--red)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Take your first exam →
            </span>
          </div>
        )}

        {/* Charts placeholder */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {["Weakest Chapters", "Weakest Topics"].map((title) => (
            <div
              key={title}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                {title}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Complete more sessions to see performance data.
              </div>
            </div>
          ))}
        </div>

        {/* Session History */}
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "22px 24px",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            Session History
          </div>
          {sessions.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No sessions yet.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["DATE", "MODE", "QUESTIONS", "SCORE", "RESULT"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 0",
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
                {sessions.map((s, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        padding: "10px 0",
                        fontSize: 13,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {new Date(s.completed_at).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: "10px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          background:
                            s.mode === "study"
                              ? "var(--blue-light)"
                              : "var(--red-light)",
                          color:
                            s.mode === "study" ? "var(--blue)" : "var(--red)",
                          padding: "3px 8px",
                          borderRadius: 5,
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        {s.mode}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 0",
                        fontSize: 13,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {s.total_questions}
                    </td>
                    <td
                      style={{
                        padding: "10px 0",
                        fontWeight: 700,
                        fontSize: 13,
                        borderBottom: "1px solid var(--border)",
                        color:
                          s.score === null
                            ? "var(--text-muted)"
                            : s.score >= 70
                              ? "var(--green)"
                              : "var(--red)",
                      }}
                    >
                      {s.score !== null ? `${s.score}%` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 0",
                        fontSize: 13,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {s.mode === "exam" && s.score !== null ? (
                        s.score >= 70 ? (
                          <span
                            style={{ color: "var(--green)", fontWeight: 700 }}
                          >
                            Pass
                          </span>
                        ) : (
                          <span
                            style={{ color: "var(--red)", fontWeight: 700 }}
                          >
                            Fail
                          </span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
