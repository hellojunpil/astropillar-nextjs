'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiGet, apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'

interface GeoResult { name: string; country: string }

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
  name: string; year: string; month: string; day: string; sex: 'M'|'F'; city: string; cityQuery: string
}

function useCitySearch(query: string) {
  const [results, setResults] = useState<GeoResult[]>([])
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (ref.current) clearTimeout(ref.current)
    ref.current = setTimeout(async () => {
      try { const r = await apiGet<GeoResult[]>('/geo/search', { q: query }); setResults(r || []) }
      catch { setResults([]) }
    }, 400)
  }, [query])
  return results
}

function PersonSection({ label, form, onChange }: { label: string; form: PersonForm; onChange: (f: Partial<PersonForm>) => void }) {
  const results = useCitySearch(form.cityQuery)
  const [showDrop, setShowDrop] = useState(false)
  useEffect(() => { setShowDrop(results.length > 0) }, [results])

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
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>Birth City</label>
          <input style={inputStyle} placeholder="Search city..." value={form.cityQuery}
            onChange={e => { onChange({ cityQuery: e.target.value, city: '' }) }} autoComplete="off" />
          {showDrop && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#16213E', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4 }}>
              {results.slice(0, 5).map((r, i) => (
                <button key={i} type="button"
                  onClick={() => { onChange({ city: `${r.name}, ${r.country}`, cityQuery: `${r.name}, ${r.country}` }); setShowDrop(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {r.name}, <span style={{ color: 'var(--text-muted)' }}>{r.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const emptyPerson = (): PersonForm => ({ name: '', year: '', month: '1', day: '', sex: 'F', city: '', cityQuery: '' })

export default function CompatibilityPage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const [person1, setPerson1] = useState<PersonForm>(emptyPerson())
  const [person2, setPerson2] = useState<PersonForm>(emptyPerson())
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState('')

  const isValid = person1.year.length === 4 && !!person1.day && !!person1.city &&
                  person2.year.length === 4 && !!person2.day && !!person2.city

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.email || !isValid) return
    setSubmitting(true)
    setError('')
    try {
      await apiPost('/use_pouch', { email: user.email, amount: 1 })
      const raw = await apiPost('/compatibility_reading', {
        person1: { year: parseInt(person1.year), month: parseInt(person1.month), day: parseInt(person1.day), birthtime: '12:00', sex: person1.sex, city: person1.city, user_name: person1.name || 'Person 1' },
        person2: { year: parseInt(person2.year), month: parseInt(person2.month), day: parseInt(person2.day), birthtime: '12:00', sex: person2.sex, city: person2.city, user_name: person2.name || 'Person 2' },
      })
      setResult(raw)
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
        <ReadingResult raw={result} onReset={() => setResult(null)} userEmail={user?.email ?? undefined} />
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
