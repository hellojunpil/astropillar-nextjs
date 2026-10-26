'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SavedPerson } from '@/lib/firestore'
import { monthOptionLabel, timeRangeLabel } from '@/lib/birthLabels'

export interface BirthData {
  name: string
  year: number
  month: number
  day: number
  hour: number | null
  minute: number | null
  sex: 'M' | 'F'
  city: string
  birth_time_label?: string
}

interface Props {
  onSubmit: (data: BirthData) => void
  loading: boolean
  submitLabel?: string
  costBadge?: string
  savedPersons?: SavedPerson[]
  onSavePerson?: (data: BirthData) => Promise<void>
}

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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const inputStyle: React.CSSProperties = {
  width: '100%',
}

const labelStyle: React.CSSProperties = {}

// 공통 입력 스타일 (레이블 위, 48px 높이, 16px 글자, 선명한 포커스 링)
export const FORM_CSS = `
  .ap-form { display: flex; flex-direction: column; gap: 20px; }
  .ap-label { display: block; margin-bottom: 8px; font-size: 13.5px; font-weight: 600; color: var(--ink-2); letter-spacing: .01em; }
  .ap-label-opt { font-weight: 400; color: var(--ink-3); margin-left: 4px; }
  .ap-input {
    display: block; width: 100%; min-height: 48px; padding: 0 14px;
    font: inherit; font-size: 16px; color: var(--ink);
    background: rgba(9, 12, 26, 0.72); border: 1px solid var(--line-strong); border-radius: var(--r-sm);
    outline: none; appearance: none; -webkit-appearance: none;
    transition: border-color var(--t-fast), box-shadow var(--t-fast), background var(--t-fast);
  }
  .ap-input::placeholder { color: var(--ink-3); opacity: 1; }
  .ap-input:hover { border-color: rgba(201,168,76,.35); }
  .ap-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,.22); background: rgba(12, 16, 34, 0.9); }
  select.ap-input {
    padding-right: 38px; cursor: pointer;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='1.6' fill='none' stroke-linecap='round'/></svg>");
    background-repeat: no-repeat; background-position: right 14px center;
  }
  select.ap-input option { background: #111628; color: #f1ede4; }
  input[type=number].ap-input::-webkit-inner-spin-button, input[type=number].ap-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number].ap-input { -moz-appearance: textfield; }
  .ap-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 4px; border-radius: calc(var(--r-sm) + 4px);
    background: rgba(9, 12, 26, 0.72); border: 1px solid var(--line-strong); }
  .ap-seg-btn { min-height: 42px; border: 1px solid transparent; border-radius: var(--r-sm); background: transparent; cursor: pointer;
    font: inherit; font-size: 15px; font-weight: 600; color: var(--ink-2); transition: all var(--t-fast); }
  .ap-seg-btn:hover { color: var(--ink); }
  .ap-seg-btn.is-on { color: var(--gold-light); background: var(--gold-soft); border-color: var(--gold-line);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.05); }
  .ap-seg-btn:focus-visible { outline: 2px solid var(--gold-light); outline-offset: 2px; }
  .ap-date-grid { display: grid; grid-template-columns: 1.1fr 1fr 1.3fr; gap: 8px; }
  .ap-link-btn { min-height: 44px; border-radius: var(--r-sm); border: 1px dashed var(--line-strong); background: transparent;
    color: var(--ink-2); font: inherit; font-size: 14px; cursor: pointer; transition: all var(--t-fast); }
  .ap-link-btn:hover { border-color: var(--gold-line); color: var(--gold-light); }
  .ap-link-btn.is-ok { color: var(--success); border-color: rgba(147,197,174,.4); border-style: solid; }
  .ap-submit { width: 100%; min-height: 54px; font-size: 16px; margin-top: 6px; }
  .ap-submit-cost { background: rgba(26,20,8,.18); border-radius: 999px; padding: 3px 10px; font-size: 12.5px; font-weight: 700; }
  @keyframes spin { to { transform: rotate(360deg) } }
`

export default function BirthForm({ onSubmit, loading, submitLabel, costBadge, savedPersons, onSavePerson }: Props) {
  const t = useTranslations('reading')
  const locale = useLocale()
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('1')
  const [day, setDay] = useState('')
  const [hourIndex, setHourIndex] = useState(0)
  const [sex, setSex] = useState<'M' | 'F'>('F')
  const [city, setCity] = useState('')
  const [savingPerson, setSavingPerson] = useState(false)
  const [personSaved, setPersonSaved] = useState(false)

  const resolvedSubmitLabel = submitLabel ?? t('reading_stars')

  function applyPerson(p: SavedPerson) {
    setName(p.name)
    setSex(p.sex)
    const [y, m, d] = p.birth_date.split('-')
    setYear(y)
    setMonth(String(parseInt(m)))
    setDay(String(parseInt(d)))
    setCity(p.birth_city)
    if (p.birth_time_label) {
      const idx = TIME_RANGES.findIndex(tr => tr.label === p.birth_time_label)
      setHourIndex(idx >= 0 ? idx : 0)
    } else if (p.hour !== null) {
      const idx = TIME_RANGES.findIndex(tr => tr.hour === p.hour)
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
      minute: range.hour !== null ? range.minute : null,
      sex, city: city.trim(),
      birth_time_label: range.label,
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
    <form onSubmit={handleSubmit} className="ap-form">

      {savedPersons && savedPersons.length > 0 && (
        <div>
          <label className="ap-label" style={labelStyle}>Select a Person</label>
          <select
            className="ap-input" style={inputStyle}
            defaultValue=""
            onChange={e => {
              const p = savedPersons.find(p => p.id === e.target.value)
              if (p) applyPerson(p)
            }}
          >
            <option value="" disabled>Select a saved person</option>
            {savedPersons.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.birth_date})</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="ap-label" style={labelStyle}>{t('your_name')}</label>
        <input className="ap-input" style={inputStyle} placeholder={t('name_placeholder')} value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <label className="ap-label" style={labelStyle}>{t('gender_label')}</label>
        <div className="ap-seg" role="radiogroup" aria-label={t('gender_label')}>
          {(['F', 'M'] as const).map(s => (
            <button key={s} type="button" role="radio" aria-checked={sex === s} onClick={() => setSex(s)} className={`ap-seg-btn${sex === s ? ' is-on' : ''}`}>
              {s === 'F' ? t('female') : t('male')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="ap-label" style={labelStyle}>{t('birth_date_label')}</label>
        <div className="ap-date-grid">
          <select className="ap-input" style={inputStyle} value={month} onChange={e => setMonth(e.target.value)}>
            {MONTHS.map((_, i) => <option key={i} value={i + 1}>{monthOptionLabel(i, locale)}</option>)}
          </select>
          <input className="ap-input" style={inputStyle} placeholder={t('day_placeholder')} type="number" min={1} max={31} value={day} onChange={e => setDay(e.target.value)} />
          <input className="ap-input" style={inputStyle} placeholder={t('year_placeholder')} type="number" min={1900} max={new Date().getFullYear()} value={year} onChange={e => setYear(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="ap-label" style={labelStyle}>{t('birth_time_label')} <span className="ap-label-opt">({t('birth_time_optional')})</span></label>
        <select className="ap-input" style={inputStyle} value={hourIndex} onChange={e => setHourIndex(parseInt(e.target.value))}>
          {TIME_RANGES.map((tr, i) => (
            <option key={i} value={i}>{timeRangeLabel(tr.label, locale)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="ap-label" style={labelStyle}>{t('birth_city_label')}</label>
        <input
          className="ap-input" style={inputStyle}
          placeholder={t('city_placeholder')}
          value={city}
          onChange={e => setCity(e.target.value)}
          autoComplete="off"
        />
      </div>

      {onSavePerson && isValid && (
        <button type="button" onClick={handleSavePerson} disabled={savingPerson || personSaved} className={`ap-link-btn${personSaved ? ' is-ok' : ''}`}>
          {personSaved ? t('saved_to_persons') : savingPerson ? t('saving') : t('save_person')}
        </button>
      )}

      <button
        type="submit"
        disabled={!isValid || loading}
        className="btn-gold ap-submit"
      >
        {loading ? (
          <><span aria-hidden="true" style={{ display: 'inline-block', animation: 'spin 1.6s linear infinite' }}>✦</span> {t('reading_stars')}</>
        ) : (
          <>{resolvedSubmitLabel}{costBadge && <span className="ap-submit-cost">{costBadge}</span>}</>
        )}
      </button>

      <style>{FORM_CSS}</style>
    </form>
  )
}
