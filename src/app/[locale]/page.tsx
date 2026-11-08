'use client'
import { useEffect, useState } from 'react'
import { useRouter, Link } from '@/navigation'
import { useLocale } from 'next-intl'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import BottomNav from '@/components/BottomNav'
import LegalFooter from '@/components/LegalFooter'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { usePricing } from '@/hooks/usePricing'
import { isNewYearSeason, yearlyPromo } from '@/lib/season'

function ga(name: string, params?: Record<string, string>) {
  try { (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', name, params || {}) } catch { /* ignore */ }
}

const IMG = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

type Copy = {
  eyebrow: string
  h1a: string; h1b: string
  sub: string
  cta: string; ctaNote: string; secondary: string; signIn: string
  lensTitle: string
  lenses: { key: string; name: string; line: string; body: string }[]
  readingsTitle: string; readingsSub: string; readingsCta: string
  readings: { id: string; pricingKey: string; title: string; q: string }[]
  flowTitle: string
  flow: { t: string; d: string }[]
  finalTitle: string; finalSub: string
  free: string; credit: (n: number) => string
}

const COPY: Record<string, Copy> = {
  ko: {
    eyebrow: '사주 × 서양 점성술',
    h1a: '사주와 점성술이', h1b: '내 얘기로 만나는 곳.',
    sub: '내 사주와 서양 점성술의 출생 차트를 함께 읽고, 하나의 해석으로 연결해요.',
    cta: '오늘의 운세 무료로 보기', ctaNote: '가입 없이 바로 확인', secondary: '리딩 둘러보기', signIn: '로그인',
    lensTitle: '세 개의 시선으로 한 사람을 읽습니다',
    lenses: [
      { key: 'bazi', name: '사주', line: '타고난 기질', body: '태어난 해·달·날·시의 네 기둥으로 당신이 어떤 결을 가진 사람인지 읽어요.' },
      { key: 'astro', name: '서양 점성술', line: '천체의 흐름', body: '태양·달·상승궁과 행성의 배치로 지금 당신에게 흐르는 에너지를 짚어요.' },
      { key: 'tarot', name: '타로', line: '지금의 질문', body: '고른 카드가 지금 마음속 질문에 대한 상징적인 답을 보여줘요.' },
    ],
    readingsTitle: '마음에 걸린 질문부터 시작하세요',
    readingsSub: '사주·별자리 리딩은 두 전통을 함께, 타로는 카드만으로 순수하게 읽어요.',
    readingsCta: '전체 운세 보기',
    readings: [
      { id: 'personal-fortune', pricingKey: 'personal_fortune', title: '나의 운명 풀이', q: '나는 어떤 사람으로 태어났을까?' },
      { id: 'compatibility', pricingKey: 'compatibility', title: '궁합', q: '우리 두 사람, 잘 맞을까?' },
      { id: 'yearly', pricingKey: 'yearly', title: '신년 운세', q: '올해 나에게 어떤 일이 찾아올까?' },
      { id: 'celtic-cross', pricingKey: 'tarot_celtic_cross', title: '심층 분석 타로', q: '복잡하게 얽힌 이 상황, 어떻게 풀릴까?' },
    ],
    flowTitle: '당신의 하늘을 그리는 방법',
    flow: [
      { t: '생년월일과 시간을 알려주세요', d: '태어난 도시까지 입력하면 그날의 하늘을 정확하게 계산해요.' },
      { t: '사주 명식과 출생 차트를 그려요', d: '네 기둥의 오행과 열 개 행성의 위치를 한 장의 지도로 펼쳐요.' },
      { t: '두 전통을 하나의 이야기로', d: '동양과 서양이 같은 곳을 가리키는 순간을 찾아 당신의 언어로 풀어드려요.' },
    ],
    finalTitle: '오늘의 별은 이미 떠 있어요',
    finalSub: '타로 한 장, 별자리, 띠별 운세까지 매일 무료로 열려 있어요.',
    free: '무료', credit: n => `${n} 크레딧`,
  },
  ja: {
    eyebrow: '四柱推命 × 西洋占星術',
    h1a: '四柱推命と占星術が', h1b: 'わたしの物語で出会う場所。',
    sub: 'あなたの命式と西洋占星術のホロスコープを一緒に読み、ひとつの解釈につなげます。',
    cta: '今日の運勢を無料で見る', ctaNote: '登録不要ですぐに', secondary: '占いを見てみる', signIn: 'ログイン',
    lensTitle: '三つのまなざしで、ひとりを読む',
    lenses: [
      { key: 'bazi', name: '四柱推命', line: '生まれ持った気質', body: '生まれた年・月・日・時の四つの柱から、あなたの本質を読み解きます。' },
      { key: 'astro', name: '西洋占星術', line: '天体の流れ', body: '太陽・月・アセンダントと惑星の配置から、今流れるエネルギーを読みます。' },
      { key: 'tarot', name: 'タロット', line: '今の問い', body: '選んだカードが、心の中の問いへの象徴的な答えを映し出します。' },
    ],
    readingsTitle: '気になる問いから始めましょう',
    readingsSub: '四柱推命・星座リーディングは二つの伝統を一緒に、タロットはカードだけで読み解きます。',
    readingsCta: 'すべての占いを見る',
    readings: [
      { id: 'personal-fortune', pricingKey: 'personal_fortune', title: '運命リーディング', q: '私はどんな人として生まれたの？' },
      { id: 'compatibility', pricingKey: 'compatibility', title: '相性', q: '私たち二人、合っている？' },
      { id: 'yearly', pricingKey: 'yearly', title: '年運', q: '今年、私に何が訪れる？' },
      { id: 'celtic-cross', pricingKey: 'tarot_celtic_cross', title: 'ケルト十字', q: '複雑に絡んだこの状況、どう動く？' },
    ],
    flowTitle: 'あなたの空を描く方法',
    flow: [
      { t: '生年月日と時間を教えてください', d: '生まれた都市まで入力すると、その日の空を正確に計算します。' },
      { t: '命式とホロスコープを描きます', d: '四柱の五行と十の天体の位置を、一枚の地図に広げます。' },
      { t: '二つの伝統を、ひとつの物語に', d: '東洋と西洋が同じ場所を指す瞬間を見つけ、あなたの言葉で伝えます。' },
    ],
    finalTitle: '今日の星は、もう昇っています',
    finalSub: 'タロット一枚、星座、干支の運勢まで毎日無料で開かれています。',
    free: '無料', credit: n => `${n} クレジット`,
  },
  en: {
    eyebrow: 'BaZi × Western Astrology',
    h1a: 'Where BaZi and astrology', h1b: 'meet in your story.',
    sub: 'We read your Four Pillars and your Western birth chart together, and connect them into one reading.',
    cta: "See Today's Fortune Free", ctaNote: 'No sign-up needed', secondary: 'Browse readings', signIn: 'Sign In',
    lensTitle: 'Three lenses on one life',
    lenses: [
      { key: 'bazi', name: 'BaZi', line: 'Your innate nature', body: 'The four pillars of your birth year, month, day and hour reveal the grain of who you are.' },
      { key: 'astro', name: 'Western Astrology', line: 'The movement of the sky', body: 'Your Sun, Moon, Rising and planets show the energy moving through you right now.' },
      { key: 'tarot', name: 'Tarot', line: 'The question you hold', body: 'The cards you draw offer a symbolic answer to what is on your mind today.' },
    ],
    readingsTitle: 'Start with the question on your mind',
    readingsSub: 'BaZi readings weave in your birth chart. Tarot readings speak through the cards alone.',
    readingsCta: 'See all readings',
    readings: [
      { id: 'personal-fortune', pricingKey: 'personal_fortune', title: 'Personal Fortune', q: 'Who was I born to be?' },
      { id: 'compatibility', pricingKey: 'compatibility', title: 'Compatibility', q: 'Are the two of us truly aligned?' },
      { id: 'yearly', pricingKey: 'yearly', title: 'Yearly Fortune', q: 'What is this year bringing me?' },
      { id: 'celtic-cross', pricingKey: 'tarot_celtic_cross', title: 'Celtic Cross', q: 'How will this tangled situation unfold?' },
    ],
    flowTitle: 'How we map your sky',
    flow: [
      { t: 'Tell us when you were born', d: 'Add your birth city and we calculate the exact sky of that moment.' },
      { t: 'We draw your pillars and chart', d: 'Five elements across four pillars and ten planets, laid out as one map.' },
      { t: 'Two traditions, one story', d: 'We find where East and West point to the same place, and tell it in plain words.' },
    ],
    finalTitle: "Tonight's stars are already out",
    finalSub: 'A tarot card, your horoscope and zodiac fortune, free every day.',
    free: 'Free', credit: n => `${n} Credit${n === 1 ? '' : 's'}`,
  },
}

const PILLARS = [
  { label: { ko: '年', ja: '年', en: 'Year' }, stem: '甲', branch: '子' },
  { label: { ko: '月', ja: '月', en: 'Month' }, stem: '丙', branch: '寅' },
  { label: { ko: '日', ja: '日', en: 'Day' }, stem: '戊', branch: '午' },
  { label: { ko: '時', ja: '時', en: 'Hour' }, stem: '庚', branch: '申' },
]
// ︎ = 텍스트 표기 강제 (Windows/Android에서 이모지로 바뀌는 것 방지)
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map(z => z + '︎') // 텍스트 기호 강제 (이모지 방지)

// 히어로: 선으로 그린 출생 차트 (12궁 링 + 행성 + 각도선)
function HeroChart() {
  const C = 200
  const pt = (deg: number, r: number) => {
    const a = (deg - 90) * Math.PI / 180
    // 서버·브라우저 소수점 차이로 하이드레이션 경고가 나지 않게 반올림
    return [Math.round((C + r * Math.cos(a)) * 100) / 100, Math.round((C + r * Math.sin(a)) * 100) / 100]
  }
  const planets = [
    { g: '☉', d: 28 }, { g: '☽', d: 96 }, { g: '☿', d: 47 }, { g: '♀', d: 141 },
    { g: '♂', d: 203 }, { g: '♃', d: 252 }, { g: '♄', d: 311 }, { g: '♅', d: 338 },
  ]
  const aspects: [number, number][] = [[0, 4], [1, 5], [2, 6], [3, 7], [0, 3], [5, 7]]
  return (
    <svg className="lp-chart" viewBox="0 0 400 400">
      <g className="ap-orbit" style={{ transformOrigin: '200px 200px' }}>
        <circle cx={C} cy={C} r={186} className="lp-c-line" />
        <circle cx={C} cy={C} r={152} className="lp-c-line" />
        {Array.from({ length: 12 }, (_, i) => {
          const [x1, y1] = pt(i * 30, 152), [x2, y2] = pt(i * 30, 186)
          const [gx, gy] = pt(i * 30 + 15, 169)
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="lp-c-line" />
              <text x={gx} y={gy} className="lp-c-sign">{ZODIAC[i]}</text>
            </g>
          )
        })}
        {Array.from({ length: 72 }, (_, i) => {
          const [x1, y1] = pt(i * 5, 186), [x2, y2] = pt(i * 5, i % 6 === 0 ? 194 : 190)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="lp-c-tick" />
        })}
      </g>
      <circle cx={C} cy={C} r={104} className="lp-c-inner" />
      {aspects.map(([a, b], i) => {
        const [x1, y1] = pt(planets[a].d, 104), [x2, y2] = pt(planets[b].d, 104)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="lp-c-aspect" />
      })}
      {planets.map(p => {
        const [x, y] = pt(p.d, 104), [gx, gy] = pt(p.d, 128)
        return (
          <g key={p.g}>
            <circle cx={x} cy={y} r={2.6} className="lp-c-dot" />
            <text x={gx} y={gy} className="lp-c-planet">{p.g + '\uFE0E'}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const locale = useLocale()
  const c = COPY[locale] ?? COPY.en
  const pricing = usePricing()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let tracked = false
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthed(!!u)
      if (!u && !tracked) {
        tracked = true
        ga('view_1_landing')
      }
    })
    return () => unsub()
  }, [])

  function goToToday() {
    ga('cta_click_v1', { target: 'today' })
    router.push('/today')
  }

  return (
    <main className="ap-page lp">
      {/* 모바일 상단 바 (PC는 SiteNav) */}
      <div className="lp-mtop ap-mobile-only">
        <span className="lp-mlogo">ASTROPILLAR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageSwitcher />
          {authed
            ? <Link href="/menu" className="ap-btn-ghost ap-btn-sm">{c.secondary}</Link>
            : <button className="ap-btn-ghost ap-btn-sm" onClick={() => { ga('login_attempt'); router.push('/login') }}>{c.signIn}</button>}
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section className="lp-hero ap-container">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow ap-rise">{c.eyebrow}</p>
          <h1 className="lp-h1 ap-rise ap-d1">
            <span>{c.h1a}</span>
            <span className="lp-h1-b">{c.h1b}</span>
          </h1>
          <p className="lp-sub ap-rise ap-d2">{c.sub}</p>
          <div className="lp-ctas ap-rise ap-d3">
            <button className="lp-cta" onClick={goToToday}>
              {c.cta}
            </button>
            <p className="lp-note">
              <span>{c.ctaNote}</span>
              <span className="lp-note-dot" aria-hidden="true" />
              <Link href="/menu" className="lp-link" onClick={() => ga('cta_click_v1', { target: 'menu' })}>{c.secondary} →</Link>
            </p>
          </div>
        </div>

        <div className="lp-hero-art ap-rise" aria-hidden="true">
          <div className="lp-duo-side">
            <span className="lp-duo-cap">{locale === 'ja' ? '命式' : locale === 'en' ? 'Four Pillars' : '사주 명식'}</span>
          <div className="lp-mx">
            {PILLARS.map((p, i) => (
              <div key={p.stem} className={`lp-mx-col${i === 2 ? ' is-day' : ''}`}>
                <span className="lp-mx-label">{p.label[locale as 'ko' | 'ja' | 'en'] ?? p.label.en}</span>
                <span className="lp-mx-char">{p.stem}</span>
                <span className="lp-mx-char">{p.branch}</span>
              </div>
            ))}
          </div>
          </div>
          <span className="lp-duo-x">×</span>
          <div className="lp-duo-side">
            <span className="lp-duo-cap">{locale === 'ja' ? 'ホロスコープ' : locale === 'en' ? 'Birth Chart' : '출생 차트'}</span>
            <div className="lp-duo-chart"><HeroChart /></div>
          </div>
        </div>
      </section>

      {/* ══ 시즌: 신년운세 안내 (11~1월) ══ */}
      {isNewYearSeason() && (() => {
        const yp = yearlyPromo(locale)
        const target = `${locale === 'en' ? '' : `/${locale}`}/reading/yearly`
        const href = authed ? '/reading/yearly' : `/login?tab=signup&returnUrl=${encodeURIComponent(target)}`
        return (
          <section className="ap-container">
            <Link href={href} className="lp-season" onClick={() => ga('season_yearly_click', { from: 'landing', auth: authed ? 'member' : 'guest' })}>
              <span className="lp-season-k">{yp.kicker}</span>
              <span className="lp-season-t">{yp.title}</span>
              <span className="lp-season-d">{yp.desc}</span>
              <span className="lp-season-cta">{yp.cta} →{!authed && <em>{yp.guestNote}</em>}</span>
            </Link>
          </section>
        )
      })()}

      {/* ══ 세 개의 시선 ══ */}
      <section className="ap-container lp-section">
        <h2 className="ap-h2 lp-center ap-reveal">{c.lensTitle}</h2>
        <div className="lp-lenses">
          {/* 사주 — 넓은 칸 */}
          <article className="lp-lens lp-lens-bazi ap-glass ap-reveal">
            <div className="lp-pillars" aria-hidden="true">
              {PILLARS.map(p => (
                <div key={p.stem} className="lp-pillar">
                  <span className="lp-pillar-label">{p.label[locale as 'ko' | 'ja' | 'en'] ?? p.label.en}</span>
                  <span className="lp-pillar-char">{p.stem}</span>
                  <span className="lp-pillar-char lp-pillar-branch">{p.branch}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="lp-lens-line">{c.lenses[0].line}</p>
              <h3 className="lp-lens-name">{c.lenses[0].name}</h3>
              <p className="lp-lens-body">{c.lenses[0].body}</p>
            </div>
          </article>

          <article className="lp-lens lp-lens-astro ap-glass ap-reveal">
            <div className="lp-mini-chart" aria-hidden="true">
              <div className="lp-mini-ring ap-orbit">
                {ZODIAC.map((z, i) => (
                  <span key={z} style={{ transform: `rotate(${i * 30}deg) translateY(-62px) rotate(${-i * 30}deg)` }}>{z}</span>
                ))}
              </div>
              <span className="lp-mini-sun">☉</span>
            </div>
            <p className="lp-lens-line">{c.lenses[1].line}</p>
            <h3 className="lp-lens-name">{c.lenses[1].name}</h3>
            <p className="lp-lens-body">{c.lenses[1].body}</p>
          </article>

          <article className="lp-lens lp-lens-tarot ap-glass ap-reveal">
            <div className="lp-fan" aria-hidden="true">
              {['moon', 'star', 'sun'].map((n, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={n} src={`${IMG}major_arcana_${n}.webp`} alt="" loading="lazy" style={{ transform: `rotate(${(i - 1) * 12}deg) translateY(${i === 1 ? -8 : 4}px)`, zIndex: i === 1 ? 2 : 1 }} />
              ))}
            </div>
            <p className="lp-lens-line">{c.lenses[2].line}</p>
            <h3 className="lp-lens-name">{c.lenses[2].name}</h3>
            <p className="lp-lens-body">{c.lenses[2].body}</p>
          </article>
        </div>
      </section>

      {/* ══ 질문으로 고르는 리딩 ══ */}
      <section className="ap-container lp-section">
        <div className="lp-readings-head ap-reveal">
          <h2 className="ap-h2">{c.readingsTitle}</h2>
          <p className="ap-lead" style={{ marginTop: 10 }}>{c.readingsSub}</p>
        </div>
        <div className="lp-readings">
          {c.readings.map((r, i) => {
            const cost = pricing[r.pricingKey] ?? 1
            return (
              <Link
                key={r.id}
                href="/menu"
                className={`lp-reading ap-glass ap-hover ap-reveal${i === 0 ? ' is-feature' : ''}`}
                onClick={() => ga('landing_reading_click', { service: r.id })}
              >
                <span className={`ap-badge${cost === 0 ? ' ap-badge-free' : ''}`}>{cost === 0 ? c.free : c.credit(cost)}</span>
                <p className="lp-reading-q">“{r.q}”</p>
                <p className="lp-reading-t">{r.title}<span aria-hidden="true"> →</span></p>
              </Link>
            )
          })}
        </div>
        <div className="lp-center ap-reveal" style={{ marginTop: 28 }}>
          <Link href="/menu" className="ap-btn-ghost">{c.readingsCta}</Link>
        </div>
      </section>

      {/* ══ 흐름 ══ */}
      <section className="ap-container lp-section">
        <h2 className="ap-h2 lp-center ap-reveal">{c.flowTitle}</h2>
        <ol className="lp-flow">
          {c.flow.map((f, i) => (
            <li key={i} className="lp-flow-item ap-reveal">
              <span className="lp-flow-glyph" aria-hidden="true">{['☽', '✶', '☉'][i]}</span>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ══ 마지막 CTA ══ */}
      <section className="ap-container lp-section">
        <div className="lp-final ap-glass ap-glass-gold ap-reveal">
          <div className="lp-final-orbit ap-orbit" aria-hidden="true" />
          <h2 className="ap-h2">{c.finalTitle}</h2>
          <p className="ap-lead" style={{ marginTop: 12 }}>{c.finalSub}</p>
          <button className="ap-btn" style={{ marginTop: 28 }} onClick={goToToday}>
            <span aria-hidden="true">✦</span>{c.cta}
          </button>
        </div>
      </section>

      <LegalFooter style={{ paddingTop: 40 }} />
      <BottomNav />

      <style>{`
        .lp-mtop { position: sticky; top: 0; z-index: 40; display:flex; justify-content:space-between; align-items:center;
          padding: 12px 16px; background: rgba(7,9,20,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
        .lp-mlogo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size:16px; letter-spacing:.2em; color: var(--gold); }

        /* 히어로: 모바일 한 화면 안에 그림·문구·버튼이 모두 들어오게 */
        .lp-hero { display:flex; flex-direction:column; justify-content:center; gap: 26px;
          min-height: calc(100svh - 58px - 76px); padding-top: 18px; padding-bottom: 22px; }
        .lp-hero-copy { order: 2; text-align:left; }
        .lp-hero-art { order: 1; }
        .lp-eyebrow { display:inline-flex; align-items:center; gap: 10px; font-size: 11.5px; font-weight: 500; letter-spacing: .22em; color: var(--gold-light); margin-bottom: 14px; }
        .lp-eyebrow::before { content:""; width: 22px; height: 1px; background: var(--gold-light); opacity: .7; }
        .lp-h1 { font-family: var(--font-display); font-weight: 700; font-size: clamp(30px, 8.4vw, 38px); line-height: 1.22; letter-spacing: -.04em;
          display:flex; flex-direction:column; color: #f4efe3; word-break: keep-all; }
        .lp-sub { margin: 14px 0 0; max-width: 30em; font-size: 15px; line-height: 1.7; color: rgba(241,237,228,.66); word-break: keep-all; letter-spacing: -.01em; }
        .lp-ctas { margin-top: 24px; display:flex; flex-direction:column; gap: 14px; align-items: stretch; }
        .lp-cta { height: 54px; border: 0; border-radius: 14px; cursor: pointer; font: inherit; font-size: 16px; font-weight: 600; letter-spacing: -.01em;
          color: #15130e; background: linear-gradient(180deg, #efe3bf, #d9c48c); box-shadow: 0 1px 0 rgba(255,255,255,.35) inset, 0 14px 30px -14px rgba(217,196,140,.55);
          transition: transform .15s var(--ease-out), box-shadow .2s; }
        .lp-cta:hover { box-shadow: 0 1px 0 rgba(255,255,255,.35) inset, 0 18px 38px -14px rgba(217,196,140,.7); }
        .lp-cta:active { transform: scale(.985); }
        .lp-note { display:flex; align-items:center; justify-content:center; gap: 10px; font-size: 13px; color: var(--ink-3); }
        .lp-note-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--ink-3); }
        .lp-link { color: var(--ink-2); text-decoration: none; font-weight: 500; }
        .lp-link:hover { color: var(--gold-light); }

        /* 명식 × 출생 차트: 두 지도를 나란히 → '동시에 본다' */
        .lp-hero-art { display:grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 10px; width: 100%; max-width: 420px; margin: 0 auto; }
        .lp-duo-side { display:flex; flex-direction:column; align-items:center; gap: 10px; min-width: 0; }
        .lp-duo-cap { font-size: 10.5px; letter-spacing: .18em; color: var(--ink-3); text-transform: uppercase; }
        .lp-duo-x { align-self: center; margin-top: 22px; font-size: 22px; font-weight: 300; color: var(--gold-light); opacity: .9; }
        .lp-duo-chart { position: relative; width: 100%; aspect-ratio: 1; }
        .lp-duo-chart .lp-c-planet { display: none; }
        html[lang="ja"] .lp-h1 { font-size: clamp(26px, 7.2vw, 34px); letter-spacing: -.02em; }
        /* 키가 작은 폰: 그림을 줄여 버튼·링크까지 한 화면에 */
        @media (max-height: 700px) and (max-width: 640px) {
          .lp-hero { gap: 18px; padding-top: 12px; padding-bottom: 14px; }
          .lp-hero-art { max-width: 300px; }
          .lp-duo-cap { display: none; }
          .lp-duo-x { margin-top: 0; }
          .lp-h1 { font-size: clamp(27px, 7.6vw, 32px); }
          .lp-sub { margin-top: 10px; font-size: 14px; }
          .lp-ctas { margin-top: 18px; gap: 10px; }
          .lp-cta { height: 50px; }
          .lp-eyebrow { margin-bottom: 10px; }
        }
        .lp-chart { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .lp-c-line { fill: none; stroke: rgba(201,168,76,.32); stroke-width: 1; }
        .lp-c-tick { stroke: rgba(201,168,76,.22); stroke-width: 1; }
        .lp-c-inner { fill: rgba(9,12,26,.35); stroke: rgba(170,165,209,.22); stroke-width: 1; }
        .lp-c-aspect { stroke: rgba(170,165,209,.32); stroke-width: .8; }
        .lp-c-dot { fill: #e6cd85; }
        .lp-c-sign { fill: rgba(230,205,133,.7); font-size: 15px; text-anchor: middle; dominant-baseline: central; font-variant-emoji: text; }
        .lp-c-planet { fill: rgba(241,237,228,.75); font-size: 14px; text-anchor: middle; dominant-baseline: central; font-variant-emoji: text; }
        .lp-mx { display: grid; grid-template-columns: repeat(4, 1fr); width: 100%; aspect-ratio: 1;
          background: rgba(10,13,28,.7); border: 1px solid rgba(201,168,76,.22); border-radius: 14px; overflow: hidden; }
        .lp-mx-col { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 6px 0; position: relative; }
        .lp-mx-col + .lp-mx-col { border-left: 1px solid var(--line); }
        .lp-mx-col.is-day { background: rgba(201,168,76,.07); }
        .lp-mx-col.is-day::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: var(--gold); }
        .lp-mx-label { font-size: 10px; letter-spacing: .08em; color: var(--ink-3); }
        .lp-mx-col.is-day .lp-mx-label { color: var(--gold-light); }
        .lp-mx-char { font-size: clamp(19px, 5.4vw, 30px); font-weight: 400; line-height: 1.05; color: var(--ink); }
        .lp-mx-col.is-day .lp-mx-char { color: #f3e6bd; }
        .lp-h1-b { color: #e2cf96; }
        .lp-arch { position:absolute; inset: 9% 13% 0; border-radius: 999px 999px 24px 24px; overflow:hidden;
          border: 1px solid var(--gold-line); box-shadow: 0 30px 80px -30px rgba(0,0,0,.8); }
        .lp-arch img { width:100%; height:100%; object-fit:cover; object-position: center 22%; display:block; filter: saturate(.5) brightness(.82) contrast(1.08); }
        .lp-arch::after { content:""; position:absolute; inset:0; background: linear-gradient(180deg, rgba(7,9,20,.15), transparent 30%, transparent 50%, rgba(7,9,20,.9)); }
        .lp-ring { position:absolute; left:50%; top:46%; width: 94%; aspect-ratio:1; translate: -50% -50%; border-radius:50%; }
        .lp-ring-1 { border: 1px solid rgba(201,168,76,.18); }
        .lp-ring-1 span, .lp-mini-ring span { font-family: 'Segoe UI Symbol','Noto Sans Symbols 2','Apple Symbols',serif; font-variant-emoji: text; }
        .lp-ring-1 span { position:absolute; left:50%; top:50%; width: 20px; height: 20px; margin:-10px 0 0 -10px; display:grid; place-items:center;
          color: rgba(230,205,133,.7); font-size: 13px; }
        .lp-ring-2 { width: 106%; border: 1px dashed rgba(170,165,209,.14); }

        .lp-season { display:flex; flex-direction:column; gap: 8px; padding: 22px 22px 20px; border-radius: 18px; text-decoration:none; color: inherit;
          background: radial-gradient(120% 140% at 100% 0%, rgba(201,168,76,.18), transparent 55%), linear-gradient(180deg, rgba(24,29,52,.85), rgba(12,15,30,.9));
          border: 1px solid rgba(201,168,76,.3); transition: border-color .2s, transform .2s var(--ease-out); }
        .lp-season:hover { border-color: rgba(201,168,76,.55); transform: translateY(-2px); }
        .lp-season-k { font-size: 11.5px; font-weight: 600; letter-spacing: .16em; color: var(--gold-light); }
        .lp-season-t { font-size: 22px; font-weight: 700; letter-spacing: -.035em; color: #f4efe3; word-break: keep-all; }
        .lp-season-d { font-size: 14px; line-height: 1.65; color: var(--ink-2); word-break: keep-all; }
        .lp-season-cta { margin-top: 6px; display:flex; flex-wrap:wrap; align-items:baseline; gap: 4px 12px; font-size: 15px; font-weight: 600; color: #e2cf96; }
        .lp-season-cta em { font-style: normal; font-size: 12.5px; font-weight: 400; color: var(--ink-3); }
        @media (min-width: 1024px) { .lp-season { padding: 32px 40px; } .lp-season-t { font-size: 30px; } }
        .lp-section { padding-top: 72px; }
        .lp-center { text-align:center; }

        .lp-lenses { margin-top: 32px; display:grid; grid-template-columns: 1fr; gap: 16px; }
        .lp-lens { padding: 28px 24px; display:flex; flex-direction:column; gap: 18px; overflow:hidden; position:relative; }
        .lp-lens-line { font-size: 12.5px; color: var(--lavender); letter-spacing: .06em; }
        .lp-lens-name { font-family: var(--font-display); font-size: 26px; font-weight: 600; margin-top: 4px; }
        html[lang="ko"] .lp-lens-name, html[lang="ja"] .lp-lens-name { font-family: 'Noto Serif KR','Noto Serif JP', serif; font-size: 22px; }
        .lp-lens-body { margin-top: 8px; font-size: 14.5px; line-height: 1.75; color: var(--ink-2); max-width: 46ch; }
        .lp-pillars { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; max-width: 340px; }
        .lp-pillar { display:flex; flex-direction:column; align-items:center; gap: 6px; padding: 12px 0; border-radius: 12px;
          background: linear-gradient(180deg, rgba(201,168,76,.08), rgba(201,168,76,.02)); border: 1px solid rgba(201,168,76,.16); }
        .lp-pillar-label { font-size: 11px; color: var(--ink-3); }
        .lp-pillar-char { font-family: 'Noto Serif KR','Noto Serif JP',serif; font-size: 26px; color: var(--gold-light); line-height:1.1; }
        .lp-pillar-branch { color: var(--lavender); }
        .lp-mini-chart { position:relative; width: 150px; height: 150px; margin: 0 auto 0 0; display:grid; place-items:center; }
        .lp-mini-ring { position:absolute; inset:0; border-radius:50%; border: 1px solid rgba(170,165,209,.25); }
        .lp-mini-ring span { position:absolute; left:50%; top:50%; width:18px; height:18px; margin:-9px 0 0 -9px; display:grid; place-items:center; font-size: 12px; color: rgba(170,165,209,.8); }
        .lp-mini-sun { font-size: 34px; color: var(--gold-light); text-shadow: 0 0 24px rgba(230,205,133,.6); }
        .lp-fan { position:relative; height: 160px; display:flex; justify-content:center; align-items:flex-end; }
        .lp-fan img { width: 86px; aspect-ratio: 1114/1919; object-fit:cover; border-radius: 8px; margin: 0 -14px;
          border: 1px solid rgba(201,168,76,.4); box-shadow: 0 16px 30px -10px rgba(0,0,0,.7); background:#1a1f35; }

        .lp-readings { margin-top: 28px; display:grid; grid-template-columns: 1fr; gap: 14px; }
        .lp-reading { display:flex; flex-direction:column; align-items:flex-start; gap: 14px; padding: 22px; text-decoration:none; color: inherit; min-height: 150px; }
        .lp-reading-q { font-family: 'Noto Serif KR','Noto Serif JP', var(--font-display), serif; font-size: 18px; line-height: 1.5; color: var(--ink); flex:1; }
        .lp-reading-t { font-size: 13.5px; color: var(--gold-light); font-weight: 600; }
        .lp-reading.is-feature { background: radial-gradient(120% 120% at 100% 0%, rgba(120,104,190,.28), transparent 60%), linear-gradient(180deg, rgba(30,37,64,.7), rgba(15,19,36,.8)); border-color: var(--gold-line); }

        .lp-flow { list-style:none; margin-top: 32px; display:grid; grid-template-columns: 1fr; gap: 28px; position:relative; }
        .lp-flow-item { padding-left: 64px; position:relative; }
        .lp-flow-glyph { position:absolute; left:0; top:-4px; width: 46px; height: 46px; border-radius:50%; display:grid; place-items:center;
          font-size: 20px; color: var(--gold-light); border: 1px solid var(--gold-line); background: rgba(201,168,76,.06); }
        .lp-flow-item h3 { font-size: 17px; font-weight: 700; }
        .lp-flow-item p { margin-top: 6px; font-size: 14.5px; line-height: 1.75; color: var(--ink-2); }

        .lp-final { position:relative; overflow:hidden; text-align:center; padding: 56px 24px; }
        .lp-final-orbit { position:absolute; left:50%; top:50%; width: 520px; height: 520px; margin:-260px 0 0 -260px; border-radius:50%;
          border: 1px dashed rgba(201,168,76,.14); pointer-events:none; }
        .lp-final > *:not(.lp-final-orbit) { position: relative; }

        @media (min-width: 640px) {
          .lp-readings { grid-template-columns: 1fr 1fr; }
          .lp-ctas { flex-direction:row; justify-content:flex-start; align-items:center; }
          .lp-cta { padding: 0 32px; }
        }
        @media (min-width: 900px) {
          .lp-lenses { grid-template-columns: 1.35fr 1fr; grid-template-rows: auto auto; }
          .lp-lens-bazi { grid-row: span 2; justify-content: space-between; padding: 36px; }
          .lp-pillars { max-width: 420px; gap: 14px; }
          .lp-pillar-char { font-size: 38px; }
          .lp-lens-astro, .lp-lens-tarot { display:grid; grid-template-columns: 150px 1fr; grid-template-rows: auto auto 1fr; column-gap: 24px; align-items:start; }
          .lp-lens-astro > :first-child, .lp-lens-tarot > :first-child { grid-row: span 3; }
          .lp-fan { height: 150px; align-items:center; }
          .lp-fan img { width: 70px; margin: 0 -18px; }
          .lp-flow { grid-template-columns: repeat(3, 1fr); gap: 32px; }
          .lp-flow::before { content:""; position:absolute; top: 19px; left: 46px; right: 10%; height:1px;
            background: linear-gradient(90deg, var(--gold-line), transparent); }
          .lp-flow-item { padding-left: 0; padding-top: 64px; }
        }
        @media (min-width: 1024px) {
          .lp-hero { display:grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items:center; min-height: calc(100dvh - var(--nav-h) - 24px); padding-top: 24px; padding-bottom: 24px; }
          .lp-hero-copy { order: 1; text-align:left; }
          .lp-hero-art { order: 2; max-width: 540px; gap: 16px; }
          .lp-h1 { font-size: clamp(40px, 3.8vw, 58px); }
          .lp-note { justify-content:flex-start; }
          .lp-mx-char { font-size: 40px; }
          .lp-mx-col { gap: 12px; }
          .lp-h1 span { white-space: nowrap; }
          .lp-sub { margin-left: 0; font-size: 17px; max-width: 40ch; }
          .lp-ctas { justify-content:flex-start; }
          .lp-ring-1 span { font-size: 16px; }
          .lp-section { padding-top: 112px; }
          .lp-readings { grid-template-columns: 1.4fr 1fr 1fr; grid-template-rows: auto auto; }
          .lp-reading.is-feature { grid-row: span 2; padding: 32px; justify-content: flex-end; }
          .lp-reading.is-feature .lp-reading-q { font-size: 28px; flex: 0; margin-top: auto; }
          .lp-readings > :nth-child(4) { grid-column: span 2; }
          .lp-final { padding: 80px 40px; }
        }
      `}</style>
    </main>
  )
}
