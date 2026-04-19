'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BirthData } from '@/components/BirthForm'
import PersonPicker from '@/components/PersonPicker'
import ReadingResult from '@/components/ReadingResult'
import ReadingPageShell from '@/components/ReadingPageShell'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading, birthDateStr, getPeople, SavedPerson } from '@/lib/firestore'
import ReadingLoader from '@/components/ReadingLoader'

const EXAMPLE_QUESTIONS = [
  "Should I quit my job and start my own business?",
  "Will I find love this year?",
  "Is this person the right one for me?",
  "Should I move to a new city?",
  "When will my financial situation improve?",
]

export default function ScenarioPage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'question'>('form')
  const [people, setPeople] = useState<SavedPerson[]>([])

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
        reading_type: 'situation', situation: question.trim(),
        user_name: birthData.name, birth_year: birthData.year,
      })
      await apiPost('/use_pouch', { email: user.email, reading_type: 'scenario' })
      const birth_date = birthDateStr(birthData.year, birthData.month, birthData.day)
      await saveReading(user.email, { reading_type: 'scenario', name: birthData.name, birth_date, birth_city: birthData.city, result: raw })
      setResult(raw); refreshCredits()
      gtagEvent('reading_completed', { reading_type: 'scenario' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <ReadingPageShell title="Scenario Reading" subtitle="Get cosmic guidance on a specific situation — ask anything" emoji="🔮" badge="2 Credits" badgeColor="#a78bfa" credits={credits} requiredCredits={2}>
      {result ? (
        <ReadingResult raw={result} onReset={() => { setResult(null); setStep('form'); setBirthData(null); setQuestion('') }} userEmail={user?.email ?? undefined} />
      ) : submitting ? (
        <ReadingLoader onComplete={() => {}} />
      ) : step === 'form' ? (
        <div className="card">
          <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20 }}>
            First, select whose chart to read for your question.
          </p>
          <PersonPicker people={people} onSubmit={handlePersonSelect} loading={false} submitLabel="Next → Ask Your Question" userEmail={user?.email ?? ''} onPeopleChange={setPeople} />
        </div>
      ) : (
        <form onSubmit={handleQuestionSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            {birthData && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, padding:'10px 12px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:10 }}>
                <div>
                  <p style={{ color:'var(--gold)', fontSize:13, fontWeight:600 }}>{birthData.name}</p>
                  <p style={{ color:'var(--text-muted)', fontSize:11, marginTop:2 }}>{birthData.city}</p>
                </div>
                <button type="button" onClick={() => setStep('form')} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer' }}>Change</button>
              </div>
            )}
            <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Your Question</p>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="What do you want the stars to reveal?"
              rows={4}
              style={{ background:'#0f1829', border:'1px solid var(--border)', borderRadius:10, color:'#fff', padding:'12px 14px', fontSize:14, width:'100%', outline:'none', resize:'vertical', fontFamily:"'Noto Sans', sans-serif", lineHeight:1.6 }}
            />
            <div style={{ marginTop:14 }}>
              <p style={{ color:'var(--text-muted)', fontSize:11, marginBottom:8 }}>Or try one of these:</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {EXAMPLE_QUESTIONS.map((q, i) => (
                  <button key={i} type="button" onClick={() => setQuestion(q)} style={{ textAlign:'left', background:'none', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text-muted)', fontSize:12, cursor:'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >{q}</button>
                ))}
              </div>
            </div>
          </div>

          {error && <p style={{ color:'#ef4444', fontSize:13, textAlign:'center' }}>{error}</p>}

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={() => setStep('form')} style={{ flex:'0 0 auto', background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:50, padding:'13px 20px', fontSize:13, cursor:'pointer' }}>
              ← Back
            </button>
            <button type="submit" disabled={!question.trim() || submitting} className="btn-gold" style={{ flex:1, opacity:(!question.trim() || submitting) ? 0.5 : 1, cursor:(!question.trim() || submitting) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {submitting ? '✦ Consulting the stars...' : (
                <>Reveal the Answer <span style={{ background:'rgba(22,33,62,0.6)', borderRadius:20, padding:'2px 10px', fontSize:12 }}>2 Credits</span></>
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
    <main style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--gold)', fontFamily:"'Cormorant Garamond', serif", fontSize:18 }}>Loading...</p>
    </main>
  )
}
