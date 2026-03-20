"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ questions: 0, students: 0, exams: 0 });
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

      const [{ count: qCount }, { count: sCount }, { count: eCount }] =
        await Promise.all([
          supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("exam_sessions")
            .select("*", { count: "exact", head: true })
            .eq("mode", "exam"),
        ]);

      setStats({
        questions: qCount || 0,
        students: sCount || 0,
        exams: eCount || 0,
      });
      setLoading(false);
    };
    init();
  }, []);

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
          Admin Dashboard
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginBottom: 28,
          }}
        >
          Manage questions and monitor student progress
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {[
            { icon: "📚", num: stats.questions, label: "Active Questions" },
            { icon: "👥", num: stats.students, label: "Students" },
            { icon: "📋", num: stats.exams, label: "Exams Completed" },
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

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div
            onClick={() => router.push("/admin/questions")}
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
                Add Question
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Manually create a new question
              </div>
            </div>
          </div>
          <div
            onClick={() => router.push("/admin/import")}
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
                background: "var(--blue-light)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              ⬆️
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                Import CSV
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Bulk import from a CSV file
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
