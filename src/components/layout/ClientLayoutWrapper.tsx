"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import type { UserRole } from "@/types";

export default function ClientLayoutWrapper({
  role,
  fullName,
  email,
  children,
}: {
  role: UserRole;
  fullName: string | null;
  email: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && (
        <Sidebar role={role} fullName={fullName} email={email} />
      )}
      <main className='min-h-screen pt-14 md:pt-0'>{children}</main>
    </>
  );
}
