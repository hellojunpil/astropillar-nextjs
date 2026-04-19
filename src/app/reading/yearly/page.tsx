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
import ReadingLoader from '@/components/ReadingLoader'

const currentYear = new Date().getFullYear()

export default function YearlyFortunePage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [fromCache, setFromCache] = useState(false)
  const [birthData, setBirthData] = useState<BirthData | null>(null)
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
      const cached = await getCachedReading(user.email, 'yearly', data.name, birth_date, data.city)
      if (cached) { setResult(cached.result); setFromCache(true); return }
      const birthtime = data.hour !== null
        ? `${String(data.hour).padStart(2,'0')}:${String(data.minute ?? 0).padStart(2,'0')}`
        : '12:00'
      const raw = await apiPost('/full_reading', {
        year: data.year, month: data.month, day: data.day,
        birthtime, sex: data.sex, city: data.city,
        reading_type: 'yearly', user_name: data.name, birth_year: data.year,
      })
      await apiPost('/use_pouch', { email: user.email, reading_type: 'yearly' })
      await saveReading(user.email, { reading_type: 'yearly', name: data.name, birth_date, birth_city: data.city, result: raw })
      setResult(raw); setFromCache(false); refreshCredits()
      gtagEvent('reading_completed', { reading_type: 'yearly' })
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

  return (
    <ReadingPageShell title="Yearly Fortune" subtitle={`Month-by-month guidance for ${currentYear} based on your chart`} emoji="📅" badge="1 Credit" credits={credits} requiredCredits={1}>
      {result ? (
        <ReadingResult raw={result} onReset={() => { setResult(null); setFromCache(false); setBirthData(null) }} userEmail={user?.email ?? undefined} fromCache={fromCache} birthData={birthData ?? undefined} />
      ) : submitting ? (
        <ReadingLoader onComplete={() => {}} />
      ) : (
        <div className="card">
          <PersonPicker people={people} onSubmit={handleSubmit} loading={submitting} submitLabel={`Reveal My ${currentYear}`} costBadge="1 Credit" userEmail={user?.email ?? ''} onPeopleChange={setPeople} />
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
