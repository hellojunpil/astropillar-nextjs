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
  { label: 'The Heart',        desc: 'Core of the situation' },
  { label: 'The Challenge',    desc: 'Obstacle / hidden dynamic' },
  { label: 'The Root',         desc: 'Foundation / how it began' },
  { label: 'Recent Past',      desc: 'What just passed' },
  { label: 'Goal / Crown',     desc: 'What you\'re reaching for' },
  { label: 'Near Future',      desc: 'What\'s coming next' },
  { label: 'Your Attitude',    desc: 'How you see yourself' },
  { label: 'Outside Forces',   desc: 'External influences' },
  { label: 'Hopes & Fears',    desc: 'What you want and dread' },
  { label: 'Outcome',          desc: 'Where this path leads' },
]
const DECK_DISPLAY = 20

type Phase = 'question' | 'selecting' | 'revealing' | 'loading' | 'result'

function CardBack({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const dims = size === 'xs' ? { w: 44, h: 66, fs: 14 } : size === 'md' ? { w: 68, h: 102, fs: 20 } : { w: 54, h: 81, fs: 16 }
  return (
    <div style={{
      width: dims.w, height: dims.h, flexShrink: 0,
      background: 'linear-gradient(135deg, #16213E 0%, #0f1829 100%)',
      border: '1.5px solid rgba(201,168,76,0.6)', borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
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

// Celtic Cross layout — classic grid positions
// Visual layout (0-indexed):
//          [4]
//   [3] [0] [5]    [6]
//      cross[1]    [7]
//          [2]     [8]
//                  [9]
function CrossLayout({ slots, flipped, onFlip }: {
  slots: (TarotCard | null)[]
  flipped: boolean[]
  onFlip: (i: number) => void
}) {
  const cardW = 54, cardH = 81

  function FlipCard({ idx }: { idx: number }) {
    const card = slots[idx]
    return (
      <div onClick={() => onFlip(idx)} style={{ width: cardW, height: cardH, perspective: 600, cursor: flipped[idx] ? 'default' : 'pointer', flexShrink: 0 }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
          transform: flipped[idx] ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden' as const,
            background: 'linear-gradient(135deg,#16213E,#0f1829)',
            border: '1.5px solid rgba(201,168,76,0.6)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'rgba(201,168,76,0.7)', fontSize: 16 }}>✦</span>
          </div>
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden' as const,
            transform: 'rotateY(180deg)', borderRadius: 6, overflow: 'hidden',
            border: '1.5px solid var(--gold)',
          }}>
            {card && <img src={cardImageUrl(card.file)} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          </div>
        </div>
      </div>
    )
  }

  function Label({ idx }: { idx: number }) {
    return (
      <p style={{ color: flipped[idx] ? 'var(--gold)' : 'var(--text-muted)', fontSize: 9, textAlign: 'center', width: cardW, marginTop: 3 }}>
        {POSITIONS[idx].label}
      </p>
    )
  }

  const gap = 8
  const col = cardW + gap

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ position: 'relative', width: col * 4 + cardW, height: cardH * 4 + gap * 3, minWidth: 280, margin: '0 auto' }}>

        {/* Cross section */}
        {/* Card 4 (top) — col 1, row 0 */}
        <div style={{ position: 'absolute', left: col, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FlipCard idx={4} /><Label idx={4} />
        </div>
        {/* Card 3 (left) — col 0, row 1 */}
        <div style={{ position: 'absolute', left: 0, top: cardH + gap, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FlipCard idx={3} /><Label idx={3} />
        </div>
        {/* Card 0 (center) — col 1, row 1 */}
        <div style={{ position: 'absolute', left: col, top: cardH + gap, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FlipCard idx={0} /><Label idx={0} />
        </div>
        {/* Card 1 (crossing — rotated 90°) — col 1, row 1 overlay */}
        <div style={{ position: 'absolute', left: col + (cardW - cardH) / 2, top: cardH + gap + (cardH - cardW) / 2, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.85 }}>
          <div style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
            <FlipCard idx={1} />
          </div>
        </div>
        {/* Card 5 (right) — col 2, row 1 */}
        <div style={{ position: 'absolute', left: col * 2, top: cardH + gap, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FlipCard idx={5} /><Label idx={5} />
        </div>
        {/* Card 2 (bottom) — col 1, row 2 */}
        <div style={{ position: 'absolute', left: col, top: (cardH + gap) * 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FlipCard idx={2} /><Label idx={2} />
        </div>

        {/* Staff section — col 3, rows 0-3 */}
        {[6, 7, 8, 9].map((posIdx, rowIdx) => (
          <div key={posIdx} style={{ position: 'absolute', left: col * 3, top: (cardH + gap) * rowIdx, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FlipCard idx={posIdx} /><Label idx={posIdx} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CelticCrossPage() {
  const { user, credits, loading } = useAuth()
  const pricing = usePricing()
  const cost = pricing.tarot_celtic_cross ?? 2

  const [phase, setPhase] = useState<Phase>('question')
  const [question, setQuestion] = useState('')
  const [deck, setDeck] = useState<TarotCard[]>([])
  const [exitIdxs, setExitIdxs] = useState<Set<number>>(new Set())
  const [slots, setSlots] = useState<(TarotCard | null)[]>(Array(10).fill(null))
  const [slotEntering, setSlotEntering] = useState<Set<number>>(new Set())
  const [flipped, setFlipped] = useState(Array(10).fill(false))
  const [gptText, setGptText] = useState<string | null>(null)
  const [gptCalled, setGptCalled] = useState(false)
  const [allFlipped, setAllFlipped] = useState(false)
  const [error, setError] = useState('')
  const [creditCharged, setCreditCharged] = useState(false)
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

  const filledCount = slots.filter(Boolean).length

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
        if (nextSlot === 9) setTimeout(() => setPhase('revealing'), 400)
      }, 350)
    }, 280)
  }

  async function callGPT(currentSlots: (TarotCard | null)[]) {
    if (gptCalled) return
    setGptCalled(true)
    try {
      const res = await apiPost<{ content_text: string }>('/tarot/celtic_cross', {
        question: question.trim(),
        cards: currentSlots.map(c => c?.name ?? ''),
      })
      if (user?.email && !creditCharged) {
        await apiPost('/use_pouch', { email: user.email, reading_type: 'tarot_celtic_cross' })
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

  const notEnough = credits !== null && credits < cost
  if (loading) return <Spinner />

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
            <h1 className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>Celtic Cross</h1>
            <span style={{ border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
              {cost} Credits
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>10-card deep dive — the most comprehensive reading</p>
        </div>

        {notEnough && phase === 'question' && (
          <div style={{ background: 'var(--card)', border: '1px solid #ef4444', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Not enough Credits</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              This reading costs {cost} Credits. You have {credits}.
            </p>
            <Link href="/buy" className="btn-gold" style={{ fontSize: 14, padding: '12px 28px' }}>Get Credits</Link>
          </div>
        )}

        {/* PHASE: question */}
        {phase === 'question' && !notEnough && (
          <div className="card" style={{ padding: 24 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>What do you need to understand?</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>
              Celtic Cross works best with a specific, meaningful question.
            </p>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Should I leave my current job and start my own business?"
              rows={3}
              style={{
                width: '100%', background: '#0f1829', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14,
                resize: 'none', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => setPhase('selecting')}
              disabled={!question.trim()}
              className="btn-gold"
              style={{ width: '100%', marginTop: 16, fontSize: 15, padding: '14px', opacity: !question.trim() ? 0.5 : 1 }}
            >
              Shuffle the Deck →
            </button>
          </div>
        )}

        {/* PHASE: selecting */}
        {phase === 'selecting' && (
          <div>
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Your question:</p>
              <p style={{ color: '#fff', fontSize: 14 }}>{question}</p>
            </div>

            {/* Next slot indicator */}
            <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(201,168,76,0.06)', borderRadius: 10, border: '1px solid rgba(201,168,76,0.2)' }}>
              <p style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>
                {filledCount < 10
                  ? `Selecting card ${filledCount + 1} / 10 — ${POSITIONS[filledCount].label}`
                  : 'All 10 cards chosen ✦'}
              </p>
              {filledCount < 10 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{POSITIONS[filledCount].desc}</p>
              )}
            </div>

            {/* Mini slots preview */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
              {POSITIONS.map((pos, i) => (
                <div key={i} style={{
                  width: 36, height: 54, borderRadius: 4,
                  border: slots[i] ? '1px solid var(--gold)' : '1px dashed rgba(201,168,76,0.3)',
                  background: slots[i] ? 'rgba(201,168,76,0.1)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                  transform: slotEntering.has(i) ? 'scale(1.15)' : 'scale(1)',
                }}>
                  {slots[i]
                    ? <span style={{ color: 'var(--gold)', fontSize: 10 }}>✦</span>
                    : <span style={{ color: 'rgba(201,168,76,0.2)', fontSize: 9 }}>{i + 1}</span>}
                </div>
              ))}
            </div>

            {/* Deck grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {deck.map((card, i) => (
                <button key={card.file} onClick={() => handleSelectCard(i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'transform 0.28s, opacity 0.28s',
                  transform: exitIdxs.has(i) ? 'scale(0.5) translateY(-16px)' : 'scale(1)',
                  opacity: exitIdxs.has(i) ? 0 : 1,
                }}>
                  <CardBack size="sm" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: revealing */}
        {phase === 'revealing' && (
          <div>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              {flipped.every(Boolean) ? 'All revealed — reading in progress...' : `Tap each card to reveal (${flipped.filter(Boolean).length} / 10)`}
            </p>
            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{error}</p>}
            <CrossLayout slots={slots} flipped={flipped} onFlip={handleFlip} />
          </div>
        )}

        {phase === 'loading' && <Spinner label="Reading your cards..." />}

        {/* PHASE: result */}
        {phase === 'result' && gptText && (
          <div>
            {/* Cards row (small) */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
              {slots.map((card, i) => card && (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <img src={cardImageUrl(card.file)} alt={card.name} style={{ width: 44, height: 66, objectFit: 'cover', borderRadius: 5, border: '1px solid var(--gold)' }} />
                  <p style={{ color: 'var(--gold)', fontSize: 8, fontWeight: 600, textAlign: 'center', width: 44 }}>{POSITIONS[i].label}</p>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: '0 20px', marginBottom: 20 }}>
              {parseResult(gptText).map((sec, i) => (
                <Section key={i} title={sec.title ?? `Section ${i + 1}`} content={sec.content} defaultOpen={i < 2} />
              ))}
            </div>

            <button onClick={() => {
              setPhase('question'); setQuestion(''); setDeck(shuffleDeck(FULL_DECK).slice(0, DECK_DISPLAY))
              setSlots(Array(10).fill(null)); setFlipped(Array(10).fill(false))
              setGptText(null); setGptCalled(false); setCreditCharged(false); setAllFlipped(false)
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

function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '2px solid rgba(201,168,76,0.2)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--gold)', fontSize: 14 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
