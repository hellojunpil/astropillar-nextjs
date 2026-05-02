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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const pricing = usePricing()
  const SERVICES = SERVICE_DEFS.map(s => {
    const cost = pricing[s.pricingKey] ?? 1
    return { ...s, cost, badge: `${cost} Credit${cost !== 1 ? 's' : ''}` }
  })

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
  }, [])

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  function handleServiceClick(href: string) {
    if (!isLoggedIn) {
      router.push('/login')
    } else {
      router.push(href)
    }
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 96px' }}>

      {/* 헤더 */}
      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
        <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>
          ASTROPILLAR
        </span>
        {isLoggedIn
          ? <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Sign out</button>
          : <Link href="/login" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 20, padding: '6px 14px' }}>Sign In</Link>
        }
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Credit 배지 (로그인 시에만) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>
              {isLoggedIn && email ? `✦ ${email}` : ''}
            </p>
            <p className="font-display" style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
              Your Readings
            </p>
          </div>
          {isLoggedIn
            ? <Link href="/buy" style={{ background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 20, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>{loadingCredits ? '—' : credits}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Credit{credits !== 1 ? 's' : ''}</span>
                <span style={{ color: 'var(--gold)', fontSize: 13 }}>＋</span>
              </Link>
            : <Link href="/login" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 20, padding: '8px 16px', textDecoration: 'none', color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>
                Sign In to track →
              </Link>
          }
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
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Today&apos;s Fortune</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                Daily Tarot · Horoscope · Chinese Zodiac
              </p>
            </div>
            <span style={{ fontSize: 28 }}>🃏</span>
          </div>
        </Link>

        {/* Tarot 배너 */}
        <Link href="/tarot" style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a0f2e 0%, #16213E 100%)',
            border: '1px solid rgba(201,168,76,0.5)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                New · Tarot Readings
              </p>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Tarot Card Spreads</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                Three Card · Relationship · Celtic Cross
              </p>
            </div>
            <span style={{ fontSize: 28 }}>🂠</span>
          </div>
        </Link>

        {/* 서비스 카드 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SERVICES.map((s) => (
            <div key={s.id} onClick={() => handleServiceClick(s.href)} style={{ cursor: 'pointer' }}>
              <div className="card" style={{ padding: '18px 20px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{s.title}</span>
                      {!isLoggedIn && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>🔒</span>}
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
            </div>
          ))}
        </div>

        {/* 비로그인 안내 */}
        {!isLoggedIn && !loadingCredits && (
          <div style={{ textAlign: 'center', marginTop: 24, padding: '20px 16px', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>New members get 1 FREE Credit</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>Sign up to unlock all premium readings.</p>
            <Link href="/login?tab=signup" className="btn-gold" style={{ fontSize: 13, padding: '11px 28px' }}>
              Get Started — Free →
            </Link>
          </div>
        )}

        {/* Credit 없을 때 안내 */}
        {isLoggedIn && credits === 0 && !loadingCredits && (
          <div style={{ textAlign: 'center', marginTop: 24, padding: '16px', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>
              You&apos;re out of Credits. Top up to unlock premium readings.
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
