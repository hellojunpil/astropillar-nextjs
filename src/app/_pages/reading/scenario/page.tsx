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
import { saveReading, createShare, birthDateStr, getPeople, SavedPerson } from '@/lib/firestore'
import ReadingLoader from '@/components/ReadingLoader'
import { FORM_CSS } from '@/components/BirthForm'

export default function ScenarioPage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const locale = useLocale()
  const t = useTranslations('reading')
  const pricing = usePricing()
  const cost = pricing.scenario
  const exampleQuestions = t.raw('scenario_questions') as string[]
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'question'>('form')
  const [people, setPeople] = useState<SavedPerson[]>([])
  const [shareId, setShareId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.email) getPeople(user.email).then(setPeople)
  }, [user?.email])

  // Pre-fill from sessionStorage (coming from ReadingResult)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const bd = sessionStorage.getItem('scenario_birth')
    const q = sessionStorage.getItem('scenario_question')
    if (bd) {
      try { setBirthData(JSON.parse(bd)); setStep('question'); sessionStorage.removeItem('scenario_birth') } catch { /* ignore */ }
    }
    if (q) { setQuestion(q); sessionStorage.removeItem('scenario_question') }
  }, [])

  function handlePersonSelect(data: BirthData) {
    setBirthData(data)
    setStep('question')
  }

  async function handleQuestionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.email || !birthData || !question.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const birthtime = birthData.hour !== null
        ? `${String(birthData.hour).padStart(2,'0')}:${String(birthData.minute ?? 0).padStart(2,'0')}`
        : '12:00'
      const raw = await apiPost('/full_reading', {
        year: birthData.year, month: birthData.month, day: birthData.day,
        birthtime, sex: birthData.sex, city: birthData.city,
        reading_type: 'situation', custom_situation: question.trim(),
        user_name: birthData.name, birth_year: birthData.year,
        language: locale,
      })
      await apiPost('/use_pouch', { email: user.email, reading_type: 'scenario' })
      const birth_date = birthDateStr(birthData.year, birthData.month, birthData.day)
      await saveReading(user.email, { reading_type: 'scenario', name: birthData.name, birth_date, birth_city: birthData.city, result: raw })
      const sid = await createShare({ reading_type: 'scenario', name: birthData.name, birth_date, birth_city: birthData.city, result: raw, birth_data: birthData })
      setShareId(sid)
      setResult(raw); refreshCredits(cost)
      gtagEvent('reading_scenario')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <ReadingPageShell title={t('scenario_title')} subtitle={t('scenario_sub')} emoji="🔮" badge={`${cost} ${t('credit_unit')}`} badgeColor="#a78bfa" credits={credits} requiredCredits={cost} inProgress={submitting || !!result}>
      {result ? (
        <ReadingResult raw={result} onReset={() => { setResult(null); setStep('form'); setBirthData(null); setQuestion(''); setShareId(null) }} userEmail={user?.email ?? undefined} shareId={shareId ?? undefined} />
      ) : submitting ? (
        <ReadingLoader onComplete={() => {}} />
      ) : step === 'form' ? (
        <div className="card">
          <p style={{ color:'var(--ink-2)', fontSize:14.5, lineHeight:1.7, marginBottom:20 }}>
            {t('scenario_first_step')}
          </p>
          <PersonPicker people={people} onSubmit={handlePersonSelect} loading={false} submitLabel={t('scenario_next_btn')} userEmail={user?.email ?? ''} onPeopleChange={setPeople} />
        </div>
      ) : (
        <form onSubmit={handleQuestionSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <style>{FORM_CSS + SCENARIO_CSS}</style>
          <div className="card">
            {birthData && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, padding:'12px 14px', background:'var(--gold-soft)', border:'1px solid var(--gold-line)', borderRadius:12 }}>
                <div>
                  <p style={{ color:'var(--gold-light)', fontSize:15, fontWeight:700 }}>{birthData.name}</p>
                  <p style={{ color:'var(--ink-2)', fontSize:13, marginTop:2 }}>{birthData.city}</p>
                </div>
                <button type="button" onClick={() => setStep('form')} className="ap-btn-ghost ap-btn-sm">{t('change')}</button>
              </div>
            )}
            <p style={{ color:'var(--gold-light)', fontFamily:"'Noto Serif KR','Noto Serif JP','Cormorant Garamond',serif", fontSize:19, fontWeight:700, marginBottom:12 }}>{t('your_question_label')}</p>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={t('question_placeholder')}
              rows={4}
              className="sc-textarea"
            />
            <div style={{ marginTop:14 }}>
              <p style={{ color:'var(--ink-2)', fontSize:13.5, fontWeight:600, marginBottom:10 }}>{t('try_these')}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {exampleQuestions.map((q, i) => (
                  <button key={i} type="button" onClick={() => setQuestion(q)} className="sc-chip">{q}</button>
                ))}
              </div>
            </div>
          </div>

          {error && <p role="alert" style={{ color:'var(--danger)', fontSize:14, lineHeight:1.6, textAlign:'center' }}>{error}</p>}

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={() => setStep('form')} className="ap-btn-ghost" style={{ flex:'0 0 auto', minHeight:54 }}>
              {t('back')}
            </button>
            <button type="submit" disabled={!question.trim() || submitting} className="btn-gold ap-submit" style={{ flex:1, marginTop:0 }}>
              {submitting ? t('consulting_stars') : (
                <>{t('reveal_answer')} <span className="ap-submit-cost">{cost} {t('credit_unit')}</span></>
              )}
            </button>
          </div>
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

const SCENARIO_CSS = `
  .sc-textarea { display: block; width: 100%; min-height: 120px; padding: 14px 16px; resize: vertical;
    font: inherit; font-size: 16px; line-height: 1.7; color: var(--ink); background: rgba(9,12,26,.72);
    border: 1px solid var(--line-strong); border-radius: var(--r-sm); outline: none; transition: border-color var(--t-fast), box-shadow var(--t-fast); }
  .sc-textarea::placeholder { color: var(--ink-3); }
  .sc-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,.22); }
  .sc-chip { text-align: left; min-height: 44px; padding: 10px 14px; border-radius: 12px; cursor: pointer; font: inherit; font-size: 14px; line-height: 1.5;
    color: var(--ink-2); background: rgba(9,12,26,.5); border: 1px solid var(--line); transition: all var(--t-fast); }
  .sc-chip:hover { color: var(--ink); border-color: var(--gold-line); background: var(--gold-soft); }
`
