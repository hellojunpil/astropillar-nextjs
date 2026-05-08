'use client'
import { usePathname } from 'next/navigation'
import { Link } from '@/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'

const GOLD = '#C9A84C'
const INACTIVE = 'rgba(246,246,248,0.75)'
const GLOW = 'drop-shadow(0 0 6px rgba(201,168,76,0.6))'

export default function BottomNav() {
  const pathname = usePathname()
  const { credits } = useAuth(false)
  const t = useTranslations('nav')

  const NAV_ITEMS = [
    { href: '/' as const,        icon: 'home',          label: t('home') },
    { href: '/menu' as const,    icon: 'auto_awesome',  label: t('destiny') },
    { href: '/today' as const,   icon: 'calendar_today',label: t('free') },
    { href: '/library' as const, icon: 'local_library', label: t('library') },
  ]

  // 로케일 prefix 제거 후 경로 비교
  const cleanPath = pathname.replace(/^\/(ko|ja)/, '') || '/'

  function isActive(href: string) {
    if (href === '/') return cleanPath === '/'
    return cleanPath === href || cleanPath.startsWith(href + '/')
  }

  const creditActive = cleanPath === '/buy'

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#16213E',
      borderTop: '1px solid rgba(201,168,76,0.35)',
    }}>
      <div style={{
        maxWidth: 480, margin: '0 auto',
        display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 env(safe-area-inset-bottom, 12px)',
      }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52 }}>
              <span className="material-icons" style={{
                fontSize: 22,
                color: active ? GOLD : INACTIVE,
                filter: active ? GLOW : 'none',
              }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 10, color: active ? GOLD : INACTIVE, filter: active ? GLOW : 'none' }}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* 크레딧 탭 */}
        <Link href="/buy" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52 }}>
          <span style={{
            fontSize: 16, fontWeight: 700, lineHeight: '22px', height: 22,
            display: 'flex', alignItems: 'center',
            color: creditActive ? GOLD : INACTIVE,
            filter: creditActive ? GLOW : 'none',
          }}>
            {credits ?? '—'}
          </span>
          <span style={{ fontSize: 10, color: creditActive ? GOLD : INACTIVE, filter: creditActive ? GLOW : 'none' }}>
            {t('credits')}
          </span>
        </Link>
      </div>
    </nav>
  )
}
