'use client'
import { useState, useEffect, useRef } from 'react'
import { apiGet } from '@/lib/api'

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

interface GeoResult {
  name: string
  country: string
  lat: number
  lon: number
}

interface Props {
  onSubmit: (data: BirthData) => void
  loading: boolean
  submitLabel?: string
  costBadge?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]
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

export default function BirthForm({ onSubmit, loading, submitLabel = 'Get My Reading', costBadge }: Props) {
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('1')
  const [day, setDay] = useState('')
  const [hour, setHour] = useState<string>('unknown')
  const [minute, setMinute] = useState('0')
  const [sex, setSex] = useState<'M' | 'F'>('F')
  const [city, setCity] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<GeoResult[]>([])
  const [citySearching, setCitySearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (cityQuery.length < 2) {
      setCityResults([])
      setShowDropdown(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setCitySearching(true)
      try {
        const results = await apiGet<GeoResult[]>('/geo/search', { q: cityQuery })
        setCityResults(results || [])
        setShowDropdown(true)
      } catch {
        setCityResults([])
      } finally {
        setCitySearching(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [cityQuery])

  function selectCity(r: GeoResult) {
    const label = `${r.name}, ${r.country}`
    setCity(label)
    setCityQuery(label)
    setShowDropdown(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const y = parseInt(year)
    const d = parseInt(day)
    if (!y || !d || !city) return
    onSubmit({
      name: name.trim() || 'You',
      year: y,
      month: parseInt(month),
      day: d,
      hour: hour === 'unknown' ? null : parseInt(hour),
      minute: hour === 'unknown' ? null : parseInt(minute),
      sex,
      city,
    })
  }

  const isValid = year.length === 4 && day.length > 0 && city.length > 0

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Name */}
      <div>
        <label style={labelStyle}>Your Name</label>
        <input
          style={inputStyle}
          placeholder="e.g. Jessica"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      {/* Sex */}
      <div>
        <label style={labelStyle}>Gender</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['F', 'M'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSex(s)}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 10,
                border: `1px solid ${sex === s ? 'var(--gold)' : 'var(--border)'}`,
                background: sex === s ? 'rgba(201,168,76,0.12)' : '#0f1829',
                color: sex === s ? 'var(--gold)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {s === 'F' ? '♀ Female' : '♂ Male'}
            </button>
          ))}
        </div>
      </div>

      {/* Birth Date */}
      <div>
        <label style={labelStyle}>Birth Date</label>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr', gap: 8 }}>
          <select
            style={inputStyle}
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            style={inputStyle}
            placeholder="Day"
            type="number"
            min={1} max={31}
            value={day}
            onChange={e => setDay(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Year (e.g. 1995)"
            type="number"
            min={1900} max={2025}
            value={year}
            onChange={e => setYear(e.target.value)}
          />
        </div>
      </div>

      {/* Birth Time */}
      <div>
        <label style={labelStyle}>Birth Time <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional — improves accuracy)</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select style={inputStyle} value={hour} onChange={e => setHour(e.target.value)}>
            <option value="unknown">Unknown</option>
            {HOURS.map(h => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
          {hour !== 'unknown' && (
            <select style={inputStyle} value={minute} onChange={e => setMinute(e.target.value)}>
              {MINUTES.map(m => (
                <option key={m} value={m}>:{String(m).padStart(2, '0')}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* City */}
      <div style={{ position: 'relative' }}>
        <label style={labelStyle}>Birth City</label>
        <input
          style={inputStyle}
          placeholder="Search city..."
          value={cityQuery}
          onChange={e => { setCityQuery(e.target.value); setCity('') }}
          autoComplete="off"
        />
        {citySearching && (
          <span style={{ position: 'absolute', right: 14, top: '50%', color: 'var(--gold)', fontSize: 12 }}>
            ✦
          </span>
        )}
        {showDropdown && cityResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            background: '#16213E', border: '1px solid var(--border)', borderRadius: 10,
            marginTop: 4, overflow: 'hidden',
          }}>
            {cityResults.slice(0, 6).map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectCity(r)}
                style={{
                  width: '100%', textAlign: 'left', padding: '11px 14px',
                  background: 'none', border: 'none', color: '#fff',
                  fontSize: 14, cursor: 'pointer', borderBottom: i < cityResults.length - 1 ? '1px solid var(--border)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {r.name}, <span style={{ color: 'var(--text-muted)' }}>{r.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="btn-gold"
        style={{
          marginTop: 8,
          opacity: (!isValid || loading) ? 0.5 : 1,
          cursor: (!isValid || loading) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>✦</span>
            Reading the stars...
          </>
        ) : (
          <>
            {submitLabel}
            {costBadge && <span style={{ background: 'rgba(22,33,62,0.6)', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{costBadge}</span>}
          </>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </form>
  )
}
