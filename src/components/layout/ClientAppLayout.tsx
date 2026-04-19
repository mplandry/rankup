"use client";

import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import Sidebar from "@/components/layout/Sidebar";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { userRole, fullName, email } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8f9fb] md:pl-64">
      <Sidebar role={userRole} fullName={fullName} email={email} />
      <main className="min-h-screen pt-14 md:pt-0">{children}</main>
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
