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
    { label: 'You',        desc: 'Your energy' },
    { label: 'Them',       desc: 'Their energy' },
    { label: 'Connection', desc: 'The dynamic' },
    { label: 'Advice',     desc: 'What to do' },
  ],
  ko: [
    { label: '나',     desc: '나의 에너지' },
    { label: '상대방', desc: '상대방의 에너지' },
    { label: '연결',   desc: '우리의 관계' },
    { label: '조언',   desc: '무엇을 해야 하는가' },
  ],
  ja: [
    { label: '私',           desc: 'あなたのエネルギー' },
    { label: '相手',         desc: '相手のエネルギー' },
    { label: 'つながり',     desc: '二人の関係' },
    { label: 'アドバイス',   desc: 'すべきこと' },
  ],
}

const RELATIONSHIP_TYPES_MAP = {
  en: ['Romantic Partner','Crush','Ex-Partner','Spouse','Friend','Best Friend','Family Member','Colleague','Boss','Mentor','Rival','Stranger'],
  ko: ['연인','짝사랑','전 연인','배우자','친구','절친','가족','동료','상사','멘토','라이벌','낯선 사람'],
  ja: ['恋人','片思いの相手','元恋人','配偶者','友人','親友','家族','同僚','上司','メンター','ライバル','見知らぬ人'],
}

const UI_TEXT_MAP = {
  en: {
    title: 'Relationship Spread',
    subtitle: 'You · Them · Connection · Advice — 4 cards',
    credits: 'Credits',
    creditBadge: (n: number) => `${n} Credit${n !== 1 ? 's' : ''}`,
    notEnoughTitle: 'Not enough Credits',
    notEnoughBody: (cost: number, credits: number) => `This reading costs ${cost} Credit${cost !== 1 ? 's' : ''}. You have ${credits}.`,
    getCredits: 'Get Credits',
    whoLabel: 'Who is this about?',
    relTypeLabel: 'Relationship type',
    questionLabel: 'Your question',
    questionOptional: '(optional)',
    questionPlaceholder: 'e.g. Does my crush feel the same way?',
    shuffleBtn: 'Shuffle the Deck →',
    viewBtn: 'View My Reading →',
    tapBegin: 'Tap any card to begin',
    tapNext: (n: number) => `${n} / 4 chosen`,
    deckLabel: 'Full deck · 78 cards · Tap to select',
    loadingTitle: 'Reading your cards…',
    loadingSub: 'Usually under a minute.',
    loadingWarn: "Please don't close or leave this page.",
    goDeeper: 'Go Deeper',
    scenarioTitle: 'Tarot Scenario Reading',
    scenarioPlaceholder: 'e.g. How can I get closer to them?',
    scenarioLoading: 'Reading...',
    scenarioBtn: (n: number) => `Get Scenario Reading — ${n} Credit${n !== 1 ? 's' : ''}`,
    scenarioLabel: 'Scenario Reading',
    newReading: 'New Reading',
  },
  ko: {
    title: '나와 상대방의 관계 타로',
    subtitle: '나 · 상대방 · 연결 · 조언 — 4장',
    credits: '크레딧',
    creditBadge: (n: number) => `${n} 크레딧`,
    notEnoughTitle: '크레딧이 부족해요',
    notEnoughBody: (cost: number, credits: number) => `이 리딩에는 ${cost} 크레딧이 필요해요. 현재 ${credits} 크레딧을 보유하고 있어요.`,
    getCredits: '크레딧 구매하기',
    whoLabel: '누구에 대한 타로인가요?',
    relTypeLabel: '관계 유형',
    questionLabel: '질문',
    questionOptional: '(선택사항)',
    questionPlaceholder: '예) 짝사랑하는 사람도 나를 좋아할까요?',
    shuffleBtn: '카드 섞기 →',
    viewBtn: '내 리딩 보기 →',
    tapBegin: '카드를 하나 선택하세요',
    tapNext: (n: number) => `${n} / 4 선택됨`,
    deckLabel: '전체 덱 · 78장 · 탭해서 선택하세요',
    loadingTitle: '카드를 읽는 중…',
    loadingSub: '보통 1분 이내로 완료됩니다.',
    loadingWarn: '이 페이지를 닫거나 이동하지 마세요.',
    goDeeper: '더 깊이 보기',
    scenarioTitle: '타로 시나리오 리딩',
    scenarioPlaceholder: '예) 어떻게 하면 상대방에게 더 가까워질 수 있을까요?',
    scenarioLoading: '리딩 중...',
    scenarioBtn: (n: number) => `시나리오 리딩 받기 — ${n} 크레딧`,
    scenarioLabel: '시나리오 리딩',
    newReading: '새로운 리딩',
  },
  ja: {
    title: '二人の関係タロット',
    subtitle: '私 · 相手 · つながり · アドバイス — 4枚',
    credits: 'クレジット',
    creditBadge: (n: number) => `${n}クレジット`,
    notEnoughTitle: 'クレジットが不足しています',
    notEnoughBody: (cost: number, credits: number) => `このリーディングには${cost}クレジットが必要です。現在${credits}クレジットをお持ちです。`,
    getCredits: 'クレジットを購入',
    whoLabel: '誰についてのタロットですか？',
    relTypeLabel: '関係の種類',
    questionLabel: '質問',
    questionOptional: '（任意）',
    questionPlaceholder: '例）片思いの相手も私のことが好きですか？',
    shuffleBtn: 'カードをシャッフル →',
    viewBtn: 'リーディングを見る →',
    tapBegin: 'カードを一枚選んでください',
    tapNext: (n: number) => `${n} / 4 選択済み`,
    deckLabel: 'フルデッキ · 78枚 · タップして選択',
    loadingTitle: 'カードを読んでいます…',
    loadingSub: '通常1分以内に完了します。',
    loadingWarn: 'このページを閉じたり移動しないでください。',
    goDeeper: 'さらに深く',
    scenarioTitle: 'タロットシナリオリーディング',
    scenarioPlaceholder: '例）どうすれば相手との距離を縮められますか？',
    scenarioLoading: 'リーディング中...',
    scenarioBtn: (n: number) => `シナリオリーディングを取得 — ${n}クレジット`,
    scenarioLabel: 'シナリオリーディング',
    newReading: '新しいリーディング',
  },
}

type Phase = 'question' | 'selecting' | 'loading' | 'result'

export default function RelationshipPage() {
  const { user, credits, loading, refreshCredits } = useAuth()
  const pricing = usePricing()
  const locale = useLocale()
  const pos = POSITIONS_MAP[locale as keyof typeof POSITIONS_MAP] ?? POSITIONS_MAP.en
  const t = UI_TEXT_MAP[locale as keyof typeof UI_TEXT_MAP] ?? UI_TEXT_MAP.en
  const relTypes = RELATIONSHIP_TYPES_MAP[locale as keyof typeof RELATIONSHIP_TYPES_MAP] ?? RELATIONSHIP_TYPES_MAP.en
  const cost = pricing.tarot_relationship ?? 1
  const scenarioCost = pricing.scenario ?? 1

  const [phase, setPhase] = useState<Phase>('question')
  const [question, setQuestion] = useState('')
  const [relType, setRelType] = useState(RELATIONSHIP_TYPES_MAP.en[0])
  const [deck, setDeck] = useState<(TarotCard | null)[]>([])
  const [exitIdxs, setExitIdxs] = useState<Set<number>>(new Set())
  const [slots, setSlots] = useState<(TarotCard | null)[]>([null, null, null, null])
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
      const res = await apiPost<{ content_text: string }>('/tarot/relationship', {
        question: question.trim() || null,
        relationship_type: relType,
        cards: slots.map(c => c?.name ?? ''),
        language: locale,
      })
      setLoadPct(99)
      if (user?.email) {
        await Promise.all([
          apiPost('/use_pouch', { email: user.email, reading_type: 'tarot_relationship' }),
          saveReading(user.email, {
            reading_type: 'tarot_relationship',
            name: question.trim() || `${relType} Reading`,
            birth_date: '', birth_city: '',
            locale,
            result: {
              content_text: res.content_text,
              cards: slots.map((c, i) => ({ name: c?.name, position: pos[i].label, file: c?.file })),
              question: question.trim(),
              relationship_type: relType,
            },
          }),
        ])
      }
      gtagEvent('reading_tarot_relationship')
      refreshCredits() // 차감 후 화면 잔액 갱신
      setGptText(res.content_text)
      setTimeout(() => setPhase('result'), 400)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reading failed. Please try again.')
      setPhase('selecting')
    }
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
        spread_type: 'relationship',
        original_question: question.trim() || null,
        scenario_question: scenarioQ.trim(),
        language: locale,
      })
      gtagEvent('reading_tarot_scenario', { spread: 'relationship' })
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
              spread_type: 'relationship',
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

  const notEnough = credits !== null && credits < cost
  if (loading) return <Spinner />
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
              <p className="tr-label">{t.whoLabel}</p>
              <label className="tr-sublabel" htmlFor="tr-rel" style={{ marginTop: 12 }}>{t.relTypeLabel}</label>
              <select id="tr-rel" value={relType} onChange={e => setRelType(e.target.value)} className="tr-input" style={{ marginBottom: 18 }}>
                {relTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
              </select>
              <label className="tr-sublabel" htmlFor="tr-q">{t.questionLabel} <span className="tr-opt">{t.questionOptional}</span></label>
              <textarea id="tr-q" value={question} onChange={e => setQuestion(e.target.value)}
                placeholder={t.questionPlaceholder} rows={3}
                className={`tr-input${question.trim() ? ' is-filled' : ''}`}
              />
              <button onClick={() => setPhase('selecting')} className="ap-btn tr-full">
                {t.shuffleBtn}
              </button>
            </div>
          </div>
        )}

        {/* PHASE: selecting */}
        {phase === 'selecting' && (
          <div className="ap-container tr-select-wrap">
            {error && <p className="tr-error">{error}</p>}

            <SlotRow slots={slots} labels={labels} entering={slotEntering} grid />

            {filledCount === 4 ? (
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
            <RevealRow slots={slots} labels={labels} grid />
            <TarotLoading pct={loadPct} title={t.loadingTitle} sub={t.loadingSub} warn={t.loadingWarn} />
          </div>
        )}

        {/* PHASE: result */}
        {phase === 'result' && gptText && (
          <div className="ap-reading-col">
            <RevealRow slots={slots} labels={labels} grid />
            <div className="ap-glass tr-result">
              {parseResult(gptText)
                .filter(sec => !sec.content.includes('Get Scenario Reading') && !sec.content.includes('Share & Earn Credits'))
                .map((sec, i) => {
                const card = slots[i]
                if (i < 4 && card) {
                  return <CardSection key={i} card={card} positionLabel={pos[i].label} positionDesc={pos[i].desc} content={sec.content} defaultOpen={i === 0} />
                }
                return <Section key={i} title={localizeTarotTitle(sec.title ?? `Section ${i + 1}`, locale)} content={sec.content} defaultOpen={i === 4} />
              })}
            </div>

            {!scenarioText && (
              <div className="ap-glass ap-glass-gold tr-deeper">
                <div className="tr-deeper-top">
                  <span>{t.goDeeper}</span>
                  <span className="ap-badge">{t.creditBadge(scenarioCost)}</span>
                </div>
                <h3 style={{ marginBottom: 14 }}>{t.scenarioTitle}</h3>
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
              reading_type: 'tarot_relationship',
              name: question.trim() || 'Relationship Reading',
              result: {
                content_text: gptText,
                cards: slots.map((c, i) => ({ name: c?.name, position: pos[i].label, file: c?.file })),
                question: question.trim(),
              },
            } : null} />

            <button onClick={() => {
              setPhase('question'); setQuestion(''); setDeck(shuffleDeck(FULL_DECK))
              setSlots([null, null, null, null]); setExitIdxs(new Set()); setSlotEntering(new Set())
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
