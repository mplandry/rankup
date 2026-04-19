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
import { useState } from "react";

const studentNav = [
  { name: "Dashboard", href: "/dashboard", icon: Layout },
  { name: "Study", href: "/study", icon: BookOpen },
  { name: "Exam", href: "/exam", icon: FileText },
  { name: "Flashcards", href: "/flashcards", icon: CreditCard },
  { name: "Progress", href: "/progress", icon: BarChart3 },
];

const adminNav = [
  { name: "Admin", href: "/admin", icon: Settings },
  { name: "Questions", href: "/admin/questions", icon: List },
  { name: "Import", href: "/admin/import", icon: Upload },
  { name: "Students", href: "/admin/students", icon: Users },
];

export default function TopNav({
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const nav = role === "admin" ? [...studentNav, ...adminNav] : studentNav;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <nav className='fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex items-center justify-between h-16'>
            <Link href='/dashboard' className='flex items-center gap-2'>
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
              <span className='font-bold text-lg text-[#1B2A4A]'>RankUp</span>
            </Link>

            <div className='hidden md:flex items-center gap-1'>
              {nav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors " +
                      (isActive
                        ? "bg-[#1B2A4A] text-white"
                        : "text-gray-700 hover:bg-gray-100")
                    }
                  >
                    <item.icon className='w-4 h-4' />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className='flex items-center gap-2'>
              <div className='hidden md:block relative'>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors'
                >
                  <div className='w-8 h-8 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white text-sm font-medium'>
                    {(fullName?.[0] || email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className='text-left hidden lg:block'>
                    <div className='text-sm font-medium text-gray-900'>
                      {fullName || "User"}
                    </div>
                    <div className='text-xs text-gray-500'>{email}</div>
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className='fixed inset-0 z-40'
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50'>
                      <div className='px-4 py-2 border-b border-gray-100'>
                        <div className='text-sm font-medium text-gray-900'>
                          {fullName || "User"}
                        </div>
                        <div className='text-xs text-gray-500'>{email}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className='w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                      >
                        <LogOut className='w-4 h-4' />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className='md:hidden p-2 rounded-lg hover:bg-gray-100'
              >
                {mobileOpen ? (
                  <X className='w-6 h-6' />
                ) : (
                  <Menu className='w-6 h-6' />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className='md:hidden border-t border-gray-200 bg-white'>
            <div className='px-4 py-2 space-y-1'>
              {nav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium " +
                      (isActive
                        ? "bg-[#1B2A4A] text-white"
                        : "text-gray-700 hover:bg-gray-100")
                    }
                  >
                    <item.icon className='w-4 h-4' />
                    {item.name}
                  </Link>
                );
              })}
              <div className='border-t border-gray-200 pt-2 mt-2'>
                <div className='px-3 py-2'>
                  <div className='text-sm font-medium text-gray-900'>
                    {fullName || "User"}
                  </div>
                  <div className='text-xs text-gray-500'>{email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className='w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100'
                >
                  <LogOut className='w-4 h-4' />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <div className='h-16' />
    </>
  );
}
