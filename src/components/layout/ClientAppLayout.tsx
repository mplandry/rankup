"use client";

import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import TopNav from "@/components/layout/TopNav";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { userRole, fullName, email } = useAuth();

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
