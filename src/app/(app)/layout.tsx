import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import type { UserRole } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className='min-h-screen bg-[#f8f9fb] md:pl-64' suppressHydrationWarning>
      <Sidebar
        role={(profile?.role as UserRole) ?? "student"}
        fullName={profile?.full_name ?? null}
        email={profile?.email ?? user.email ?? ""}
      />
      <main className='min-h-screen pt-14 md:pt-0'>{children}</main>
    </>
  );
}
