'use client'
import { Link, useRouter } from '@/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import BottomNav from './BottomNav'

interface Props {
  title: string
  subtitle: string
  emoji: string
  badge: string
  badgeColor?: string
  credits: number | null
  requiredCredits: number
  inProgress?: boolean
  children: React.ReactNode
}

export default function ReadingPageShell({
  title, subtitle, emoji, badge, badgeColor,
  credits, requiredCredits, inProgress = false, children
}: Props) {
  const router = useRouter()
  const t = useTranslations('reading')
  const locale = useLocale()

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  // 이모지 대신 천문 기호로 표현 (︎ = 텍스트 표기 강제)
  const GLYPHS: Record<string, string> = { '✨': '✦', '☀️': '☉', '💞': '⚭', '🔮': '☽', '📅': '♃' }
  const glyph = (GLYPHS[emoji] ?? emoji) + '︎'

  const notEnoughCredits = !inProgress && requiredCredits > 0 && credits !== null && credits < requiredCredits

  return (
    <main className="ap-page">

      {/* 모바일 헤더 (PC는 전역 SiteNav) */}
      <header className="rps-mhead ap-mobile-only">
        <Link href="/menu" className="rps-back" aria-label="Back">
          <span className="material-icons" style={{ fontSize: 20 }}>arrow_back_ios_new</span>
        </Link>
        <span className="rps-logo">ASTROPILLAR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/buy" className="rps-credit">
            <span className="rps-credit-num">{credits ?? '—'}</span>
            <span className="rps-credit-label">{t('credits_label')}</span>
          </Link>
          <button onClick={handleSignOut} className="rps-signout">{t('sign_out')}</button>
        </div>
      </header>

      {/* 입력 단계는 좁게(600), 결과 단계는 넓게(760) */}
      <div className={inProgress ? 'ap-reading-col' : 'ap-narrow'}>
        {/* PC: 운세 목록으로 돌아가기 */}
        <Link href="/menu" className="rps-crumb ap-desktop-only">
          <span className="material-icons" style={{ fontSize: 16 }}>arrow_back</span>
          {t('back_to_menu')}
        </Link>

        {/* 페이지 타이틀 */}
        <div className="rps-title ap-rise">
          <div className="rps-sigil" aria-hidden="true">
            <span className="rps-sigil-ring ap-orbit" />
            <span className="rps-sigil-glyph">{glyph}</span>
          </div>
          <h1 className="rps-h1">{title}</h1>
          <p className="rps-sub">{subtitle}</p>
          <span className="ap-badge" style={badgeColor ? { color: badgeColor, borderColor: badgeColor } : undefined}>{badge}</span>
        </div>

        {notEnoughCredits ? (
          <div className="ap-glass ap-glass-gold rps-nocredit ap-rise ap-d1">
            <div className="rps-nocredit-glyph" aria-hidden="true">✦</div>
            <p className="rps-nocredit-title">{t('not_enough_title')}</p>
            <p className="rps-nocredit-body">
              {t('not_enough_body', { n: requiredCredits, credits: credits ?? 0 })}
            </p>
            <Link href="/buy" className="ap-btn">
              {t('get_credits')}
            </Link>
            {/* 가진 크레딧으로 바로 볼 수 있는 리딩 안내 (가입 직후 1크레딧 사용자 이탈 방지) */}
            {(credits ?? 0) >= 1 && (
              <Link href="/reading/personal-fortune" className="ap-btn-ghost rps-alt">
                {locale === 'ko' ? `보유한 ${credits}크레딧으로 '나의 운명 풀이' 보기`
                  : locale === 'ja' ? `保有の${credits}クレジットで「運命リーディング」を見る`
                  : `Use your ${credits} credit${credits === 1 ? '' : 's'} on Personal Fortune`}
              </Link>
            )}
          </div>
        ) : (
          <div className="ap-rise ap-d1">{children}</div>
        )}
      </div>
      <BottomNav />

      <style>{`
        .rps-mhead { position: sticky; top: 0; z-index: 40; display:grid; grid-template-columns: 40px 1fr auto; align-items:center; gap: 8px;
          padding: 10px 16px; background: linear-gradient(180deg, rgba(7,9,20,.94), rgba(7,9,20,.72));
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }
        .rps-back { width: 40px; height: 40px; display:grid; place-items:center; border-radius: 50%; color: var(--ink-2); text-decoration:none; }
        .rps-logo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size: 15px; letter-spacing:.2em; color: var(--gold); }
        .rps-credit { display:flex; align-items:center; gap:5px; height: 32px; padding: 0 12px; border-radius:999px; text-decoration:none;
          background: var(--gold-soft); border: 1px solid var(--gold-line); }
        .rps-credit-num { color: var(--gold-light); font-weight: 700; font-size: 14px; }
        .rps-credit-label { color: rgba(230,205,133,.75); font-size: 11px; }
        .rps-signout { background:none; border:none; color: var(--ink-3); font: inherit; font-size: 12px; cursor:pointer; min-height: 32px; }
        .rps-crumb { display:inline-flex; align-items:center; gap:6px; margin-top: 28px; font-size: 13px; color: var(--ink-2); text-decoration:none; }
        .rps-crumb:hover { color: var(--gold-light); }

        .rps-title { display:flex; flex-direction:column; align-items:center; text-align:center; gap: 10px; padding: 28px 0 28px; }
        .rps-sigil { position:relative; width: 76px; height: 76px; display:grid; place-items:center; margin-bottom: 4px; }
        .rps-sigil-ring { position:absolute; inset:0; border-radius:50%; border: 1px dashed rgba(201,168,76,.35); }
        .rps-sigil-ring::after { content:""; position:absolute; top:-3px; left:50%; width:6px; height:6px; margin-left:-3px; border-radius:50%;
          background: var(--gold-light); box-shadow: 0 0 10px var(--gold-light); }
        .rps-sigil-glyph { width: 56px; height: 56px; border-radius:50%; display:grid; place-items:center; font-size: 26px; color: var(--gold-light);
          font-family: 'Segoe UI Symbol','Noto Sans Symbols 2','Apple Symbols',serif;
          background: radial-gradient(circle at 50% 35%, rgba(201,168,76,.22), rgba(120,104,190,.12) 70%); border: 1px solid var(--gold-line); }
        .rps-h1 { font-family: var(--font-display); font-size: clamp(26px, 6vw, 36px); font-weight: 600; line-height: 1.2; }
        html[lang="ko"] .rps-h1, html[lang="ja"] .rps-h1 { font-family: 'Noto Serif KR','Noto Serif JP', serif; font-weight: 700; }
        .rps-sub { font-size: 14.5px; line-height: 1.7; color: var(--ink-2); max-width: 44ch; }

        .rps-nocredit { text-align:center; padding: 36px 24px; display:flex; flex-direction:column; align-items:center; gap: 10px; }
        .rps-nocredit-glyph { font-size: 30px; color: var(--gold-light); animation: apGlow 3s ease-in-out infinite; }
        .rps-nocredit-title { font-size: 17px; font-weight: 700; }
        .rps-alt { white-space: normal !important; text-align: center; min-height: 46px; font-size: 14px; }
        .rps-nocredit-body { font-size: 14px; color: var(--ink-2); line-height: 1.7; margin-bottom: 10px; }

        @media (min-width: 1024px) {
          .rps-title { padding: 20px 0 36px; }
        }
      `}</style>
    </main>
  )
}
