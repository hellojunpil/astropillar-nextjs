'use client'
import { useState, useEffect } from 'react'
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
import {
  TarotStyles, TarotMobileHeader, TarotTitle, NotEnough, DeckGrid,
  TarotLoading, Section, CardSection, Spinner, CardBack,
} from '../_ui'

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
      refreshCredits() // 차감 후 화면 잔액 갱신
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
              <textarea
                id="tr-q"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder={t.questionPlaceholder}
                rows={3}
                className={`tr-input${question.trim() ? ' is-filled' : ''}`}
              />
              <button onClick={() => setPhase('selecting')} disabled={!question.trim()} className="ap-btn tr-full">
                {t.shuffleBtn}
              </button>
            </div>
          </div>
        )}

        {/* PHASE: selecting */}
        {phase === 'selecting' && (
          <div className="ap-container tr-select-wrap">
            <div className="ap-narrow" style={{ padding: 0 }}>
              <div className="ap-glass tr-question">
                <span className="tr-question-glyph" aria-hidden="true">✦</span>
                <div>
                  <small>{t.yourQuestion}</small>
                  <p>{question}</p>
                </div>
              </div>
            </div>

            {error && <p className="tr-error">{error}</p>}

            {filledCount === 10 ? (
              <div>
                <p className="tr-status"><b>{t.allChosen}</b></p>
                <CrossLayout slots={slots} revealed={false} positions={pos} compact />
                <div className="ap-narrow" style={{ padding: 0 }}>
                  <button onClick={startReading} className="ap-btn tr-full">
                    {t.viewBtn}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <CrossLayout slots={slots} revealed={false} positions={pos} nextIdx={filledCount} entering={slotEntering} compact />

                <div className="ap-narrow" style={{ padding: 0 }}>
                  <div className="ap-glass ap-glass-gold tr-cc-current" aria-live="polite">
                    <span className="tr-cc-current-num">{filledCount + 1}</span>
                    <div>
                      <b>{t.selectingCard(filledCount + 1, pos[filledCount].label)}</b>
                      <small>{pos[filledCount].desc}</small>
                    </div>
                  </div>
                </div>

                <DeckGrid deck={deck} exitIdxs={exitIdxs} onSelect={handleSelectCard} label={t.deckLabel} />
              </div>
            )}
          </div>
        )}

        {/* PHASE: loading */}
        {phase === 'loading' && (
          <div className="ap-reading-col">
            <CrossLayout slots={slots} revealed={true} positions={pos} />
            <TarotLoading pct={loadPct} title={t.loadingTitle} sub={t.loadingSub} warn={t.loadingWarn} />
          </div>
        )}

        {/* PHASE: result */}
        {phase === 'result' && gptText && (
          <div className="ap-reading-col">
            <CrossLayout slots={slots} revealed={true} positions={pos} />
            <div className="ap-glass tr-result">
              {parseResult(gptText)
                .filter(sec => !sec.content.includes('Get Scenario Reading') && !sec.content.includes('Share & Earn Credits'))
                .map((sec, i) => {
                const card = slots[i]
                if (i < 10 && card) {
                  return <CardSection key={i} card={card} positionLabel={pos[i].label} positionDesc={pos[i].desc} content={sec.content} defaultOpen={i === 0} />
                }
                return <Section key={i} title={localizeTarotTitle(sec.title ?? `Section ${i + 1}`, locale)} content={sec.content} defaultOpen={i === 10} />
              })}
            </div>
            {!scenarioText && (
              <div className="ap-glass ap-glass-gold tr-deeper">
                <div className="tr-deeper-top">
                  <span>{t.goDeeper}</span>
                  <span className="ap-badge">{t.creditBadge(scenarioCost)}</span>
                </div>
                <h3>{t.scenarioTitle}</h3>
                <p>{t.scenarioDesc}</p>
                <textarea value={scenarioQ} onChange={e => setScenarioQ(e.target.value)}
                  placeholder={t.scenarioPlaceholder} rows={2} className="tr-input" style={{ marginBottom: 12 }} />
                {scenarioError && <p className="tr-error" style={{ textAlign: 'left' }}>{scenarioError}</p>}
                <button onClick={handleScenario} disabled={!scenarioQ.trim() || scenarioLoading || (credits !== null && credits < scenarioCost)} className="ap-btn" style={{ width: '100%' }}>
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

type CrossCtx = {
  slots: (TarotCard | null)[]
  revealed: boolean
  positions: { label: string; desc: string }[]
  nextIdx?: number
  entering?: Set<number>
}

function CrossCardFace({ idx, ctx }: { idx: number; ctx: CrossCtx }) {
  const card = ctx.slots[idx]
  const isNext = ctx.nextIdx === idx
  if (!card) {
    return <div className={`tr-cc-card is-empty${isNext ? ' is-next' : ''}`}><span>{idx + 1}</span></div>
  }
  const entering = ctx.entering?.has(idx)
  return (
    <div className={`tr-cc-card${ctx.revealed ? ' is-revealed' : ''}`} style={entering ? { animation: 'fadeIn .35s var(--ease-out) both' } : undefined}>
      {ctx.revealed
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={cardImageUrl(card.file)} alt={card.name} />
        : <CardBack />}
      <span className="tr-cc-num">{idx + 1}</span>
    </div>
  )
}

function CrossCell({ idx, ctx, withCross }: { idx: number; ctx: CrossCtx; withCross?: boolean }) {
  return (
    <div className="tr-cc-cell">
      <div style={{ position: 'relative' }}>
        <CrossCardFace idx={idx} ctx={ctx} />
        {withCross && (
          <div className="tr-cc-cross-card">
            <CrossCardFace idx={1} ctx={ctx} />
          </div>
        )}
      </div>
      <p className="tr-cc-label">{ctx.positions[idx].label}</p>
    </div>
  )
}

/**
 * 켈틱 크로스 실제 배치: 십자(1 중심 + 2 가로지름 + 3 아래 + 4 왼쪽 + 5 위 + 6 오른쪽)
 * + 오른쪽 지팡이(7 아래 → 10 위). 모바일은 번호 + 범례, PC는 카드 아래 라벨.
 */
function CrossLayout({ compact, ...ctx }: CrossCtx & { compact?: boolean }) {
  const compactStyle = compact ? ({ '--cw': 'clamp(44px, 12vw, 64px)' } as React.CSSProperties) : undefined
  return (
    <>
      <div className="tr-cc" style={compactStyle}>
        <div className="tr-cc-cross">
          <div />
          <CrossCell idx={4} ctx={ctx} />
          <div />
          <CrossCell idx={3} ctx={ctx} />
          <CrossCell idx={0} ctx={ctx} withCross />
          <CrossCell idx={5} ctx={ctx} />
          <div />
          <CrossCell idx={2} ctx={ctx} />
          <div />
        </div>
        <div className="tr-cc-staff">
          {[6, 7, 8, 9].map(i => <CrossCell key={i} idx={i} ctx={ctx} />)}
        </div>
      </div>
      {ctx.revealed && (
        <ol className="ap-glass tr-cc-legend">
          {ctx.positions.map((p, i) => (
            <li key={i}><b>{i + 1}</b><span>{p.label}{ctx.slots[i] ? ` · ${ctx.slots[i]!.name}` : ''}</span></li>
          ))}
        </ol>
      )}
    </>
  )
}
