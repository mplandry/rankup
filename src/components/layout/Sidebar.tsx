"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  BarChart3,
  Layout,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  List,
  Upload,
  Users,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const studentNav = [
  { name: "Dashboard", href: "/dashboard", icon: Layout },
  { name: "Study Mode", href: "/study", icon: BookOpen },
  { name: "Exam Mode", href: "/exam", icon: FileText },
  { name: "Flashcards", href: "/flashcards", icon: CreditCard },
  { name: "My Progress", href: "/progress", icon: BarChart3 },
];

const adminNav = [
  { name: "Admin Overview", href: "/admin", icon: Settings },
  { name: "Questions", href: "/admin/questions", icon: List },
  { name: "Import CSV", href: "/admin/import", icon: Upload },
  { name: "Students", href: "/admin/students", icon: Users },
];

export default function Sidebar({
  role,
  fullName,
  email,
}: {
  role: string;
  fullName?: string | null;
  email?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const nav = role === "admin" ? [...studentNav, ...adminNav] : studentNav;

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className='fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#1B2A4A] text-white md:hidden'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg overflow-hidden'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={32}
              height={32}
              className='object-cover'
              priority
            />
          </div>
          <div className='font-bold text-sm'>RankUp</div>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className='p-2'>
          {mobileOpen ? (
            <X className='w-6 h-6' />
          ) : (
            <Menu className='w-6 h-6' />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className='hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#1B2A4A] text-white z-50'>
        <div className='p-6 flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg overflow-hidden'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={40}
              height={40}
              className='object-cover'
              priority
            />
          </div>
          <div className='font-bold text-lg'>RankUp</div>
        </div>

        <nav className='flex-1 px-3 py-2'>
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 " +
                  (isActive
                    ? "bg-white/20 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white")
                }
              >
                <item.icon className='w-4 h-4' />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className='p-4 border-t border-white/10'>
          <div className='flex items-center gap-3 px-3 py-2 mb-2'>
            <div className='w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium'>
              {(fullName?.[0] || email?.[0] || "U").toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-sm font-medium truncate text-white'>
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
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className='fixed inset-0 z-30 md:hidden'>
          <div
            onClick={() => setMobileOpen(false)}
            className='absolute inset-0 bg-black/50'
          />
          <div className='absolute left-0 top-14 bottom-0 w-64 bg-[#1B2A4A] text-white flex flex-col'>
            <nav className='flex-1 px-3 py-2 overflow-y-auto'>
              {nav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 " +
                      (isActive
                        ? "bg-white/20 text-white"
                        : "text-slate-300 hover:bg-white/10 hover:text-white")
                    }
                  >
                    <item.icon className='w-4 h-4' />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className='p-4 border-t border-white/10'>
              <div className='flex items-center gap-3 px-3 py-2 mb-2'>
                <div className='w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium'>
                  {(fullName?.[0] || email?.[0] || "U").toUpperCase()}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='text-sm font-medium truncate text-white'>
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
          </div>
        </div>
      )}
    </>
  );
}
