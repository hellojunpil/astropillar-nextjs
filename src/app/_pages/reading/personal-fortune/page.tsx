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

export default function PersonalFortunePage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const locale = useLocale()
  const t = useTranslations('reading')
  const pricing = usePricing()
  const cost = pricing.personal_fortune
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [fromCache, setFromCache] = useState(false)
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [error, setError] = useState('')
  const [people, setPeople] = useState<SavedPerson[]>([])
  const [shareId, setShareId] = useState<string | null>(null)

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
      const cached = await getCachedReading(user.email, 'personal_fortune', data.name, birth_date, data.city, undefined, locale)
      if (cached) { const sid = await createShare({ reading_type: 'personal_fortune', name: data.name, birth_date, birth_city: data.city, result: cached.result, birth_data: data }); setShareId(sid); setResult(cached.result); setFromCache(true); return }
      const birthtime = data.hour !== null
        ? `${String(data.hour).padStart(2,'0')}:${String(data.minute ?? 0).padStart(2,'0')}`
        : '12:00'
      const raw = await apiPost('/personal_fortune', {
        year: data.year, month: data.month, day: data.day,
        birthtime, sex: data.sex, city: data.city,
        user_name: data.name, birth_year: data.year,
        reading_type: 'personal_fortune',
        language: locale,
      })
      await apiPost('/use_pouch', { email: user.email, reading_type: 'personal_fortune' })
      await saveReading(user.email, { reading_type: 'personal_fortune', name: data.name, birth_date, birth_city: data.city, locale, result: raw })
      const sid = await createShare({ reading_type: 'personal_fortune', name: data.name, birth_date, birth_city: data.city, result: raw, birth_data: data })
      setShareId(sid)
      setResult(raw); setFromCache(false); refreshCredits(cost)
      gtagEvent('reading_personal_fortune')
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
    <ReadingPageShell title={t('personal_fortune_title')} subtitle={t('personal_fortune_sub')} emoji="✨" badge={`${cost} ${t('credit_unit')}`} credits={credits} requiredCredits={cost} inProgress={submitting || !!result}>
      {result ? (
        <ReadingResult raw={result} onReset={() => { setResult(null); setFromCache(false); setBirthData(null); setShareId(null) }} userEmail={user?.email ?? undefined} fromCache={fromCache} birthData={birthData ?? undefined} shareId={shareId ?? undefined} />
      ) : submitting ? (
        <ReadingLoader onComplete={() => {}} />
      ) : (
        <div className="card">
          <PersonPicker people={people} onSubmit={handleSubmit} loading={submitting} submitLabel={t('personal_fortune_submit')} costBadge={`${cost} ${t('credit_unit')}`} userEmail={user?.email ?? ''} onPeopleChange={setPeople} />
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
