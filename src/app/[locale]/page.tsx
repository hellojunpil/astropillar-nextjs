'use client'
import { useEffect } from 'react'
import { useRouter, Link } from '@/navigation'
import { useLocale } from 'next-intl'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import BottomNav from '@/components/BottomNav'
import LegalFooter from '@/components/LegalFooter'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { usePricing } from '@/hooks/usePricing'

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
    eyebrow: '사주 · 점성술 · 타로',
    h1a: '오늘 밤,', h1b: '별이 당신에게 답합니다',
    sub: '태어난 순간의 하늘과 사주팔자를 함께 읽어, 지금 당신의 흐름을 들려드려요.',
    cta: '오늘의 운세 무료로 보기', ctaNote: '가입 없이 바로 확인', secondary: '운세 둘러보기', signIn: '로그인',
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
    eyebrow: '四柱推命 · 西洋占星術 · タロット',
    h1a: '今夜、', h1b: '星があなたに答える',
    sub: '生まれた瞬間の空と四柱推命を重ねて読み、今のあなたの流れをお伝えします。',
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
    eyebrow: 'BaZi · Astrology · Tarot',
    h1a: 'Tonight,', h1b: 'the stars answer you',
    sub: 'We read the sky of your birth alongside your Four Pillars to show where your life is flowing now.',
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

export default function LandingPage() {
  const router = useRouter()
  const locale = useLocale()
  const c = COPY[locale] ?? COPY.en
  const pricing = usePricing()

  useEffect(() => {
    let tracked = false
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        router.replace('/menu')
      } else if (!tracked) {
        tracked = true
        ga('view_1_landing')
      }
    })
    return () => unsub()
  }, [router])

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
          <button className="ap-btn-ghost ap-btn-sm" onClick={() => { ga('login_attempt'); router.push('/login') }}>{c.signIn}</button>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section className="lp-hero ap-container">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow ap-rise">{c.eyebrow}</p>
          <h1 className="lp-h1 ap-rise ap-d1">
            <span>{c.h1a}</span>
            <span className="ap-gold-text">{c.h1b}</span>
          </h1>
          <p className="lp-sub ap-rise ap-d2">{c.sub}</p>
          <div className="lp-ctas ap-rise ap-d3">
            <button className="ap-btn lp-cta" onClick={goToToday}>
              <span aria-hidden="true">✦</span>{c.cta}
            </button>
            <Link href="/menu" className="ap-btn-ghost" onClick={() => ga('cta_click_v1', { target: 'menu' })}>{c.secondary}</Link>
          </div>
          <p className="lp-note ap-rise ap-d4">{c.ctaNote}</p>
        </div>

        <div className="lp-hero-art ap-rise ap-d2" aria-hidden="true">
          <div className="lp-ring lp-ring-1 ap-orbit">
            {ZODIAC.map((z, i) => (
              <span key={z} style={{ transform: `rotate(${i * 30}deg) translateY(-44cqw) rotate(${-i * 30}deg)` }}>{z}</span>
            ))}
          </div>
          <div className="lp-ring lp-ring-2 ap-orbit-rev" />
          <div className="lp-arch">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home.png" alt="" fetchPriority="high" />
          </div>
        </div>
      </section>

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

        .lp-hero { display:grid; grid-template-columns: 1fr; gap: 8px; align-items:center; padding-top: 8px; padding-bottom: 40px; }
        .lp-hero-copy { order: 2; text-align:center; }
        .lp-hero-art { order: 1; }
        .lp-eyebrow { font-size: 12.5px; letter-spacing: .28em; color: var(--lavender); margin-bottom: 14px; }
        .lp-h1 { font-family: var(--font-display); font-weight: 600; font-size: clamp(34px, 8.6vw, 44px); line-height: 1.18; display:flex; flex-direction:column; padding-bottom: 4px; }
        html[lang="ko"] .lp-h1, html[lang="ja"] .lp-h1 { font-family: 'Noto Serif KR','Noto Serif JP', serif; font-weight: 700; letter-spacing: -.01em; }
        .lp-sub { margin: 18px auto 0; max-width: 34ch; font-size: 15.5px; line-height: 1.75; color: var(--ink-2); }
        .lp-ctas { margin-top: 28px; display:flex; flex-direction:column; gap: 12px; align-items: stretch; }
        .lp-cta { min-height: 54px; font-size: 16px; }
        .lp-note { margin-top: 12px; font-size: 12.5px; color: var(--ink-3); }

        .lp-hero-art { position: relative; width: min(74vw, 320px); aspect-ratio: 1 / 1.08; margin: 0 auto; container-type: inline-size; }
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
          .lp-ctas { flex-direction:row; justify-content:center; }
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
          .lp-hero { grid-template-columns: 1.05fr 1fr; gap: 48px; min-height: calc(100dvh - var(--nav-h) - 24px); padding-top: 24px; padding-bottom: 24px; }
          .lp-hero-copy { order: 1; text-align:left; }
          .lp-hero-art { order: 2; width: min(42vw, 520px); }
          .lp-h1 { font-size: clamp(48px, 5vw, 68px); }
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
