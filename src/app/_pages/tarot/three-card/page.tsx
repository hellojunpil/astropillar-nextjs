'use client'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { saveReading } from '@/lib/firestore'
import { FULL_DECK, TarotCard, shuffleDeck } from '@/lib/tarotDeck'
import { parseResult } from '@/components/ReadingResult'
import { localizeTarotTitle } from '@/lib/tarotTitles'
import TarotShareButton from '@/components/TarotShareButton'
import BottomNav from '@/components/BottomNav'
import {
  TarotStyles, TarotMobileHeader, TarotTitle, NotEnough, DeckGrid, SlotRow, RevealRow,
  TarotLoading, Section, CardSection, Spinner,
} from '../_ui'

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
      refreshCredits() // 차감 후 화면 잔액 갱신
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

  const labels = pos.map(p => p.label)

  return (
    <main className="ap-page">
      <TarotStyles />
      <TarotMobileHeader credits={credits} creditsLabel={t.credits} />

      <div className="tr-wrap">
        <div className="ap-container">
          <TarotTitle title={t.title} subtitle={t.subtitle} badge={t.creditBadge(cost)} />
        </div>

        {notEnough && phase === 'question' && (
          <div className="ap-narrow">
            <NotEnough title={t.notEnoughTitle} body={t.notEnoughBody(cost, credits ?? 0)} cta={t.getCredits} />
          </div>
        )}

        {/* PHASE: question */}
        {phase === 'question' && !notEnough && (
          <div className="ap-narrow">
            <div className="ap-glass ap-glass-gold tr-panel ap-rise ap-d1">
              <label className="tr-label" htmlFor="tr-q">{t.questionLabel}</label>
              <p className="tr-help">{t.questionSub}</p>
              <textarea id="tr-q" value={question} onChange={e => setQuestion(e.target.value)}
                placeholder={t.questionPlaceholder} rows={3}
                className={`tr-input${question.trim() ? ' is-filled' : ''}`}
              />
              {!question.trim() && <p className="tr-hint">{t.questionHint}</p>}
              <button onClick={() => setPhase('selecting')} disabled={!question.trim()} className="ap-btn tr-full">
                {t.shuffleBtn}
              </button>
            </div>
          </div>
        )}

        {/* PHASE: selecting */}
        {phase === 'selecting' && (
          <div className="ap-container tr-select-wrap">
            {error && <p className="tr-error">{error}</p>}

            <SlotRow slots={slots} labels={labels} entering={slotEntering} />

            {filledCount === 3 ? (
              <div className="ap-narrow" style={{ padding: 0 }}>
                <button onClick={startReading} className="ap-btn tr-full" style={{ marginTop: 4 }}>
                  {t.viewBtn}
                </button>
              </div>
            ) : (
              <>
                <p className="tr-status">
                  {filledCount === 0 ? t.tapBegin : t.tapNext(filledCount)}
                </p>
                <DeckGrid deck={deck} exitIdxs={exitIdxs} onSelect={handleSelectCard} label={t.deckLabel} />
              </>
            )}
          </div>
        )}

        {/* PHASE: loading */}
        {phase === 'loading' && (
          <div className="ap-reading-col">
            <RevealRow slots={slots} labels={labels} />
            <TarotLoading pct={loadPct} title={t.loadingTitle} sub={t.loadingSub} warn={t.loadingWarn} />
          </div>
        )}

        {/* PHASE: result */}
        {phase === 'result' && gptText && (
          <div className="ap-reading-col">
            <RevealRow slots={slots} labels={labels} />

            <div className="ap-glass tr-result">
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
              <div className="ap-glass ap-glass-gold tr-deeper">
                <div className="tr-deeper-top">
                  <span>{t.goDeeper}</span>
                  <span className="ap-badge">{t.creditBadge(scenarioCost)}</span>
                </div>
                <h3>{t.scenarioTitle}</h3>
                <p>{t.scenarioDesc}</p>
                <textarea value={scenarioQuestion} onChange={e => setScenarioQuestion(e.target.value)}
                  placeholder={t.scenarioPlaceholder} rows={2} className="tr-input" style={{ marginBottom: 12 }}
                />
                {scenarioError && <p className="tr-error" style={{ textAlign: 'left' }}>{scenarioError}</p>}
                <button onClick={handleScenario} disabled={!scenarioQuestion.trim() || scenarioLoading || (credits !== null && credits < scenarioCost)} className="ap-btn" style={{ width: '100%' }}>
                  {scenarioLoading ? t.scenarioLoading : t.scenarioBtn(scenarioCost)}
                </button>
              </div>
            )}

            {scenarioText && (
              <div className="ap-glass tr-result">
                <p className="tr-sec-label">{t.scenarioLabel}</p>
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
            }} className="ap-btn-ghost tr-again">
              {t.newReading}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}
