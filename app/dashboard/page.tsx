"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
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
        .order("completed_at", { ascending: false })
        .limit(5);
      setSessions(data || []);
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );

  const examSessions = sessions.filter((s) => s.mode === "exam");
  const scores = examSessions.map((s) => s.score).filter((s) => s !== null);
  const avgScore = scores.length
    ? Math.round(
        scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
      )
    : null;
  const bestScore = scores.length ? Math.max(...scores) : null;
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
          Welcome back, {userName.split(" ")[0]}
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginBottom: 28,
          }}
        >
          Ready to prep for your promotional exam?
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
            { icon: "📋", num: sessions.length, label: "Total Sessions" },
            {
              icon: "🎯",
              num: sessions.reduce((a, s) => a + (s.total_questions || 0), 0),
              label: "Questions Answered",
            },
            {
              icon: "📈",
              num: avgScore !== null ? `${avgScore}%` : "—",
              label: "Avg Score",
            },
            {
              icon: "🏆",
              num: bestScore !== null ? `${bestScore}%` : "—",
              label: "Best Score",
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
              <div style={{ fontSize: 22, marginBottom: 10 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                {stat.num}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            onClick={() => router.push("/study")}
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "var(--green-light)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              📖
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                Study Mode
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Practice with instant feedback
              </div>
            </div>
          </div>
          <div
            onClick={() => router.push("/exam")}
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "var(--red-light)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              🔥
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                Exam Mode
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                90 questions, timed simulation
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Sessions</div>
            <span
              onClick={() => router.push("/progress")}
              style={{
                fontSize: 13,
                color: "var(--red)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              View all
            </span>
          </div>
          {sessions.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No sessions yet. Start studying!
            </div>
          ) : (
            sessions.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom:
                    i < sessions.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <span
                  style={{
                    background:
                      s.mode === "study"
                        ? "var(--blue-light)"
                        : "var(--red-light)",
                    color: s.mode === "study" ? "var(--blue)" : "var(--red)",
                    padding: "3px 8px",
                    borderRadius: 5,
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  {s.mode}
                </span>
                <span style={{ fontSize: 13 }}>
                  {s.total_questions} questions
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontWeight: 700,
                    color:
                      s.score === null
                        ? "var(--text-muted)"
                        : s.score >= 70
                          ? "var(--green)"
                          : "var(--red)",
                  }}
                >
                  {s.score !== null ? `${s.score}%` : "—"}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {new Date(s.completed_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
