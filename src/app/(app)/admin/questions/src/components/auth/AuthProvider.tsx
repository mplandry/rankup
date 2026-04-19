"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

type AuthContextType = {
  userId: string | null;
  userRole: UserRole;
  fullName: string | null;
  email: string;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  userId: null,
  userRole: "student",
  fullName: null,
  email: "",
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

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

      setUserId(user.id);
      setUserRole((profile?.role as UserRole) ?? "student");
      setFullName(profile?.full_name ?? null);
      setEmail(profile?.email ?? user.email ?? "");
      setLoading(false);
    }

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className='min-h-screen bg-[#f8f9fb] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600 text-sm'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ userId, userRole, fullName, email, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
