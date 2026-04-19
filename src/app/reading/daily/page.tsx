'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import BirthForm, { BirthData } from '@/components/BirthForm'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'

const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export default function DailyFortunePage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState('')

  async function handleSubmit(data: BirthData) {
    if (!user?.email) return
    setSubmitting(true)
    setError('')
    try {
      await apiPost('/use_pouch', { email: user.email, amount: 1 })
      const birthtime = data.hour !== null
        ? `${String(data.hour).padStart(2, '0')}:${String(data.minute ?? 0).padStart(2, '0')}`
        : '12:00'
      const raw = await apiPost('/personal_daily_fortune', {
        year: data.year, month: data.month, day: data.day,
        birthtime, sex: data.sex, city: data.city,
        user_name: data.name, birth_year: data.year,
      })
      setResult(raw)
      refreshCredits()
      gtagEvent('reading_completed', { reading_type: 'daily' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <ReadingPageShell
      title="Personal Daily Fortune"
      subtitle={`Today's energy — ${today}`}
      emoji="☀️" badge="1 Credit" credits={credits} requiredCredits={1}
    >
      {result ? (
        <ReadingResult raw={result} onReset={() => setResult(null)} userEmail={user?.email ?? undefined} />
      ) : (
        <div className="card">
          <BirthForm onSubmit={handleSubmit} loading={submitting} submitLabel="Read Today's Stars" costBadge="1 Credit" />
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 14, textAlign: 'center' }}>{error}</p>}
        </div>
      )}
    </ReadingPageShell>
  )
}

function LoadingScreen() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Loading...</p>
    </main>
  )
}
