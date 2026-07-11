import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

const IMG_BASE = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

interface PageProps {
  params?: Promise<{ locale?: string }>
  searchParams: Promise<{ type?: string; id?: string; label?: string }>
}

const TEXTS = {
  en: {
    subtitles: { tarot: 'Daily Tarot Card', horoscope: 'Daily Horoscope', chinese: 'Chinese Zodiac Fortune' } as Record<string, string>,
    fallbackSubtitle: "Today's Fortune",
    descriptions: (label: string) => ({
      tarot: `"${label}" was drawn from the Major Arcana. What does your card say?`,
      horoscope: `Today's ${label} horoscope has been revealed. Check yours at AstroPillar!`,
      chinese: `Year of the ${label} fortune revealed. Check yours at AstroPillar!`,
    }) as Record<string, string>,
    fallbackDesc: 'Discover your daily fortune at AstroPillar.',
    cta: '✦ Check My Fortune →',
    free: 'Free · No login required',
  },
  ko: {
    subtitles: { tarot: '오늘의 타로 카드', horoscope: '오늘의 별자리 운세', chinese: '오늘의 띠별 운세' } as Record<string, string>,
    fallbackSubtitle: '오늘의 운세',
    descriptions: (label: string) => ({
      tarot: `메이저 아르카나에서 "${label}" 카드가 나왔어요. 당신의 카드는 뭐라고 말할까요?`,
      horoscope: `오늘의 ${label} 운세가 공개됐어요. AstroPillar에서 확인해보세요!`,
      chinese: `${label}띠 오늘의 운세가 공개됐어요. AstroPillar에서 확인해보세요!`,
    }) as Record<string, string>,
    fallbackDesc: 'AstroPillar에서 오늘의 운세를 확인해보세요.',
    cta: '✦ 내 운세 확인하기 →',
    free: '무료 · 로그인 불필요',
  },
  ja: {
    subtitles: { tarot: '今日のタロットカード', horoscope: '今日の星座占い', chinese: '今日の干支占い' } as Record<string, string>,
    fallbackSubtitle: '今日の運勢',
    descriptions: (label: string) => ({
      tarot: `メジャーアルカナから「${label}」が出ました。あなたのカードは何と言うでしょう？`,
      horoscope: `今日の${label}の運勢が公開されました。AstroPillarでチェック！`,
      chinese: `${label}年生まれの今日の運勢が公開されました。AstroPillarでチェック！`,
    }) as Record<string, string>,
    fallbackDesc: 'AstroPillarで今日の運勢をチェックしましょう。',
    cta: '✦ 私の運勢をチェック →',
    free: '無料 · ログイン不要',
  },
}

function getTexts(locale?: string) {
  return TEXTS[locale as keyof typeof TEXTS] ?? TEXTS.en
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const locale = (await params)?.locale
  const { type = 'tarot', id = '', label = '' } = await searchParams
  const t = getTexts(locale)
  const imgUrl = id ? `${IMG_BASE}${id}` : ''
  const description = t.descriptions(label)[type] || t.fallbackDesc
  const title = `${label} — AstroPillar`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imgUrl ? [{ url: imgUrl }] : [],
      url: 'https://astropillar.com/today',
      siteName: 'AstroPillar',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imgUrl ? [imgUrl] : [],
    },
  }
}

export default async function SharePage({ params, searchParams }: PageProps) {
  const locale = (await params)?.locale
  const { type = 'tarot', id = '', label = '' } = await searchParams
  const t = getTexts(locale)
  const imgUrl = id ? `${IMG_BASE}${id}` : ''
  const isTarot = type === 'tarot'
  const fontFamily = locale === 'ko' ? "'Noto Sans KR', sans-serif" : locale === 'ja' ? "'Noto Sans JP', sans-serif" : "'Noto Sans', sans-serif"

  return (
    <main style={{
      background: '#0a0a0f', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily,
    }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <p style={{ color: '#C9A84C', fontSize: 11, letterSpacing: 4, fontWeight: 700, marginBottom: 32 }}>
          ASTROPILLAR
        </p>

        {imgUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Image
              src={imgUrl}
              alt={label}
              width={isTarot ? 180 : 150}
              height={isTarot ? 300 : 150}
              style={{
                borderRadius: 12,
                border: '2px solid #C9A84C',
                objectFit: 'cover',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              }}
              unoptimized
            />
          </div>
        )}

        <p style={{ color: '#aaaaaa', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          {t.subtitles[type] || t.fallbackSubtitle}
        </p>
        <h1 style={{ color: '#C9A84C', fontSize: 28, fontWeight: 700, marginBottom: 32, fontFamily: "'Cormorant Garamond', serif", letterSpacing: 1 }}>
          {label}
        </h1>

        <Link
          href="/today"
          style={{
            background: '#C9A84C', color: '#16213E', fontWeight: 700,
            padding: '14px 32px', borderRadius: 50, textDecoration: 'none',
            fontSize: 15, display: 'inline-block',
          }}
        >
          {t.cta}
        </Link>

        <p style={{ color: '#444', fontSize: 11, marginTop: 20 }}>
          {t.free}
        </p>
      </div>
    </main>
  )
}
