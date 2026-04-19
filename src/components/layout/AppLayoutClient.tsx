"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import type { UserRole } from "@/types";

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .single();

      setUserRole((profile?.role as UserRole) ?? "student");
      setFullName(profile?.full_name ?? null);
      setEmail(profile?.email ?? user.email ?? "");
      setLoading(false);
    }

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] md:pl-64">
      <Sidebar role={userRole} fullName={fullName} email={email} />
      <main className="min-h-screen pt-14 md:pt-0">{children}</main>
    </div>
  );
}
