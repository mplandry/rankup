import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export const metadata: Metadata = {
  title: 'RankUp',
  description: 'Firefighter Promotional Exam Prep',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

// Runs before paint to apply the right theme class and avoid a flash of the
// wrong mode. Mirrors the logic in ThemeProvider's getInitialTheme().
const noFlashThemeScript = `(function(){try{var t=localStorage.getItem('rankup-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
