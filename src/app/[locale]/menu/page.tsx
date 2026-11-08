'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '@/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiGet, getPouchWithRetry } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { usePricing } from '@/hooks/usePricing'
import BottomNav from '@/components/BottomNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import LegalFooter from '@/components/LegalFooter'
import { isNewYearSeason } from '@/lib/season'

// 각 서비스가 답하는 "질문" (Codex 기획: 서비스 목록 → 질문 중심 안내)
const QUESTIONS: Record<string, Record<string, string>> = {
  ko: {
    'personal-fortune': '나는 어떤 사람으로 태어났을까?',
    daily: '오늘 나에게 어떤 기운이 흐를까?',
    yearly: '올해는 어떤 흐름으로 흘러갈까?',
    compatibility: '우리 두 사람, 정말 잘 맞을까?',
    'three-card': '이 일은 어디서 와서 어디로 갈까?',
    relationship: '그 사람의 마음은 지금 어떨까?',
    'celtic-cross': '복잡하게 얽힌 이 상황, 어떻게 풀릴까?',
  },
  ja: {
    'personal-fortune': '私はどんな人として生まれたの？',
    daily: '今日、私にどんな気が流れる？',
    yearly: '今年はどんな流れになる？',
    compatibility: '私たち二人、本当に合っている？',
    'three-card': 'この出来事はどこから来て、どこへ向かう？',
    relationship: 'あの人の気持ちは今どうなっている？',
    'celtic-cross': '複雑に絡んだこの状況、どう動く？',
  },
  en: {
    'personal-fortune': 'Who was I born to be?',
    daily: 'What energy is flowing to me today?',
    yearly: 'Where is this year taking me?',
    compatibility: 'Are the two of us truly aligned?',
    'three-card': 'Where did this come from, and where is it going?',
    relationship: 'What is really between us right now?',
    'celtic-cross': 'How will this tangled situation unfold?',
  },
}

const UI: Record<string, { hello: string; guest: string; freeTitle: string; freeSub: string; freeCta: string; sajuSection: string; sajuSub: string; tarotSub: string; recommended: string }> = {
  ko: { hello: '오늘 밤, 어떤 질문을 품고 오셨나요?', guest: '가입하면 첫 리딩용 크레딧 1개를 드려요', freeTitle: '오늘의 별 메시지', freeSub: '타로 한 장 · 별자리 · 띠별 운세, 매일 무료', freeCta: '무료로 보기', sajuSection: '사주 × 별자리 리딩', sajuSub: '태어난 순간의 하늘과 네 기둥을 함께 읽어요', tarotSub: '카드를 직접 골라 지금의 질문에 답을 구해요', recommended: '가장 먼저 추천' },
  ja: { hello: '今夜、どんな問いを抱えてきましたか？', guest: '登録すると最初のリーディング用クレジットを1つ差し上げます', freeTitle: '今日の星のメッセージ', freeSub: 'タロット一枚 · 星座 · 干支運勢、毎日無料', freeCta: '無料で見る', sajuSection: '四柱推命 × 星座リーディング', sajuSub: '生まれた瞬間の空と四つの柱を一緒に読みます', tarotSub: 'カードを自分で選び、今の問いに答えを求めます', recommended: 'まずはこちら' },
  en: { hello: 'What question did you bring tonight?', guest: 'Sign up and get 1 free credit for your first reading', freeTitle: "Today's message from the stars", freeSub: 'One tarot card, horoscope and zodiac fortune, free daily', freeCta: 'See it free', sajuSection: 'BaZi × Astrology Readings', sajuSub: 'We read the sky of your birth together with your Four Pillars', tarotSub: 'Draw your own cards and ask the question on your mind', recommended: 'Start here' },
}

const GLYPH: Record<string, string> = {
  'personal-fortune': '✦', daily: '☉', yearly: '♃', compatibility: '⚭',
  'three-card': '☽', relationship: '♀', 'celtic-cross': '✠',
}

export default function MenuPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('menu')
  const ui = UI[locale] ?? UI.en
  const qs = QUESTIONS[locale] ?? QUESTIONS.en
  const [email, setEmail] = useState('')
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const pricing = usePricing()

  function getFortuneYear() {
    const now = new Date()
    return now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear()
  }

  const SERVICE_DEFS = [
    { id: 'personal-fortune', pricingKey: 'personal_fortune', href: '/reading/personal-fortune', tKey: 'services.personal_fortune' },
    { id: 'daily', pricingKey: 'personal_daily_fortune', href: '/reading/daily', tKey: 'services.daily' },
    { id: 'yearly', pricingKey: 'yearly', href: '/reading/yearly', tKey: 'services.yearly' },
    { id: 'compatibility', pricingKey: 'compatibility', href: '/reading/compatibility', tKey: 'services.compatibility' },
  ]

  const TAROT_DEFS = [
    { id: 'three-card', pricingKey: 'tarot_three_card', href: '/tarot/three-card', tKey: 'tarot.three_card' },
    { id: 'relationship', pricingKey: 'tarot_relationship', href: '/tarot/relationship', tKey: 'tarot.relationship' },
    { id: 'celtic-cross', pricingKey: 'tarot_celtic_cross', href: '/tarot/celtic-cross', tKey: 'tarot.celtic_cross' },
  ]

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true)
        setEmail(user.email || '')
        try {
          const data = await apiGet<{ ok: boolean; pouch_count: number }>('/get_pouch', { email: user.email || '' })
          setCredits(data.pouch_count)
          // 가입 직후 register_user보다 먼저 도착하면 user_not_found(0) — 백그라운드 재시도
          if (!data.ok) void getPouchWithRetry(user.email || '').then(setCredits)
        } catch {
          setCredits(0)
        }
      } else {
        setIsLoggedIn(false)
      }
      setLoadingCredits(false)
    })
    return () => unsub()
  }, [router])

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  function handleServiceClick(href: string, serviceId?: string) {
    if (!isLoggedIn) {
      // 로그인 후 고른 서비스로 바로 복귀 (login은 returnUrl을 그대로 이동하므로 로케일 접두어 포함)
      const target = locale === 'en' ? href : `/${locale}${href}`
      router.push(`/login?returnUrl=${encodeURIComponent(target)}` as Parameters<typeof router.push>[0])
    } else {
      if (serviceId) gtagEvent('menu_service_click', { service: serviceId })
      router.push(href as Parameters<typeof router.push>[0])
    }
  }

  function creditBadge(cost: number) {
    if (cost === 0) return t('free_badge')
    return cost === 1 ? t('credit_badge', { n: cost }) : t('credits_badge', { n: cost })
  }

  function fillYear(id: string, s: string) {
    return id === 'yearly' ? s.replace('{year}', String(getFortuneYear())) : s
  }

  function renderCard(def: { id: string; pricingKey: string; href: string; tKey: string }, feature = false) {
    const cost = pricing[def.pricingKey] ?? 1
    const tData = t.raw(def.tKey) as { title: string; subtitle: string; desc: string }
    return (
      <button
        key={def.id}
        onClick={() => handleServiceClick(def.href, def.id)}
        className={`mn-card ap-glass ap-hover${feature ? ' is-feature' : ''}`}
      >
        <div className="mn-card-top">
          <span className="mn-glyph" aria-hidden="true">{GLYPH[def.id]}{'︎'}</span>
          <span className={`ap-badge${cost === 0 ? ' ap-badge-free' : ''}`}>{creditBadge(cost)}</span>
        </div>
        {feature && <span className="mn-reco">{ui.recommended}</span>}
        <p className="mn-q">“{def.id === 'yearly' && isNewYearSeason()
          ? (locale === 'ko' ? `${getFortuneYear()}년엔 어떤 흐름으로 흘러갈까?` : locale === 'ja' ? `${getFortuneYear()}年はどんな流れになる？` : `Where is ${getFortuneYear()} taking me?`)
          : qs[def.id]}”</p>
        <div className="mn-meta">
          <p className="mn-title">{tData.title}</p>
          <p className="mn-sub">{fillYear(def.id, tData.subtitle)}</p>
          {feature && <p className="mn-desc">{fillYear(def.id, tData.desc)}</p>}
        </div>
        <span className="mn-arrow material-icons" aria-hidden="true">arrow_forward</span>
      </button>
    )
  }

  return (
    <main className="ap-page">
      {/* 모바일 헤더 (PC는 전역 SiteNav) */}
      <div className="mn-mhead ap-mobile-only">
        <span className="mn-logo">ASTROPILLAR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageSwitcher />
          {isLoggedIn && !loadingCredits && (
            <Link href="/buy" className="mn-credit">
              <span className="mn-credit-num">{credits ?? 0}</span>
              <span className="mn-credit-label">{t('credits_label')}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="ap-container">
        {/* 인사 */}
        <section className="mn-hello ap-rise">
          <div>
            <h1 className="mn-h1">{ui.hello}</h1>
            <p className="mn-email">{isLoggedIn ? email : (!loadingCredits ? ui.guest : '')}</p>
          </div>
          {isLoggedIn
            ? <button onClick={handleSignOut} className="ap-btn-ghost ap-btn-sm ap-mobile-only">{t('sign_out')}</button>
            : !loadingCredits && <Link href="/login" className="ap-btn ap-btn-sm ap-mobile-only" style={{ minHeight: 38 }}>
                {locale === 'ko' ? '로그인' : locale === 'ja' ? 'ログイン' : 'Sign In'}
              </Link>
          }
        </section>

        {/* 무료 오늘의 메시지 */}
        <Link href="/today" className="mn-free ap-glass ap-glass-gold ap-hover ap-rise ap-d1" onClick={() => gtagEvent('menu_service_click', { service: 'today_free' })}>
          <div className="mn-free-moon" aria-hidden="true"><span className="ap-orbit" /></div>
          <div className="mn-free-text">
            <span className="ap-badge ap-badge-free">{t('free_badge')}</span>
            <p className="mn-free-title">{ui.freeTitle}</p>
            <p className="mn-free-sub">{ui.freeSub}</p>
          </div>
          <span className="mn-free-cta">{ui.freeCta}<span className="material-icons" style={{ fontSize: 18 }}>arrow_forward</span></span>
        </Link>

        {/* 사주 × 별자리 */}
        <section className="mn-section">
          <div className="mn-section-head ap-reveal">
            <h2 className="ap-h2">{ui.sajuSection}</h2>
            <p className="mn-section-sub">{ui.sajuSub}</p>
          </div>
          <div className="mn-grid mn-grid-saju">
            {(isNewYearSeason()
              ? [...SERVICE_DEFS.filter(s => s.id === 'yearly'), ...SERVICE_DEFS.filter(s => s.id !== 'yearly')]
              : SERVICE_DEFS).map((svc, i) => renderCard(svc, i === 0))}
          </div>
        </section>

        {/* 타로 */}
        <section className="mn-section">
          <div className="mn-section-head ap-reveal">
            <h2 className="ap-h2">{t('tarot_section')}</h2>
            <p className="mn-section-sub">{ui.tarotSub}</p>
          </div>
          <div className="mn-grid mn-grid-tarot">
            {TAROT_DEFS.map(svc => renderCard(svc))}
          </div>
        </section>
      </div>

      <LegalFooter style={{ marginTop: 48 }} />
      <BottomNav />

      <style>{`
        .mn-mhead { position: sticky; top:0; z-index: 40; display:flex; justify-content:space-between; align-items:center; padding: 12px 16px;
          background: linear-gradient(180deg, rgba(7,9,20,.94), rgba(7,9,20,.7)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--line); }
        .mn-logo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size: 16px; letter-spacing:.2em; color: var(--gold); }
        .mn-credit { display:flex; align-items:center; gap:5px; height: 32px; padding: 0 12px; border-radius:999px; text-decoration:none;
          background: var(--gold-soft); border: 1px solid var(--gold-line); }
        .mn-credit-num { color: var(--gold-light); font-weight:700; font-size: 14px; }
        .mn-credit-label { color: rgba(230,205,133,.75); font-size: 11px; }

        .mn-hello { display:flex; justify-content:space-between; align-items:flex-end; gap: 16px; padding: 28px 0 20px; }
        .mn-h1 { font-family: var(--font-display); font-size: clamp(22px, 5.4vw, 38px); font-weight: 600; line-height: 1.3; }
        html[lang="ko"] .mn-h1, html[lang="ja"] .mn-h1 { font-family: 'Noto Serif KR','Noto Serif JP', serif; font-weight: 700; }
        .mn-email { margin-top: 6px; font-size: 13px; color: var(--ink-3); }

        .mn-free { display:grid; grid-template-columns: 56px 1fr; gap: 16px; align-items:center; padding: 20px; text-decoration:none; color: inherit; }
        .mn-free-moon { position:relative; width:56px; height:56px; border-radius:50%;
          background: radial-gradient(circle at 35% 35%, #fff6d8, #e6cd85 40%, #8a6d2a 100%); box-shadow: 0 0 30px rgba(230,205,133,.45); }
        .mn-free-moon span { position:absolute; inset:-8px; border-radius:50%; border: 1px dashed rgba(230,205,133,.35); }
        .mn-free-title { margin-top: 8px; font-size: 17px; font-weight: 700; }
        .mn-free-sub { margin-top: 4px; font-size: 13px; color: var(--ink-2); line-height: 1.6; }
        .mn-free-cta { grid-column: 1 / -1; display:inline-flex; align-items:center; gap: 6px; justify-self:start; font-size: 14px; font-weight: 700; color: var(--gold-light); }

        .mn-section { margin-top: 48px; }
        .mn-section-head { margin-bottom: 18px; }
        .mn-section-sub { margin-top: 6px; font-size: 14px; color: var(--ink-2); }
        .mn-grid { display:grid; grid-template-columns: 1fr; gap: 12px; }

        .mn-card { position:relative; display:flex; flex-direction:column; align-items:flex-start; gap: 12px; text-align:left;
          padding: 20px; cursor:pointer; font: inherit; color: inherit; width: 100%; min-height: 150px; }
        .mn-card-top { width:100%; display:flex; justify-content:space-between; align-items:center; }
        .mn-glyph { width: 40px; height: 40px; border-radius: 50%; display:grid; place-items:center; font-size: 19px; color: var(--gold-light);
          font-family: 'Segoe UI Symbol','Noto Sans Symbols 2','Apple Symbols',serif;
          background: rgba(201,168,76,.08); border: 1px solid var(--gold-line); }
        .mn-reco { font-size: 11.5px; letter-spacing: .08em; color: var(--lavender); }
        .mn-q { font-family: 'Noto Serif KR','Noto Serif JP', var(--font-display), serif; font-size: 17px; line-height: 1.5; color: var(--ink); }
        .mn-meta { margin-top: auto; }
        .mn-title { font-size: 14.5px; font-weight: 700; color: var(--gold-light); }
        .mn-sub { margin-top: 3px; font-size: 12.5px; color: var(--ink-2); line-height: 1.55; }
        .mn-desc { margin-top: 10px; font-size: 14px; color: var(--ink-2); line-height: 1.7; max-width: 44ch; }
        .mn-arrow { position:absolute; right: 18px; bottom: 18px; font-size: 20px; color: var(--ink-3); transition: transform .25s var(--ease-out), color .25s; }
        .mn-card:hover .mn-arrow { transform: translateX(4px); color: var(--gold-light); }
        .mn-card.is-feature { background: radial-gradient(120% 120% at 100% 0%, rgba(120,104,190,.3), transparent 60%), linear-gradient(180deg, rgba(30,37,64,.72), rgba(15,19,36,.82));
          border-color: var(--gold-line); }

        @media (min-width: 640px) {
          .mn-grid { grid-template-columns: 1fr 1fr; }
          .mn-grid-saju .is-feature { grid-column: 1 / -1; }
          .mn-free { grid-template-columns: 64px 1fr auto; padding: 24px 28px; }
          .mn-free-moon { width: 64px; height: 64px; }
          .mn-free-cta { grid-column: auto; justify-self: end; }
        }
        @media (min-width: 1024px) {
          .mn-hello { padding: 48px 0 28px; }
          .mn-section { margin-top: 64px; }
          .mn-grid-saju { grid-template-columns: 1.3fr 1fr 1fr; grid-template-rows: auto auto; gap: 16px; }
          .mn-grid-saju .is-feature { grid-column: auto; grid-row: span 2; padding: 32px; }
          .mn-grid-saju .is-feature .mn-q { font-size: 26px; margin-top: 16px; }
          .mn-grid-saju > :nth-child(4) { grid-column: span 2; }
          .mn-grid-tarot { grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .mn-card { padding: 24px; min-height: 190px; }
          .mn-q { font-size: 19px; }
        }
      `}</style>
    </main>
  )
}
