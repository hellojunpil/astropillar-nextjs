'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import {
  getReadings, getPeople, deletePerson, savePerson,
  ReadingRecord, SavedPerson
} from '@/lib/firestore'
import ReadingResult from '@/components/ReadingResult'
import BottomNav from '@/components/BottomNav'

const TYPE_LABELS: Record<string, string> = {
  personal_fortune: 'Personal Fortune',
  daily: 'Daily Fortune',
  yearly: 'Yearly Fortune',
  compatibility: 'Compatibility',
  scenario: 'Scenario',
}
const TYPE_COLORS: Record<string, string> = {
  personal_fortune: 'var(--gold)',
  daily: '#f59e0b',
  yearly: '#60a5fa',
  compatibility: '#f472b6',
  scenario: '#a78bfa',
}

const inputStyle: React.CSSProperties = {
  background: '#0f1829', border: '1px solid var(--border)', borderRadius: 10,
  color: '#fff', padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5,
  textTransform: 'uppercase', marginBottom: 5, display: 'block',
}
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function LibraryPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<'history' | 'persons'>(() =>
    searchParams.get('tab') === 'persons' ? 'persons' : 'history'
  )
  const [readings, setReadings] = useState<ReadingRecord[]>([])
  const [people, setPeople] = useState<SavedPerson[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [viewReading, setViewReading] = useState<ReadingRecord | null>(null)

  // Add person form state
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [pName, setPName] = useState('')
  const [pYear, setPYear] = useState('')
  const [pMonth, setPMonth] = useState('1')
  const [pDay, setPDay] = useState('')
  const [pSex, setPSex] = useState<'M'|'F'>('F')
  const [pCity, setPCity] = useState('')
  const [savingPerson, setSavingPerson] = useState(false)
  const [savePersonError, setSavePersonError] = useState('')

  useEffect(() => {
    if (!user?.email) return
    setLoadingData(true)
    Promise.all([
      getReadings(user.email),
      getPeople(user.email),
    ]).then(([r, p]) => {
      setReadings(r)
      setPeople(p)
      setLoadingData(false)
    })
  }, [user?.email])

  async function handleDeletePerson(id: string) {
    if (!user?.email) return
    await deletePerson(user.email, id)
    setPeople(prev => prev.filter(p => p.id !== id))
  }

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.email || !pName || !pYear || !pDay || !pCity) return
    setSavingPerson(true)
    setSavePersonError('')
    try {
      const birth_date = `${pYear}-${String(parseInt(pMonth)).padStart(2,'0')}-${String(parseInt(pDay)).padStart(2,'0')}`
      await savePerson(user.email, { name: pName, birth_date, sex: pSex, birth_city: pCity, hour: null, minute: null })
      const refreshed = await getPeople(user.email)
      setPeople(refreshed)
      setPName(''); setPYear(''); setPMonth('1'); setPDay(''); setPCity('')
      setShowAddPerson(false)
    } catch (err: unknown) {
      setSavePersonError(err instanceof Error ? err.message : 'Failed to save. Check Firestore rules.')
    } finally {
      setSavingPerson(false)
    }
  }

  function formatDate(r: ReadingRecord) {
    if (!r.created_at) return ''
    const d = (r.created_at as { toDate?: () => Date }).toDate?.()
    if (!d) return ''
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Loading...</p>
    </main>
  )

  if (viewReading) {
    return (
      <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 80 }}>
        <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setViewReading(null)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 14, cursor: 'pointer' }}>← Library</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(viewReading)}</span>
        </header>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 24px 0' }}>
          <ReadingResult raw={viewReading.result} onReset={() => setViewReading(null)} userEmail={user?.email ?? undefined} />
        </div>
        <BottomNav />
      </main>
    )
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 80 }}>
      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
        <Link href="/menu" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>ASTROPILLAR</span>
        </Link>
        <button onClick={() => signOut(auth).then(() => router.push('/'))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 24px 0' }}>
        <h1 className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 20 }}>
          📚 Library
        </h1>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#0a0a1a', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {(['history', 'persons'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? 'var(--gold)' : 'transparent',
              color: tab === t ? '#16213E' : 'var(--text-muted)',
            }}>
              {t === 'history' ? 'Reading History' : 'My Persons'}
            </button>
          ))}
        </div>

        {/* ── Reading History ── */}
        {tab === 'history' && (
          <div>
            {loadingData ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Loading...</p>
            ) : readings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>✦</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No readings yet. Start your first reading!</p>
                <Link href="/menu" className="btn-gold" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, padding: '10px 24px' }}>Go to Readings</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {readings.map(r => (
                  <button key={r.id} onClick={() => setViewReading(r)} style={{
                    width: '100%', textAlign: 'left', background: 'var(--card)',
                    border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px',
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                        color: TYPE_COLORS[r.reading_type] ?? 'var(--gold)',
                        border: `1px solid ${TYPE_COLORS[r.reading_type] ?? 'var(--gold)'}`,
                        borderRadius: 20, padding: '2px 8px',
                      }}>
                        {TYPE_LABELS[r.reading_type] ?? r.reading_type}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{formatDate(r)}</span>
                    </div>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{r.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{r.birth_date} · {r.birth_city}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── My Persons ── */}
        {tab === 'persons' && (
          <div>
            {loadingData ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Loading...</p>
            ) : (
              <>
                {people.length === 0 && !showAddPerson && (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <p style={{ fontSize: 32, marginBottom: 12 }}>👤</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Save persons to quickly fill reading forms.</p>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {people.map(p => (
                    <div key={p.id} className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{p.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>
                          {p.birth_date} · {p.sex === 'F' ? '♀' : '♂'} · {p.birth_city}
                        </p>
                      </div>
                      <button onClick={() => p.id && handleDeletePerson(p.id)} style={{
                        background: 'none', border: '1px solid #ef4444', borderRadius: 8,
                        color: '#ef4444', fontSize: 12, padding: '5px 10px', cursor: 'pointer',
                      }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                {showAddPerson ? (
                  <form onSubmit={handleAddPerson} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Add Person</p>
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input style={inputStyle} placeholder="e.g. Jessica" value={pName} onChange={e => setPName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Gender</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['F','M'] as const).map(s => (
                          <button key={s} type="button" onClick={() => setPSex(s)} style={{
                            flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13,
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
                      <label style={labelStyle}>Birth City</label>
                      <input style={inputStyle} placeholder="e.g. New York" value={pCity} onChange={e => setPCity(e.target.value)} required />
                    </div>
                    {savePersonError && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>{savePersonError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => { setShowAddPerson(false); setSavePersonError('') }} style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 50, color: 'var(--text-muted)', fontSize: 13, padding: '11px', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" disabled={savingPerson} className="btn-gold" style={{ flex: 2, opacity: savingPerson ? 0.7 : 1 }}>{savingPerson ? 'Saving...' : 'Save Person'}</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setShowAddPerson(true)} style={{
                    width: '100%', background: 'rgba(201,168,76,0.08)', border: '1px dashed rgba(201,168,76,0.4)',
                    borderRadius: 14, padding: '14px', color: 'var(--gold)', fontSize: 14, cursor: 'pointer',
                  }}>
                    + Add Person
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Loading...</p>
      </main>
    }>
      <LibraryPageInner />
    </Suspense>
  )
}
