"use client";
export const dynamic = "force-dynamic";

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

      // Role guard: only admins allowed
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/dashboard");
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
      <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 1100 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Admin Overview</div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 28 }}>
          Manage questions, students, and exam data.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "📚", num: stats.questions, label: "Active Questions" },
            { icon: "👥", num: stats.students, label: "Registered Students" },
            { icon: "📋", num: stats.exams, label: "Exams Completed" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px" }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{stat.num}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { href: "/admin/students", icon: "👥", title: "Manage Students", desc: "View and manage registered users" },
            { href: "/admin/questions", icon: "📝", title: "Manage Questions", desc: "Review and edit exam questions" },
            { href: "/admin/import", icon: "📄", title: "Import CSV", desc: "Bulk upload questions from CSV" },
          ].map((item, i) => (
            <div key={i} onClick={() => router.push(item.href)} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", cursor: "pointer" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
