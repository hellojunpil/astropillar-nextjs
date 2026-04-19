import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID

export const metadata: Metadata = {
  title: 'AstroPillar — Where the stars meet your fate',
  description: 'Discover your destiny through Eastern BaZi and Western Astrology. Free personalized readings.',
  openGraph: {
    title: 'AstroPillar',
    description: 'Your BaZi + Astrology reading — free.',
    url: 'https://astropillar.com',
    siteName: 'AstroPillar',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
        {children}
      </body>
    </html>
  )
}
