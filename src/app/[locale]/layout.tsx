import type { Metadata } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Providers from '@/components/Providers'
import '../globals.css'

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
    en: 'Discover your destiny through Eastern BaZi and Western Astrology. Free personalized readings.',
    ko: '동양 사주와 서양 점성술로 나의 운명을 알아보세요. 무료 개인 맞춤 운세.',
    ja: '東洋の四柱推命と西洋占星術であなたの運命を読み解きます。無料パーソナルリーディング。',
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
    ko: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap',
    ja: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap',
    en: '',
  }

  return (
    <html lang={locale}>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        {fontLinks[locale] && <link href={fontLinks[locale]} rel="stylesheet" />}
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
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
