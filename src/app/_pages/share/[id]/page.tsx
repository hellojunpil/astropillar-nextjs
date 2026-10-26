'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getShare, ShareRecord } from '@/lib/firestore'
import { BirthData } from '@/components/BirthForm'
import ReadingResult, { parseResult } from '@/components/ReadingResult'
import { localizeTarotTitle } from '@/lib/tarotTitles'
import { cardImageUrl } from '@/lib/tarotDeck'
import Link from 'next/link'
import { gtagEvent } from '@/lib/gtag'

interface TarotSharedResult {
  content_text?: string
  cards?: Array<{ name?: string; position?: string; file?: string }>
  question?: string
}

function TarotSharedView({ record }: { record: ShareRecord }) {
  const locale = useLocale()
  const result = (record.result ?? {}) as TarotSharedResult
  const cards = result.cards ?? []
  const sections = result.content_text
    ? parseResult(result.content_text).filter(sec =>
        !sec.content.includes('Get Scenario Reading') && !sec.content.includes('Share & Earn Credits'))
    : []

  return (
    <div>
      {result.question && (
        <p style={{ color: 'var(--ink-2)', fontSize: 15, fontStyle: 'italic', textAlign: 'center', marginBottom: 24, lineHeight: 1.7 }}>
          “{result.question}”
        </p>
      )}

      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {c.file && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cardImageUrl(c.file)} alt={c.name ?? ''} style={{ width: 84, height: 136, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--gold)', boxShadow: '0 14px 30px -12px rgba(0,0,0,.7)' }} />
              )}
              {c.position && <p style={{ color: 'var(--gold-light)', fontSize: 12.5, fontWeight: 700 }}>{c.position}</p>}
              {c.name && <p style={{ color: 'var(--ink-2)', fontSize: 12, textAlign: 'center', maxWidth: 90 }}>{c.name}</p>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map((sec, i) => (
          <div key={i} className="ap-glass" style={{ padding: '18px 20px' }}>
            {sec.title && <p style={{ color: 'var(--gold-light)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{localizeTarotTitle(sec.title, locale)}</p>}
            <p style={{ color: 'var(--ink)', fontSize: 15.5, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{sec.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>()
  const locale = useLocale()
  const prefix = locale === 'en' ? '' : `/${locale}`
  const L = SHARE_UI[locale as keyof typeof SHARE_UI] ?? SHARE_UI.en
  const [record, setRecord] = useState<ShareRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    getShare(id).then(r => {
      if (r) setRecord(r)
      else setNotFound(true)
      setLoading(false)
    })
  }, [id])

  // 공유받은 사람의 다음 행동: 무료 체험 → 가입 (가입 시 1크레딧)
  const isTarot = !!record?.reading_type?.startsWith('tarot')
  const freeHref = `${prefix}/today`
  const signupHref = `${prefix}/login?tab=signup&returnUrl=${encodeURIComponent(`${prefix}${isTarot ? '/tarot/three-card' : '/reading/personal-fortune'}`)}`

  if (loading) {
    return (
      <main className="ap-page" style={{ display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--gold-light)', fontSize: 16 }}>{L.loading}</p>
      </main>
    )
  }

  if (notFound || !record) {
    return (
      <main className="ap-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: '0 20px' }}>
        <p style={{ color: 'var(--ink-2)', fontSize: 16 }}>{L.notFound}</p>
        <Link href={freeHref} className="ap-btn">{L.free}</Link>
      </main>
    )
  }

  return (
    <main className="ap-page">
      <div className="sh-mhead ap-mobile-only">
        <Link href={`${prefix}/`} className="sh-logo">ASTROPILLAR</Link>
        <Link href={freeHref} className="ap-btn-ghost ap-btn-sm">{L.freeShort}</Link>
      </div>
      <div className="ap-reading-col" style={{ paddingTop: 24 }}>
        <p className="sh-kicker">{L.kicker}</p>
        {isTarot ? (
          <TarotSharedView record={record} />
        ) : (
          <ReadingResult
            raw={record.result}
            onReset={() => {}}
            birthData={record.birth_data as BirthData | undefined}
            isSharedView={true}
          />
        )}

        <section className="ap-glass ap-glass-gold sh-cta">
          <p className="sh-cta-title">{L.ctaTitle}</p>
          <p className="sh-cta-desc">{L.ctaDesc}</p>
          <div className="sh-cta-row">
            <Link href={freeHref} className="ap-btn" onClick={() => gtagEvent('share_visit_cta', { target: 'today', locale })}>{L.free}</Link>
            <Link href={signupHref} className="ap-btn-ghost" onClick={() => gtagEvent('share_visit_cta', { target: 'signup', locale })}>{L.signup}</Link>
          </div>
          <p className="sh-cta-note">{L.note}</p>
        </section>
      </div>
      <style>{`
        .sh-mhead { position: sticky; top: 0; z-index: 40; display:flex; justify-content:space-between; align-items:center; padding: 10px 16px;
          background: rgba(7,9,20,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
        .sh-logo { font-weight: 700; font-size: 15px; letter-spacing: .2em; color: var(--gold); text-decoration: none; }
        .sh-kicker { text-align: center; font-size: 13px; color: var(--lavender); letter-spacing: .04em; margin-bottom: 18px; }
        .sh-cta { margin-top: 32px; padding: 28px 22px; text-align: center; }
        .sh-cta-title { font-size: 20px; font-weight: 700; }
        .sh-cta-desc { margin-top: 8px; font-size: 14.5px; color: var(--ink-2); line-height: 1.7; }
        .sh-cta-row { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 10px; }
        .sh-cta-note { margin-top: 12px; font-size: 12.5px; color: var(--ink-3); }
        @media (min-width: 640px) { .sh-cta-row { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </main>
  )
}

const SHARE_UI = {
  ko: { loading: '리딩을 불러오는 중...', notFound: '공유된 리딩을 찾을 수 없어요.', kicker: '친구가 공유한 AstroPillar 리딩', ctaTitle: '나의 별은 무엇을 말할까요?', ctaDesc: '타로 한 장, 별자리, 띠별 운세는 가입 없이 매일 무료예요.', free: '오늘의 운세 무료로 보기', freeShort: '무료 운세', signup: '가입하고 1크레딧 받기', note: '가입하면 1크레딧이 바로 지급돼요.' },
  ja: { loading: 'リーディングを読み込み中...', notFound: '共有されたリーディングが見つかりません。', kicker: '友だちが共有したAstroPillarリーディング', ctaTitle: 'あなたの星は何を語る？', ctaDesc: 'タロット一枚、星座、干支運勢は登録なしで毎日無料です。', free: '今日の運勢を無料で見る', freeShort: '無料占い', signup: '登録して1クレジットを受け取る', note: '登録するとすぐに1クレジットが付与されます。' },
  en: { loading: 'Loading reading...', notFound: 'This shared reading could not be found.', kicker: 'An AstroPillar reading shared with you', ctaTitle: 'What do your stars say?', ctaDesc: 'A daily tarot card, horoscope and zodiac fortune, free with no sign-up.', free: "See Today's Fortune Free", freeShort: 'Free fortune', signup: 'Sign up · get 1 free credit', note: 'New accounts get 1 credit right away.' },
}
