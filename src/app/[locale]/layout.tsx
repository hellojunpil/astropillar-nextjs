import type { Metadata } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Providers from '@/components/Providers'

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing' })

  const titles: Record<string, string> = {
    en: 'AstroPillar — Where the stars meet your fate',
    ko: 'AstroPillar — 사주와 별자리로 읽는 나의 운명',
    ja: 'AstroPillar — 星と四柱推命が導く、あなたの運命',
  }
  const descs: Record<string, string> = {
    en: 'Read your destiny through Eastern BaZi and Western astrology. Daily tarot, horoscope and zodiac fortunes are free.',
    ko: '동양 사주와 서양 점성술로 나의 운명을 읽어보세요. 오늘의 타로·별자리·띠 운세는 매일 무료예요.',
    ja: '東洋の四柱推命と西洋占星術であなたの運命を読み解きます。今日のタロット・星座・干支運勢は毎日無料。',
  }

  return {
    title: titles[locale] || titles.en,
    description: descs[locale] || descs.en,
    verification: { google: '91ba17f1e5a9c408' },
    openGraph: {
      title: titles[locale] || titles.en,
      description: descs[locale] || descs.en,
      url: 'https://astropillar.com',
      siteName: 'AstroPillar',
      type: 'website',
      images: [{ url: 'https://astropillar.com/og-image.png', width: 1200, height: 630 }],
    },
  }
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'ko' | 'ja')) {
    notFound()
  }

  const messages = await getMessages()

  const fontLinks: Record<string, string> = {
    // 전체 서체: Pretendard (일본어는 Pretendard JP)
    ko: '',
    ja: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-jp-dynamic-subset.min.css',
    en: '',
  }

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        {/* 한자 표시용 명조 (Google Fonts가 글자 범위별로 잘라서 필요한 글자만 받음) */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap" rel="stylesheet" />
        {fontLinks[locale] && <link href={fontLinks[locale]} rel="stylesheet" />}
      </head>
      <body>
        <Script id="disable-pwa-install" strategy="afterInteractive">{`
          window.addEventListener('beforeinstallprompt', function(e) { e.preventDefault(); });
        `}</Script>
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
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
