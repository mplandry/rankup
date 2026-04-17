'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, BookOpen, ClipboardList, TrendingUp, Settings, LogOut, ChevronRight, Menu, X, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/types'

const studentNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/study', label: 'Study Mode', icon: BookOpen },
  { href: '/exam', label: 'Exam Mode', icon: ClipboardList },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/progress', label: 'My Progress', icon: TrendingUp },
]

const adminNav = [
  { href: '/admin', label: 'Admin Overview', icon: Settings },
  { href: '/admin/questions', label: 'Questions', icon: BookOpen },
  { href: '/admin/import', label: 'Import CSV', icon: ClipboardList },
  { href: '/admin/students', label: 'Students', icon: TrendingUp },
]

interface SidebarProps {
  role: UserRole
  fullName: string | null
  email: string
}

export default function Sidebar({ role, fullName, email }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const nav = role === 'admin' ? [...studentNav, ...adminNav] : studentNav

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isMobile === null) return null

  if (!isMobile) {
    return (
      <aside className='flex flex-col w-64 min-h-screen bg-[#1B2A4A] text-white shrink-0'>
        <div className='flex items-center gap-3 px-6 py-5 border-b border-white/10'>
          <div className='w-9 h-9 rounded-lg overflow-hidden shrink-0'>
            <Image src='/icon.png' alt='RankUp' width={36} height={36} className='object-cover' />
          </div>
          <div>
            <div className='font-bold text-sm leading-tight'>RankUp</div>
            <div className='text-xs text-slate-400 capitalize'>{role}</div>
          </div>
        </div>
        <nav className='flex-1 px-3 py-4 space-y-1'>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-[#C0392B] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white')}>
                <Icon className='w-4 h-4 shrink-0' />
                {label}
                {active && <ChevronRight className='w-3.5 h-3.5 ml-auto opacity-60' />}
              </Link>
            )
          })}
        </nav>
        <div className='px-3 pb-4 border-t border-white/10 pt-4 space-y-1'>
          <div className='flex items-center gap-3 px-3 py-2'>
            <div className='w-8 h-8 rounded-full bg-[#C0392B] flex items-center justify-center shrink-0'>
              <span className='text-xs font-bold text-white'>{(fullName || email).charAt(0).toUpperCase()}</span>
            </div>
            <div className='min-w-0'>
              <div className='text-sm font-medium truncate text-white'>{fullName || email}</div>
              <div className='text-xs text-slate-400 truncate'>{email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className='flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors'>
            <LogOut className='w-4 h-4' />Sign Out
          </button>
        </div>
      </aside>
    )
  }

  return (
    <>
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:40,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#1B2A4A',color:'white'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'8px',overflow:'hidden'}}>
            <Image src='/icon.png' alt='RankUp' width={32} height={32} style={{objectFit:'cover'}} />
          </div>
          <div style={{fontWeight:'bold',fontSize:'14px'}}>RankUp</div>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{padding:'6px',borderRadius:'8px',background:'transparent',border:'none',color:'white',cursor:'pointer'}}>
          {mobileOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
        </button>
      </div>
      {mobileOpen && (
        <div style={{position:'fixed',inset:0,zIndex:30,display:'flex'}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)'}} onClick={() => setMobileOpen(false)} />
          <div style={{position:'relative',display:'flex',flexDirection:'column',width:'256px',minHeight:'100vh',background:'#1B2A4A',color:'white',paddingTop:'56px'}}>
            <nav style={{flex:1,padding:'16px 12px',display:'flex',flexDirection:'column',gap:'4px'}}>
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href))
                return (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-[#C0392B] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white')}>
                    <Icon className='w-4 h-4 shrink-0' />
                    {label}
                    {active && <ChevronRight className='w-3.5 h-3.5 ml-auto opacity-60' />}
                  </Link>
                )
              })}
            </nav>
            <div style={{padding:'16px 12px',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'8px 12px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#C0392B',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{fontSize:'12px',fontWeight:'bold',color:'white'}}>{(fullName || email).charAt(0).toUpperCase()}</span>
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'14px',fontWeight:500,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fullName || email}</div>
                  <div style={{fontSize:'12px',color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{email}</div>
                </div>
              </div>
              <button onClick={handleLogout} style={{display:'flex',width:'100%',alignItems:'center',gap:'12px',padding:'10px 12px',borderRadius:'8px',background:'transparent',border:'none',color:'#cbd5e1',cursor:'pointer',fontSize:'14px'}}>
                <LogOut className='w-4 h-4' />Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
