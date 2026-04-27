import type { Metadata } from 'next'
import Script from 'next/script'
import Providers from '@/components/Providers'
import './globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID

export const metadata: Metadata = {
  title: 'AstroPillar — Where the stars meet your fate',
  description: 'Discover your destiny through Eastern BaZi and Western Astrology. Free personalized readings.',
  verification: {
    google: '91ba17f1e5a9c408',
  },
  openGraph: {
    title: 'AstroPillar — Where the stars meet your fate',
    description: 'Your free BaZi + Astrology reading. Discover what your birth chart really says.',
    url: 'https://astropillar.com',
    siteName: 'AstroPillar',
    type: 'website',
    images: [
      {
        url: 'https://astropillar.com/home.png',
        width: 1200,
        height: 630,
        alt: 'AstroPillar — BaZi & Astrology Reading',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AstroPillar — Where the stars meet your fate',
    description: 'Your free BaZi + Astrology reading. Discover what your birth chart really says.',
    images: ['https://astropillar.com/home.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
