"use client";
export const dynamic = "force-dynamic";

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

      // Role guard: only admins allowed
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/dashboard");
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

    if (!profiles) return;

    const studentsWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const [{ count: examCount }, { data: scores }] = await Promise.all([
          supabase
            .from("exam_sessions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .eq("mode", "exam"),
          supabase
            .from("exam_sessions")
            .select("score")
            .eq("user_id", profile.id)
            .eq("mode", "exam")
            .not("score", "is", null),
        ]);

        const avgScore =
          scores && scores.length > 0
            ? Math.round(
                scores.reduce((a: number, s: any) => a + s.score, 0) /
                  scores.length
              )
            : null;

        return {
          ...profile,
          examCount: examCount || 0,
          avgScore,
        };
      })
    );

    setStudents(studentsWithStats);
  };

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        Loading...
      </div>
    );

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";

  return (
    <div style={{ display: "flex" }}>
      <Sidebar userName={userName} userEmail={user?.email || ""} userRole="admin" />
      <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 1200 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Students</div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 28 }}>
          {students.length} registered student{students.length !== 1 ? "s" : ""}
        </div>

        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                {["Name", "Email", "Department", "Role", "Exams Taken", "Avg Score", "Joined"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student, i) => (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: i < students.length - 1 ? "1px solid var(--border)" : "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
                      {student.full_name || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>
                      {student.email || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>
                      {student.department || "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        background: student.role === "admin" ? "var(--red-light)" : "var(--blue-light)",
                        color: student.role === "admin" ? "var(--red)" : "var(--blue)",
                        padding: "3px 8px",
                        borderRadius: 5,
                        fontSize: 11.5,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}>
                        {student.role || "student"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, textAlign: "center" }}>
                      {student.examCount}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, textAlign: "center", color: student.avgScore === null ? "var(--text-muted)" : student.avgScore >= 70 ? "var(--green)" : "var(--red)" }}>
                      {student.avgScore !== null ? `${student.avgScore}%` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(student.created_at).toLocaleDateString()}
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
