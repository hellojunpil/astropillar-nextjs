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
    { label: 'Past',    desc: 'What shaped this' },
    { label: 'Present', desc: 'Where you are now' },
    { label: 'Future',  desc: 'Where this leads' },
  ],
  ko: [
    { label: '과거', desc: '지금을 만든 것' },
    { label: '현재', desc: '지금 있는 곳' },
    { label: '미래', desc: '이 흐름의 끝' },
  ],
  ja: [
    { label: '過去', desc: '今を作ったもの' },
    { label: '現在', desc: '今のあなた' },
    { label: '未来', desc: 'この流れの先' },
  ],
}

const UI_TEXT_MAP = {
  en: {
    title: 'Three Card Spread',
    subtitle: 'Past · Present · Future — 3 cards',
    credits: 'Credits',
    creditBadge: (n: number) => `${n} Credit${n !== 1 ? 's' : ''}`,
    notEnoughTitle: 'Not enough Credits',
    notEnoughBody: (cost: number, credits: number) => `This reading costs ${cost} Credit${cost !== 1 ? 's' : ''}. You have ${credits}.`,
    getCredits: 'Get Credits',
    questionLabel: "What's your question?",
    questionSub: 'Be specific. The cards will answer exactly what you ask.',
    questionPlaceholder: 'e.g. Should I leave my current job this year?',
    questionHint: '✦ A question is required to begin your reading.',
    shuffleBtn: 'Shuffle the Deck →',
    viewBtn: 'View My Reading →',
    tapBegin: 'Tap any card to begin',
    tapNext: (n: number) => `${n} / 3 chosen — tap another`,
    deckLabel: 'Full deck · 78 cards · Tap to select',
    loadingTitle: 'Reading your cards…',
    loadingSub: 'Usually under a minute.',
    loadingWarn: "Please don't close or leave this page.",
    goDeeper: 'Go Deeper',
    scenarioTitle: 'Tarot Scenario Reading',
    scenarioDesc: 'Ask a specific question — get a deeper reading based on the cards you drew.',
    scenarioPlaceholder: 'e.g. Should I take this job offer?',
    scenarioLoading: 'Reading...',
    scenarioBtn: (n: number) => `Get Scenario Reading — ${n} Credit${n !== 1 ? 's' : ''}`,
    scenarioLabel: 'Scenario Reading',
    newReading: 'New Reading',
  },
  ko: {
    title: '과거·현재·미래 타로',
    subtitle: '과거 · 현재 · 미래 — 3장',
    credits: '크레딧',
    creditBadge: (n: number) => `${n} 크레딧`,
    notEnoughTitle: '크레딧이 부족해요',
    notEnoughBody: (cost: number, credits: number) => `이 리딩에는 ${cost} 크레딧이 필요해요. 현재 ${credits} 크레딧을 보유하고 있어요.`,
    getCredits: '크레딧 구매하기',
    questionLabel: '질문을 입력하세요',
    questionSub: '구체적으로 적어주세요. 카드는 당신의 질문에 정확히 답합니다.',
    questionPlaceholder: '예) 올해 현재 직장을 그만둬야 할까요?',
    questionHint: '✦ 리딩을 시작하려면 질문을 입력하세요.',
    shuffleBtn: '카드 섞기 →',
    viewBtn: '내 리딩 보기 →',
    tapBegin: '카드를 하나 선택하세요',
    tapNext: (n: number) => `${n} / 3 선택됨 — 다음 카드를 선택하세요`,
    deckLabel: '전체 덱 · 78장 · 탭해서 선택하세요',
    loadingTitle: '카드를 읽는 중…',
    loadingSub: '보통 1분 이내로 완료됩니다.',
    loadingWarn: '이 페이지를 닫거나 이동하지 마세요.',
    goDeeper: '더 깊이 보기',
    scenarioTitle: '타로 시나리오 리딩',
    scenarioDesc: '구체적인 질문을 하면 뽑은 카드를 바탕으로 더 깊은 리딩을 해드려요.',
    scenarioPlaceholder: '예) 이 일자리 제안을 수락해야 할까요?',
    scenarioLoading: '리딩 중...',
    scenarioBtn: (n: number) => `시나리오 리딩 받기 — ${n} 크레딧`,
    scenarioLabel: '시나리오 리딩',
    newReading: '새로운 리딩',
  },
  ja: {
    title: '過去・現在・未来タロット',
    subtitle: '過去 · 現在 · 未来 — 3枚',
    credits: 'クレジット',
    creditBadge: (n: number) => `${n}クレジット`,
    notEnoughTitle: 'クレジットが不足しています',
    notEnoughBody: (cost: number, credits: number) => `このリーディングには${cost}クレジットが必要です。現在${credits}クレジットをお持ちです。`,
    getCredits: 'クレジットを購入',
    questionLabel: '質問を入力してください',
    questionSub: '具体的に書いてください。カードはあなたの質問に正確に答えます。',
    questionPlaceholder: '例）今年、今の仕事を辞めるべきですか？',
    questionHint: '✦ リーディングを始めるには質問を入力してください。',
    shuffleBtn: 'カードをシャッフル →',
    viewBtn: 'リーディングを見る →',
    tapBegin: 'カードを一枚選んでください',
    tapNext: (n: number) => `${n} / 3 選択済み — 次のカードを選んでください`,
    deckLabel: 'フルデッキ · 78枚 · タップして選択',
    loadingTitle: 'カードを読んでいます…',
    loadingSub: '通常1分以内に完了します。',
    loadingWarn: 'このページを閉じたり移動しないでください。',
    goDeeper: 'さらに深く',
    scenarioTitle: 'タロットシナリオリーディング',
    scenarioDesc: '具体的な質問をすると、引いたカードをもとに深いリーディングを行います。',
    scenarioPlaceholder: '例）この仕事のオファーを受けるべきですか？',
    scenarioLoading: 'リーディング中...',
    scenarioBtn: (n: number) => `シナリオリーディングを取得 — ${n}クレジット`,
    scenarioLabel: 'シナリオリーディング',
    newReading: '新しいリーディング',
  },
}

type Phase = 'question' | 'selecting' | 'loading' | 'result'

function CardBack({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? { w: 44, h: 66, fs: 14 } : size === 'lg' ? { w: 90, h: 135, fs: 28 } : { w: 72, h: 108, fs: 22 }
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
            <h2 style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3, margin: '0 0 3px' }}>{positionLabel}</h2>
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

function ProgressRing({ pct, locale }: { pct: number; locale: string }) {
  const r = 28, circ = 2 * Math.PI * r
  const t = UI_TEXT_MAP[locale as keyof typeof UI_TEXT_MAP] ?? UI_TEXT_MAP.en
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width={72} height={72} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
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

function CardStrip({ slots, revealed, positions }: { slots: (TarotCard | null)[]; revealed: boolean; positions: typeof POSITIONS_MAP.en }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
      {positions.map((p, i) => {
        const card = slots[i]
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {revealed && card
              ? <img src={cardImageUrl(card.file)} alt={card.name} style={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--gold)' }} />
              : <div style={{ width: 80, height: 120, background: 'linear-gradient(135deg,#16213E,#0f1829)', border: '1.5px solid rgba(201,168,76,0.6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'rgba(201,168,76,0.7)', fontSize: 24 }}>✦</span>
                </div>
            }
            <p style={{ color: revealed ? 'var(--gold)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{p.label}</p>
            {revealed && card && <p style={{ color: 'var(--text-muted)', fontSize: 9, textAlign: 'center', maxWidth: 80 }}>{card.name}</p>}
          </div>
        )
      })}
    </div>
  )
}

export default function ThreeCardPage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const pricing = usePricing()
  const locale = useLocale()
  const pos = POSITIONS_MAP[locale as keyof typeof POSITIONS_MAP] ?? POSITIONS_MAP.en
  const t = UI_TEXT_MAP[locale as keyof typeof UI_TEXT_MAP] ?? UI_TEXT_MAP.en
  const cost = pricing.tarot_three_card ?? 1
  const scenarioCost = pricing.scenario ?? 1

  const [phase, setPhase] = useState<Phase>('question')
  const [question, setQuestion] = useState('')
  const [deck, setDeck] = useState<(TarotCard | null)[]>([])
  const [exitIdxs, setExitIdxs] = useState<Set<number>>(new Set())
  const [slots, setSlots] = useState<(TarotCard | null)[]>([null, null, null])
  const [slotEntering, setSlotEntering] = useState<Set<number>>(new Set())
  const [gptText, setGptText] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loadPct, setLoadPct] = useState(0)
  const [scenarioQuestion, setScenarioQuestion] = useState('')
  const [scenarioText, setScenarioText] = useState<string | null>(null)
  const [scenarioLoading, setScenarioLoading] = useState(false)
  const [scenarioError, setScenarioError] = useState('')

  useEffect(() => { setDeck(shuffleDeck(FULL_DECK)) }, [])

  useEffect(() => {
    if (phase !== 'loading') { setLoadPct(0); return }
    setLoadPct(10)
    const targets = [25, 42, 58, 70, 80, 88, 93, 97]
    let i = 0
    const iv = setInterval(() => {
      if (i < targets.length) { setLoadPct(targets[i]); i++ }
      else clearInterval(iv)
    }, 5000)
    return () => clearInterval(iv)
  }, [phase])

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

  async function startReading() {
    setPhase('loading')
    try {
      const res = await apiPost<{ content_text: string }>('/tarot/three_card', {
        question: question.trim(),
        cards: slots.map(c => c?.name ?? ''),
        language: locale,
      })
      setLoadPct(99)
      if (user?.email) {
        await Promise.all([
          apiPost('/use_pouch', { email: user.email, reading_type: 'tarot_three_card' }),
          saveReading(user.email, {
            reading_type: 'tarot_three_card',
            name: question.trim() || 'Three Card Reading',
            birth_date: '', birth_city: '',
            locale,
            result: {
              content_text: res.content_text,
              cards: slots.map((c, i) => ({ name: c?.name, position: pos[i].label, file: c?.file })),
              question: question.trim(),
            },
          }),
        ])
      }
      gtagEvent('reading_tarot_three_card')
      setGptText(res.content_text)
      setTimeout(() => setPhase('result'), 400)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reading failed. Please try again.')
      setPhase('selecting')
    }
  }

  async function handleScenario() {
    if (!scenarioQuestion.trim()) return
    if (credits !== null && credits < scenarioCost) { setScenarioError('Not enough Credits.'); return }
    setScenarioLoading(true)
    setScenarioError('')
    try {
      const res = await apiPost<{ content_text: string }>('/tarot/scenario', {
        cards: slots.map(c => c?.name ?? ''),
        positions: pos.map(p => p.label),
        spread_type: 'three_card',
        original_question: question.trim() || null,
        scenario_question: scenarioQuestion.trim(),
        language: locale,
      })
      gtagEvent('reading_tarot_scenario', { spread: 'three_card' })
      setScenarioText(res.content_text)
      if (user?.email) {
        refreshCredits(scenarioCost)
        await Promise.all([
          apiPost('/use_pouch', { email: user.email, reading_type: 'tarot_scenario' }),
          saveReading(user.email, {
            reading_type: 'tarot_scenario',
            name: scenarioQuestion.trim(),
            birth_date: '', birth_city: '',
            locale,
            result: {
              content_text: res.content_text,
              cards: slots.map((c, i) => ({ name: c?.name, position: pos[i].label, file: c?.file })),
              spread_type: 'three_card',
              scenario_question: scenarioQuestion.trim(),
              original_question: question.trim() || null,
            },
          }),
        ])
      }
    } catch (e) {
      setScenarioError(e instanceof Error ? e.message : 'Failed. Please try again.')
    } finally {
      setScenarioLoading(false)
    }
  }

  if (loading) return <Spinner />
  const notEnough = credits !== null && credits < cost
  const filledCount = slots.filter(Boolean).length

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 96 }}>
      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
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
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              placeholder={t.questionPlaceholder} rows={3}
              style={{ width: '100%', background: '#0f1829', border: `1px solid ${question.trim() ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, resize: 'none', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            />
            {!question.trim() && (
              <p style={{ color: 'rgba(201,168,76,0.7)', fontSize: 11, marginTop: 8 }}>{t.questionHint}</p>
            )}
            <button onClick={() => setPhase('selecting')} disabled={!question.trim()} className="btn-gold"
              style={{ width: '100%', marginTop: 16, fontSize: 15, padding: '14px', opacity: question.trim() ? 1 : 0.4, cursor: question.trim() ? 'pointer' : 'not-allowed' }}>
              {t.shuffleBtn}
            </button>
          </div>
        )}

        {/* PHASE: selecting */}
        {phase === 'selecting' && (
          <div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</p>}

            {/* Slot preview */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
              {pos.map((position, i) => {
                const card = slots[i]
                const entering = slotEntering.has(i)
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 72, height: 108,
                      border: card ? '1.5px solid var(--gold)' : '1.5px dashed rgba(201,168,76,0.35)',
                      borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: card ? 'rgba(201,168,76,0.05)' : 'transparent',
                      transition: 'all 0.3s',
                      transform: entering ? 'translateY(8px)' : 'translateY(0)',
                      opacity: entering ? 0 : 1,
                    }}>
                      {card ? <CardBack size="md" /> : <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: 24 }}>✦</span>}
                    </div>
                    <p style={{ color: card ? 'var(--gold)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{position.label}</p>
                  </div>
                )
              })}
            </div>

            {/* All 3 selected → show View button */}
            {filledCount === 3 ? (
              <button onClick={startReading} className="btn-gold" style={{ width: '100%', fontSize: 15, padding: '15px', marginBottom: 20 }}>
                {t.viewBtn}
              </button>
            ) : (
              <>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                  {filledCount === 0 ? t.tapBegin : t.tapNext(filledCount)}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>{t.deckLabel}</p>
                <div style={{ maxHeight: 360, overflowY: 'auto', borderRadius: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                    {deck.map((card, i) => card === null ? (
                      <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 44, height: 66, borderRadius: 6, border: '1px dashed rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.03)' }} />
                      </div>
                    ) : (
                      <button key={i} onClick={() => handleSelectCard(i)} style={{
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
              </>
            )}
          </div>
        )}

        {/* PHASE: loading */}
        {phase === 'loading' && (
          <div>
            <CardStrip slots={slots} revealed={true} positions={pos} />
            <ProgressRing pct={loadPct} locale={locale} />
          </div>
        )}

        {/* PHASE: result */}
        {phase === 'result' && gptText && (
          <div>
            <CardStrip slots={slots} revealed={true} positions={pos} />

            <div className="card" style={{ padding: '0 20px', marginBottom: 20 }}>
              {parseResult(gptText)
                .filter(sec => !sec.content.includes('Get Scenario Reading') && !sec.content.includes('Share & Earn Credits'))
                .map((sec, i) => {
                  const card = slots[i]
                  if (i < 3 && card) {
                    return <CardSection key={i} card={card} positionLabel={pos[i].label} positionDesc={pos[i].desc} content={sec.content} defaultOpen={i === 0} />
                  }
                  return <Section key={i} title={localizeTarotTitle(sec.title ?? `Section ${i + 1}`, locale)} content={sec.content} defaultOpen={i === 3} />
                })}
            </div>

            {/* Scenario CTA */}
            {!scenarioText && (
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>{t.goDeeper}</p>
                  <span style={{ border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{t.creditBadge(scenarioCost)}</span>
                </div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{t.scenarioTitle}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>{t.scenarioDesc}</p>
                <textarea value={scenarioQuestion} onChange={e => setScenarioQuestion(e.target.value)}
                  placeholder={t.scenarioPlaceholder} rows={2}
                  style={{ width: '100%', background: '#0f1829', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box', marginBottom: 12 }}
                />
                {scenarioError && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{scenarioError}</p>}
                <button onClick={handleScenario} disabled={!scenarioQuestion.trim() || scenarioLoading || (credits !== null && credits < scenarioCost)} className="btn-gold"
                  style={{ width: '100%', fontSize: 14, padding: '12px', opacity: (!scenarioQuestion.trim() || scenarioLoading || (credits !== null && credits < scenarioCost)) ? 0.5 : 1 }}>
                  {scenarioLoading ? t.scenarioLoading : t.scenarioBtn(scenarioCost)}
                </button>
              </div>
            )}

            {scenarioText && (
              <div className="card" style={{ padding: '0 20px', marginBottom: 16 }}>
                <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', padding: '16px 0 8px' }}>{t.scenarioLabel}</p>
                {parseResult(scenarioText).map((sec, i) => (
                  <Section key={i} title={localizeTarotTitle(sec.title ?? `Section ${i + 1}`, locale)} content={sec.content} defaultOpen={i === 0} />
                ))}
              </div>
            )}

            <TarotShareButton userEmail={user?.email ?? ''} share={gptText ? {
              reading_type: 'tarot_three_card',
              name: question.trim() || 'Three Card Reading',
              result: {
                content_text: gptText,
                cards: slots.map((c, i) => ({ name: c?.name, position: pos[i].label, file: c?.file })),
                question: question.trim(),
              },
            } : null} />

            <button onClick={() => {
              setPhase('question'); setQuestion(''); setDeck(shuffleDeck(FULL_DECK))
              setSlots([null, null, null]); setExitIdxs(new Set()); setSlotEntering(new Set())
              setGptText(null); setError(''); setLoadPct(0)
              setScenarioText(null); setScenarioQuestion('')
            }} style={{ width: '100%', background: 'none', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
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
