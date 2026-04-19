'use client'
import { useState } from 'react'
import { SavedPerson, savePerson, birthDateStr } from '@/lib/firestore'
import BirthForm, { BirthData } from './BirthForm'

export function personToBirthData(p: SavedPerson): BirthData {
  const [year, month, day] = p.birth_date.split('-').map(Number)
  return { name: p.name, year, month, day, hour: p.hour ?? null, minute: p.minute ?? null, sex: p.sex, city: p.birth_city }
}

function birthTimeLabel(p: SavedPerson) {
  if (p.birth_time_label) return p.birth_time_label
  if (p.hour === null || p.hour === undefined) return 'Birth time unknown'
  return `${String(p.hour).padStart(2,'0')}:${String(p.minute ?? 0).padStart(2,'0')}`
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

const inputStyle: React.CSSProperties = {
  background: '#0f1829', border: '1px solid var(--border)', borderRadius: 10,
  color: '#fff', padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none',
  fontFamily: "'Noto Sans', sans-serif",
}
const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5,
  textTransform: 'uppercase', marginBottom: 5, display: 'block',
}

interface Props {
  people: SavedPerson[]
  onSubmit: (data: BirthData) => void
  loading: boolean
  submitLabel?: string
  costBadge?: string
  headerSlot?: React.ReactNode
  userEmail?: string
  onPeopleChange?: (people: SavedPerson[]) => void
}

export default function PersonPicker({
  people, onSubmit, loading, submitLabel = 'Get My Reading',
  costBadge, headerSlot, userEmail, onPeopleChange,
}: Props) {
  const [mode, setMode] = useState<'select' | 'manual'>('select')
  const [selectedId, setSelectedId] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Add person form state
  const [pName, setPName] = useState('')
  const [pSex, setPSex] = useState<'M'|'F'>('F')
  const [pMonth, setPMonth] = useState('1')
  const [pDay, setPDay] = useState('')
  const [pYear, setPYear] = useState('')
  const [pCity, setPCity] = useState('')
  const [pHourIndex, setPHourIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const selectedPerson = people.find(p => p.id === selectedId) ?? null

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!userEmail || !pName || !pYear || !pDay || !pCity) return
    setSaving(true)
    setSaveError('')
    try {
      const birth_date = birthDateStr(parseInt(pYear), parseInt(pMonth), parseInt(pDay))
      const pRange = TIME_RANGES[pHourIndex]
      const pHour = pRange.hour
      const pMinute = pHour !== null ? pRange.minute : null
      const pLabel = pRange.label
      const saved = await savePerson(userEmail, { name: pName, birth_date, sex: pSex, birth_city: pCity, hour: pHour, minute: pMinute, birth_time_label: pLabel })
      const newPerson: SavedPerson = { id: saved?.id, name: pName, birth_date, sex: pSex, birth_city: pCity, hour: pHour, minute: pMinute, birth_time_label: pLabel }
      const updated = [...people, newPerson]
      onPeopleChange?.(updated)
      setSelectedId(newPerson.id ?? '')
      setShowAddForm(false)
      setPName(''); setPSex('F'); setPMonth('1'); setPDay(''); setPYear(''); setPCity(''); setPHourIndex(0)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const addPersonForm = (
    <form onSubmit={handleAddPerson} style={{ display:'flex', flexDirection:'column', gap:12, background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:14, padding:'18px 16px', marginTop:4 }}>
      <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>New Person</p>
      <div>
        <label style={labelStyle}>Name</label>
        <input style={inputStyle} placeholder="e.g. Jessica" value={pName} onChange={e => setPName(e.target.value)} required />
      </div>
      <div>
        <label style={labelStyle}>Gender</label>
        <div style={{ display:'flex', gap:8 }}>
          {(['F','M'] as const).map(s => (
            <button key={s} type="button" onClick={() => setPSex(s)} style={{
              flex:1, padding:'9px', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13,
              border:`1px solid ${pSex === s ? 'var(--gold)' : 'var(--border)'}`,
              background: pSex === s ? 'rgba(201,168,76,0.12)' : 'transparent',
              color: pSex === s ? 'var(--gold)' : 'var(--text-muted)',
            }}>{s === 'F' ? '♀ Female' : '♂ Male'}</button>
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Birth Date</label>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 3fr', gap:8 }}>
          <select style={inputStyle} value={pMonth} onChange={e => setPMonth(e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <input style={inputStyle} placeholder="Day" type="number" min={1} max={31} value={pDay} onChange={e => setPDay(e.target.value)} required />
          <input style={inputStyle} placeholder="Year" type="number" min={1900} max={2025} value={pYear} onChange={e => setPYear(e.target.value)} required />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Birth Time <span style={{ color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
        <select style={inputStyle} value={pHourIndex} onChange={e => setPHourIndex(parseInt(e.target.value))}>
          {TIME_RANGES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Birth City</label>
        <input style={inputStyle} placeholder="e.g. New York" value={pCity} onChange={e => setPCity(e.target.value)} required />
      </div>
      {saveError && <p style={{ color:'#ef4444', fontSize:12 }}>{saveError}</p>}
      <div style={{ display:'flex', gap:8, marginTop:4 }}>
        <button type="button" onClick={() => { setShowAddForm(false); setSaveError('') }} style={{
          flex:1, background:'none', border:'1px solid var(--border)', borderRadius:50,
          color:'var(--text-muted)', fontSize:13, padding:'10px', cursor:'pointer',
        }}>Cancel</button>
        <button type="submit" disabled={saving} className="btn-gold" style={{ flex:2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save & Select'}
        </button>
      </div>
    </form>
  )

  if (mode === 'manual') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {headerSlot}
        {people.length > 0 && (
          <button type="button" onClick={() => setMode('select')} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer', textAlign:'left', padding:0 }}>
            ← Select a saved person
          </button>
        )}
        <BirthForm onSubmit={onSubmit} loading={loading} submitLabel={submitLabel} costBadge={costBadge} />
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {headerSlot}

      {people.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {!showAddForm && (
            <div style={{ textAlign:'center', padding:'36px 24px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:14 }}>
              <p style={{ fontSize:28, marginBottom:12 }}>👤</p>
              <p style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:8 }}>No saved persons yet.</p>
              <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20, lineHeight:1.6 }}>
                Save yourself to get started with quick readings.
              </p>
              {userEmail ? (
                <button type="button" onClick={() => setShowAddForm(true)} className="btn-gold" style={{ padding:'11px 24px', fontSize:13 }}>
                  + Add Person
                </button>
              ) : (
                <p style={{ color:'var(--text-muted)', fontSize:12 }}>Please sign in to save persons.</p>
              )}
            </div>
          )}
          {showAddForm && addPersonForm}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {people.map(p => {
              const selected = p.id === selectedId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id ?? '')}
                  style={{
                    width:'100%', textAlign:'left', padding:'14px 16px', borderRadius:14, cursor:'pointer',
                    border:`1.5px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                    background: selected ? 'rgba(201,168,76,0.08)' : 'var(--card)',
                    transition:'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p style={{ color: selected ? 'var(--gold)' : '#fff', fontSize:15, fontWeight:700 }}>{p.name}</p>
                    {selected && <span style={{ color:'var(--gold)', fontSize:16 }}>✦</span>}
                  </div>
                  <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>
                    {p.birth_date} · {p.sex === 'F' ? '♀' : '♂'} · {p.birth_city}
                  </p>
                  <p style={{ color:'var(--text-muted)', fontSize:11, marginTop:2 }}>{birthTimeLabel(p)}</p>
                </button>
              )
            })}
          </div>

          {showAddForm ? addPersonForm : (
            userEmail && (
              <button type="button" onClick={() => setShowAddForm(true)} style={{
                background:'rgba(201,168,76,0.06)', border:'1px dashed rgba(201,168,76,0.35)',
                borderRadius:12, padding:'10px', color:'var(--gold)', fontSize:13, cursor:'pointer',
              }}>
                + Add Another Person
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => selectedPerson && onSubmit(personToBirthData(selectedPerson))}
            disabled={!selectedPerson || loading}
            className="btn-gold"
            style={{
              marginTop:4,
              opacity: (!selectedPerson || loading) ? 0.5 : 1,
              cursor: (!selectedPerson || loading) ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            }}
          >
            {loading
              ? <><span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>✦</span> Reading the stars...</>
              : <>{submitLabel}{costBadge && <span style={{ background:'rgba(22,33,62,0.6)', borderRadius:20, padding:'2px 10px', fontSize:12 }}>{costBadge}</span>}</>
            }
          </button>
        </>
      )}

      <button type="button" onClick={() => setMode('manual')} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', textAlign:'center', padding:'4px 0', textDecoration:'underline', textUnderlineOffset:3 }}>
        Enter manually →
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
