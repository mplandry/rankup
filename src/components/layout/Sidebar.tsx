"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types";

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/study", label: "Study Mode", icon: BookOpen },
  { href: "/exam", label: "Exam Mode", icon: ClipboardList },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/progress", label: "My Progress", icon: TrendingUp },
];

const adminNav = [
  { href: "/admin", label: "Admin Overview", icon: Settings },
  { href: "/admin/questions", label: "Questions", icon: BookOpen },
  { href: "/admin/import", label: "Import CSV", icon: ClipboardList },
  { href: "/admin/students", label: "Students", icon: TrendingUp },
];

interface SidebarProps {
  role: UserRole;
  fullName: string | null;
  email: string;
}

export default function Sidebar({ role, fullName, email }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = role === "admin" ? [...studentNav, ...adminNav] : studentNav;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = nav.map(({ href, label, icon: Icon }) => {
    const active =
      pathname === href ||
      (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href));
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          active
            ? "bg-[#C0392B] text-white"
            : "text-slate-300 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon className='w-4 h-4 shrink-0' />
        {label}
        {active && <ChevronRight className='w-3.5 h-3.5 ml-auto opacity-60' />}
      </Link>
    );
  });

  const userSection = (
    <div className='px-3 pb-4 border-t border-white/10 pt-4 space-y-1'>
      <div className='flex items-center gap-3 px-3 py-2'>
        <div className='w-8 h-8 rounded-full bg-[#C0392B] flex items-center justify-center shrink-0'>
          <span className='text-xs font-bold text-white'>
            {(fullName || email).charAt(0).toUpperCase()}
          </span>
        </div>
        <div className='min-w-0'>
          <div className='text-sm font-medium truncate'>
            {fullName || email}
          </div>
          <div className='text-xs text-slate-400 truncate'>{email}</div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className='flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors'
      >
        <LogOut className='w-4 h-4' />
        Sign Out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar - only on small screens */}
      <div className='sm:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#1B2A4A] text-white'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg overflow-hidden shrink-0'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={32}
              height={32}
              className='object-cover'
            />
          </div>
          <div className='font-bold text-sm'>RankUp</div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className='p-1.5 rounded-lg hover:bg-white/10 transition-colors'
        >
          {mobileOpen ? (
            <X className='w-5 h-5' />
          ) : (
            <Menu className='w-5 h-5' />
          )}
        </button>
      </div>

      {/* Mobile drawer - only on small screens */}
      {mobileOpen && (
        <div className='sm:hidden fixed inset-0 z-30 flex'>
          <div
            className='absolute inset-0 bg-black/50'
            onClick={() => setMobileOpen(false)}
          />
          <div className='relative flex flex-col w-64 min-h-screen bg-[#1B2A4A] text-white pt-14'>
            <nav className='flex-1 px-3 py-4 space-y-1'>{navLinks}</nav>
            {userSection}
          </div>
        </div>
      )}

      {/* Desktop sidebar - only on sm and above */}
      <aside className='hidden sm:flex flex-col w-64 min-h-screen bg-[#1B2A4A] text-white'>
        <div className='flex items-center gap-3 px-6 py-5 border-b border-white/10'>
          <div className='w-9 h-9 rounded-lg overflow-hidden shrink-0'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={36}
              height={36}
              className='object-cover'
            />
          </div>
          <div>
            <div className='font-bold text-sm leading-tight'>RankUp</div>
            <div className='text-xs text-slate-400 capitalize'>{role}</div>
          </div>
        </div>
        <nav className='flex-1 px-3 py-4 space-y-1'>{navLinks}</nav>
        {userSection}
      </aside>
    </>
  );
}
