import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export const metadata: Metadata = {
  title: 'RankUp',
  description: '2027 MA Statewide Fire Lieutenant & Captain Promotional Exam Prep',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

// Runs before paint to apply the right theme class and avoid a flash of the
// wrong mode. Mirrors the logic in ThemeProvider's getInitialTheme().
const noFlashThemeScript = `(function(){try{var t=localStorage.getItem('rankup-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`

const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                try { if (localStorage.getItem('rankup_internal') === '1') gtag('set', { traffic_type: 'internal' }); } catch (e) {}
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        {CLARITY_ID && (
          <Script id="clarity-init" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
              // Admin's own visits (flag set by src/lib/analytics.ts on login) get tagged
              // so Clarity's "Real users" segment can hide them on any network.
              try { if (localStorage.getItem('rankup_internal') === '1') clarity('set', 'platform_admin', 'yes'); } catch (e) {}
            `}
          </Script>
        )}
      </body>
    </html>
  )
}
