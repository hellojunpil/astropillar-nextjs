'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SavedPerson, savePerson, birthDateStr } from '@/lib/firestore'
import { monthOptionLabel, timeRangeLabel } from '@/lib/birthLabels'
import BirthForm, { BirthData, FORM_CSS } from './BirthForm'

export function personToBirthData(p: SavedPerson): BirthData {
  const [year, month, day] = p.birth_date.split('-').map(Number)
  return { name: p.name, year, month, day, hour: p.hour ?? null, minute: p.minute ?? null, sex: p.sex, city: p.birth_city }
}

function birthTimeLabel(p: SavedPerson, locale: string) {
  if (p.birth_time_label) return timeRangeLabel(p.birth_time_label, locale)
  if (p.hour === null || p.hour === undefined) {
    return locale === 'ko' ? '태어난 시간 모름' : locale === 'ja' ? '出生時間不明' : 'Birth time unknown'
  }
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

const inputStyle: React.CSSProperties = { width: '100%' }
const labelStyle: React.CSSProperties = {}

const PICKER_CSS = `
  .pp-add { display: flex; flex-direction: column; gap: 16px; padding: 22px 18px; margin-top: 4px;
    border-radius: var(--r-md); border: 1px solid var(--gold-line);
    background: linear-gradient(180deg, rgba(201,168,76,.06), rgba(201,168,76,.015)); }
  .pp-add-title { font-family: var(--font-display); font-size: 19px; font-weight: 600; color: var(--gold-light); }
  .pp-err { color: var(--danger); font-size: 13.5px; }
  .pp-actions { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-top: 4px; }
  .pp-empty { text-align: center; padding: 40px 24px; }
  .pp-empty-glyph { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; display: grid; place-items: center;
    font-size: 26px; color: var(--gold-light); border: 1px solid var(--gold-line);
    background: radial-gradient(circle, rgba(201,168,76,.18), rgba(201,168,76,.02) 70%); }
  .pp-empty-title { font-size: 17px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
  .pp-empty-sub { font-size: 14.5px; line-height: 1.7; color: var(--ink-2); margin: 0 auto 22px; max-width: 36ch; }
  .pp-list { display: grid; grid-template-columns: 1fr; gap: 10px; max-height: 452px; overflow-y: auto; padding: 2px 4px 2px 2px; overscroll-behavior: contain; }
  @media (min-width: 560px) { .pp-list { grid-template-columns: 1fr 1fr; } }
  .pp-person { width: 100%; text-align: left; padding: 16px 18px; border-radius: var(--r-md); cursor: pointer; position: relative;
    font: inherit; color: inherit; border: 1px solid var(--line-strong);
    background: linear-gradient(180deg, rgba(30,37,64,.55), rgba(15,19,36,.7));
    transition: border-color var(--t-fast), background var(--t-fast), transform var(--t-fast), box-shadow var(--t-med); }
  .pp-person:hover { border-color: var(--gold-line); }
  .pp-person:active { transform: scale(.985); }
  .pp-person.is-on { border-color: var(--gold); background: linear-gradient(180deg, rgba(201,168,76,.14), rgba(201,168,76,.04));
    box-shadow: 0 0 0 3px rgba(201,168,76,.12), 0 16px 40px -20px rgba(201,168,76,.45); }
  .pp-name { font-size: 16px; font-weight: 700; color: var(--ink); padding-right: 22px; }
  .pp-person.is-on .pp-name { color: var(--gold-light); }
  .pp-meta { font-size: 13.5px; color: var(--ink-2); margin-top: 6px; }
  .pp-time { font-size: 12.5px; color: var(--ink-3); margin-top: 3px; }
  .pp-check { position: absolute; top: 14px; right: 16px; color: var(--gold-light); font-size: 15px; }
  .pp-add-btn { min-height: 48px; border-radius: var(--r-md); border: 1px dashed var(--gold-line); background: rgba(201,168,76,.04);
    color: var(--gold-light); font: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer; transition: background var(--t-fast); }
  .pp-add-btn:hover { background: var(--gold-soft); }
  .pp-text-btn { align-self: center; background: none; border: none; cursor: pointer; font: inherit; font-size: 14px; color: var(--ink-2);
    padding: 10px 6px; min-height: 44px; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--line-strong); }
  .pp-text-btn:hover { color: var(--gold-light); text-decoration-color: var(--gold-line); }
  .pp-back { align-self: flex-start; background: none; border: none; cursor: pointer; font: inherit; font-size: 14px; color: var(--ink-2); padding: 8px 0; min-height: 40px; }
  .pp-back:hover { color: var(--gold-light); }
`

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
  people, onSubmit, loading, submitLabel,
  costBadge, headerSlot, userEmail, onPeopleChange,
}: Props) {
  const t = useTranslations('reading')
  const locale = useLocale()
  const [mode, setMode] = useState<'select' | 'manual'>('select')
  const [selectedId, setSelectedId] = useState('')
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

  const resolvedSubmitLabel = submitLabel ?? t('reading_stars')
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
    <form onSubmit={handleAddPerson} className="pp-add">
      <p className="pp-add-title">{t('new_person')}</p>
      <div>
        <label className="ap-label" style={labelStyle}>{t('name_label')}</label>
        <input className="ap-input" style={inputStyle} placeholder={t('name_placeholder')} value={pName} onChange={e => setPName(e.target.value)} required />
      </div>
      <div>
        <label className="ap-label" style={labelStyle}>{t('gender_label')}</label>
        <div className="ap-seg" role="radiogroup" aria-label={t('gender_label')}>
          {(['F','M'] as const).map(s => (
            <button key={s} type="button" role="radio" aria-checked={pSex === s} onClick={() => setPSex(s)} className={`ap-seg-btn${pSex === s ? ' is-on' : ''}`}>{s === 'F' ? t('female') : t('male')}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="ap-label" style={labelStyle}>{t('birth_date_label')}</label>
        <div className="ap-date-grid">
          <select className="ap-input" style={inputStyle} value={pMonth} onChange={e => setPMonth(e.target.value)}>
            {MONTHS.map((_, i) => <option key={i} value={i+1}>{monthOptionLabel(i, locale)}</option>)}
          </select>
          <input className="ap-input" style={inputStyle} placeholder={t('day_placeholder')} type="number" min={1} max={31} value={pDay} onChange={e => setPDay(e.target.value)} required />
          <input className="ap-input" style={inputStyle} placeholder={t('year_placeholder')} type="number" min={1900} max={new Date().getFullYear()} value={pYear} onChange={e => setPYear(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="ap-label" style={labelStyle}>{t('birth_time_label')} <span className="ap-label-opt">({t('optional')})</span></label>
        <select className="ap-input" style={inputStyle} value={pHourIndex} onChange={e => setPHourIndex(parseInt(e.target.value))}>
          {TIME_RANGES.map((tr, i) => <option key={i} value={i}>{timeRangeLabel(tr.label, locale)}</option>)}
        </select>
      </div>
      <div>
        <label className="ap-label" style={labelStyle}>{t('birth_city_label')}</label>
        <input className="ap-input" style={inputStyle} placeholder={t('city_placeholder')} value={pCity} onChange={e => setPCity(e.target.value)} required />
      </div>
      {saveError && <p className="pp-err" role="alert">{saveError}</p>}
      <div className="pp-actions">
        <button type="button" onClick={() => { setShowAddForm(false); setSaveError('') }} className="ap-btn-ghost">{t('cancel')}</button>
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? t('saving') : t('save_select')}
        </button>
      </div>
    </form>
  )

  if (mode === 'manual') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {headerSlot}
        {people.length > 0 && (
          <button type="button" onClick={() => setMode('select')} className="pp-back">
            ← {t('select_saved')}
          </button>
        )}
        <BirthForm onSubmit={onSubmit} loading={loading} submitLabel={resolvedSubmitLabel} costBadge={costBadge} />
        <style>{PICKER_CSS}</style>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {headerSlot}

      {people.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {!showAddForm && (
            <div className="pp-empty ap-glass">
              <div className="pp-empty-glyph" aria-hidden="true">☾</div>
              <p className="pp-empty-title">{t('no_saved_title')}</p>
              <p className="pp-empty-sub">{t('no_saved_sub')}</p>
              {userEmail ? (
                <button type="button" onClick={() => setShowAddForm(true)} className="btn-gold">
                  {t('add_person')}
                </button>
              ) : (
                <p style={{ color:'var(--ink-2)', fontSize:14 }}>{t('please_sign_in')}</p>
              )}
            </div>
          )}
          {showAddForm && addPersonForm}
        </div>
      ) : (
        <>
          <div className="pp-list">
            {people.map(p => {
              const selected = p.id === selectedId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id ?? '')}
                  aria-pressed={selected}
                  className={`pp-person${selected ? ' is-on' : ''}`}
                >
                  {selected && <span className="pp-check" aria-hidden="true">✦</span>}
                  <p className="pp-name">{p.name}</p>
                  <p className="pp-meta">
                    {p.birth_date} · {p.sex === 'F' ? '♀\uFE0E' : '♂\uFE0E'} · {p.birth_city}
                  </p>
                  <p className="pp-time">{birthTimeLabel(p, locale)}</p>
                </button>
              )
            })}
          </div>

          {showAddForm ? addPersonForm : (
            userEmail && (
              <button type="button" onClick={() => setShowAddForm(true)} className="pp-add-btn">
                {t('add_another')}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => selectedPerson && onSubmit(personToBirthData(selectedPerson))}
            disabled={!selectedPerson || loading}
            className="btn-gold ap-submit"
          >
            {loading
              ? <><span aria-hidden="true" style={{ display:'inline-block', animation:'spin 1.6s linear infinite' }}>✦</span> {t('reading_stars')}</>
              : <>{resolvedSubmitLabel}{costBadge && <span className="ap-submit-cost">{costBadge}</span>}</>
            }
          </button>
        </>
      )}

      <button type="button" onClick={() => setMode('manual')} className="pp-text-btn">
        {t('enter_manually')}
      </button>

      <style>{FORM_CSS + PICKER_CSS}</style>
    </div>
  )
}
