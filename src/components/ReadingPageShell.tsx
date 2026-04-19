'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  children: React.ReactNode
}

export default function ReadingPageShell({
  title, subtitle, emoji, badge, badgeColor = 'var(--gold)',
  credits, requiredCredits, children
}: Props) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  const notEnoughCredits = requiredCredits > 0 && credits !== null && credits < requiredCredits

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/buy" style={{
            background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 20,
            padding: '6px 12px', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>{credits ?? '—'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Credits</span>
          </Link>
          <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px 0' }}>

        {/* Page Title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>{emoji}</span>
            <h1 className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>{title}</h1>
            <span style={{
              border: `1px solid ${badgeColor}`, color: badgeColor,
              borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
            }}>{badge}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{subtitle}</p>
        </div>

        {/* Not enough credits warning */}
        {notEnoughCredits ? (
          <div style={{
            background: 'var(--card)', border: '1px solid #ef4444', borderRadius: 16,
            padding: '24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✦</p>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Not enough Credits</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              This reading costs {requiredCredits} Credit{requiredCredits > 1 ? 's' : ''}. You have {credits}.
            </p>
            <Link href="/buy" className="btn-gold" style={{ fontSize: 14, padding: '12px 28px' }}>
              Get Credits
            </Link>
          </div>
        ) : children}

      </div>
      <BottomNav />
    </main>
  )
}
