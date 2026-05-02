'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import { apiPost } from '@/lib/api'
import { FULL_DECK, TarotCard, cardImageUrl, shuffleDeck } from '@/lib/tarotDeck'
import { parseResult } from '@/components/ReadingResult'
import BottomNav from '@/components/BottomNav'

const POSITIONS = [
  { label: 'You', desc: 'Your energy' },
  { label: 'Them', desc: 'Their energy' },
  { label: 'Connection', desc: 'The dynamic' },
  { label: 'Advice', desc: 'What to do' },
]
const DECK_DISPLAY = 78
const RELATIONSHIP_TYPES = [
  'Romantic Partner', 'Crush', 'Ex-Partner', 'Spouse', 'Friend',
  'Best Friend', 'Family Member', 'Colleague', 'Boss', 'Mentor', 'Rival', 'Stranger',
]

type Phase = 'question' | 'selecting' | 'revealing' | 'loading' | 'result'

function CardBack({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? { w: 56, h: 84, fs: 16 } : size === 'lg' ? { w: 80, h: 120, fs: 26 } : { w: 68, h: 102, fs: 20 }
  return (
    <div style={{
      width: dims.w, height: dims.h,
      background: 'linear-gradient(135deg, #16213E 0%, #0f1829 100%)',
      border: '1.5px solid rgba(201,168,76,0.6)', borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ color: 'rgba(201,168,76,0.7)', fontSize: dims.fs, userSelect: 'none' }}>✦</span>
    </div>
  )
}

function Section({ title, content, defaultOpen }: { title: string; content: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
      }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ color: 'var(--gold)', fontSize: 18, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{content}</p>
        </div>
      )}
    </div>
  )
}

export default function RelationshipPage() {
  const { user, credits, loading } = useAuth()
  const pricing = usePricing()
  const cost = pricing.tarot_relationship ?? 1

  const [phase, setPhase] = useState<Phase>('question')
  const [question, setQuestion] = useState('')
  const [relType, setRelType] = useState('Romantic Partner')
  const [deck, setDeck] = useState<TarotCard[]>([])
  const [exitIdxs, setExitIdxs] = useState<Set<number>>(new Set())
  const [slots, setSlots] = useState<(TarotCard | null)[]>([null, null, null, null])
  const [slotEntering, setSlotEntering] = useState<Set<number>>(new Set())
  const [flipped, setFlipped] = useState([false, false, false, false])
  const [gptText, setGptText] = useState<string | null>(null)
  const [gptCalled, setGptCalled] = useState(false)
  const [allFlipped, setAllFlipped] = useState(false)
  const [error, setError] = useState('')
  const [creditCharged, setCreditCharged] = useState(false)
  const [scenarioQ, setScenarioQ] = useState('')
  const [scenarioText, setScenarioText] = useState<string | null>(null)
  const [scenarioLoading, setScenarioLoading] = useState(false)
  const slotsRef = useRef(slots)
  slotsRef.current = slots

  useEffect(() => { setDeck(shuffleDeck(FULL_DECK).slice(0, DECK_DISPLAY)) }, [])

  useEffect(() => {
    if (!allFlipped) return
    if (gptText) setPhase('result')
    else setPhase('loading')
  }, [allFlipped, gptText])

  useEffect(() => {
    if (phase === 'loading' && gptText) setPhase('result')
  }, [gptText, phase])

  function handleSelectCard(deckIdx: number) {
    if (exitIdxs.has(deckIdx)) return
    const nextSlot = slots.findIndex(s => s === null)
    if (nextSlot === -1) return
    const card = deck[deckIdx]
    setExitIdxs(prev => new Set([...prev, deckIdx]))
    setTimeout(() => {
      setDeck(prev => prev.filter((_, i) => i !== deckIdx))
      setExitIdxs(prev => { const n = new Set(prev); n.delete(deckIdx); return n })
      setSlotEntering(prev => new Set([...prev, nextSlot]))
      setSlots(prev => { const n = [...prev]; n[nextSlot] = card; return n })
      setTimeout(() => {
        setSlotEntering(prev => { const n = new Set(prev); n.delete(nextSlot); return n })
        if (nextSlot === 3) setTimeout(() => setPhase('revealing'), 400)
      }, 400)
    }, 280)
  }

  async function callGPT(currentSlots: (TarotCard | null)[]) {
    if (gptCalled) return
    setGptCalled(true)
    try {
      const res = await apiPost<{ content_text: string }>('/tarot/relationship', {
        question: question.trim() || null,
        relationship_type: relType,
        cards: currentSlots.map(c => c?.name ?? ''),
      })
      if (user?.email && !creditCharged) {
        await apiPost('/use_pouch', { email: user.email, reading_type: 'tarot_relationship' })
        setCreditCharged(true)
      }
      setGptText(res.content_text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reading failed. Please try again.')
      setPhase('revealing')
    }
  }

  function handleFlip(idx: number) {
    if (flipped[idx]) return
    const newFlipped = [...flipped]
    newFlipped[idx] = true
    setFlipped(newFlipped)
    if (!gptCalled) callGPT(slotsRef.current)
    if (newFlipped.every(Boolean)) setTimeout(() => setAllFlipped(true), 700)
  }

  async function handleScenario() {
    if (!scenarioQ.trim()) return
    setScenarioLoading(true)
    try {
      const res = await apiPost<{ content_text: string }>('/tarot/scenario', {
        cards: slots.map(c => c?.name ?? ''),
        positions: POSITIONS.map(p => p.label),
        spread_type: 'relationship',
        original_question: question.trim() || null,
        scenario_question: scenarioQ.trim(),
      })
      setScenarioText(res.content_text)
    } catch { /* silent */ } finally { setScenarioLoading(false) }
  }

  const notEnough = credits !== null && credits < cost
  if (loading) return <LoadingSpinner />

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 96 }}>
      <header style={{
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/tarot" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>ASTROPILLAR</span>
        </Link>
        <Link href="/buy" style={{
          background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 20,
          padding: '6px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>{credits ?? '—'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Credits</span>
        </Link>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>Relationship Spread</h1>
            <span style={{ border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
              {cost} Credit{cost !== 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>You · Them · Connection · Advice — 4 cards</p>
        </div>

        {notEnough && phase === 'question' && (
          <div style={{ background: 'var(--card)', border: '1px solid #ef4444', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Not enough Credits</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              This reading costs {cost} Credit{cost !== 1 ? 's' : ''}. You have {credits}.
            </p>
            <Link href="/buy" className="btn-gold" style={{ fontSize: 14, padding: '12px 28px' }}>Get Credits</Link>
          </div>
        )}

        {/* PHASE: question */}
        {phase === 'question' && !notEnough && (
          <div className="card" style={{ padding: 24 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Who is this about?</p>

            {/* Relationship type */}
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Relationship type</p>
            <select
              value={relType}
              onChange={e => setRelType(e.target.value)}
              style={{
                width: '100%', background: '#0f1829', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14,
                outline: 'none', colorScheme: 'dark', marginBottom: 16,
                appearance: 'none', WebkitAppearance: 'none',
              }}
            >
              {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Your question <span style={{ color: 'rgba(255,255,255,0.3)' }}>(optional)</span></p>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Does my crush feel the same way?"
              rows={3}
              style={{
                width: '100%', background: '#0f1829', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14,
                resize: 'none', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box',
              }}
            />
            <button onClick={() => setPhase('selecting')} className="btn-gold" style={{ width: '100%', marginTop: 16, fontSize: 15, padding: '14px' }}>
              Shuffle the Deck →
            </button>
          </div>
        )}

        {/* PHASE: selecting */}
        {phase === 'selecting' && (
          <div>
            {/* Slots — 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {POSITIONS.map((pos, i) => {
                const card = slots[i]
                const entering = slotEntering.has(i)
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: '100%', maxWidth: 120, height: 100,
                      border: card ? '1.5px solid var(--gold)' : '1.5px dashed rgba(201,168,76,0.35)',
                      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: card ? 'transparent' : 'rgba(201,168,76,0.03)',
                      transition: 'all 0.3s', transform: entering ? 'translateY(8px)' : 'none', opacity: entering ? 0 : 1,
                    }}>
                      {card ? <CardBack size="md" /> : <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: 24 }}>✦</span>}
                    </div>
                    <p style={{ color: card ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{pos.label}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 10 }}>{pos.desc}</p>
                  </div>
                )
              })}
            </div>

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              {slots.filter(Boolean).length === 0 ? 'Tap any card to begin'
                : slots.filter(Boolean).length === 4 ? 'All cards chosen ✦'
                : `${slots.filter(Boolean).length} / 4 chosen`}
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>
              Full deck · 78 cards · Tap to select
            </p>
            <div style={{ maxHeight: 340, overflowY: 'auto', borderRadius: 10, padding: '2px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {deck.map((card, i) => (
                <button key={card.file} onClick={() => handleSelectCard(i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'transform 0.28s, opacity 0.28s',
                  transform: exitIdxs.has(i) ? 'scale(0.5) translateY(-16px)' : 'scale(1)',
                  opacity: exitIdxs.has(i) ? 0 : 1,
                  display: 'flex', justifyContent: 'center',
                }}>
                  <CardBack size="sm" />
                </button>
              ))}
            </div>
            </div>
          </div>
        )}

        {/* PHASE: revealing */}
        {phase === 'revealing' && (
          <div>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              {flipped.every(Boolean) ? 'All revealed — reading in progress...' : 'Tap each card to reveal'}
            </p>
            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{error}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {POSITIONS.map((pos, i) => {
                const card = slots[i]
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div onClick={() => handleFlip(i)} style={{ width: 80, height: 120, perspective: 800, cursor: flipped[i] ? 'default' : 'pointer' }}>
                      <div style={{
                        width: '100%', height: '100%', position: 'relative',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
                        transform: flipped[i] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}>
                        <div style={{
                          position: 'absolute', inset: 0, backfaceVisibility: 'hidden' as const,
                          background: 'linear-gradient(135deg,#16213E,#0f1829)',
                          border: '1.5px solid rgba(201,168,76,0.6)', borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ color: 'rgba(201,168,76,0.7)', fontSize: 28 }}>✦</span>
                        </div>
                        <div style={{
                          position: 'absolute', inset: 0, backfaceVisibility: 'hidden' as const,
                          transform: 'rotateY(180deg)', borderRadius: 8, overflow: 'hidden',
                          border: '1.5px solid var(--gold)',
                        }}>
                          {card && <img src={cardImageUrl(card.file)} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                        </div>
                      </div>
                    </div>
                    <p style={{ color: flipped[i] ? 'var(--gold)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{pos.label}</p>
                    {flipped[i] && card && <p style={{ color: '#fff', fontSize: 10 }}>{card.name}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {phase === 'loading' && <LoadingSpinner label="Reading your cards..." />}

        {phase === 'result' && gptText && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
              {slots.map((card, i) => card && (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <img src={cardImageUrl(card.file)} alt={card.name} style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--gold)' }} />
                  <p style={{ color: 'var(--gold)', fontSize: 9, fontWeight: 600 }}>{POSITIONS[i].label}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 8, textAlign: 'center', maxWidth: 64 }}>{card.name}</p>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: '0 20px', marginBottom: 20 }}>
              {parseResult(gptText).map((sec, i) => (
                <Section key={i} title={sec.title ?? `Section ${i + 1}`} content={sec.content} defaultOpen={i < 2} />
              ))}
            </div>

            {!scenarioText && (
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Go Deeper</p>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Tarot Scenario Reading</p>
                <textarea value={scenarioQ} onChange={e => setScenarioQ(e.target.value)}
                  placeholder="e.g. How can I get closer to them?" rows={2}
                  style={{ width: '100%', background: '#0f1829', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box', marginBottom: 12 }} />
                <button onClick={handleScenario} disabled={!scenarioQ.trim() || scenarioLoading} className="btn-gold"
                  style={{ width: '100%', fontSize: 14, padding: '12px', opacity: (!scenarioQ.trim() || scenarioLoading) ? 0.5 : 1 }}>
                  {scenarioLoading ? 'Reading...' : 'Get Scenario Reading →'}
                </button>
              </div>
            )}
            {scenarioText && (
              <div className="card" style={{ padding: '0 20px', marginBottom: 16 }}>
                <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', padding: '16px 0 8px' }}>Scenario Reading</p>
                {parseResult(scenarioText).map((sec, i) => (
                  <Section key={i} title={sec.title ?? `Section ${i + 1}`} content={sec.content} defaultOpen={i === 0} />
                ))}
              </div>
            )}
            <button onClick={() => {
              setPhase('question'); setQuestion(''); setDeck(shuffleDeck(FULL_DECK).slice(0, DECK_DISPLAY))
              setSlots([null, null, null, null]); setFlipped([false, false, false, false])
              setGptText(null); setGptCalled(false); setCreditCharged(false); setAllFlipped(false)
              setScenarioText(null); setScenarioQ('')
            }} style={{ width: '100%', background: 'none', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
              New Reading
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}

function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '2px solid rgba(201,168,76,0.2)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--gold)', fontSize: 14 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
