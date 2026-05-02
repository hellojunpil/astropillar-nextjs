'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import BottomNav from '@/components/BottomNav'

const SPREADS = [
  {
    id: 'three-card',
    href: '/tarot/three-card',
    title: 'Three Card Spread',
    subtitle: 'Past · Present · Future',
    description: 'The fastest way to see where a situation is coming from, where it stands, and where it\'s going.',
    cards: '3 cards',
    pricingKey: 'tarot_three_card',
    tag: 'Most Popular',
    positions: ['Past', 'Present', 'Future'],
    goodFor: 'Any situation, quick clarity, first-time readings',
  },
  {
    id: 'relationship',
    href: '/tarot/relationship',
    title: 'Relationship Spread',
    subtitle: 'You · Them · Connection · Advice',
    description: 'Two people, one dynamic. Understand the energy both sides are bringing — and what to do with it.',
    cards: '4 cards',
    pricingKey: 'tarot_relationship',
    tag: null,
    positions: ['You', 'Them', 'The Connection', 'Advice'],
    goodFor: 'Love, crushes, conflict, friendship, family',
  },
  {
    id: 'celtic-cross',
    href: '/tarot/celtic-cross',
    title: 'Celtic Cross',
    subtitle: '10-Card Deep Dive',
    description: 'The most comprehensive reading available. Covers your situation from every angle — root causes, hidden dynamics, and the honest outcome.',
    cards: '10 cards',
    pricingKey: 'tarot_celtic_cross',
    tag: 'Most Detailed',
    positions: ['Heart', 'Challenge', 'Root', 'Recent Past', 'Goal', 'Beneath', 'Self', 'Others', 'Hopes/Fears', 'Outcome'],
    goodFor: 'Major decisions, complex situations, deep self-insight',
  },
]

export default function TarotHubPage() {
  const { credits, loading } = useAuth(false)
  const pricing = usePricing()

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
        <Link href="/buy" style={{
          background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 20,
          padding: '6px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>{loading ? '—' : (credits ?? '—')}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Credits</span>
        </Link>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px 0' }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            Tarot Readings
          </p>
          <h1 className="font-display" style={{ color: '#fff', fontSize: 24, fontWeight: 600, marginBottom: 6 }}>
            Choose Your Spread
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Draw cards, flip them one by one, and get a reading built around what you drew.
          </p>
        </div>

        {/* Spread cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SPREADS.map(spread => {
            const cost = pricing[spread.pricingKey] ?? (spread.id === 'celtic-cross' ? 2 : 1)
            const badge = `${cost} Credit${cost !== 1 ? 's' : ''}`
            return (
              <Link key={spread.id} href={spread.href} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '20px', position: 'relative', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>

                  {/* Tag */}
                  {spread.tag && (
                    <span style={{
                      position: 'absolute', top: 14, right: 14,
                      background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
                      color: 'var(--gold)', fontSize: 10, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 10, letterSpacing: 0.5,
                    }}>
                      {spread.tag}
                    </span>
                  )}

                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{spread.title}</span>
                  </div>
                  <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                    {spread.subtitle}
                  </p>

                  {/* Description */}
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                    {spread.description}
                  </p>

                  {/* Positions preview */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {spread.positions.map((pos, i) => (
                      <span key={i} style={{
                        background: '#0f1829', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '3px 8px',
                        color: 'var(--text-muted)', fontSize: 11,
                      }}>
                        {pos}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      🃏 {spread.cards} · Good for: {spread.goodFor}
                    </span>
                    <span style={{
                      border: '1px solid var(--gold)', color: 'var(--gold)',
                      borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                    }}>
                      {badge}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
