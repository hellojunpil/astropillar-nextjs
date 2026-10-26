import type { Metadata, Viewport } from 'next'
import './globals.css'

// 실제 <html>/<body>는 app/[locale]/layout.tsx 가 렌더링 (next-intl 권장 구조).
// 여기서 html을 또 그리면 html 중첩 → 하이드레이션 에러가 발생했음.
export const metadata: Metadata = {
  title: 'AstroPillar — Where the stars meet your fate',
  description: 'Discover your destiny through Eastern BaZi and Western Astrology. Free personalized readings.',
  manifest: '/manifest.json',
  verification: { google: '91ba17f1e5a9c408' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AstroPillar',
  },
  openGraph: {
    title: 'AstroPillar — Where the stars meet your fate',
    description: 'Your free BaZi + Astrology reading. Discover what your birth chart really says.',
    url: 'https://astropillar.com',
    siteName: 'AstroPillar',
    type: 'website',
    images: [{ url: 'https://astropillar.com/og-image.png', width: 1200, height: 630, alt: 'AstroPillar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AstroPillar — Where the stars meet your fate',
    description: 'Your free BaZi + Astrology reading. Discover what your birth chart really says.',
    images: ['https://astropillar.com/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#070914',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
