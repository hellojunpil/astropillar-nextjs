'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading, getCachedReading, getPeople, savePerson, birthDateStr, SavedPerson } from '@/lib/firestore'
import ReadingLoader from '@/components/ReadingLoader'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const TIME_RANGES: { label: string; hour: number | null; minute: number }[] = [
  { label: "Unknown", hour: null, minute: 0 },
  { label: '23:30 - 01:30', hour: 23, minute: 30 },
  { label: '01:30 - 03:30', hour: 1, minute: 30 },
  { label: '03:30 - 05:30', hour: 3, minute: 30 },
  { label: '05:30 - 07:30', hour: 5, minute: 30 },
  { label: '07:30 - 09:30', hour: 7, minute: 30 },
  { label: '09:30 - 11:30', hour: 9, minute: 30 },
  { label: '11:30 - 13:30', hour: 11, minute: 30 },
  { label: '13:30 - 15:30', hour: 13, minute: 30 },
  { label: '15:30 - 17:30', hour: 15, minute: 30 },
  { label: '17:30 - 19:30', hour: 17, minute: 30 },
  { label: '19:30 - 21:30', hour: 19, minute: 30 },
  { label: '21:30 - 23:30', hour: 21, minute: 30 },
]

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
  const pricing = usePricing()
  const cost = pricing.compatibility
  const [people, setPeople] = useState<SavedPerson[]>([])
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [person1Id, setPerson1Id] = useState('')
  const [person2Id, setPerson2Id] = useState('')
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState('')

  // Inline add person form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [pName, setPName] = useState('')
  const [pSex, setPSex] = useState<'M'|'F'>('F')
  const [pMonth, setPMonth] = useState('1')
  const [pDay, setPDay] = useState('')
  const [pYear, setPYear] = useState('')
  const [pCity, setPCity] = useState('')
  const [pHourIndex, setPHourIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

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
      refreshCredits(cost)
      gtagEvent('reading_completed', { reading_type: 'compatibility' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddPerson() {
    if (!user?.email || !pName || !pYear || !pDay || !pCity) return
    setSaving(true); setSaveError('')
    try {
      const birth_date = birthDateStr(parseInt(pYear), parseInt(pMonth), parseInt(pDay))
      const pRange = TIME_RANGES[pHourIndex]
      const saved = await savePerson(user.email, {
        name: pName, birth_date, sex: pSex, birth_city: pCity,
        hour: pRange.hour, minute: pRange.hour !== null ? pRange.minute : null,
        birth_time_label: pRange.label,
      })
      const newPerson: SavedPerson = {
        id: saved?.id, name: pName, birth_date, sex: pSex, birth_city: pCity,
        hour: pRange.hour, minute: pRange.hour !== null ? pRange.minute : null,
        birth_time_label: pRange.label,
      }
      setPeople(prev => [...prev, newPerson])
      setShowAddForm(false)
      setPName(''); setPSex('F'); setPMonth('1'); setPDay(''); setPYear(''); setPCity(''); setPHourIndex(0)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingScreen />

  return (
    <ReadingPageShell
      title="Compatibility" subtitle="How your energy aligns with someone special — deep compatibility analysis"
      emoji="💞" badge={`${cost} Credit${cost !== 1 ? 's' : ''}`} credits={credits} requiredCredits={cost} inProgress={submitting || !!result}
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

          {/* Inline Add Person */}
          {!showAddForm ? (
            user?.email && (
              <button type="button" onClick={() => setShowAddForm(true)} style={{
                background: 'rgba(201,168,76,0.06)', border: '1px dashed rgba(201,168,76,0.35)',
                borderRadius: 12, padding: '10px', color: 'var(--gold)', fontSize: 13, cursor: 'pointer',
              }}>
                + Add New Person
              </button>
            )
          ) : (
            <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>New Person</p>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} placeholder="e.g. Jessica" value={pName} onChange={e => setPName(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['F','M'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setPSex(s)} style={{
                      flex: 1, padding: '9px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      border: `1px solid ${pSex === s ? 'var(--gold)' : 'var(--border)'}`,
                      background: pSex === s ? 'rgba(201,168,76,0.12)' : 'transparent',
                      color: pSex === s ? 'var(--gold)' : 'var(--text-muted)',
                    }}>{s === 'F' ? '♀ Female' : '♂ Male'}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Birth Date</label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr', gap: 8 }}>
                  <select style={inputStyle} value={pMonth} onChange={e => setPMonth(e.target.value)}>
                    {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                  <input style={inputStyle} placeholder="Day" type="number" min={1} max={31} value={pDay} onChange={e => setPDay(e.target.value)} required />
                  <input style={inputStyle} placeholder="Year" type="number" min={1900} max={2025} value={pYear} onChange={e => setPYear(e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Birth Time <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <select style={inputStyle} value={pHourIndex} onChange={e => setPHourIndex(parseInt(e.target.value))}>
                  {TIME_RANGES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Birth City</label>
                <input style={inputStyle} placeholder="e.g. New York" value={pCity} onChange={e => setPCity(e.target.value)} required />
              </div>
              {saveError && <p style={{ color: '#ef4444', fontSize: 12 }}>{saveError}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowAddForm(false); setSaveError('') }} style={{
                  flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 50,
                  color: 'var(--text-muted)', fontSize: 13, padding: '10px', cursor: 'pointer',
                }}>Cancel</button>
                <button type="button" disabled={saving || !pName || !pYear || !pDay || !pCity} onClick={handleAddPerson} className="btn-gold" style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </div>
          )}

          {people.length < 2 && !showAddForm && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
              Add at least 2 people above to check compatibility.
            </p>
          )}

          {person1Id && person2Id && person1Id === person2Id && (
            <p style={{ color: '#f59e0b', fontSize: 13, textAlign: 'center' }}>Please select two different people.</p>
          )}

          {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={!isValid || submitting} className="btn-gold"
            style={{ marginTop: 4, opacity: (!isValid || submitting) ? 0.5 : 1, cursor: (!isValid || submitting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {submitting ? '✦ Reading the stars...' : (
              <>Check Compatibility <span style={{ background: 'rgba(22,33,62,0.6)', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{cost} Credit{cost !== 1 ? 's' : ''}</span></>
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
