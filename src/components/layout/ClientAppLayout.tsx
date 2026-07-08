"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import TopNav from "@/components/layout/TopNav";

const HEARTBEAT_INTERVAL_MS = 60_000;

// Pings /api/heartbeat while a logged-in user has the app open, so admins
// can see who's active right now (see /admin). Fires on mount, on an
// interval, and whenever the tab regains focus/visibility.
function useHeartbeat(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const ping = () => {
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {
        // Best-effort — a missed heartbeat just means a slightly stale "last active" time.
      });
    };

    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId]);
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { userId, userRole, fullName, email } = useAuth();
  useHeartbeat(userId);

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0b1220]">
      <TopNav role={userRole} fullName={fullName} email={email} />
      <main className="min-h-screen">{children}</main>
    </div>
  );
}

export default function ClientAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}
