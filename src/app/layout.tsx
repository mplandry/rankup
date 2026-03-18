import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RankUp',
  description: 'Firefighter Promotional Exam Prep',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
