"use client";

import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STUDENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/study", label: "Study Mode", icon: "📖" },
  { href: "/exam", label: "Exam Mode", icon: "📋" },
  { href: "/progress", label: "My Progress", icon: "📈" },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Admin Overview", icon: "⚙️" },
  { href: "/admin/questions", label: "Questions", icon: "📚" },
  { href: "/admin/import", label: "Import CSV", icon: "📄" },
  { href: "/admin/students", label: "Students", icon: "👥" },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole?: string;
}

export default function Sidebar({ userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = userRole === "admin";
  const navItems = isAdmin ? [...STUDENT_NAV, ...ADMIN_NAV] : STUDENT_NAV;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      style={{
        width: "var(--sidebar-w)",
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "20px 18px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            background: "var(--red)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🔥
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>RankUp</div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Fire Promo Prep</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "10px 0" }}>
        {isAdmin && (
          <div style={{ padding: "8px 18px 4px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Student
          </div>
        )}
        {STUDENT_NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <div
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 18px",
                color: active ? "#fff" : "rgba(255,255,255,0.65)",
                fontSize: 13.5,
                fontWeight: 500,
                cursor: "pointer",
                background: active ? "var(--red)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {active && <span style={{ marginLeft: "auto", fontSize: 11 }}>›</span>}
            </div>
          );
        })}

        {isAdmin && (
          <>
            <div style={{ padding: "12px 18px 4px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Admin
            </div>
            {ADMIN_NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <div
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 18px",
                    color: active ? "#fff" : "rgba(255,255,255,0.65)",
                    fontSize: 13.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: active ? "var(--red)" : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                  {active && <span style={{ marginLeft: "auto", fontSize: 11 }}>›</span>}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* User */}
      <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--red)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {userName?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{userName}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{userEmail}</div>
          </div>
        </div>
        <div
          onClick={handleSignOut}
          style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", fontSize: 12.5, cursor: "pointer" }}
        >
          ↪ Sign Out
        </div>
      </div>
    </div>
  );
}
