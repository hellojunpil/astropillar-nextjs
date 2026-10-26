'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import {
  getReadings, getPeople, deletePerson, savePerson,
  ReadingRecord, SavedPerson
} from '@/lib/firestore'
import ReadingResult, { parseResult } from '@/components/ReadingResult'
import { cardImageUrl } from '@/lib/tarotDeck'
import { gtagEvent } from '@/lib/gtag'
import BottomNav from '@/components/BottomNav'
import { useLocale } from 'next-intl'
import { localizeTarotTitle } from '@/lib/tarotTitles'
import { monthOptionLabel, timeRangeLabel } from '@/lib/birthLabels'

const TAROT_POSITIONS: Record<string, { label: string; desc: string }[]> = {
  tarot_three_card: [
    { label: 'Past', desc: 'What shaped this' },
    { label: 'Present', desc: 'Where you are now' },
    { label: 'Future', desc: 'Where this leads' },
  ],
  tarot_relationship: [
    { label: 'You', desc: 'Your energy' },
    { label: 'Them', desc: 'Their energy' },
    { label: 'Connection', desc: 'The dynamic' },
    { label: 'Advice', desc: 'What to do' },
  ],
  tarot_celtic_cross: [
    { label: 'The Heart', desc: 'Core of the situation' },
    { label: 'The Challenge', desc: 'Obstacle & hidden dynamic' },
    { label: 'The Root', desc: 'Foundation / how it began' },
    { label: 'Recent Past', desc: 'What just passed' },
    { label: "What You're Reaching For", desc: 'Your conscious goal' },
    { label: 'Beneath the Surface', desc: 'The unconscious driver' },
    { label: 'How You See Yourself', desc: 'Your self-perception' },
    { label: 'Outside Forces', desc: 'External influences' },
    { label: 'Hopes & Fears', desc: 'What you want & dread' },
    { label: 'Where This Is Heading', desc: 'The outcome of this path' },
  ],
}

// 타로 페이지들의 POSITIONS_MAP과 동일한 라벨 (라이브러리 상세 현지화용)
const TAROT_POSITIONS_KO: Record<string, { label: string; desc: string }[]> = {
  tarot_three_card: [
    { label: '과거', desc: '지금을 만든 것' },
    { label: '현재', desc: '지금 있는 곳' },
    { label: '미래', desc: '이 흐름의 끝' },
  ],
  tarot_relationship: [
    { label: '나', desc: '나의 에너지' },
    { label: '상대방', desc: '상대방의 에너지' },
    { label: '연결', desc: '우리의 관계' },
    { label: '조언', desc: '무엇을 해야 하는가' },
  ],
  tarot_celtic_cross: [
    { label: '현재 상황', desc: '상황의 핵심' },
    { label: '십자 (장애물)', desc: '숨겨진 역학' },
    { label: '뿌리 (기초)', desc: '어떻게 시작됐는가' },
    { label: '최근 과거', desc: '방금 지나간 것' },
    { label: '목표', desc: '의식적 목표' },
    { label: '내면', desc: '무의식의 동력' },
    { label: '나의 시각', desc: '자기 인식' },
    { label: '외부 영향', desc: '외부의 영향들' },
    { label: '희망과 두려움', desc: '원하는 것과 두려운 것' },
    { label: '결과', desc: '이 길의 결말' },
  ],
}
const TAROT_POSITIONS_JA: Record<string, { label: string; desc: string }[]> = {
  tarot_three_card: [
    { label: '過去', desc: '今を作ったもの' },
    { label: '現在', desc: '今のあなた' },
    { label: '未来', desc: 'この流れの先' },
  ],
  tarot_relationship: [
    { label: '私', desc: 'あなたのエネルギー' },
    { label: '相手', desc: '相手のエネルギー' },
    { label: 'つながり', desc: '二人の関係' },
    { label: 'アドバイス', desc: 'すべきこと' },
  ],
  tarot_celtic_cross: [
    { label: '現在の状況', desc: '状況の核心' },
    { label: '十字（障害）', desc: '隠れた力学' },
    { label: '根（基盤）', desc: 'どのように始まったか' },
    { label: '直近の過去', desc: '通り過ぎたもの' },
    { label: '目標', desc: '意識的な目標' },
    { label: '内面', desc: '無意識の動力' },
    { label: '自己認識', desc: '自分の見方' },
    { label: '外部の影響', desc: '外部の影響' },
    { label: '希望と恐れ', desc: '望むことと恐れること' },
    { label: '結果', desc: 'この道の結末' },
  ],
}

function tarotPositions(readingType: string, locale: string): { label: string; desc: string }[] {
  if (locale === 'ko') return TAROT_POSITIONS_KO[readingType] ?? TAROT_POSITIONS[readingType] ?? []
  if (locale === 'ja') return TAROT_POSITIONS_JA[readingType] ?? TAROT_POSITIONS[readingType] ?? []
  return TAROT_POSITIONS[readingType] ?? []
}

function TarotCardAccordion({ cardName, cardFile, posLabel, posDesc, content, defaultOpen }: {
  cardName: string; cardFile?: string; posLabel: string; posDesc: string; content: string; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const imgSrc = cardFile ? cardImageUrl(cardFile) : null
  const nameToFile = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^the_/, '')
  const fallbackSrc = cardImageUrl('major_arcana_' + nameToFile(cardName))
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={imgSrc ?? fallbackSrc} alt={cardName}
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
            style={{ width: 38, height: 58, objectFit: 'cover', borderRadius: 5, border: '1.5px solid var(--gold)', flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>{posLabel}</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{cardName}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{posDesc}</p>
          </div>
        </div>
        <span style={{ color: 'var(--gold)', fontSize: 18, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
      </button>
      {open && <div style={{ paddingBottom: 16, paddingLeft: 50 }}>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{content}</p>
      </div>}
    </div>
  )
}

function TarotSectionAccordion({ title, content, defaultOpen }: { title: string; content: string; defaultOpen?: boolean }) {
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
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{content}</p>
      </div>}
    </div>
  )
}

function TarotResultView({ readingType, tarotResult }: {
  readingType: string
  tarotResult: { content_text?: string; cards?: { name?: string; position?: string; file?: string }[]; question?: string; scenario_question?: string; spread_type?: string }
}) {
  const locale = useLocale()
  const positions = tarotPositions(readingType, locale)
  const cards = tarotResult.cards ?? []
  const sections = tarotResult.content_text ? parseResult(tarotResult.content_text) : []
  const cardCount = positions.length
  const displayQuestion = tarotResult.scenario_question ?? tarotResult.question

  return (
    <div>
      <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
        {TYPE_LABELS_I18N[locale]?.[readingType] ?? TYPE_LABELS[readingType] ?? readingType}
      </p>
      {displayQuestion && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, fontStyle: 'italic' }}>
          &ldquo;{displayQuestion}&rdquo;
        </p>
      )}

      {/* Card image strip */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {cards.map((c, i) => {
            const pos = positions[i]
            return (
              <div key={i} style={{ flexShrink: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <img
                  src={c.file ? cardImageUrl(c.file) : cardImageUrl('major_arcana_' + (c.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^the_/, ''))}
                  alt={c.name ?? ''}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
                  style={{ width: 72, height: 108, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--gold-line)', boxShadow: '0 12px 24px -10px rgba(0,0,0,.7)' }}
                />
                <p style={{ color: 'var(--gold-light)', fontSize: 11.5, fontWeight: 700, maxWidth: 80, textAlign: 'center' }}>
                  {pos?.label ?? c.position ?? `Card ${i + 1}`}
                </p>
                <p style={{ color: 'var(--ink-3)', fontSize: 11, maxWidth: 80, textAlign: 'center' }}>{c.name}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Accordion sections */}
      {sections.length > 0 && (
        <div className="ap-glass" style={{ padding: '0 20px', marginBottom: 16 }}>
          {sections.map((sec, i) => {
            const card = cards[i]
            const pos = positions[i]
            if (i < cardCount && card?.name && pos) {
              return (
                <TarotCardAccordion
                  key={i}
                  cardName={card.name}
                  cardFile={card.file}
                  posLabel={pos.label}
                  posDesc={pos.desc}
                  content={sec.content}
                  defaultOpen={i === 0}
                />
              )
            }
            return (
              <TarotSectionAccordion
                key={i}
                title={localizeTarotTitle(sec.title ?? `Section ${i + 1}`, locale)}
                content={sec.content}
                defaultOpen={i === cardCount}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

const TYPE_LABELS: Record<string, string> = {
  personal_fortune: 'Personal Fortune',
  daily: 'Daily Fortune',
  yearly: 'Yearly Fortune',
  compatibility: 'Compatibility',
  scenario: 'Scenario',
  tarot_three_card: 'Tarot · Three Card',
  tarot_relationship: 'Tarot · Relationship',
  tarot_celtic_cross: 'Tarot · Celtic Cross',
  tarot_scenario: 'Tarot · Scenario',
}
const TYPE_COLORS: Record<string, string> = {
  personal_fortune: 'var(--gold)',
  daily: '#f59e0b',
  yearly: '#60a5fa',
  compatibility: '#f472b6',
  scenario: '#a78bfa',
  tarot_three_card: '#c084fc',
  tarot_relationship: '#f472b6',
  tarot_celtic_cross: '#818cf8',
  tarot_scenario: '#34d399',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(7,9,20,0.55)', border: '1px solid var(--line-strong)', borderRadius: 12,
  color: 'var(--ink)', padding: '0 14px', minHeight: 46, fontSize: 16, width: '100%', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  color: 'var(--ink-2)', fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block',
}
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TIME_RANGES: { label: string; hour: number | null; minute: number }[] = [
  { label: "Unknown (I don't know my birth time)", hour: null, minute: 0 },
  { label: '23:30 - 01:30', hour: 23, minute: 30 },
  { label: '01:30 - 03:30', hour: 1, minute: 30 },
  { label: '03:30 - 05:30', hour: 3, minute: 30 },
  { label: '05:30 - 07:30', hour: 5, minute: 30 },
  { label: '07:30 - 09:30', hour: 7, minute: 30 },
  { label: '09:30 - 11:30', hour: 9, minute: 30 },
  { label: '11:30 - 13:30', hour: 11, minute: 30 },
  { label: '13:30 - 15:30', hour: 13, minute: 30 },
  { label: '15:30 - 17:30', hour: 15, minute: 30 },
  { label: '17:30 - 19:30', hour: 17, minute: 30 },
  { label: '19:30 - 21:30', hour: 19, minute: 30 },
  { label: '21:30 - 23:30', hour: 21, minute: 30 },
]

function LibraryPageInner() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<'history' | 'persons'>(() =>
    searchParams.get('tab') === 'persons' ? 'persons' : 'history'
  )
  const [readings, setReadings] = useState<ReadingRecord[]>([])
  const [people, setPeople] = useState<SavedPerson[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [viewReading, setViewReading] = useState<ReadingRecord | null>(null)

  // Add person form state
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [pName, setPName] = useState('')
  const [pYear, setPYear] = useState('')
  const [pMonth, setPMonth] = useState('1')
  const [pDay, setPDay] = useState('')
  const [pSex, setPSex] = useState<'M'|'F'>('F')
  const [pCity, setPCity] = useState('')
  const [pHourIndex, setPHourIndex] = useState(0)
  const [savingPerson, setSavingPerson] = useState(false)
  const [savePersonError, setSavePersonError] = useState('')

  useEffect(() => {
    if (!user?.email) return
    setLoadingData(true)
    Promise.all([
      getReadings(user.email),
      getPeople(user.email),
    ]).then(([r, p]) => {
      setReadings(r)
      setPeople(p)
      setLoadingData(false)
    })
  }, [user?.email])

  async function handleDeletePerson(id: string) {
    if (!user?.email) return
    await deletePerson(user.email, id)
    setPeople(prev => prev.filter(p => p.id !== id))
  }

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.email || !pName || !pYear || !pDay || !pCity) return
    setSavingPerson(true)
    setSavePersonError('')
    try {
      const birth_date = `${pYear}-${String(parseInt(pMonth)).padStart(2,'0')}-${String(parseInt(pDay)).padStart(2,'0')}`
      const pRange = TIME_RANGES[pHourIndex]
      const pHour = pRange.hour
      await savePerson(user.email, { name: pName, birth_date, sex: pSex, birth_city: pCity, hour: pHour, minute: pHour !== null ? pRange.minute : null, birth_time_label: pRange.label })
      const refreshed = await getPeople(user.email)
      setPeople(refreshed)
      setPName(''); setPYear(''); setPMonth('1'); setPDay(''); setPCity(''); setPHourIndex(0)
      setShowAddPerson(false)
    } catch (err: unknown) {
      setSavePersonError(err instanceof Error ? err.message : 'Failed to save. Check Firestore rules.')
    } finally {
      setSavingPerson(false)
    }
  }

  function formatDate(r: ReadingRecord) {
    if (!r.created_at) return ''
    const d = (r.created_at as { toDate?: () => Date }).toDate?.()
    if (!d) return ''
    const dateLocale = locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : 'en-US'
    return d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const L = locale === 'ko' ? 'ko' : locale === 'ja' ? 'ja' : 'en'
  const T = LIB_TEXT[L]
  const typeLabel = (type: string) => TYPE_LABELS_I18N[L]?.[type] ?? TYPE_LABELS[type] ?? type

  if (loading) return (
    <main className="ap-page lib-center">
      <p className="lib-loading">{T.loading}</p>
    </main>
  )

  if (viewReading) {
    const isTarot = viewReading.reading_type?.startsWith('tarot_')
    const tarotResult = isTarot ? viewReading.result as { content_text?: string; cards?: { name?: string; position?: string; file?: string }[]; question?: string } : null

    return (
      <main className="ap-page">
        <div className="ap-reading-col lib-detail-head">
          <button onClick={() => setViewReading(null)} className="ap-btn-ghost ap-btn-sm">← {T.title}</button>
          <span className="lib-date">{formatDate(viewReading)}</span>
        </div>
        <div className="ap-reading-col" style={{ paddingTop: 20 }}>
          {isTarot && tarotResult ? (
            <TarotResultView readingType={viewReading.reading_type} tarotResult={tarotResult} />
          ) : (
            <ReadingResult raw={viewReading.result} onReset={() => setViewReading(null)} userEmail={user?.email ?? undefined} />
          )}
        </div>
        <BottomNav />
        <style>{LIB_CSS}</style>
      </main>
    )
  }

  return (
    <main className="ap-page">
      {/* 모바일 헤더 (PC는 SiteNav) */}
      <div className="lib-mhead ap-mobile-only">
        <Link href={locale === 'en' ? '/menu' : `/${locale}/menu`} className="lib-mlogo">ASTROPILLAR</Link>
        <button onClick={() => signOut(auth).then(() => router.push('/'))} className="ap-btn-ghost ap-btn-sm">{T.signOut}</button>
      </div>

      <div className="ap-container lib-wrap">
        <header className="lib-head">
          <h1 className="ap-h1">{T.title}</h1>
          <p className="ap-lead" style={{ marginTop: 6 }}>{T.sub}</p>
        </header>

        {/* Tabs */}
        <div className="lib-tabs" role="tablist">
          {(['history', 'persons'] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`lib-tab${tab === t ? ' is-on' : ''}`}>
              <span className="material-icons" aria-hidden="true">{t === 'history' ? 'auto_stories' : 'group'}</span>
              {t === 'history' ? T.history : T.persons}
            </button>
          ))}
        </div>

        {/* ── Reading History ── */}
        {tab === 'history' && (
          <div>
            {loadingData ? (
              <div className="lib-grid">
                {[0, 1, 2].map(i => <div key={i} className="lib-skeleton ap-glass" />)}
              </div>
            ) : readings.length === 0 ? (
              <div className="lib-empty ap-glass">
                <span className="lib-empty-glyph" aria-hidden="true">☽</span>
                <p className="lib-empty-title">{T.emptyTitle}</p>
                <p className="lib-empty-body">{T.emptyBody}</p>
                <Link href={locale === 'en' ? '/menu' : `/${locale}/menu`} className="ap-btn" style={{ marginTop: 20 }}>{T.goReadings}</Link>
              </div>
            ) : (
              <div className="lib-grid">
                {readings.map(r => {
                  const color = TYPE_COLORS[r.reading_type] ?? 'var(--gold)'
                  const cards = r.reading_type?.startsWith('tarot_')
                    ? ((r.result as { cards?: { file?: string; name?: string }[] })?.cards ?? []).slice(0, 3)
                    : []
                  return (
                    <button
                      key={r.id}
                      onClick={() => { gtagEvent('library_reading_open', { reading_type: r.reading_type }); setViewReading(r) }}
                      className="lib-item ap-glass ap-hover"
                    >
                      <div className="lib-item-top">
                        <span className="lib-type" style={{ color, borderColor: color }}>{typeLabel(r.reading_type)}</span>
                        <span className="lib-date">{formatDate(r)}</span>
                      </div>
                      <p className="lib-name">{r.name}</p>
                      {cards.length > 0 && (
                        <div className="lib-cards">
                          {cards.map((c, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i}
                              src={c.file ? cardImageUrl(c.file) : cardImageUrl('major_arcana_' + (c.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^the_/, ''))}
                              alt={c.name ?? ''}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
                            />
                          ))}
                        </div>
                      )}
                      <p className="lib-meta">{[r.birth_date, r.birth_city].filter(Boolean).join(' · ')}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── My Persons ── */}
        {tab === 'persons' && (
          <div>
            {loadingData ? (
              <div className="lib-grid">
                {[0, 1].map(i => <div key={i} className="lib-skeleton ap-glass" style={{ height: 96 }} />)}
              </div>
            ) : (
              <>
                {people.length === 0 && !showAddPerson && (
                  <div className="lib-empty ap-glass" style={{ marginBottom: 16 }}>
                    <span className="lib-empty-glyph" aria-hidden="true">✶</span>
                    <p className="lib-empty-title">{T.personsEmptyTitle}</p>
                    <p className="lib-empty-body">{T.personsEmptyBody}</p>
                  </div>
                )}
                {people.length > 0 && (
                  <div className="lib-grid" style={{ marginBottom: 16 }}>
                    {people.map(p => (
                      <div key={p.id} className="lib-person ap-glass">
                        <div className="lib-avatar" aria-hidden="true">{(p.name || '?').slice(0, 1)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="lib-name">{p.name}</p>
                          <p className="lib-meta">{p.birth_date} · {p.sex === 'F' ? '♀' : '♂'} · {p.birth_city}</p>
                          <p className="lib-meta">
                            {p.birth_time_label ? timeRangeLabel(p.birth_time_label, locale) : (p.hour !== null && p.hour !== undefined ? `${String(p.hour).padStart(2,'0')}:${String(p.minute ?? 0).padStart(2,'0')}` : locale === 'ko' ? '태어난 시간 모름' : locale === 'ja' ? '出生時間不明' : 'Birth time unknown')}
                          </p>
                        </div>
                        <button onClick={() => p.id && handleDeletePerson(p.id)} className="lib-delete">{T.del}</button>
                      </div>
                    ))}
                  </div>
                )}

                {showAddPerson ? (
                  <form onSubmit={handleAddPerson} className="lib-form ap-glass ap-glass-gold">
                    <p className="lib-form-title">{T.addPerson}</p>
                    <div>
                      <label style={labelStyle}>{T.name}</label>
                      <input style={inputStyle} placeholder={T.namePh} value={pName} onChange={e => setPName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>{T.gender}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['F','M'] as const).map(s => (
                          <button key={s} type="button" onClick={() => setPSex(s)} className={`lib-seg${pSex === s ? ' is-on' : ''}`}>
                            {s === 'F' ? `♀ ${T.female}` : `♂ ${T.male}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>{T.birthDate}</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr', gap: 8 }}>
                        <select style={inputStyle} value={pMonth} onChange={e => setPMonth(e.target.value)}>
                          {MONTHS.map((_, i) => <option key={i} value={i+1}>{monthOptionLabel(i, locale)}</option>)}
                        </select>
                        <input style={inputStyle} placeholder={T.day} type="number" min={1} max={31} value={pDay} onChange={e => setPDay(e.target.value)} required />
                        <input style={inputStyle} placeholder={T.year} type="number" min={1900} max={new Date().getFullYear()} value={pYear} onChange={e => setPYear(e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>{T.birthTime} <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-3)' }}>{T.optional}</span></label>
                      <select style={inputStyle} value={pHourIndex} onChange={e => setPHourIndex(parseInt(e.target.value))}>
                        {TIME_RANGES.map((t, i) => <option key={i} value={i}>{timeRangeLabel(t.label, locale)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>{T.birthCity}</label>
                      <input style={inputStyle} placeholder={T.cityPh} value={pCity} onChange={e => setPCity(e.target.value)} required />
                    </div>
                    {savePersonError && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{savePersonError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => { setShowAddPerson(false); setSavePersonError('') }} className="ap-btn-ghost" style={{ flex: 1 }}>{T.cancel}</button>
                      <button type="submit" disabled={savingPerson} className="ap-btn" style={{ flex: 2 }}>{savingPerson ? T.saving : T.save}</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setShowAddPerson(true)} className="lib-add">
                    <span className="material-icons" aria-hidden="true">person_add</span>{T.addPerson}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
      <style>{LIB_CSS}</style>
    </main>
  )
}

const LIB_TEXT = {
  ko: { loading: '불러오는 중...', title: '나의 기록', sub: '지금까지 받은 리딩과 저장한 사람들을 모아두었어요.', history: '리딩 기록', persons: '저장한 사람', signOut: '로그아웃',
    emptyTitle: '아직 펼쳐본 별 지도가 없어요', emptyBody: '첫 리딩을 받으면 이곳에 차곡차곡 쌓여요.', goReadings: '운세 보러 가기',
    personsEmptyTitle: '저장한 사람이 없어요', personsEmptyBody: '가족이나 연인의 출생 정보를 저장해두면 궁합과 리딩을 더 빠르게 볼 수 있어요.',
    del: '삭제', addPerson: '사람 추가', name: '이름', namePh: '예: 지수', gender: '성별', female: '여성', male: '남성', birthDate: '생년월일', day: '일', year: '년',
    birthTime: '태어난 시간', optional: '(선택)', birthCity: '태어난 도시', cityPh: '예: 서울', cancel: '취소', save: '저장', saving: '저장 중...' },
  ja: { loading: '読み込み中...', title: '履歴', sub: 'これまでのリーディングと保存した人物をまとめています。', history: 'リーディング履歴', persons: '保存した人物', signOut: 'ログアウト',
    emptyTitle: 'まだ開いた星の地図はありません', emptyBody: '最初のリーディングを受けると、ここに記録されます。', goReadings: '占いを見る',
    personsEmptyTitle: '保存した人物はいません', personsEmptyBody: '家族や恋人の出生情報を保存すると、相性やリーディングをすばやく見られます。',
    del: '削除', addPerson: '人物を追加', name: '名前', namePh: '例: さくら', gender: '性別', female: '女性', male: '男性', birthDate: '生年月日', day: '日', year: '年',
    birthTime: '出生時間', optional: '(任意)', birthCity: '出生地', cityPh: '例: 東京', cancel: 'キャンセル', save: '保存', saving: '保存中...' },
  en: { loading: 'Loading...', title: 'Library', sub: 'Your past readings and saved people, all in one place.', history: 'Reading History', persons: 'My Persons', signOut: 'Sign out',
    emptyTitle: 'No star maps unfolded yet', emptyBody: 'Your readings will gather here once you receive your first one.', goReadings: 'Go to Readings',
    personsEmptyTitle: 'No saved people yet', personsEmptyBody: 'Save the birth details of family or a partner to start compatibility and readings faster.',
    del: 'Delete', addPerson: 'Add Person', name: 'Name', namePh: 'e.g. Jessica', gender: 'Gender', female: 'Female', male: 'Male', birthDate: 'Birth Date', day: 'Day', year: 'Year',
    birthTime: 'Birth Time', optional: '(optional)', birthCity: 'Birth City', cityPh: 'e.g. New York', cancel: 'Cancel', save: 'Save Person', saving: 'Saving...' },
}

const TYPE_LABELS_I18N: Record<string, Record<string, string>> = {
  ko: { personal_fortune: '나의 운명 풀이', daily: '오늘의 운세', yearly: '신년 운세', compatibility: '궁합', scenario: '별에게 물어봐',
    tarot_three_card: '타로 · 3카드', tarot_relationship: '타로 · 관계', tarot_celtic_cross: '타로 · 심층 분석', tarot_scenario: '타로 · 질문' },
  ja: { personal_fortune: '運命リーディング', daily: '今日の運勢', yearly: '年運', compatibility: '相性', scenario: '星に聞く',
    tarot_three_card: 'タロット · 3枚', tarot_relationship: 'タロット · 関係', tarot_celtic_cross: 'タロット · ケルト十字', tarot_scenario: 'タロット · 質問' },
}

const LIB_CSS = `
  .lib-center { display:flex; align-items:center; justify-content:center; }
  .lib-loading { color: var(--gold); font-family: 'Cormorant Garamond', serif; font-size: 18px; animation: apGlow 2s ease-in-out infinite; }
  .lib-mhead { display:flex; justify-content:space-between; align-items:center; padding: 12px 16px; }
  .lib-mlogo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size:16px; letter-spacing:.2em; color: var(--gold); text-decoration:none; }
  .lib-wrap { padding-top: 16px; }
  .lib-head { margin-bottom: 22px; }
  .lib-tabs { display:inline-grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(255,255,255,.04); border: 1px solid var(--line); margin-bottom: 24px; width: 100%; max-width: 420px; }
  .lib-tab { display:flex; align-items:center; justify-content:center; gap: 6px; min-height: 42px; border: 0; border-radius: 999px; background: transparent; color: var(--ink-2); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .2s, color .2s; }
  .lib-tab .material-icons { font-size: 18px; }
  .lib-tab.is-on { background: linear-gradient(180deg, #e3c879, #c9a84c); color: #1a1408; }
  .lib-grid { display:grid; grid-template-columns: 1fr; gap: 12px; }
  .lib-item { width:100%; text-align:left; padding: 16px 18px; cursor:pointer; color: inherit; font: inherit; display:flex; flex-direction:column; gap: 6px; }
  .lib-item-top { display:flex; justify-content:space-between; align-items:center; gap: 8px; }
  .lib-type { font-size: 11.5px; font-weight: 700; border: 1px solid; border-radius: 999px; padding: 2px 10px; white-space: nowrap; }
  .lib-date { color: var(--ink-3); font-size: 12px; white-space: nowrap; }
  .lib-name { color: var(--ink); font-size: 15.5px; font-weight: 600; }
  .lib-meta { color: var(--ink-3); font-size: 12.5px; margin-top: 2px; }
  .lib-cards { display:flex; gap: 6px; margin-top: 4px; }
  .lib-cards img { width: 32px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid var(--gold-line); }
  .lib-skeleton { height: 110px; position:relative; overflow:hidden; }
  .lib-skeleton::after { content:""; position:absolute; inset:0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent); animation: libShimmer 1.4s infinite; }
  @keyframes libShimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
  .lib-empty { text-align:center; padding: 44px 24px; display:flex; flex-direction:column; align-items:center; }
  .lib-empty-glyph { font-size: 34px; color: var(--gold-light); text-shadow: 0 0 24px rgba(230,205,133,.5); margin-bottom: 14px; }
  .lib-empty-title { font-size: 17px; font-weight: 700; }
  .lib-empty-body { margin-top: 8px; font-size: 14px; color: var(--ink-2); line-height: 1.7; max-width: 38ch; }
  .lib-person { display:flex; align-items:center; gap: 14px; padding: 16px; }
  .lib-avatar { width: 44px; height: 44px; flex-shrink:0; border-radius: 50%; display:grid; place-items:center; font-weight: 700; font-size: 17px;
    color: var(--gold-light); background: var(--gold-soft); border: 1px solid var(--gold-line); }
  .lib-delete { background: none; border: 1px solid rgba(242,155,155,.4); border-radius: 999px; color: var(--danger); font: inherit; font-size: 12.5px; padding: 6px 12px; cursor: pointer; min-height: 34px; }
  .lib-delete:hover { background: rgba(242,155,155,.08); }
  .lib-form { display:flex; flex-direction:column; gap: 16px; padding: 22px; max-width: 560px; }
  .lib-form-title { color: var(--gold-light); font-size: 15px; font-weight: 700; }
  .lib-seg { flex:1; min-height: 44px; border-radius: 12px; cursor: pointer; font: inherit; font-weight: 600; font-size: 14px;
    border: 1px solid var(--line-strong); background: transparent; color: var(--ink-2); transition: all .2s; }
  .lib-seg.is-on { border-color: var(--gold); background: var(--gold-soft); color: var(--gold-light); }
  .lib-add { width:100%; max-width: 560px; display:flex; align-items:center; justify-content:center; gap: 8px; min-height: 52px; border-radius: 16px; cursor:pointer;
    background: rgba(201,168,76,.06); border: 1px dashed rgba(201,168,76,.4); color: var(--gold-light); font: inherit; font-size: 14.5px; font-weight: 600; transition: background .2s; }
  .lib-add:hover { background: rgba(201,168,76,.12); }
  .lib-detail-head { display:flex; justify-content:space-between; align-items:center; padding-top: 16px; }
  @media (min-width: 768px) { .lib-grid { grid-template-columns: 1fr 1fr; gap: 16px; } }
  @media (min-width: 1100px) { .lib-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 1024px) { .lib-wrap { padding-top: 48px; } .lib-detail-head { padding-top: 32px; } }
`

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <main className="ap-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Loading...</p>
      </main>
    }>
      <LibraryPageInner />
    </Suspense>
  )
}
