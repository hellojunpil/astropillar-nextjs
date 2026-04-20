'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiGet } from '@/lib/api'
import { usePricing } from '@/hooks/usePricing'
import BottomNav from '@/components/BottomNav'

const SERVICE_DEFS = [
  { id: 'personal-fortune', pricingKey: 'personal_fortune', href: '/reading/personal-fortune', title: 'Personal Fortune', subtitle: 'Lifetime destiny reading', description: 'Deep dive into your life theme, career, love, and hidden potential.', badgeColor: 'var(--gold)' },
  { id: 'daily', pricingKey: 'personal_daily_fortune', href: '/reading/daily', title: 'Personal Daily Fortune', subtitle: "Today's energy for you", description: "Today's luck, opportunities, and things to watch out for — personalized.", badgeColor: 'var(--gold)' },
  { id: 'yearly', pricingKey: 'yearly', href: '/reading/yearly', title: 'Yearly Fortune', subtitle: 'The year ahead', description: 'Month-by-month guidance for the current year based on your chart.', badgeColor: 'var(--gold)' },
  { id: 'compatibility', pricingKey: 'compatibility', href: '/reading/compatibility', title: 'Compatibility Reading', subtitle: 'Love & relationship synergy', description: 'How your energy aligns with someone special — deep compatibility analysis.', badgeColor: 'var(--gold)' },
]

export default function MenuPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const pricing = usePricing()
  const SERVICES = SERVICE_DEFS.map(s => {
    const cost = pricing[s.pricingKey] ?? 1
    return { ...s, cost, badge: `${cost} Credit${cost !== 1 ? 's' : ''}` }
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      setEmail(user.email || '')
      try {
        const data = await apiGet<{ pouch_count: number }>('/get_pouch', { email: user.email || '' })
        setCredits(data.pouch_count)
      } catch {
        setCredits(0)
      } finally {
        setLoadingCredits(false)
      }
    })
    return () => unsub()
  }, [router])

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 96px' }}>

      {/* 헤더 */}
      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
        <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>
          ASTROPILLAR
        </span>
        <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Credit 배지 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>
              {email ? `✦ ${email}` : ''}
            </p>
            <p className="font-display" style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
              Your Readings
            </p>
          </div>
          <Link href="/buy" style={{
            background: 'var(--card)',
            border: '1px solid var(--gold)',
            borderRadius: 20,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
              {loadingCredits ? '—' : credits}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Credit{credits !== 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--gold)', fontSize: 13 }}>＋</span>
          </Link>
        </div>

        {/* Today's Fortune 배너 */}
        <Link href="/today" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, #16213E 0%, #1a1a3e 100%)',
            border: '1px solid var(--gold)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                Free · No login required
              </p>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Today's Fortune</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                Daily horoscope by zodiac & Chinese sign
              </p>
            </div>
            <span style={{ fontSize: 28 }}>🌙</span>
          </div>
        </Link>

        {/* 서비스 카드 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SERVICES.map((s) => (
            <Link key={s.id} href={s.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{s.title}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                      {s.subtitle}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                      {s.description}
                    </p>
                  </div>
                  <span style={{
                    background: 'transparent',
                    border: `1px solid ${s.badgeColor}`,
                    color: s.badgeColor,
                    borderRadius: 20,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    marginLeft: 12,
                    flexShrink: 0,
                  }}>
                    {s.badge}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Credit 없을 때 안내 */}
        {credits === 0 && !loadingCredits && (
          <div style={{ textAlign: 'center', marginTop: 24, padding: '16px', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>
              You're out of Credits. Top up to unlock premium readings.
            </p>
            <Link href="/buy" className="btn-gold" style={{ fontSize: 13, padding: '10px 24px' }}>
              Get Credits
            </Link>
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  )
}
