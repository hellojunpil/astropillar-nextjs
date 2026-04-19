'use client'
import { useState } from 'react'
import { SavedPerson } from '@/lib/firestore'

export interface BirthData {
  name: string
  year: number
  month: number
  day: number
  hour: number | null
  minute: number | null
  sex: 'M' | 'F'
  city: string
}

interface Props {
  onSubmit: (data: BirthData) => void
  loading: boolean
  submitLabel?: string
  costBadge?: string
  savedPersons?: SavedPerson[]
  onSavePerson?: (data: BirthData) => Promise<void>
}

const TIME_RANGES: { label: string; hour: number | null }[] = [
  { label: "Unknown (I don't know my birth time)", hour: null },
  { label: '23:30 - 01:30', hour: 0 },
  { label: '01:30 - 03:30', hour: 2 },
  { label: '03:30 - 05:30', hour: 4 },
  { label: '05:30 - 07:30', hour: 6 },
  { label: '07:30 - 09:30', hour: 8 },
  { label: '09:30 - 11:30', hour: 10 },
  { label: '11:30 - 13:30', hour: 12 },
  { label: '13:30 - 15:30', hour: 14 },
  { label: '15:30 - 17:30', hour: 16 },
  { label: '17:30 - 19:30', hour: 18 },
  { label: '19:30 - 21:30', hour: 20 },
  { label: '21:30 - 23:30', hour: 22 },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const inputStyle: React.CSSProperties = {
  background: '#0f1829',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: '#fff',
  padding: '11px 14px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
}

export default function BirthForm({ onSubmit, loading, submitLabel = 'Get My Reading', costBadge, savedPersons, onSavePerson }: Props) {
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('1')
  const [day, setDay] = useState('')
  const [hourIndex, setHourIndex] = useState(0) // index into TIME_RANGES
  const [sex, setSex] = useState<'M' | 'F'>('F')
  const [city, setCity] = useState('')
  const [savingPerson, setSavingPerson] = useState(false)
  const [personSaved, setPersonSaved] = useState(false)

  function applyPerson(p: SavedPerson) {
    setName(p.name)
    setSex(p.sex)
    const [y, m, d] = p.birth_date.split('-')
    setYear(y)
    setMonth(String(parseInt(m)))
    setDay(String(parseInt(d)))
    setCity(p.birth_city)
    if (p.hour !== null) {
      const idx = TIME_RANGES.findIndex(t => t.hour === p.hour)
      setHourIndex(idx >= 0 ? idx : 0)
    } else {
      setHourIndex(0)
    }
  }

  function currentBirthData(): BirthData | null {
    const y = parseInt(year)
    const d = parseInt(day)
    if (!y || !d || !city.trim()) return null
    const range = TIME_RANGES[hourIndex]
    return {
      name: name.trim() || 'You',
      year: y, month: parseInt(month), day: d,
      hour: range.hour,
      minute: range.hour !== null ? 0 : null,
      sex, city: city.trim(),
    }
  }

  async function handleSavePerson() {
    if (!onSavePerson) return
    const data = currentBirthData()
    if (!data) return
    setSavingPerson(true)
    await onSavePerson(data)
    setPersonSaved(true)
    setSavingPerson(false)
    setTimeout(() => setPersonSaved(false), 3000)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = currentBirthData()
    if (!data) return
    onSubmit(data)
  }

  const isValid = year.length === 4 && day.length > 0 && city.trim().length > 0

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Saved persons dropdown */}
      {savedPersons && savedPersons.length > 0 && (
        <div>
          <label style={labelStyle}>Select a Person</label>
          <select
            style={inputStyle}
            defaultValue=""
            onChange={e => {
              const p = savedPersons.find(p => p.id === e.target.value)
              if (p) applyPerson(p)
            }}
          >
            <option value="" disabled>— Select a saved person —</option>
            {savedPersons.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.birth_date})</option>
            ))}
          </select>
        </div>
      )}

      {/* Name */}
      <div>
        <label style={labelStyle}>Your Name</label>
        <input style={inputStyle} placeholder="e.g. Jessica" value={name} onChange={e => setName(e.target.value)} />
      </div>

      {/* Sex */}
      <div>
        <label style={labelStyle}>Gender</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['F', 'M'] as const).map(s => (
            <button key={s} type="button" onClick={() => setSex(s)} style={{
              flex: 1, padding: '11px', borderRadius: 10,
              border: `1px solid ${sex === s ? 'var(--gold)' : 'var(--border)'}`,
              background: sex === s ? 'rgba(201,168,76,0.12)' : '#0f1829',
              color: sex === s ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              {s === 'F' ? '♀ Female' : '♂ Male'}
            </button>
          ))}
        </div>
      </div>

      {/* Birth Date */}
      <div>
        <label style={labelStyle}>Birth Date</label>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr', gap: 8 }}>
          <select style={inputStyle} value={month} onChange={e => setMonth(e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input style={inputStyle} placeholder="Day" type="number" min={1} max={31} value={day} onChange={e => setDay(e.target.value)} />
          <input style={inputStyle} placeholder="Year (e.g. 1995)" type="number" min={1900} max={2025} value={year} onChange={e => setYear(e.target.value)} />
        </div>
      </div>

      {/* Birth Time */}
      <div>
        <label style={labelStyle}>Birth Time <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional — improves accuracy)</span></label>
        <select style={inputStyle} value={hourIndex} onChange={e => setHourIndex(parseInt(e.target.value))}>
          {TIME_RANGES.map((t, i) => (
            <option key={i} value={i}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label style={labelStyle}>Birth City</label>
        <input
          style={inputStyle}
          placeholder="e.g. New York"
          value={city}
          onChange={e => setCity(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Save person button */}
      {onSavePerson && isValid && (
        <button type="button" onClick={handleSavePerson} disabled={savingPerson || personSaved} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 10,
          color: personSaved ? '#2ecc71' : 'var(--text-muted)', fontSize: 12,
          padding: '8px', cursor: 'pointer', textAlign: 'center',
        }}>
          {personSaved ? '✓ Saved to My Persons' : savingPerson ? 'Saving...' : '+ Save this person'}
        </button>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="btn-gold"
        style={{
          marginTop: 4,
          opacity: (!isValid || loading) ? 0.5 : 1,
          cursor: (!isValid || loading) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {loading ? (
          <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>✦</span> Reading the stars...</>
        ) : (
          <>{submitLabel}{costBadge && <span style={{ background: 'rgba(22,33,62,0.6)', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{costBadge}</span>}</>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </form>
  )
}
