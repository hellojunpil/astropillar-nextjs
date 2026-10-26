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
    <main className="ap-page sh" style={{ fontFamily }}>
      <div className="sh-wrap">
        <div className="sh-orbit ap-orbit" aria-hidden="true" />
        <p className="sh-brand ap-rise">ASTROPILLAR</p>

        {imgUrl && (
          <div className={`sh-art ap-rise ap-d1${isTarot ? ' is-tarot' : ''}`}>
            <div className="sh-halo" aria-hidden="true" />
            <Image
              src={imgUrl}
              alt={label}
              width={isTarot ? 200 : 160}
              height={isTarot ? 333 : 160}
              className="sh-img"
              unoptimized
            />
          </div>
        )}

        <p className="sh-sub ap-rise ap-d2">{t.subtitles[type] || t.fallbackSubtitle}</p>
        <h1 className="sh-title ap-rise ap-d2">{label}</h1>

        <Link href={`${locale && locale !== 'en' ? `/${locale}` : ''}/today`} className="ap-btn sh-cta ap-rise ap-d3">
          {t.cta}
        </Link>

        <p className="sh-free ap-rise ap-d4">{t.free}</p>
      </div>
      <style>{`
        .sh { display:flex; align-items:center; justify-content:center; padding: 32px 20px 64px; }
        .sh-wrap { position: relative; max-width: 420px; width: 100%; text-align: center; display:flex; flex-direction:column; align-items:center; }
        .sh-orbit { position:absolute; left:50%; top: 38%; width: 420px; height: 420px; margin: -210px 0 0 -210px; border-radius:50%;
          border: 1px dashed rgba(201,168,76,.16); pointer-events:none; }
        .sh-brand { font-family:'Cormorant Garamond',serif; color: var(--gold); font-size: 15px; letter-spacing: .32em; font-weight: 700; margin-bottom: 36px; }
        .sh-art { position: relative; margin-bottom: 28px; }
        .sh-halo { position:absolute; inset: -35%; border-radius:50%;
          background: radial-gradient(circle, rgba(230,205,133,.3), rgba(120,104,190,.14) 45%, transparent 70%); animation: apGlow 4s ease-in-out infinite; }
        .sh-img { position: relative; border-radius: 16px; border: 1px solid var(--gold); object-fit: cover;
          box-shadow: 0 0 0 6px rgba(201,168,76,.08), 0 30px 60px -20px rgba(0,0,0,.8); }
        .sh-art:not(.is-tarot) .sh-img { border-radius: 50%; }
        .sh-sub { color: var(--lavender); font-size: 13px; letter-spacing: .12em; margin-bottom: 8px; }
        .sh-title { font-family:'Cormorant Garamond','Noto Serif KR','Noto Serif JP',serif; color: var(--gold-light); font-size: 34px; font-weight: 600; letter-spacing: .02em; margin-bottom: 32px; }
        .sh-cta { min-height: 54px; padding: 0 32px; font-size: 16px; }
        .sh-free { color: var(--ink-3); font-size: 12.5px; margin-top: 16px; }
      `}</style>
    </main>
  )
}
