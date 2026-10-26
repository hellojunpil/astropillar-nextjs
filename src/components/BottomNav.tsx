'use client'
import { usePathname } from 'next/navigation'
import { Link } from '@/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'

/** 로케일 prefix 제거 */
export function cleanPathname(pathname: string) {
  return pathname.replace(/^\/(ko|ja|en)(?=\/|$)/, '') || '/'
}

/** 탭 활성 판정: 리딩·타로 하위 경로는 '운세' 탭으로 묶음 */
export function isNavActive(href: string, cleanPath: string) {
  if (href === '/') return cleanPath === '/'
  if (href === '/menu') return cleanPath === '/menu' || cleanPath.startsWith('/reading') || cleanPath.startsWith('/tarot')
  return cleanPath === href || cleanPath.startsWith(href + '/')
}

/**
 * 모바일 하단 탭 바 (PC에서는 숨김 — 상단 SiteNav가 대신함)
 */
export default function BottomNav() {
  const pathname = usePathname()
  const { credits } = useAuth(false)
  const t = useTranslations('nav')
  const cleanPath = cleanPathname(pathname)

  const NAV_ITEMS = [
    { href: '/' as const,        icon: 'home',            label: t('home') },
    { href: '/today' as const,   icon: 'nights_stay',     label: t('free') },
    { href: '/menu' as const,    icon: 'auto_awesome',    label: t('destiny') },
    { href: '/library' as const, icon: 'local_library',   label: t('library') },
  ]
  const creditActive = cleanPath === '/buy'

  return (
    <nav className="ap-tabbar ap-mobile-only" aria-label="Main">
      <div className="ap-tabbar-inner">
        {NAV_ITEMS.map(item => {
          const active = isNavActive(item.href, cleanPath)
          return (
            <Link key={item.href} href={item.href} className={`ap-tab${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              <span className="material-icons ap-tab-icon">{item.icon}</span>
              <span className="ap-tab-label">{item.label}</span>
            </Link>
          )
        })}
        <Link href="/buy" className={`ap-tab${creditActive ? ' is-active' : ''}`} aria-current={creditActive ? 'page' : undefined}>
          <span className="ap-tab-credit">{credits ?? '—'}</span>
          <span className="ap-tab-label">{t('credits')}</span>
        </Link>
      </div>
      <style>{`
        .ap-tabbar {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
          background: linear-gradient(180deg, rgba(10,13,28,.82), rgba(7,9,20,.96));
          backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%);
          border-top: 1px solid rgba(201,168,76,.22);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .ap-tabbar::before { content:""; position:absolute; left:10%; right:10%; top:-1px; height:1px;
          background: linear-gradient(90deg, transparent, rgba(230,205,133,.6), transparent); }
        .ap-tabbar-inner { max-width: 560px; margin: 0 auto; display: grid; grid-template-columns: repeat(5, 1fr); height: var(--tab-h); }
        .ap-tab { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
          text-decoration:none; color: rgba(241,237,228,.55); min-height:44px; position:relative;
          transition: color .2s; }
        .ap-tab.is-active { color: var(--gold-light); }
        .ap-tab.is-active::after { content:""; position:absolute; top:0; width:22px; height:2px; border-radius:2px;
          background: var(--gold-light); box-shadow: 0 0 10px rgba(230,205,133,.8); }
        .ap-tab-icon { font-size: 23px; }
        .ap-tab.is-active .ap-tab-icon { filter: drop-shadow(0 0 6px rgba(230,205,133,.55)); }
        .ap-tab-label { font-size: 10.5px; letter-spacing: .02em; }
        .ap-tab-credit { font-size: 17px; font-weight: 700; line-height: 23px; height: 23px; font-variant-numeric: tabular-nums; }
      `}</style>
    </nav>
  )
}
