'use client'
import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import { BirthData } from '@/components/BirthForm'
import PersonPicker from '@/components/PersonPicker'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading, createShare, getCachedReading, savePerson, getPeople, birthDateStr, SavedPerson } from '@/lib/firestore'
import ReadingLoader from '@/components/ReadingLoader'

export default function DailyFortunePage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const locale = useLocale()
  const t = useTranslations('reading')
  const pricing = usePricing()
  const cost = pricing.personal_daily_fortune
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [fromCache, setFromCache] = useState(false)
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [error, setError] = useState('')
  const [people, setPeople] = useState<SavedPerson[]>([])
  const [shareId, setShareId] = useState<string | null>(null)

  const dateOptions = (() => {
    const today = new Date()
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      // 화면 언어에 맞춘 날짜 표기 (ko: 11월 10일 (화), ja: 11月10日(火))
      const wd = (loc: string) => d.toLocaleDateString(loc, { weekday: 'short' })
      const label = i === 0 ? t('today') : i === 1 ? t('tomorrow')
        : locale === 'ko' ? `${d.getMonth() + 1}월 ${d.getDate()}일 (${wd('ko-KR')})`
        : locale === 'ja' ? `${d.getMonth() + 1}月${d.getDate()}日(${wd('ja-JP')})`
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      return { value: `${y}-${m}-${day}`, label }
    })
  })()

  const [targetDate, setTargetDate] = useState(dateOptions[0].value)

  useEffect(() => {
    if (user?.email) getPeople(user.email).then(setPeople)
  }, [user?.email])

  async function handleSubmit(data: BirthData) {
    if (!user?.email) return
    setSubmitting(true)
    setError('')
    setBirthData(data)
    try {
      const birth_date = birthDateStr(data.year, data.month, data.day)
      const cached = await getCachedReading(user.email, 'daily', data.name, birth_date, data.city, targetDate, locale)
      if (cached) { const sid = await createShare({ reading_type: 'daily', name: data.name, birth_date, birth_city: data.city, result: cached.result, birth_data: data }); setShareId(sid); setResult(cached.result); setFromCache(true); return }
      const birthtime = data.hour !== null
        ? `${String(data.hour).padStart(2,'0')}:${String(data.minute ?? 0).padStart(2,'0')}`
        : '12:00'
      const raw = await apiPost('/personal_daily_fortune', {
        year: data.year, month: data.month, day: data.day,
        birthtime, sex: data.sex, city: data.city,
        user_name: data.name, birth_year: data.year,
        target_date: targetDate,
        language: locale,
      })
      await apiPost('/use_pouch', { email: user.email, reading_type: 'personal_daily_fortune' })
      await saveReading(user.email, { reading_type: 'daily', name: data.name, birth_date, birth_city: data.city, target_date: targetDate, locale, result: raw })
      const sid = await createShare({ reading_type: 'daily', name: data.name, birth_date, birth_city: data.city, result: raw, birth_data: data })
      setShareId(sid)
      setResult(raw); setFromCache(false); refreshCredits(cost)
      gtagEvent('reading_daily_fortune')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSavePerson(data: BirthData) {
    if (!user?.email) return
    const birth_date = birthDateStr(data.year, data.month, data.day)
    await savePerson(user.email, { name: data.name, birth_date, sex: data.sex, birth_city: data.city, hour: data.hour, minute: data.minute })
    getPeople(user.email).then(setPeople)
  }

  if (loading) return <LoadingScreen />

  const selectedLabel = dateOptions.find(d => d.value === targetDate)?.label ?? targetDate

  const datePicker = (
    <div style={{ marginBottom: 4 }}>
      <label style={{ color:'var(--ink-2)', fontSize:13.5, fontWeight:600, marginBottom:10, display:'block' }}>
        {t('read_fortune_for')}
      </label>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {dateOptions.map(opt => (
          <button key={opt.value} type="button" aria-pressed={targetDate === opt.value} onClick={() => setTargetDate(opt.value)} style={{
            minHeight:40, padding:'0 16px', borderRadius:999, fontSize:14, cursor:'pointer', font:'inherit',
            border:`1px solid ${targetDate === opt.value ? 'var(--gold)' : 'var(--line-strong)'}`,
            background: targetDate === opt.value ? 'var(--gold-soft)' : 'rgba(9,12,26,0.6)',
            color: targetDate === opt.value ? 'var(--gold-light)' : 'var(--ink-2)',
            fontWeight: targetDate === opt.value ? 700 : 500,
            boxShadow: targetDate === opt.value ? '0 0 0 3px rgba(201,168,76,.12)' : 'none',
            transition:'all .16s',
          }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <ReadingPageShell title={t('daily_title')} subtitle={t('daily_sub', { date: selectedLabel })} emoji="☀️" badge={`${cost} ${t('credit_unit')}`} credits={credits} requiredCredits={cost} inProgress={submitting || !!result}>
      {result ? (
        <ReadingResult raw={result} onReset={() => { setResult(null); setFromCache(false); setBirthData(null); setShareId(null) }} userEmail={user?.email ?? undefined} fromCache={fromCache} birthData={birthData ?? undefined} shareId={shareId ?? undefined} />
      ) : submitting ? (
        <ReadingLoader onComplete={() => {}} />
      ) : (
        <div className="card">
          <PersonPicker people={people} onSubmit={handleSubmit} loading={submitting} submitLabel={t('daily_submit', { date: selectedLabel })} costBadge={`${cost} ${t('credit_unit')}`} headerSlot={datePicker} userEmail={user?.email ?? ''} onPeopleChange={setPeople} />
          {error && <p role="alert" style={{ color:'var(--danger)', fontSize:14, lineHeight:1.6, marginTop:14, textAlign:'center' }}>{error}</p>}
        </div>
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
