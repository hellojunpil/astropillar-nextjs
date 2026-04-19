'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading, getCachedReading, birthDateStr } from '@/lib/firestore'

const inputStyle: React.CSSProperties = {
  background: '#0f1829', border: '1px solid var(--border)', borderRadius: 10,
  color: '#fff', padding: '11px 14px', fontSize: 14, width: '100%', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5,
  textTransform: 'uppercase', marginBottom: 6, display: 'block',
}
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface PersonForm {
  name: string; year: string; month: string; day: string; sex: 'M'|'F'; city: string
}

function PersonSection({ label, form, onChange }: { label: string; form: PersonForm; onChange: (f: Partial<PersonForm>) => void }) {
  return (
    <div style={{ background: '#0f1829', borderRadius: 14, padding: '20px', border: '1px solid var(--border)' }}>
      <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} placeholder="Name" value={form.name} onChange={e => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Gender</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['F','M'] as const).map(s => (
              <button key={s} type="button" onClick={() => onChange({ sex: s })} style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${form.sex === s ? 'var(--gold)' : 'var(--border)'}`,
                background: form.sex === s ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: form.sex === s ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 600, fontSize: 13,
              }}>
                {s === 'F' ? '♀ F' : '♂ M'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Birth Date</label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr', gap: 8 }}>
            <select style={inputStyle} value={form.month} onChange={e => onChange({ month: e.target.value })}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input style={inputStyle} placeholder="Day" type="number" min={1} max={31} value={form.day} onChange={e => onChange({ day: e.target.value })} />
            <input style={inputStyle} placeholder="Year" type="number" min={1900} max={2025} value={form.year} onChange={e => onChange({ year: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Birth City</label>
          <input
            style={inputStyle}
            placeholder="e.g. New York"
            value={form.city}
            onChange={e => onChange({ city: e.target.value })}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  )
}

const emptyPerson = (): PersonForm => ({ name: '', year: '', month: '1', day: '', sex: 'F', city: '' })

export default function CompatibilityPage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const [person1, setPerson1] = useState<PersonForm>(emptyPerson())
  const [person2, setPerson2] = useState<PersonForm>(emptyPerson())
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState('')

  const isValid = person1.year.length === 4 && !!person1.day && !!person1.city.trim() &&
                  person2.year.length === 4 && !!person2.day && !!person2.city.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.email || !isValid) return
    setSubmitting(true)
    setError('')
    try {
      const bd1 = birthDateStr(parseInt(person1.year), parseInt(person1.month), parseInt(person1.day))
      const cacheKey = `${person1.name || 'P1'}+${person2.name || 'P2'}`
      const cacheDate = `${bd1}+${birthDateStr(parseInt(person2.year), parseInt(person2.month), parseInt(person2.day))}`
      const cacheCity = `${person1.city}+${person2.city}`
      const cached = await getCachedReading(user.email, 'compatibility', cacheKey, cacheDate, cacheCity)
      if (cached) {
        setResult(cached.result)
        setFromCache(true)
        return
      }
      const raw = await apiPost('/compatibility_reading', {
        person1: { year: parseInt(person1.year), month: parseInt(person1.month), day: parseInt(person1.day), birthtime: '12:00', sex: person1.sex, city: person1.city, user_name: person1.name || 'Person 1' },
        person2: { year: parseInt(person2.year), month: parseInt(person2.month), day: parseInt(person2.day), birthtime: '12:00', sex: person2.sex, city: person2.city, user_name: person2.name || 'Person 2' },
      })
      await apiPost('/use_pouch', { email: user.email, amount: 1 })
      await saveReading(user.email, { reading_type: 'compatibility', name: cacheKey, birth_date: cacheDate, birth_city: cacheCity, result: raw })
      setResult(raw)
      setFromCache(false)
      refreshCredits()
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
      emoji="💞" badge="1 Credit" credits={credits} requiredCredits={1}
    >
      {result ? (
        <ReadingResult raw={result} onReset={() => { setResult(null); setFromCache(false) }} userEmail={user?.email ?? undefined} fromCache={fromCache} />
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PersonSection label="Person 1 — You" form={person1} onChange={p => setPerson1(prev => ({ ...prev, ...p }))} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 20 }}>💞</div>
          <PersonSection label="Person 2 — Them" form={person2} onChange={p => setPerson2(prev => ({ ...prev, ...p }))} />
          {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}
          <button type="submit" disabled={!isValid || submitting} className="btn-gold"
            style={{ marginTop: 8, opacity: (!isValid || submitting) ? 0.5 : 1, cursor: (!isValid || submitting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {submitting ? '✦ Reading the stars...' : <>Check Our Compatibility <span style={{ background: 'rgba(22,33,62,0.6)', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>1 Credit</span></>}
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
