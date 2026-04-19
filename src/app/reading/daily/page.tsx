'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BirthData } from '@/components/BirthForm'
import PersonPicker from '@/components/PersonPicker'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading, getCachedReading, savePerson, getPeople, birthDateStr, SavedPerson } from '@/lib/firestore'

function getDateOptions() {
  const today = new Date()
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return { value: `${y}-${m}-${day}`, label }
  })
}

const DATE_OPTIONS = getDateOptions()

export default function DailyFortunePage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [fromCache, setFromCache] = useState(false)
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [targetDate, setTargetDate] = useState(DATE_OPTIONS[0].value)
  const [error, setError] = useState('')
  const [people, setPeople] = useState<SavedPerson[]>([])

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
      const cached = await getCachedReading(user.email, 'daily', data.name, birth_date, data.city, targetDate)
      if (cached) { setResult(cached.result); setFromCache(true); return }
      const birthtime = data.hour !== null
        ? `${String(data.hour).padStart(2,'0')}:${String(data.minute ?? 0).padStart(2,'0')}`
        : '12:00'
      const raw = await apiPost('/personal_daily_fortune', {
        year: data.year, month: data.month, day: data.day,
        birthtime, sex: data.sex, city: data.city,
        user_name: data.name, birth_year: data.year,
        target_date: targetDate,
      })
      await apiPost('/use_pouch', { email: user.email, amount: 1 })
      await saveReading(user.email, { reading_type: 'daily', name: data.name, birth_date, birth_city: data.city, target_date: targetDate, result: raw })
      setResult(raw); setFromCache(false); refreshCredits()
      gtagEvent('reading_completed', { reading_type: 'daily' })
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

  const selectedLabel = DATE_OPTIONS.find(d => d.value === targetDate)?.label ?? targetDate

  const datePicker = (
    <div style={{ marginBottom: 4 }}>
      <label style={{ color:'var(--text-muted)', fontSize:11, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8, display:'block' }}>
        Read fortune for
      </label>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {DATE_OPTIONS.map(opt => (
          <button key={opt.value} type="button" onClick={() => setTargetDate(opt.value)} style={{
            padding:'6px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
            border:`1px solid ${targetDate === opt.value ? 'var(--gold)' : 'var(--border)'}`,
            background: targetDate === opt.value ? 'rgba(201,168,76,0.12)' : '#0f1829',
            color: targetDate === opt.value ? 'var(--gold)' : 'var(--text-muted)',
            fontWeight: targetDate === opt.value ? 700 : 400,
          }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <ReadingPageShell title="Personal Daily Fortune" subtitle={`Your energy for ${selectedLabel}`} emoji="☀️" badge="1 Credit" credits={credits} requiredCredits={1}>
      {result ? (
        <ReadingResult raw={result} onReset={() => { setResult(null); setFromCache(false); setBirthData(null) }} userEmail={user?.email ?? undefined} fromCache={fromCache} birthData={birthData ?? undefined} />
      ) : (
        <div className="card">
          <PersonPicker people={people} onSubmit={handleSubmit} loading={submitting} submitLabel={`Read ${selectedLabel}'s Stars`} costBadge="1 Credit" headerSlot={datePicker} />
          {error && <p style={{ color:'#ef4444', fontSize:13, marginTop:14, textAlign:'center' }}>{error}</p>}
        </div>
      )}
    </ReadingPageShell>
  )
}

function LoadingScreen() {
  return (
    <main style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--gold)', fontFamily:"'Cormorant Garamond', serif", fontSize:18 }}>Loading...</p>
    </main>
  )
}
