"use client";

import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import Sidebar from "@/components/layout/Sidebar";
import { useState, useEffect } from "react";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { userRole, fullName, email } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Give sidebar time to mount properly
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {!isReady && (
        <div className="fixed inset-0 bg-[#f8f9fb] z-[9999] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading...</p>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-[#f8f9fb] md:pl-64">
        <Sidebar role={userRole} fullName={fullName} email={email} />
        <main className="min-h-screen pt-14 md:pt-0">{children}</main>
      </div>
    </>
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
