'use client'
import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading, createShare, getCachedReading, getPeople, savePerson, birthDateStr, SavedPerson } from '@/lib/firestore'
import ReadingLoader from '@/components/ReadingLoader'
import { FORM_CSS } from '@/components/BirthForm'
import { monthOptionLabel, timeRangeLabel } from '@/lib/birthLabels'

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

const RELATIONSHIPS_DISPLAY: Record<string, Record<string, string>> = {
  ko: {
    'Romantic Partner': '연인',
    'Crush': '짝사랑',
    'Ex': '전 연인',
    'Friend': '친구',
    'Business Partner': '비즈니스 파트너',
    'Parent': '부모님',
    'Brother/Sister': '형제/자매',
    'My Child': '내 자녀',
    'Coworker': '동료',
    'Boss': '상사',
    'Junior Colleague': '부하직원',
    'Celebrity Crush': '좋아하는 연예인',
  },
  ja: {
    'Romantic Partner': '恋愛パートナー',
    'Crush': '片思い',
    'Ex': '元恋人',
    'Friend': '友人',
    'Business Partner': 'ビジネスパートナー',
    'Parent': '親',
    'Brother/Sister': '兄弟・姉妹',
    'My Child': '子ども',
    'Coworker': '同僚',
    'Boss': '上司',
    'Junior Colleague': '後輩',
    'Celebrity Crush': '推し',
  },
}

const inputStyle: React.CSSProperties = { width: '100%' }
const labelStyle: React.CSSProperties = {}

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
  const locale = useLocale()
  const t = useTranslations('reading')
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
  const [shareId, setShareId] = useState<string | null>(null)

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
      const cached = await getCachedReading(user.email, 'compatibility', cacheKey, cacheDate, cacheCity, undefined, locale)
      if (cached) {
        const sid = await createShare({ reading_type: 'compatibility', name: cacheKey, birth_date: cacheDate, birth_city: cacheCity, result: cached.result })
        setShareId(sid)
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
        language: locale,
      })
      await apiPost('/use_pouch', { email: user.email, reading_type: 'compatibility' })
      await saveReading(user.email, { reading_type: 'compatibility', name: cacheKey, birth_date: cacheDate, birth_city: cacheCity, locale, result: raw })
      const sid = await createShare({ reading_type: 'compatibility', name: cacheKey, birth_date: cacheDate, birth_city: cacheCity, result: raw })
      setShareId(sid)
      setResult(raw)
      setFromCache(false)
      refreshCredits(cost)
      gtagEvent('reading_compatibility')
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
      title={t('compat_title')} subtitle={t('compat_sub')}
      emoji="💞" badge={`${cost} ${t('credit_unit')}`} credits={credits} requiredCredits={cost} inProgress={submitting || !!result}
    >
      {result ? (
        <ReadingResult
          raw={result}
          onReset={() => { setResult(null); setFromCache(false); setShareId(null) }}
          userEmail={user?.email ?? undefined}
          fromCache={fromCache}
          shareId={shareId ?? undefined}
        />
      ) : submitting ? (
        <ReadingLoader onComplete={() => {}} />
      ) : loadingPeople ? (
        <p style={{ color: 'var(--ink-2)', textAlign: 'center', padding: 40 }} aria-busy="true"><span aria-hidden="true" style={{ display:'inline-block', color:'var(--gold-light)', animation:'spin 2s linear infinite', marginRight:8 }}>✦</span>Loading</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <style>{FORM_CSS + COMPAT_CSS}</style>

          {/* Person 1 */}
          <div className="card">
            <label className="ap-label" style={labelStyle}>{t('person1_label')}</label>
            <select className="ap-input" style={inputStyle} value={person1Id} onChange={e => setPerson1Id(e.target.value)}>
              <option value="">{t('select_person_ph')}</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.birth_date})</option>
              ))}
            </select>
            {person1 && (
              <p className="cp-meta">
                {person1.sex === 'F' ? '♀\uFE0E' : '♂\uFE0E'} · {person1.birth_city} · {personBirthtime(person1) === '12:00' && person1.hour === null ? t('birth_time_unknown') : personBirthtime(person1)}
              </p>
            )}
          </div>

          {/* Person 2 + Relationship */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="ap-label" style={labelStyle}>{t('person2_label')}</label>
              <select className="ap-input" style={inputStyle} value={person2Id} onChange={e => setPerson2Id(e.target.value)}>
                <option value="">{t('select_person_ph')}</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.birth_date})</option>
                ))}
              </select>
              {person2 && (
                <p className="cp-meta">
                  {person2.sex === 'F' ? '♀\uFE0E' : '♂\uFE0E'} · {person2.birth_city} · {personBirthtime(person2) === '12:00' && person2.hour === null ? t('birth_time_unknown') : personBirthtime(person2)}
                </p>
              )}
            </div>
            <div>
              <label className="ap-label" style={labelStyle}>{t('relationship_label')}</label>
              <select className="ap-input" style={inputStyle} value={relationship} onChange={e => setRelationship(e.target.value)}>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{RELATIONSHIPS_DISPLAY[locale]?.[r] ?? r}</option>)}
              </select>
            </div>
          </div>

          {/* Inline Add Person */}
          {!showAddForm ? (
            user?.email && (
              <button type="button" onClick={() => setShowAddForm(true)} className="cp-add-btn">
                {t('add_new_person')}
              </button>
            )
          ) : (
            <div className="cp-add">
              <p className="cp-add-title">{t('new_person')}</p>
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
              {saveError && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13.5 }}>{saveError}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowAddForm(false); setSaveError('') }} className="ap-btn-ghost">{t('cancel')}</button>
                <button type="button" disabled={saving || !pName || !pYear || !pDay || !pCity} onClick={handleAddPerson} className="btn-gold" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? t('saving') : t('save_select')}
                </button>
              </div>
            </div>
          )}

          {people.length < 2 && !showAddForm && (
            <p style={{ color: 'var(--ink-2)', fontSize: 13.5, textAlign: 'center', lineHeight: 1.6 }}>
              {t('min_two_people')}
            </p>
          )}

          {person1Id && person2Id && person1Id === person2Id && (
            <p role="alert" style={{ color: '#f3c77a', fontSize: 14, textAlign: 'center' }}>{t('diff_people_warning')}</p>
          )}

          {error && <p role="alert" style={{ color:'var(--danger)', fontSize:14, lineHeight:1.6, textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={!isValid || submitting} className="btn-gold ap-submit">
            {submitting ? <><span aria-hidden="true" style={{ display:'inline-block', animation:'spin 1.6s linear infinite' }}>✦</span> {t('reading_stars')}</> : (
              <>{t('compat_submit')} <span className="ap-submit-cost">{cost} {t('credit_unit')}</span></>
            )}
          </button>
        </form>
      )}
    </ReadingPageShell>
  )
}

function LoadingScreen() {
  return (
    <main style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }} aria-busy="true">
      <span aria-hidden="true" style={{ fontSize:28, color:'var(--gold-light)', textShadow:'0 0 20px rgba(230,205,133,.7)', animation:'apGlow 1.8s ease-in-out infinite, apSpin 6s linear infinite', display:'inline-block' }}>✦</span>
      <p style={{ color:'var(--ink-2)', fontFamily:"'Cormorant Garamond', serif", fontSize:18, letterSpacing:'.12em' }}>Loading</p>
    </main>
  )
}

const COMPAT_CSS = `
  .cp-meta { color: var(--ink-2); font-size: 13.5px; margin-top: 10px; }
  .cp-add-btn { min-height: 48px; border-radius: var(--r-md); border: 1px dashed var(--gold-line); background: rgba(201,168,76,.04);
    color: var(--gold-light); font: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer; transition: background var(--t-fast); }
  .cp-add-btn:hover { background: var(--gold-soft); }
  .cp-add { display: flex; flex-direction: column; gap: 16px; padding: 22px 18px; border-radius: var(--r-md);
    border: 1px solid var(--gold-line); background: linear-gradient(180deg, rgba(201,168,76,.06), rgba(201,168,76,.015)); }
  .cp-add-title { font-family: var(--font-display); font-size: 19px; font-weight: 600; color: var(--gold-light); }
`
