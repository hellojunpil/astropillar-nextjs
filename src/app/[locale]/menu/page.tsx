'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiGet } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { usePricing } from '@/hooks/usePricing'
import BottomNav from '@/components/BottomNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function MenuPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('menu')
  const [email, setEmail] = useState('')
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const pricing = usePricing()

  const fontFamily = locale === 'ko' ? "'Noto Sans KR', sans-serif" : locale === 'ja' ? "'Noto Sans JP', sans-serif" : "'Noto Sans', sans-serif"

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
          const data = await apiGet<{ pouch_count: number }>('/get_pouch', { email: user.email || '' })
          setCredits(data.pouch_count)
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
      router.push('/login')
    } else {
      if (serviceId) gtagEvent('menu_service_click', { service: serviceId })
      router.push(href as Parameters<typeof router.push>[0])
    }
  }

  function creditBadge(cost: number) {
    if (cost === 0) return t('free_badge')
    return cost === 1 ? t('credit_badge', { n: cost }) : t('credits_badge', { n: cost })
  }

  return (
    <main style={{ fontFamily, background: '#07071a', color: '#F6F6F8', minHeight: '100vh', paddingBottom: 96 }}>
      {/* 헤더 */}
      <div style={{ background: 'rgba(13,13,43,0.95)', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#C9A84C', letterSpacing: 3 }}>ASTROPILLAR</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LanguageSwitcher />
            {isLoggedIn && !loadingCredits && (
              <Link href="/buy" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 20, padding: '6px 12px', textDecoration: 'none' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C' }}>{credits ?? 0}</span>
                <span style={{ fontSize: 11, color: 'rgba(201,168,76,0.8)' }}>{t('credits_label')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 20px 0' }}>
        {/* 유저 정보 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{t('title')}</div>
            <div style={{ fontSize: 12, color: 'rgba(200,195,220,0.5)' }}>{email}</div>
          </div>
          {isLoggedIn
            ? <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 20, color: 'rgba(200,195,220,0.5)', fontFamily, fontSize: 11, padding: '6px 12px', cursor: 'pointer' }}>
                {t('sign_out')}
              </button>
            : !loadingCredits && <Link href="/login" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 20, color: '#C9A84C', fontFamily, fontSize: 11, fontWeight: 700, padding: '6px 14px', textDecoration: 'none' }}>
                {locale === 'ko' ? '로그인' : locale === 'ja' ? 'ログイン' : 'Sign In'}
              </Link>
          }
        </div>

        {/* 서비스 카드들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {SERVICE_DEFS.map(svc => {
            const cost = pricing[svc.pricingKey] ?? 1
            const tData = t.raw(svc.tKey) as { title: string; subtitle: string; desc: string }
            return (
              <button
                key={svc.id}
                onClick={() => handleServiceClick(svc.href, svc.id)}
                style={{ background: 'rgba(22,33,62,0.8)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer', width: '100%' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#F6F6F8' }}>{tData.title}</div>
                  <span style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#C9A84C', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {creditBadge(cost)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(201,168,76,0.7)', marginBottom: 6 }}>
                  {svc.id === 'yearly' ? tData.subtitle.replace('{year}', String(getFortuneYear())) : tData.subtitle}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(200,195,220,0.6)', lineHeight: 1.6 }}>{tData.desc}</div>
              </button>
            )
          })}
        </div>

        {/* 타로 섹션 */}
        <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: 'rgba(201,168,76,0.6)', letterSpacing: 2 }}>
          {t('tarot_section').toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TAROT_DEFS.map(svc => {
            const cost = pricing[svc.pricingKey] ?? 1
            const tData = t.raw(svc.tKey) as { title: string; subtitle: string; desc: string }
            return (
              <button
                key={svc.id}
                onClick={() => handleServiceClick(svc.href, svc.id)}
                style={{ background: 'rgba(22,33,62,0.8)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer', width: '100%' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#F6F6F8' }}>{tData.title}</div>
                  <span style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#C9A84C', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {creditBadge(cost)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(201,168,76,0.7)', marginBottom: 6 }}>{tData.subtitle}</div>
                <div style={{ fontSize: 12, color: 'rgba(200,195,220,0.6)', lineHeight: 1.6 }}>{tData.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
