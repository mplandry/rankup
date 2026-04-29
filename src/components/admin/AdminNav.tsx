'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const adminLinks = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: '📊',
    description: 'Overview & stats'
  },
  {
    href: '/admin/review',
    label: 'Review Queue',
    icon: '✅',
    description: 'Question review & approval'
  },
  {
    href: '/admin/distractor-improver',
    label: 'Distractor Improver',
    icon: '🎯',
    description: 'Upgrade CSV questions'
  },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#F5C842] text-[#1B2A4A] px-2.5 py-1 rounded text-xs font-bold">
          ADMIN
        </span>
        <span className="text-lg font-bold text-[#1B2A4A]">Admin Tools</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {adminLinks.map(link => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block p-4 rounded-lg border transition-all ${
                isActive 
                  ? 'bg-blue-50 border-blue-400' 
                  : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xl">{link.icon}</span>
                <span className={`text-sm font-semibold ${
                  isActive ? 'text-blue-600' : 'text-[#1B2A4A]'
                }`}>
                  {link.label}
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-7">
                {link.description}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
