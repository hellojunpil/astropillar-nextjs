'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading, getCachedReading, getPeople, birthDateStr, SavedPerson } from '@/lib/firestore'
import ReadingLoader from '@/components/ReadingLoader'

const RELATIONSHIPS = [
  'Romantic Partner',
  'Crush',
  'Ex',
  'Friend',
  'Business Partner',
  'Parent',
  'Brother/Sister',
  'My Child',
  'Coworker',
  'Boss',
  'Junior Colleague',
  'Celebrity Crush',
]

const inputStyle: React.CSSProperties = {
  background: '#0f1829', border: '1px solid var(--border)', borderRadius: 10,
  color: '#fff', padding: '11px 14px', fontSize: 14, width: '100%', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5,
  textTransform: 'uppercase', marginBottom: 6, display: 'block',
}

function personBirthtime(p: SavedPerson): string {
  if (p.hour !== null && p.hour !== undefined) {
    return `${String(p.hour).padStart(2, '0')}:${String(p.minute ?? 0).padStart(2, '0')}`
  }
  return '12:00'
}

function parseBirthDate(birth_date: string): { year: number; month: number; day: number } {
  const [y, m, d] = birth_date.split('-').map(Number)
  return { year: y, month: m, day: d }
}

export default function CompatibilityPage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const [people, setPeople] = useState<SavedPerson[]>([])
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [person1Id, setPerson1Id] = useState('')
  const [person2Id, setPerson2Id] = useState('')
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.email) return
    getPeople(user.email).then(p => { setPeople(p); setLoadingPeople(false) })
  }, [user?.email])

  const person1 = people.find(p => p.id === person1Id) ?? null
  const person2 = people.find(p => p.id === person2Id) ?? null
  const isValid = !!person1 && !!person2 && person1Id !== person2Id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.email || !person1 || !person2) return
    setSubmitting(true)
    setError('')
    try {
      const bd1 = person1.birth_date
      const bd2 = person2.birth_date
      const cacheKey = `${person1.name}+${person2.name}`
      const cacheDate = `${bd1}+${bd2}`
      const cacheCity = `${person1.birth_city}+${person2.birth_city}`
      const cached = await getCachedReading(user.email, 'compatibility', cacheKey, cacheDate, cacheCity)
      if (cached) {
        setResult(cached.result)
        setFromCache(true)
        return
      }
      const p1 = parseBirthDate(person1.birth_date)
      const p2 = parseBirthDate(person2.birth_date)
      const raw = await apiPost('/compatibility_reading', {
        name1: person1.name,
        year1: p1.year, month1: p1.month, day1: p1.day,
        birthtime1: personBirthtime(person1),
        sex1: person1.sex,
        city1: person1.birth_city,
        name2: person2.name,
        year2: p2.year, month2: p2.month, day2: p2.day,
        birthtime2: personBirthtime(person2),
        sex2: person2.sex,
        city2: person2.birth_city,
        relationship,
      })
      await apiPost('/use_pouch', { email: user.email, reading_type: 'compatibility' })
      await saveReading(user.email, { reading_type: 'compatibility', name: cacheKey, birth_date: cacheDate, birth_city: cacheCity, result: raw })
      setResult(raw)
      setFromCache(false)
      refreshCredits(1)
      gtagEvent('reading_completed', { reading_type: 'compatibility' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <ReadingPageShell
      title="Compatibility" subtitle="How your energy aligns with someone special — deep compatibility analysis"
      emoji="💞" badge="1 Credit" credits={credits} requiredCredits={1} inProgress={submitting || !!result}
    >
      {result ? (
        <ReadingResult
          raw={result}
          onReset={() => { setResult(null); setFromCache(false) }}
          userEmail={user?.email ?? undefined}
          fromCache={fromCache}
        />
      ) : submitting ? (
        <ReadingLoader onComplete={() => {}} />
      ) : loadingPeople ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : people.length < 2 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>👤</p>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            You need at least 2 saved persons
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            Save yourself and the person you want to check compatibility with in My Persons first.
          </p>
          <Link href="/library" className="btn-gold" style={{ display: 'inline-block', padding: '12px 28px', fontSize: 14, textDecoration: 'none' }}>
            Add Person →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Person 1 */}
          <div className="card">
            <label style={labelStyle}>Person 1 — You</label>
            <select style={inputStyle} value={person1Id} onChange={e => setPerson1Id(e.target.value)}>
              <option value="">— Select a person —</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.birth_date})</option>
              ))}
            </select>
            {person1 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                {person1.sex === 'F' ? '♀' : '♂'} · {person1.birth_city} · {personBirthtime(person1) === '12:00' && person1.hour === null ? 'Birth time unknown' : personBirthtime(person1)}
              </p>
            )}
          </div>

          {/* Person 2 + Relationship */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Person 2 — Them</label>
              <select style={inputStyle} value={person2Id} onChange={e => setPerson2Id(e.target.value)}>
                <option value="">— Select a person —</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.birth_date})</option>
                ))}
              </select>
              {person2 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                  {person2.sex === 'F' ? '♀' : '♂'} · {person2.birth_city} · {personBirthtime(person2) === '12:00' && person2.hour === null ? 'Birth time unknown' : personBirthtime(person2)}
                </p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Relationship</label>
              <select style={inputStyle} value={relationship} onChange={e => setRelationship(e.target.value)}>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {person1Id && person2Id && person1Id === person2Id && (
            <p style={{ color: '#f59e0b', fontSize: 13, textAlign: 'center' }}>Please select two different people.</p>
          )}

          {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={!isValid || submitting} className="btn-gold"
            style={{ marginTop: 4, opacity: (!isValid || submitting) ? 0.5 : 1, cursor: (!isValid || submitting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {submitting ? '✦ Reading the stars...' : (
              <>Check Compatibility <span style={{ background: 'rgba(22,33,62,0.6)', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>1 Credit</span></>
            )}
          </button>
        </form>
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
