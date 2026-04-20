'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import { auth } from '@/lib/firebase'
import { gtagEvent } from '@/lib/gtag'
import BottomNav from '@/components/BottomNav'

const GUMROAD_1 = process.env.NEXT_PUBLIC_GUMROAD_URL_1 || ''
const GUMROAD_5 = process.env.NEXT_PUBLIC_GUMROAD_URL_5 || ''

const PACKAGES = [
  {
    id: 1,
    credits: 1,
    price: '$1.99',
    label: 'Single Reading',
    description: 'Perfect for trying one premium reading',
    url: GUMROAD_1,
    popular: false,
    emoji: '✦',
  },
  {
    id: 5,
    credits: 5,
    price: '$8.99',
    label: 'Explorer Pack',
    description: 'Best value — unlock 5 premium readings',
    url: GUMROAD_5,
    popular: true,
    emoji: '✦✦✦',
    saving: 'Save $1',
  },
]

const SERVICE_PRICE_KEYS = [
  { name: 'Personal Fortune', key: 'personal_fortune' },
  { name: 'Personal Daily Fortune', key: 'personal_daily_fortune' },
  { name: 'Yearly Fortune', key: 'yearly' },
  { name: 'Compatibility Reading', key: 'compatibility' },
  { name: 'Scenario Reading', key: 'scenario' },
]

export default function BuyPage() {
  const router = useRouter()
  const { user, credits, loading } = useAuth()
  const pricing = usePricing()
  const SERVICES = SERVICE_PRICE_KEYS.map(s => {
    const n = pricing[s.key] ?? 1
    return { name: s.name, cost: `${n} Credit${n !== 1 ? 's' : ''}`, color: 'var(--gold)' }
  })

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  if (loading) {
    return (
      <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 96 }}>

      {/* Header */}
      <header style={{
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', maxWidth: 480, margin: '0 auto',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/menu" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>
            ASTROPILLAR
          </span>
        </Link>
        <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px 0' }}>

        {/* Current balance */}
        <div className="card" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Your current balance</p>
            <p className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>
              <span style={{ color: 'var(--gold)' }}>{credits ?? '—'}</span> Credit{credits !== 1 ? 's' : ''}
            </p>
          </div>
          <span style={{ fontSize: 32 }}>✦</span>
        </div>

        {/* Page title */}
        <h1 className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
          Get Credits
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          Credits unlock premium readings. They never expire.
        </p>

        {/* Packages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {PACKAGES.map(pkg => (
            <a
              key={pkg.id}
              href={pkg.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
              onClick={() => gtagEvent('credit_purchase_click', { credits: pkg.credits, price: pkg.price })}
            >
              <div style={{
                background: pkg.popular ? 'linear-gradient(135deg, #16213E 0%, #1a1a3e 100%)' : 'var(--card)',
                border: `2px solid ${pkg.popular ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 16,
                padding: '20px 22px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                {pkg.popular && (
                  <span style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--gold)', color: '#16213E', fontWeight: 700,
                    fontSize: 11, padding: '3px 14px', borderRadius: 20, letterSpacing: 1,
                  }}>
                    BEST VALUE
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ color: 'var(--gold)', fontSize: 14 }}>{pkg.emoji}</span>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>{pkg.credits} Credit{pkg.credits > 1 ? 's' : ''}</span>
                      {pkg.saving && (
                        <span style={{ background: 'rgba(46,204,113,0.15)', color: '#2ecc71', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          {pkg.saving}
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{pkg.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <p style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 22 }}>{pkg.price}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>via Gumroad</p>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* What you can do */}
        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
            What each Credit unlocks
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SERVICES.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ddd', fontSize: 14 }}>{s.name}</span>
                <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Free credit tip */}
        <div style={{
          background: 'rgba(46,204,113,0.07)', border: '1px solid rgba(46,204,113,0.3)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        }}>
          <p style={{ color: '#2ecc71', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>💡 Earn free Credits</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Share AstroPillar 3 times to earn 1 free Credit — available in your reading results.
          </p>
        </div>

        {/* Back to menu */}
        <Link href="/menu" style={{ display: 'block', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Menu
        </Link>

      </div>
      <BottomNav />
    </main>
  )
}
