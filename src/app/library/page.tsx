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
import ReadingResult, { parseResult } from '@/components/ReadingResult'
import { cardImageUrl } from '@/lib/tarotDeck'
import { gtagEvent } from '@/lib/gtag'
import BottomNav from '@/components/BottomNav'

const TAROT_POSITIONS: Record<string, { label: string; desc: string }[]> = {
  tarot_three_card: [
    { label: 'Past', desc: 'What shaped this' },
    { label: 'Present', desc: 'Where you are now' },
    { label: 'Future', desc: 'Where this leads' },
  ],
  tarot_relationship: [
    { label: 'You', desc: 'Your energy' },
    { label: 'Them', desc: 'Their energy' },
    { label: 'Connection', desc: 'The dynamic' },
    { label: 'Advice', desc: 'What to do' },
  ],
  tarot_celtic_cross: [
    { label: 'The Heart', desc: 'Core of the situation' },
    { label: 'The Challenge', desc: 'Obstacle & hidden dynamic' },
    { label: 'The Root', desc: 'Foundation / how it began' },
    { label: 'Recent Past', desc: 'What just passed' },
    { label: "What You're Reaching For", desc: 'Your conscious goal' },
    { label: 'Beneath the Surface', desc: 'The unconscious driver' },
    { label: 'How You See Yourself', desc: 'Your self-perception' },
    { label: 'Outside Forces', desc: 'External influences' },
    { label: 'Hopes & Fears', desc: 'What you want & dread' },
    { label: 'Where This Is Heading', desc: 'The outcome of this path' },
  ],
}

function TarotCardAccordion({ cardName, cardFile, posLabel, posDesc, content, defaultOpen }: {
  cardName: string; cardFile?: string; posLabel: string; posDesc: string; content: string; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const imgSrc = cardFile ? cardImageUrl(cardFile) : null
  const nameToFile = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^the_/, '')
  const fallbackSrc = cardImageUrl('major_arcana_' + nameToFile(cardName))
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={imgSrc ?? fallbackSrc} alt={cardName}
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
            style={{ width: 38, height: 58, objectFit: 'cover', borderRadius: 5, border: '1.5px solid var(--gold)', flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>{posLabel}</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{cardName}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{posDesc}</p>
          </div>
        </div>
        <span style={{ color: 'var(--gold)', fontSize: 18, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
      </button>
      {open && <div style={{ paddingBottom: 16, paddingLeft: 50 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{content}</p>
      </div>}
    </div>
  )
}

function TarotSectionAccordion({ title, content, defaultOpen }: { title: string; content: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
      }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ color: 'var(--gold)', fontSize: 18, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && <div style={{ paddingBottom: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{content}</p>
      </div>}
    </div>
  )
}

function TarotResultView({ readingType, tarotResult }: {
  readingType: string
  tarotResult: { content_text?: string; cards?: { name?: string; position?: string; file?: string }[]; question?: string; scenario_question?: string; spread_type?: string }
}) {
  const positions = TAROT_POSITIONS[readingType] ?? []
  const cards = tarotResult.cards ?? []
  const sections = tarotResult.content_text ? parseResult(tarotResult.content_text) : []
  const cardCount = positions.length
  const displayQuestion = tarotResult.scenario_question ?? tarotResult.question

  return (
    <div>
      <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
        {TYPE_LABELS[readingType] ?? readingType}
      </p>
      {displayQuestion && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, fontStyle: 'italic' }}>
          &ldquo;{displayQuestion}&rdquo;
        </p>
      )}

      {/* Card image strip */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {cards.map((c, i) => {
            const pos = positions[i]
            return (
              <div key={i} style={{ flexShrink: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <img
                  src={c.file ? cardImageUrl(c.file) : cardImageUrl('major_arcana_' + (c.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^the_/, ''))}
                  alt={c.name ?? ''}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
                  style={{ width: 56, height: 84, objectFit: 'cover', borderRadius: 6, border: '1.5px solid var(--gold)' }}
                />
                <p style={{ color: 'var(--gold)', fontSize: 9, fontWeight: 700, maxWidth: 60, textAlign: 'center' }}>
                  {pos?.label ?? c.position ?? `Card ${i + 1}`}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 8, maxWidth: 60, textAlign: 'center' }}>{c.name}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Accordion sections */}
      {sections.length > 0 && (
        <div className="card" style={{ padding: '0 20px', marginBottom: 16 }}>
          {sections.map((sec, i) => {
            const card = cards[i]
            const pos = positions[i]
            if (i < cardCount && card?.name && pos) {
              return (
                <TarotCardAccordion
                  key={i}
                  cardName={card.name}
                  cardFile={card.file}
                  posLabel={pos.label}
                  posDesc={pos.desc}
                  content={sec.content}
                  defaultOpen={i === 0}
                />
              )
            }
            return (
              <TarotSectionAccordion
                key={i}
                title={sec.title ?? `Section ${i + 1}`}
                content={sec.content}
                defaultOpen={i === cardCount}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

const TYPE_LABELS: Record<string, string> = {
  personal_fortune: 'Personal Fortune',
  daily: 'Daily Fortune',
  yearly: 'Yearly Fortune',
  compatibility: 'Compatibility',
  scenario: 'Scenario',
  tarot_three_card: 'Tarot · Three Card',
  tarot_relationship: 'Tarot · Relationship',
  tarot_celtic_cross: 'Tarot · Celtic Cross',
  tarot_scenario: 'Tarot · Scenario',
}
const TYPE_COLORS: Record<string, string> = {
  personal_fortune: 'var(--gold)',
  daily: '#f59e0b',
  yearly: '#60a5fa',
  compatibility: '#f472b6',
  scenario: '#a78bfa',
  tarot_three_card: '#c084fc',
  tarot_relationship: '#f472b6',
  tarot_celtic_cross: '#818cf8',
  tarot_scenario: '#34d399',
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

const TIME_RANGES: { label: string; hour: number | null; minute: number }[] = [
  { label: "Unknown (I don't know my birth time)", hour: null, minute: 0 },
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
  const [pHourIndex, setPHourIndex] = useState(0)
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
      const pRange = TIME_RANGES[pHourIndex]
      const pHour = pRange.hour
      await savePerson(user.email, { name: pName, birth_date, sex: pSex, birth_city: pCity, hour: pHour, minute: pHour !== null ? pRange.minute : null, birth_time_label: pRange.label })
      const refreshed = await getPeople(user.email)
      setPeople(refreshed)
      setPName(''); setPYear(''); setPMonth('1'); setPDay(''); setPCity(''); setPHourIndex(0)
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
    const isTarot = viewReading.reading_type?.startsWith('tarot_')
    const tarotResult = isTarot ? viewReading.result as { content_text?: string; cards?: { name?: string; position?: string; file?: string }[]; question?: string } : null

    return (
      <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 80 }}>
        <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setViewReading(null)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 14, cursor: 'pointer' }}>← Library</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(viewReading)}</span>
        </header>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 24px 0' }}>
          {isTarot && tarotResult ? (
            <TarotResultView readingType={viewReading.reading_type} tarotResult={tarotResult} />
          ) : (
            <ReadingResult raw={viewReading.result} onReset={() => setViewReading(null)} userEmail={user?.email ?? undefined} />
          )}
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
                  <button key={r.id} onClick={() => { gtagEvent('library_reading_open', { reading_type: r.reading_type }); setViewReading(r) }} style={{
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
                    {r.reading_type?.startsWith('tarot_') && (() => {
                      const cards = ((r.result as { cards?: { file?: string; name?: string }[] })?.cards ?? []).slice(0, 3)
                      if (!cards.length) return null
                      return (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          {cards.map((c, i) => (
                            <img key={i}
                              src={c.file ? cardImageUrl(c.file) : cardImageUrl('major_arcana_' + (c.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^the_/, ''))}
                              alt={c.name ?? ''}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
                              style={{ width: 30, height: 45, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(201,168,76,0.5)' }}
                            />
                          ))}
                        </div>
                      )
                    })()}
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
                        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                          {p.birth_time_label ?? (p.hour !== null && p.hour !== undefined ? `${String(p.hour).padStart(2,'0')}:${String(p.minute ?? 0).padStart(2,'0')}` : 'Birth time unknown')}
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
                      <label style={labelStyle}>Birth Time <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                      <select style={inputStyle} value={pHourIndex} onChange={e => setPHourIndex(parseInt(e.target.value))}>
                        {TIME_RANGES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                      </select>
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
