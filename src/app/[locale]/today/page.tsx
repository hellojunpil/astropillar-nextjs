import type { Metadata } from 'next'
export { default } from '@/app/_pages/today/page'

const META: Record<string, { title: string; description: string }> = {
  ko: { title: '오늘의 무료 운세: 타로 · 별자리 · 띠별 운세 | AstroPillar', description: '로그인 없이 오늘의 타로 한 장, 12별자리 운세, 12띠 운세를 무료로 확인하세요.' },
  ja: { title: '今日の無料占い：タロット・星座・干支運勢 | AstroPillar', description: 'ログイン不要。今日のタロット一枚、12星座占い、干支の運勢を無料でチェック。' },
  en: { title: "Free Daily Horoscope, Tarot & Chinese Zodiac | AstroPillar", description: 'Draw a free tarot card and read your daily horoscope and Chinese zodiac fortune. No sign-up needed.' },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const m = META[locale] ?? META.en
  const url = (l: string) => `https://astropillar.com${l === 'en' ? '' : `/${l}`}/today`
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: url(locale), languages: { en: url('en'), ko: url('ko'), ja: url('ja') } },
    openGraph: { title: m.title, description: m.description, url: url(locale), siteName: 'AstroPillar', type: 'website', images: [{ url: 'https://astropillar.com/og-image.png', width: 1200, height: 630 }] },
  }
}
