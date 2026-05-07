"use client";

import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import TopNav from "@/components/layout/TopNav";
import Footer from "@/components/layout/Footer";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { userRole, fullName, email } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      <TopNav role={userRole} fullName={fullName} email={email} />
      <main className="flex-1">{children}</main>
      <Footer />
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
}mv src/app/\(app\)/privicy src/app/\(app\)/privacynano src/components/layout/ClientAppLayout.tsx
"use client";

import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import TopNav from "@/components/layout/TopNav";
import Footer from "@/components/layout/Footer";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { userRole, fullName, email } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      <TopNav role={userRole} fullName={fullName} email={email} />
      <main className="flex-1">{children}</main>
      <Footer />
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
