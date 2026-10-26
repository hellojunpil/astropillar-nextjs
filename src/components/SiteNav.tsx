'use client'
import { usePathname } from 'next/navigation'
import { Link, useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import LanguageSwitcher from './LanguageSwitcher'
import { cleanPathname, isNavActive } from './BottomNav'

/**
 * PC(≥1024px) 전용 상단 고정 내비게이션. 모바일에서는 숨김.
 */
export default function SiteNav() {
  const pathname = usePathname()
  const cleanPath = cleanPathname(pathname)
  const router = useRouter()
  const t = useTranslations('nav')
  const { user, credits, loading } = useAuth(false)

  // 공유 전용 페이지 등에서는 숨기지 않음 — 일관된 브랜드 경험
  const LINKS = [
    { href: '/today' as const, label: t('today') },
    { href: '/menu' as const, label: t('readings') },
    { href: '/library' as const, label: t('library') },
    { href: '/explain' as const, label: t('guide') },
  ]

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  return (
    <header className="ap-sitenav ap-desktop-only">
      <div className="ap-sitenav-inner">
        <Link href="/" className="ap-sitenav-logo" aria-label="AstroPillar home">
          <span className="ap-logo-mark" aria-hidden="true">✦</span>
          ASTROPILLAR
        </Link>
        <nav className="ap-sitenav-links" aria-label="Main">
          {LINKS.map(l => {
            const active = isNavActive(l.href, cleanPath)
            return (
              <Link key={l.href} href={l.href} className={`ap-sitenav-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="ap-sitenav-right">
          <LanguageSwitcher />
          {!loading && user && (
            <Link href="/buy" className="ap-credit-pill" title={t('credits')}>
              <span className="ap-credit-star" aria-hidden="true">✦</span>
              <span className="ap-credit-num">{credits ?? '—'}</span>
              <span className="ap-credit-label">{t('credits')}</span>
            </Link>
          )}
          {!loading && (user
            ? <button onClick={handleSignOut} className="ap-btn-ghost ap-btn-sm">{t('sign_out')}</button>
            : <Link href="/login" className="ap-btn ap-btn-sm" style={{ minHeight: 38, padding: '0 18px', fontSize: 13 }}>{t('sign_in')}</Link>
          )}
        </div>
      </div>
      <style>{`
        .ap-sitenav { position: fixed; top: 0; left: 0; right: 0; z-index: 60; height: var(--nav-h);
          background: linear-gradient(180deg, rgba(7,9,20,.92), rgba(7,9,20,.7));
          backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%);
          border-bottom: 1px solid var(--line); }
        .ap-sitenav-inner { max-width: 1200px; height: 100%; margin: 0 auto; padding: 0 40px;
          display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 32px; }
        .ap-sitenav-logo { display:flex; align-items:center; gap:10px; text-decoration:none;
          font-family: 'Cormorant Garamond', serif; font-weight:700; font-size:21px; letter-spacing:.2em; color: var(--gold); }
        .ap-logo-mark { font-size: 14px; color: var(--gold-light); animation: apGlow 4s ease-in-out infinite; }
        .ap-sitenav-links { display:flex; gap: 6px; justify-self: center; }
        .ap-sitenav-link { position:relative; padding: 10px 16px; border-radius: 999px; text-decoration:none;
          font-size: 14.5px; font-weight: 500; color: var(--ink-2); white-space: nowrap; transition: color .2s, background .2s; }
        .ap-sitenav-link:hover { color: var(--ink); background: rgba(255,255,255,.04); }
        .ap-sitenav-link.is-active { color: var(--gold-light); }
        .ap-sitenav-link.is-active::after { content:""; position:absolute; left:50%; bottom:2px; width:4px; height:4px; margin-left:-2px;
          border-radius:50%; background: var(--gold-light); box-shadow: 0 0 8px var(--gold-light); }
        .ap-sitenav-right { display:flex; align-items:center; gap: 12px; }
        .ap-credit-pill { display:flex; align-items:center; gap:6px; height:38px; padding: 0 14px; border-radius:999px;
          text-decoration:none; background: var(--gold-soft); border: 1px solid var(--gold-line); transition: background .2s; }
        .ap-credit-pill:hover { background: rgba(201,168,76,.22); }
        .ap-credit-star { color: var(--gold-light); font-size: 11px; }
        .ap-credit-num { color: var(--gold-light); font-weight: 700; font-size: 15px; font-variant-numeric: tabular-nums; }
        .ap-credit-label { color: rgba(230,205,133,.75); font-size: 12px; }
      `}</style>
    </header>
  )
}
