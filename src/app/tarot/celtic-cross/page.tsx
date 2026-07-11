'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading } from '@/lib/firestore'
import { FULL_DECK, TarotCard, cardImageUrl, shuffleDeck } from '@/lib/tarotDeck'
import { parseResult } from '@/components/ReadingResult'
import { localizeTarotTitle } from '@/lib/tarotTitles'
import TarotShareButton from '@/components/TarotShareButton'
import BottomNav from '@/components/BottomNav'

const POSITIONS_MAP = {
  en: [
    { label: 'The Heart',                desc: 'Core of the situation' },
    { label: 'The Challenge',            desc: 'Obstacle & hidden dynamic' },
    { label: 'The Root',                 desc: 'Foundation / how it began' },
    { label: 'Recent Past',              desc: 'What just passed' },
    { label: "What You're Reaching For", desc: 'Your conscious goal' },
    { label: 'Beneath the Surface',      desc: 'The unconscious driver' },
    { label: 'How You See Yourself',     desc: 'Your self-perception' },
    { label: 'Outside Forces',           desc: 'External influences' },
    { label: 'Hopes & Fears',            desc: 'What you want & dread' },
    { label: 'Where This Is Heading',    desc: 'The outcome of this path' },
  ],
  ko: [
    { label: '현재 상황',     desc: '상황의 핵심' },
    { label: '십자 (장애물)', desc: '숨겨진 역학' },
    { label: '뿌리 (기초)',   desc: '어떻게 시작됐는가' },
    { label: '최근 과거',     desc: '방금 지나간 것' },
    { label: '목표',          desc: '의식적 목표' },
    { label: '내면',          desc: '무의식의 동력' },
    { label: '나의 시각',     desc: '자기 인식' },
    { label: '외부 영향',     desc: '외부의 영향들' },
    { label: '희망과 두려움', desc: '원하는 것과 두려운 것' },
    { label: '결과',          desc: '이 길의 결말' },
  ],
  ja: [
    { label: '現在の状況',     desc: '状況の核心' },
    { label: '十字（障害）',   desc: '隠れた力学' },
    { label: '根（基盤）',     desc: 'どのように始まったか' },
    { label: '直近の過去',     desc: '通り過ぎたもの' },
    { label: '目標',           desc: '意識的な目標' },
    { label: '内面',           desc: '無意識の動力' },
    { label: '自己認識',       desc: '自分の見方' },
    { label: '外部の影響',     desc: '外部の影響' },
    { label: '希望と恐れ',     desc: '望むことと恐れること' },
    { label: '結果',           desc: 'この道の行方' },
  ],
}

const UI_TEXT_MAP = {
  en: {
    title: 'Celtic Cross',
    subtitle: '10-card deep dive — the most comprehensive reading',
    credits: 'Credits',
    creditBadge: (n: number) => `${n} Credit${n !== 1 ? 's' : ''}`,
    notEnoughTitle: 'Not enough Credits',
    notEnoughBody: (cost: number, bal: number) => `This reading costs ${cost} Credits. You have ${bal}.`,
    getCredits: 'Get Credits',
    questionLabel: 'What do you need to understand?',
    questionSub: 'Celtic Cross works best with a specific, meaningful question.',
    questionPlaceholder: 'e.g. Should I leave my current job and start my own business?',
    shuffleBtn: 'Shuffle the Deck →',
    allChosen: 'All 10 cards chosen ✦',
    viewBtn: 'View My Reading →',
    selectingCard: (n: number, label: string) => `Selecting card ${n} / 10 — ${label}`,
    deckLabel: 'Full deck · 78 cards · Tap to select',
    yourQuestion: 'Your question:',
    loadingTitle: 'Reading your spread…',
    loadingSub: 'This takes 1–2 minutes.',
    loadingWarn: "Please don't close or leave this page.",
    goDeeper: 'Go Deeper',
    scenarioTitle: 'Tarot Scenario Reading',
    scenarioDesc: 'Ask a specific question — get a deeper reading based on all 10 cards.',
    scenarioPlaceholder: 'e.g. What should I do about this situation?',
    scenarioLoading: 'Reading...',
    scenarioBtn: (n: number) => `Get Scenario Reading — ${n} Credit${n !== 1 ? 's' : ''}`,
    scenarioLabel: 'Scenario Reading',
    newReading: 'New Reading',
  },
  ko: {
    title: '심층 분석 타로',
    subtitle: '10장 종합 배열 — 가장 심층적인 리딩',
    credits: '크레딧',
    creditBadge: (n: number) => `${n} 크레딧`,
    notEnoughTitle: '크레딧이 부족해요',
    notEnoughBody: (cost: number, bal: number) => `이 리딩에는 ${cost} 크레딧이 필요해요. 현재 ${bal} 크레딧을 보유하고 있어요.`,
    getCredits: '크레딧 구매하기',
    questionLabel: '무엇을 이해해야 하나요?',
    questionSub: '켈틱 크로스는 구체적이고 의미 있는 질문에 가장 잘 맞아요.',
    questionPlaceholder: '예) 현재 직장을 그만두고 사업을 시작해야 할까요?',
    shuffleBtn: '카드 섞기 →',
    allChosen: '10장 모두 선택됨 ✦',
    viewBtn: '내 리딩 보기 →',
    selectingCard: (n: number, label: string) => `카드 ${n} / 10 선택 중 — ${label}`,
    deckLabel: '전체 덱 · 78장 · 탭해서 선택하세요',
    yourQuestion: '질문:',
    loadingTitle: '배열을 읽는 중…',
    loadingSub: '보통 1~2분 정도 걸립니다.',
    loadingWarn: '이 페이지를 닫거나 이동하지 마세요.',
    goDeeper: '더 깊이 보기',
    scenarioTitle: '타로 시나리오 리딩',
    scenarioDesc: '구체적인 질문을 하면 10장 카드를 모두 바탕으로 더 깊은 리딩을 해드려요.',
    scenarioPlaceholder: '예) 이 상황에서 어떻게 해야 할까요?',
    scenarioLoading: '리딩 중...',
    scenarioBtn: (n: number) => `시나리오 리딩 받기 — ${n} 크레딧`,
    scenarioLabel: '시나리오 리딩',
    newReading: '새로운 리딩',
  },
  ja: {
    title: '深掘りタロット',
    subtitle: '10枚の総合スプレッド — 最も包括的なリーディング',
    credits: 'クレジット',
    creditBadge: (n: number) => `${n}クレジット`,
    notEnoughTitle: 'クレジットが不足しています',
    notEnoughBody: (cost: number, bal: number) => `このリーディングには${cost}クレジットが必要です。現在${bal}クレジットをお持ちです。`,
    getCredits: 'クレジットを購入',
    questionLabel: '何を理解したいですか？',
    questionSub: 'ケルティッククロスは、具体的で意味のある質問に最も適しています。',
    questionPlaceholder: '例）今の仕事を辞めて、自分のビジネスを始めるべきですか？',
    shuffleBtn: 'カードをシャッフル →',
    allChosen: '10枚すべて選択済み ✦',
    viewBtn: 'リーディングを見る →',
    selectingCard: (n: number, label: string) => `カード${n} / 10 を選択中 — ${label}`,
    deckLabel: 'フルデッキ · 78枚 · タップして選択',
    yourQuestion: '質問：',
    loadingTitle: 'スプレッドを読んでいます…',
    loadingSub: '通常1〜2分かかります。',
    loadingWarn: 'このページを閉じたり移動しないでください。',
    goDeeper: 'さらに深く',
    scenarioTitle: 'タロットシナリオリーディング',
    scenarioDesc: '具体的な質問をすると、10枚のカードすべてをもとに深いリーディングを行います。',
    scenarioPlaceholder: '例）この状況でどうすればよいですか？',
    scenarioLoading: 'リーディング中...',
    scenarioBtn: (n: number) => `シナリオリーディングを取得 — ${n}クレジット`,
    scenarioLabel: 'シナリオリーディング',
    newReading: '新しいリーディング',
  },
}

type Phase = 'question' | 'selecting' | 'loading' | 'result'

function CardBack({ size = 'sm' }: { size?: 'xs' | 'sm' }) {
  const dims = size === 'xs' ? { w: 36, h: 54, fs: 12 } : { w: 44, h: 66, fs: 14 }
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
      {open && <div style={{ paddingBottom: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{content}</p>
      </div>}
    </div>
  )
}

function CardSection({ card, positionLabel, positionDesc, content, defaultOpen }: {
  card: TarotCard; positionLabel: string; positionDesc: string; content: string; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={cardImageUrl(card.file)} alt={card.name}
            style={{ width: 38, height: 58, objectFit: 'cover', borderRadius: 5, border: '1.5px solid var(--gold)', flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 3px' }}>{positionLabel}</h2>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>{card.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{positionDesc}</p>
          </div>
        </div>
        <span style={{ color: 'var(--gold)', fontSize: 18, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
      </button>
      {open && <div style={{ paddingBottom: 16, paddingLeft: 50 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{content}</p>
      </div>}
    </div>
  )
}

function CrossLayout({ slots, revealed, positions }: {
  slots: (TarotCard | null)[]
  revealed: boolean
  positions: { label: string; desc: string }[]
}) {
  const cardW = 54, cardH = 81, gap = 8, col = cardW + gap

  function Card({ idx }: { idx: number }) {
    const card = slots[idx]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: cardW, height: cardH, borderRadius: 6, overflow: 'hidden', border: '1.5px solid var(--gold)', flexShrink: 0 }}>
          {revealed && card
            ? <img src={cardImageUrl(card.file)} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#16213E,#0f1829)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'rgba(201,168,76,0.7)', fontSize: 16 }}>✦</span>
              </div>
          }
        </div>
        <p style={{ color: revealed ? 'var(--gold)' : 'var(--text-muted)', fontSize: 9, textAlign: 'center', width: cardW, marginTop: 3 }}>
          {positions[idx].label}
        </p>
        {revealed && card && (
          <p style={{ color: 'var(--text-muted)', fontSize: 8, textAlign: 'center', width: cardW }}>{card.name}</p>
        )}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ position: 'relative', width: col * 4 + cardW, height: cardH * 4 + gap * 3 + 36, minWidth: 280, margin: '0 auto' }}>
        <div style={{ position: 'absolute', left: col, top: 0 }}><Card idx={4} /></div>
        <div style={{ position: 'absolute', left: 0, top: cardH + gap }}><Card idx={3} /></div>
        <div style={{ position: 'absolute', left: col, top: cardH + gap }}><Card idx={0} /></div>
        {/* Card 1 — crossing, rotated 90° */}
        <div style={{ position: 'absolute', left: col + (cardW - cardH) / 2, top: cardH + gap + (cardH - cardW) / 2, opacity: 0.85 }}>
          <div style={{ transform: 'rotate(90deg)', transformOrigin: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: cardW, height: cardH, borderRadius: 6, overflow: 'hidden', border: '1.5px solid var(--gold)' }}>
              {revealed && slots[1]
                ? <img src={cardImageUrl(slots[1].file)} alt={slots[1].name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#16213E,#0f1829)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'rgba(201,168,76,0.7)', fontSize: 16 }}>✦</span>
                  </div>
              }
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: col * 2, top: cardH + gap }}><Card idx={5} /></div>
        <div style={{ position: 'absolute', left: col, top: (cardH + gap) * 2 }}><Card idx={2} /></div>
        {[6, 7, 8, 9].map((posIdx, rowIdx) => (
          <div key={posIdx} style={{ position: 'absolute', left: col * 3, top: (cardH + gap) * rowIdx }}><Card idx={posIdx} /></div>
        ))}
      </div>
    </div>
  )
}

function ProgressRing({ pct, locale }: { pct: number; locale: string }) {
  const t = UI_TEXT_MAP[locale as keyof typeof UI_TEXT_MAP] ?? UI_TEXT_MAP.en
  const r = 28, circ = 2 * Math.PI * r
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width={72} height={72} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
          <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth={4} />
          <circle cx={36} cy={36} r={r} fill="none" stroke="var(--gold)" strokeWidth={4}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>{pct}%</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{t.loadingTitle}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{t.loadingSub}</p>
        <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{t.loadingWarn}</p>
      </div>
    </div>
  )
}

export default function CelticCrossPage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const pricing = usePricing()
  const locale = useLocale()
  const cost = pricing.tarot_celtic_cross ?? 2
  const scenarioCost = pricing.scenario ?? 1
  const pos = POSITIONS_MAP[locale as keyof typeof POSITIONS_MAP] ?? POSITIONS_MAP.en
  const t = UI_TEXT_MAP[locale as keyof typeof UI_TEXT_MAP] ?? UI_TEXT_MAP.en

  const [phase, setPhase] = useState<Phase>('question')
  const [question, setQuestion] = useState('')
  const [deck, setDeck] = useState<(TarotCard | null)[]>([])
  const [exitIdxs, setExitIdxs] = useState<Set<number>>(new Set())
  const [slots, setSlots] = useState<(TarotCard | null)[]>(Array(10).fill(null))
  const [slotEntering, setSlotEntering] = useState<Set<number>>(new Set())
  const [gptText, setGptText] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loadPct, setLoadPct] = useState(0)
  const [scenarioQ, setScenarioQ] = useState('')
  const [scenarioText, setScenarioText] = useState<string | null>(null)
  const [scenarioLoading, setScenarioLoading] = useState(false)
  const [scenarioError, setScenarioError] = useState('')

  useEffect(() => { setDeck(shuffleDeck(FULL_DECK)) }, [])

  useEffect(() => {
    if (phase !== 'loading') { setLoadPct(0); return }
    setLoadPct(5)
    const targets = [15, 28, 42, 55, 65, 74, 82, 88, 93, 96]
    let i = 0
    const iv = setInterval(() => {
      if (i < targets.length) { setLoadPct(targets[i]); i++ }
      else clearInterval(iv)
    }, 8000)
    return () => clearInterval(iv)
  }, [phase])

  const filledCount = slots.filter(Boolean).length

  function handleSelectCard(deckIdx: number) {
    if (exitIdxs.has(deckIdx) || deck[deckIdx] === null) return
    const nextSlot = slots.findIndex(s => s === null)
    if (nextSlot === -1) return
    const card = deck[deckIdx]
    setExitIdxs(prev => new Set([...prev, deckIdx]))
    setTimeout(() => {
      setDeck(prev => { const n = [...prev]; n[deckIdx] = null; return n })
      setExitIdxs(prev => { const n = new Set(prev); n.delete(deckIdx); return n })
      setSlotEntering(prev => new Set([...prev, nextSlot]))
      setSlots(prev => { const n = [...prev]; n[nextSlot] = card; return n })
      setTimeout(() => setSlotEntering(prev => { const n = new Set(prev); n.delete(nextSlot); return n }), 350)
    }, 280)
  }

  async function handleScenario() {
    if (!scenarioQ.trim()) return
    if (credits !== null && credits < scenarioCost) { setScenarioError('Not enough Credits.'); return }
    setScenarioLoading(true)
    setScenarioError('')
    try {
      const res = await apiPost<{ content_text: string }>('/tarot/scenario', {
        cards: slots.map(c => c?.name ?? ''),
        positions: pos.map(p => p.label),
        spread_type: 'celtic_cross',
        original_question: question.trim() || null,
        scenario_question: scenarioQ.trim(),
        language: locale,
      })
      gtagEvent('reading_tarot_scenario', { spread: 'celtic_cross' })
      setScenarioText(res.content_text)
      if (user?.email) {
        refreshCredits(scenarioCost)
        await Promise.all([
          apiPost('/use_pouch', { email: user.email, reading_type: 'tarot_scenario' }),
          saveReading(user.email, {
            reading_type: 'tarot_scenario',
            name: scenarioQ.trim(),
            birth_date: '', birth_city: '',
            locale,
            result: {
              content_text: res.content_text,
              cards: slots.map((c, i) => ({ name: c?.name, position: pos[i].label, file: c?.file })),
              spread_type: 'celtic_cross',
              scenario_question: scenarioQ.trim(),
              original_question: question.trim() || null,
            },
          }),
        ])
      }
    } catch (e) {
      setScenarioError(e instanceof Error ? e.message : 'Failed. Please try again.')
    } finally { setScenarioLoading(false) }
  }

  async function startReading() {
    setPhase('loading')
    try {
      const res = await apiPost<{ content_text: string }>('/tarot/celtic_cross', {
        question: question.trim(),
        cards: slots.map(c => c?.name ?? ''),
        language: locale,
      })
      setLoadPct(99)
      if (user?.email) {
        await Promise.all([
          apiPost('/use_pouch', { email: user.email, reading_type: 'tarot_celtic_cross' }),
          saveReading(user.email, {
            reading_type: 'tarot_celtic_cross',
            name: question.trim() || 'Celtic Cross Reading',
            birth_date: '',
            birth_city: '',
            locale,
            result: {
              content_text: res.content_text,
              cards: slots.map((c, i) => ({ name: c?.name, position: pos[i].label, file: c?.file })),
              question: question.trim(),
            },
          }),
        ])
      }
      gtagEvent('reading_tarot_celtic_cross')
      setGptText(res.content_text)
      setTimeout(() => setPhase('result'), 400)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reading failed. Please try again.')
      setPhase('selecting')
    }
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
        <Link href="/buy" style={{ background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 20, padding: '6px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>{credits ?? '—'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t.credits}</span>
        </Link>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>{t.title}</h1>
            <span style={{ border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {t.creditBadge(cost)}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.subtitle}</p>
        </div>

        {notEnough && phase === 'question' && (
          <div style={{ background: 'var(--card)', border: '1px solid #ef4444', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>{t.notEnoughTitle}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>{t.notEnoughBody(cost, credits ?? 0)}</p>
            <Link href="/buy" className="btn-gold" style={{ fontSize: 14, padding: '12px 28px' }}>{t.getCredits}</Link>
          </div>
        )}

        {/* PHASE: question */}
        {phase === 'question' && !notEnough && (
          <div className="card" style={{ padding: 24 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{t.questionLabel}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>{t.questionSub}</p>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={t.questionPlaceholder}
              rows={3}
              style={{ width: '100%', background: '#0f1829', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, resize: 'none', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}
            />
            <button onClick={() => setPhase('selecting')} disabled={!question.trim()} className="btn-gold"
              style={{ width: '100%', marginTop: 16, fontSize: 15, padding: '14px', opacity: !question.trim() ? 0.5 : 1 }}>
              {t.shuffleBtn}
            </button>
          </div>
        )}

        {/* PHASE: selecting */}
        {phase === 'selecting' && (
          <div>
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.yourQuestion}</p>
              <p style={{ color: '#fff', fontSize: 14 }}>{question}</p>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</p>}

            {filledCount === 10 ? (
              <div>
                <p style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
                  {t.allChosen}
                </p>
                <CrossLayout slots={slots} revealed={false} positions={pos} />
                <button onClick={startReading} className="btn-gold"
                  style={{ width: '100%', marginTop: 20, fontSize: 15, padding: '15px' }}>
                  {t.viewBtn}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 14, padding: '10px 16px', background: 'rgba(201,168,76,0.06)', borderRadius: 10, border: '1px solid rgba(201,168,76,0.2)' }}>
                  <p style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>
                    {t.selectingCard(filledCount + 1, pos[filledCount].label)}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{pos[filledCount].desc}</p>
                </div>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                  {pos.map((_, i) => (
                    <div key={i} style={{
                      width: 30, height: 45, borderRadius: 4,
                      border: slots[i] ? '1px solid var(--gold)' : '1px dashed rgba(201,168,76,0.3)',
                      background: slots[i] ? 'rgba(201,168,76,0.1)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s',
                      transform: slotEntering.has(i) ? 'scale(1.2)' : 'scale(1)',
                    }}>
                      {slots[i]
                        ? <span style={{ color: 'var(--gold)', fontSize: 9 }}>✦</span>
                        : <span style={{ color: 'rgba(201,168,76,0.25)', fontSize: 8 }}>{i + 1}</span>}
                    </div>
                  ))}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>{t.deckLabel}</p>
                <div style={{ maxHeight: 360, overflowY: 'auto', borderRadius: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                    {deck.map((card, i) => card === null ? (
                      <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 36, height: 54, borderRadius: 6, border: '1px dashed rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.03)' }} />
                      </div>
                    ) : (
                      <button key={i} onClick={() => handleSelectCard(i)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        transition: 'transform 0.28s, opacity 0.28s',
                        transform: exitIdxs.has(i) ? 'scale(0.5) translateY(-16px)' : 'scale(1)',
                        opacity: exitIdxs.has(i) ? 0 : 1,
                        display: 'flex', justifyContent: 'center',
                      }}>
                        <CardBack size="xs" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE: loading */}
        {phase === 'loading' && (
          <div>
            <CrossLayout slots={slots} revealed={true} positions={pos} />
            <ProgressRing pct={loadPct} locale={locale} />
          </div>
        )}

        {/* PHASE: result */}
        {phase === 'result' && gptText && (
          <div>
            <CrossLayout slots={slots} revealed={true} positions={pos} />
            <div className="card" style={{ padding: '0 20px', marginBottom: 20, marginTop: 20 }}>
              {parseResult(gptText)
                .filter(sec => !sec.content.includes('Get Scenario Reading') && !sec.content.includes('Share & Earn Credits'))
                .map((sec, i) => {
                const card = slots[i]
                if (i < 10 && card) {
                  return <CardSection key={i} card={card} positionLabel={pos[i].label} positionDesc={pos[i].desc} content={sec.content} defaultOpen={i === 0} />
                }
                return <Section key={i} title={sec.title ?? `Section ${i + 1}`} content={sec.content} defaultOpen={i === 10} />
              })}
            </div>
            {!scenarioText && (
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>{t.goDeeper}</p>
                  <span style={{ border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{t.creditBadge(scenarioCost)}</span>
                </div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{t.scenarioTitle}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>{t.scenarioDesc}</p>
                <textarea value={scenarioQ} onChange={e => setScenarioQ(e.target.value)}
                  placeholder={t.scenarioPlaceholder} rows={2}
                  style={{ width: '100%', background: '#0f1829', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box', marginBottom: 12 }} />
                {scenarioError && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{scenarioError}</p>}
                <button onClick={handleScenario} disabled={!scenarioQ.trim() || scenarioLoading || (credits !== null && credits < scenarioCost)} className="btn-gold"
                  style={{ width: '100%', fontSize: 14, padding: '12px', opacity: (!scenarioQ.trim() || scenarioLoading || (credits !== null && credits < scenarioCost)) ? 0.5 : 1 }}>
                  {scenarioLoading ? t.scenarioLoading : t.scenarioBtn(scenarioCost)}
                </button>
              </div>
            )}
            {scenarioText && (
              <div className="card" style={{ padding: '0 20px', marginBottom: 16 }}>
                <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', padding: '16px 0 8px' }}>{t.scenarioLabel}</p>
                {parseResult(scenarioText).map((sec, i) => (
                  <Section key={i} title={sec.title ?? `Section ${i + 1}`} content={sec.content} defaultOpen={i === 0} />
                ))}
              </div>
            )}

            <TarotShareButton userEmail={user?.email ?? ''} share={gptText ? {
              reading_type: 'tarot_celtic_cross',
              name: question.trim() || 'Celtic Cross Reading',
              result: {
                content_text: gptText,
                cards: slots.map((c, i) => ({ name: c?.name, position: pos[i].label, file: c?.file })),
                question: question.trim(),
              },
            } : null} />

            <button onClick={() => {
              setPhase('question'); setQuestion(''); setDeck(shuffleDeck(FULL_DECK))
              setSlots(Array(10).fill(null)); setExitIdxs(new Set()); setSlotEntering(new Set())
              setGptText(null); setError(''); setLoadPct(0)
              setScenarioText(null); setScenarioQ('')
            }} style={{ width: '100%', background: 'none', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
              {t.newReading}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '2px solid rgba(201,168,76,0.2)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
