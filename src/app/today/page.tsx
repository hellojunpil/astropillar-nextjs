'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from '@/components/BottomNav'
import { apiGet, apiPost } from '@/lib/api'

const IMG = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

const HOROSCOPE_SIGNS = [
  { name: 'Aries',       img: '01_01_aries.png',       start: [3,21], end: [4,19] },
  { name: 'Taurus',      img: '01_02_taurus.png',      start: [4,20], end: [5,20] },
  { name: 'Gemini',      img: '01_03_gemini.png',      start: [5,21], end: [6,20] },
  { name: 'Cancer',      img: '01_04_cancer.png',      start: [6,21], end: [7,22] },
  { name: 'Leo',         img: '02_01_leo.png',         start: [7,23], end: [8,22] },
  { name: 'Virgo',       img: '02_02_virgo.png',       start: [8,23], end: [9,22] },
  { name: 'Libra',       img: '02_03_libra.png',       start: [9,23], end: [10,22] },
  { name: 'Scorpio',     img: '02_04_scorpio.png',     start: [10,23], end: [11,21] },
  { name: 'Sagittarius', img: '03_01_sagittarius.png', start: [11,22], end: [12,21] },
  { name: 'Capricorn',   img: '03_02_capricorn.png',   start: [12,22], end: [1,19] },
  { name: 'Aquarius',    img: '03_03_aquarius.png',    start: [1,20],  end: [2,18] },
  { name: 'Pisces',      img: '03_04_pisces.png',      start: [2,19],  end: [3,20] },
]

const CHINESE_SIGNS = [
  { name: 'Rat',     img: '01_01_rat.png'     },
  { name: 'Ox',      img: '01_02_ox.png'      },
  { name: 'Tiger',   img: '01_03_tiger.png'   },
  { name: 'Rabbit',  img: '01_04_rabbit.png'  },
  { name: 'Dragon',  img: '02_01_dragon.png'  },
  { name: 'Snake',   img: '02_02_snake.png'   },
  { name: 'Horse',   img: '02_03_horse.png'   },
  { name: 'Goat',    img: '02_04_goat.png'    },
  { name: 'Monkey',  img: '03_01_monkey.png'  },
  { name: 'Rooster', img: '03_02_rooster.png' },
  { name: 'Dog',     img: '03_03_dog.png'     },
  { name: 'Pig',     img: '03_04_pig.png'     },
]

const TAROT_CARDS = [
  // Major Arcana
  { name: 'The Fool',           file: 'major_arcana_fool'        },
  { name: 'The Magician',       file: 'major_arcana_magician'    },
  { name: 'The High Priestess', file: 'major_arcana_priestess'   },
  { name: 'The Empress',        file: 'major_arcana_empress'     },
  { name: 'The Emperor',        file: 'major_arcana_emperor'     },
  { name: 'The Hierophant',     file: 'major_arcana_hierophant'  },
  { name: 'The Lovers',         file: 'major_arcana_lovers'      },
  { name: 'The Chariot',        file: 'major_arcana_chariot'     },
  { name: 'Strength',           file: 'major_arcana_strength'    },
  { name: 'The Hermit',         file: 'major_arcana_hermit'      },
  { name: 'Wheel of Fortune',   file: 'major_arcana_fortune'     },
  { name: 'Justice',            file: 'major_arcana_justice'     },
  { name: 'The Hanged Man',     file: 'major_arcana_hanged'      },
  { name: 'Death',              file: 'major_arcana_death'       },
  { name: 'Temperance',         file: 'major_arcana_temperance'  },
  { name: 'The Devil',          file: 'major_arcana_devil'       },
  { name: 'The Tower',          file: 'major_arcana_tower'       },
  { name: 'The Star',           file: 'major_arcana_star'        },
  { name: 'The Moon',           file: 'major_arcana_moon'        },
  { name: 'The Sun',            file: 'major_arcana_sun'         },
  { name: 'Judgement',          file: 'major_arcana_judgement'   },
  { name: 'The World',          file: 'major_arcana_world'       },
  // Cups
  { name: 'Ace of Cups',    file: 'minor_arcana_cups_ace'    },
  { name: 'Two of Cups',    file: 'minor_arcana_cups_2'      },
  { name: 'Three of Cups',  file: 'minor_arcana_cups_3'      },
  { name: 'Four of Cups',   file: 'minor_arcana_cups_4'      },
  { name: 'Five of Cups',   file: 'minor_arcana_cups_5'      },
  { name: 'Six of Cups',    file: 'minor_arcana_cups_6'      },
  { name: 'Seven of Cups',  file: 'minor_arcana_cups_7'      },
  { name: 'Eight of Cups',  file: 'minor_arcana_cups_8'      },
  { name: 'Nine of Cups',   file: 'minor_arcana_cups_9'      },
  { name: 'Ten of Cups',    file: 'minor_arcana_cups_10'     },
  { name: 'Page of Cups',   file: 'minor_arcana_cups_page'   },
  { name: 'Knight of Cups', file: 'minor_arcana_cups_knight' },
  { name: 'Queen of Cups',  file: 'minor_arcana_cups_queen'  },
  { name: 'King of Cups',   file: 'minor_arcana_cups_king'   },
  // Pentacles
  { name: 'Ace of Pentacles',    file: 'minor_arcana_pentacles_ace'    },
  { name: 'Two of Pentacles',    file: 'minor_arcana_pentacles_2'      },
  { name: 'Three of Pentacles',  file: 'minor_arcana_pentacles_3'      },
  { name: 'Four of Pentacles',   file: 'minor_arcana_pentacles_4'      },
  { name: 'Five of Pentacles',   file: 'minor_arcana_pentacles_5'      },
  { name: 'Six of Pentacles',    file: 'minor_arcana_pentacles_6'      },
  { name: 'Seven of Pentacles',  file: 'minor_arcana_pentacles_7'      },
  { name: 'Eight of Pentacles',  file: 'minor_arcana_pentacles_8'      },
  { name: 'Nine of Pentacles',   file: 'minor_arcana_pentacles_9'      },
  { name: 'Ten of Pentacles',    file: 'minor_arcana_pentacles_10'     },
  { name: 'Page of Pentacles',   file: 'minor_arcana_pentacles_page'   },
  { name: 'Knight of Pentacles', file: 'minor_arcana_pentacles_knight' },
  { name: 'Queen of Pentacles',  file: 'minor_arcana_pentacles_queen'  },
  { name: 'King of Pentacles',   file: 'minor_arcana_pentacles_king'   },
  // Swords
  { name: 'Ace of Swords',    file: 'minor_arcana_swords_ace'    },
  { name: 'Two of Swords',    file: 'minor_arcana_swords_2'      },
  { name: 'Three of Swords',  file: 'minor_arcana_swords_3'      },
  { name: 'Four of Swords',   file: 'minor_arcana_swords_4'      },
  { name: 'Five of Swords',   file: 'minor_arcana_swords_5'      },
  { name: 'Six of Swords',    file: 'minor_arcana_swords_6'      },
  { name: 'Seven of Swords',  file: 'minor_arcana_swords_7'      },
  { name: 'Eight of Swords',  file: 'minor_arcana_swords_8'      },
  { name: 'Nine of Swords',   file: 'minor_arcana_swords_9'      },
  { name: 'Ten of Swords',    file: 'minor_arcana_swords_10'     },
  { name: 'Page of Swords',   file: 'minor_arcana_swords_page'   },
  { name: 'Knight of Swords', file: 'minor_arcana_swords_knight' },
  { name: 'Queen of Swords',  file: 'minor_arcana_swords_queen'  },
  { name: 'King of Swords',   file: 'minor_arcana_swords_king'   },
  // Wands
  { name: 'Ace of Wands',    file: 'minor_arcana_wands_ace'    },
  { name: 'Two of Wands',    file: 'minor_arcana_wands_2'      },
  { name: 'Three of Wands',  file: 'minor_arcana_wands_3'      },
  { name: 'Four of Wands',   file: 'minor_arcana_wands_4'      },
  { name: 'Five of Wands',   file: 'minor_arcana_wands_5'      },
  { name: 'Six of Wands',    file: 'minor_arcana_wands_6'      },
  { name: 'Seven of Wands',  file: 'minor_arcana_wands_7'      },
  { name: 'Eight of Wands',  file: 'minor_arcana_wands_8'      },
  { name: 'Nine of Wands',   file: 'minor_arcana_wands_9'      },
  { name: 'Ten of Wands',    file: 'minor_arcana_wands_10'     },
  { name: 'Page of Wands',   file: 'minor_arcana_wands_page'   },
  { name: 'Knight of Wands', file: 'minor_arcana_wands_knight' },
  { name: 'Queen of Wands',  file: 'minor_arcana_wands_queen'  },
  { name: 'King of Wands',   file: 'minor_arcana_wands_king'   },
]

const CHINESE_ORDER = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = Array.from({length: 31}, (_, i) => i + 1)
const YEARS = Array.from({length: 100}, (_, i) => new Date().getFullYear() - i)
const TAROT_STORAGE_KEY = 'tarot_daily_v1'

const selectStyle: React.CSSProperties = {
  flex: 1, background: '#0f1829', border: '1px solid var(--border)',
  borderRadius: 12, padding: '8px 10px', color: '#fff',
  fontSize: 14, outline: 'none', colorScheme: 'dark', cursor: 'pointer',
  appearance: 'none' as const, WebkitAppearance: 'none' as const,
}

const MOON_PHASE_EMOJIS: Record<string, string> = {
  'new moon': '🌑', 'waxing crescent': '🌒', 'first quarter': '🌓',
  'waxing gibbous': '🌔', 'full moon': '🌕', 'waning gibbous': '🌖',
  'third quarter': '🌗', 'last quarter': '🌗', 'waning crescent': '🌘',
}

interface MoonPhaseData {
  phase?: string
  illumination?: number | null
  moon_age?: number | null
}

interface FortuneData { [key: string]: unknown }

type FortuneMode = 'horoscope' | 'chinese'

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getHoroscope(month: number, day: number): string {
  for (const s of HOROSCOPE_SIGNS) {
    const [sm, sd] = s.start, [em, ed] = s.end
    if (sm <= em) {
      if ((month===sm&&day>=sd)||(month===em&&day<=ed)||(month>sm&&month<em)) return s.name
    } else {
      if ((month===sm&&day>=sd)||month>sm||(month===em&&day<=ed)||month<em) return s.name
    }
  }
  return 'Capricorn'
}

function getChineseZodiac(year: number): string {
  return CHINESE_ORDER[((year-1924)%12+12)%12]
}

function parseTarotResult(text: string): Array<{ header: string; content: string }> {
  const sections: Array<{ header: string; content: string }> = []
  const re = /(?:^|\n)((?:🃏|✦|💡)[^\n]+)\n([\s\S]*?)(?=\n(?:🃏|✦|💡)|$)/g
  let m
  while ((m = re.exec(text)) !== null) {
    const content = m[2].trim()
    if (content) sections.push({ header: m[1].trim(), content })
  }
  return sections.length > 0 ? sections : [{ header: '', content: text.trim() }]
}

const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

export default function TodayFortunePage() {
  const { user } = useAuth(false)
  const [activeTab, setActiveTab] = useState<'fortune' | 'tarot'>('fortune')

  // ── Fortune tab state ─────────────────────────────────────────
  const [bMonth, setBMonth] = useState('')
  const [bDay, setBDay] = useState('')
  const [bYear, setBYear] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<FortuneMode | null>(null)
  const [autoHoro, setAutoHoro] = useState<string | null>(null)
  const [autoChinese, setAutoChinese] = useState<string | null>(null)
  const [fortune, setFortune] = useState<FortuneData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'pick' | 'result'>('pick')
  const [moonPhase, setMoonPhase] = useState<MoonPhaseData | null>(null)

  // ── Tarot tab state ───────────────────────────────────────────
  const [tarotCard, setTarotCard] = useState<{ name: string; file: string } | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [tarotLoading, setTarotLoading] = useState(false)
  const [tarotResult, setTarotResult] = useState<string | null>(null)
  const [tarotError, setTarotError] = useState('')
  const [alreadyDrawn, setAlreadyDrawn] = useState(false)
  const apiCalledRef = useRef(false)

  useEffect(() => {
    apiGet<MoonPhaseData>('/moon_phase').then(d => setMoonPhase(d)).catch(() => {})
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TAROT_STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved.date === getTodayKey() && saved.cardFile && saved.result) {
        const card = TAROT_CARDS.find(c => c.file === saved.cardFile)
        if (card) {
          setTarotCard(card)
          setFlipped(true)
          setTarotResult(saved.result)
          setAlreadyDrawn(true)
          apiCalledRef.current = true
        }
      }
    } catch { /* ignore */ }
  }, [])

  function handleBirthday(m: string, d: string, y: string) {
    const month = parseInt(m), day = parseInt(d), year = parseInt(y)
    setAutoHoro(month && day ? getHoroscope(month, day) : null)
    setAutoChinese(year ? getChineseZodiac(year) : null)
  }

  function selectSign(name: string, m: FortuneMode) {
    if (selected === name && mode === m) { setSelected(null); setMode(null) }
    else { setSelected(name); setMode(m) }
  }

  async function fetchFortune() {
    if (!selected || !mode) return
    setLoading(true); setError('')
    try {
      const dateKey = getTodayKey()
      const signKey = selected.toLowerCase()
      const docId = mode === 'horoscope' ? `${dateKey}_horoscope_${signKey}` : `${dateKey}_zodiac_${signKey}`
      const snap = await getDoc(doc(db, 'daily_fortunes', docId))
      if (!snap.exists()) { setError('No fortune available for today. Please check back later.'); return }
      setFortune(snap.data() as FortuneData)
      setStep('result')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load fortune. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function drawCard() {
    if (alreadyDrawn || tarotCard) return
    const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)]
    setTarotCard(card)
    setTimeout(() => setFlipped(true), 80)
    setTimeout(() => fetchTarotReading(card), 800)
  }

  async function fetchTarotReading(card: { name: string; file: string }) {
    if (apiCalledRef.current) return
    apiCalledRef.current = true
    setTarotLoading(true); setTarotError('')
    try {
      const imageUrl = `${IMG}${card.file}.webp`
      const data = await apiPost<{ content_text: string }>('/tarot/daily', {
        card_name: card.name,
        card_image_url: imageUrl,
      })
      setTarotResult(data.content_text)
      localStorage.setItem(TAROT_STORAGE_KEY, JSON.stringify({
        date: getTodayKey(), cardFile: card.file, cardName: card.name, result: data.content_text,
      }))
    } catch (e: unknown) {
      setTarotError(e instanceof Error ? e.message : 'Could not load your reading. Please try again.')
      apiCalledRef.current = false
    } finally {
      setTarotLoading(false)
    }
  }

  const SCORE_ITEMS = [
    { label: 'Love',     key: 'score_love',     color: '#f472b6' },
    { label: 'Work',     key: 'score_work',     color: '#C9A84C' },
    { label: 'Money',    key: 'score_money',    color: '#4ade80' },
    { label: 'Health',   key: 'score_health',   color: '#a78bfa' },
    { label: 'Social',   key: 'score_social',   color: '#60a5fa' },
    { label: 'Creative', key: 'score_creative', color: '#fb923c' },
  ] as const
  const scores = fortune ? SCORE_ITEMS.filter(s => typeof fortune[s.key] === 'number') : []
  const bestMatch = fortune && typeof fortune.best_match === 'string' ? fortune.best_match : null
  const bestMatchSign = bestMatch ? HOROSCOPE_SIGNS.find(s => s.name.toLowerCase() === bestMatch.toLowerCase()) : null
  const tarotSections = tarotResult ? parseTarotResult(tarotResult) : []

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 96 }}>

      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>ASTROPILLAR</span>
        </Link>
        {user
          ? <Link href="/menu" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>{user.email?.split('@')[0]} ✦</Link>
          : <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Sign in →</Link>
        }
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 20px 0' }}>

        {/* Page title */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <h1 className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 2 }}>Today&apos;s Fortune</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{todayStr}</p>
          <span style={{ display: 'inline-block', marginTop: 5, border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>
            FREE — No login required
          </span>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 4 }}>
          {(['fortune', 'tarot'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? 'var(--card)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-muted)',
              fontSize: 13, fontWeight: activeTab === tab ? 700 : 400,
              transition: 'all 0.2s',
              boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}>
              {tab === 'fortune' ? '🌙 Today\'s Fortune' : '🃏 Daily Tarot'}
            </button>
          ))}
        </div>

        {/* ── Fortune tab ──────────────────────────────────────── */}
        {activeTab === 'fortune' && (
          <div>
            {moonPhase?.phase && (
              <div style={{ background: 'rgba(22,33,62,0.7)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 16, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>
                  {MOON_PHASE_EMOJIS[moonPhase.phase.toLowerCase()] ?? '🌙'}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#a78bfa', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>Moon Phase</p>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{moonPhase.phase}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {moonPhase.illumination != null ? `${Math.round(moonPhase.illumination <= 1 ? moonPhase.illumination*100 : moonPhase.illumination)}% illuminated` : ''}
                    {moonPhase.moon_age != null ? ` · Day ${Math.round(moonPhase.moon_age)} of cycle` : ''}
                  </p>
                </div>
              </div>
            )}

            {step === 'result' && fortune ? (
              <div>
                <div className="card" style={{ marginBottom: 12 }}>
                  <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                    {mode === 'horoscope' ? '✦ Horoscope' : '✦ Chinese Zodiac'} · {selected}
                  </p>
                  {scores.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 18 }}>
                      {scores.map(s => (
                        <div key={s.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>{s.label}</span>
                            <span style={{ color: s.color, fontSize: 13, fontWeight: 700 }}>{fortune[s.key] as number}</span>
                          </div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${fortune[s.key] as number}%`, background: s.color, borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {bestMatch && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', marginBottom: 18 }}>
                      {bestMatchSign && (
                        <Image src={`${IMG}${bestMatchSign.img}`} alt={bestMatch} width={36} height={36} style={{ objectFit: 'contain' }} unoptimized />
                      )}
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>Best Match Today</p>
                        <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{bestMatch}</p>
                      </div>
                    </div>
                  )}
                  {!!fortune.intro && <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', marginBottom: 14, lineHeight: 1.7 }}>{fortune.intro as string}</p>}
                  {!!fortune.fortune && <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.9, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{(fortune.fortune as string).replace(/^\[[\w\s]+\]\s*/i, '')}</p>}
                  {!!fortune.tip && (
                    <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>TIP FOR TODAY</p>
                      <p style={{ color: '#ddd', fontSize: 13, lineHeight: 1.7 }}>{fortune.tip as string}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => { setStep('pick'); setFortune(null); setSelected(null); setMode(null) }}
                  style={{ width: '100%', background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 50, padding: '12px', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>
                  ← Check Another Sign
                </button>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>Want a personalized reading?</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Get your full BaZi chart + Astrology reading tailored to your exact birth details.</p>
                  <Link href="/login" className="btn-gold" style={{ fontSize: 14, padding: '12px 28px' }}>Start for Free →</Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Your Birthday</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={bMonth} onChange={e => { setBMonth(e.target.value); handleBirthday(e.target.value, bDay, bYear) }} style={selectStyle}>
                      <option value="">Month</option>
                      {MONTHS.map((m, i) => <option key={m} value={String(i+1)}>{m}</option>)}
                    </select>
                    <select value={bDay} onChange={e => { setBDay(e.target.value); handleBirthday(bMonth, e.target.value, bYear) }} style={{...selectStyle, flex: '0 0 80px'}}>
                      <option value="">Day</option>
                      {DAYS.map(d => <option key={d} value={String(d)}>{d}</option>)}
                    </select>
                    <select value={bYear} onChange={e => { setBYear(e.target.value); handleBirthday(bMonth, bDay, e.target.value) }} style={{...selectStyle, flex: '0 0 96px'}}>
                      <option value="">Year</option>
                      {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                  {(autoHoro || autoChinese) && (
                    <p style={{ color: 'var(--gold)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                      {autoHoro && `✦ ${autoHoro}`}{autoHoro && autoChinese && ' · '}{autoChinese && `Year of the ${autoChinese}`}
                    </p>
                  )}
                </div>

                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Horoscope</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {HOROSCOPE_SIGNS.map(s => {
                      const isSelected = selected === s.name && mode === 'horoscope'
                      const isAuto = autoHoro === s.name && !(selected && mode)
                      const highlight = isSelected || isAuto
                      return (
                        <button key={s.name} type="button" onClick={() => selectSign(s.name, 'horoscope')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 76, height: 76, borderRadius: 18, background: highlight ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)', border: `2px solid ${isSelected ? 'var(--gold)' : isAuto ? 'rgba(201,168,76,0.5)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: highlight ? '0 0 12px rgba(201,168,76,0.3)' : 'none', transition: 'all 0.15s' }}>
                            <Image src={`${IMG}${s.img}`} alt={s.name} width={56} height={56} style={{ objectFit: 'contain' }} unoptimized />
                          </div>
                          <span style={{ color: isSelected ? 'var(--gold)' : isAuto ? 'rgba(201,168,76,0.8)' : 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>{s.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Chinese Zodiac</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {CHINESE_SIGNS.map(s => {
                      const isSelected = selected === s.name && mode === 'chinese'
                      const isAuto = autoChinese === s.name && !(selected && mode)
                      const highlight = isSelected || isAuto
                      return (
                        <button key={s.name} type="button" onClick={() => selectSign(s.name, 'chinese')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 76, height: 76, borderRadius: 18, background: highlight ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)', border: `2px solid ${isSelected ? '#a78bfa' : isAuto ? 'rgba(167,139,250,0.5)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: highlight ? '0 0 12px rgba(167,139,250,0.3)' : 'none', transition: 'all 0.15s' }}>
                            <Image src={`${IMG}${s.img}`} alt={s.name} width={56} height={56} style={{ objectFit: 'contain' }} unoptimized />
                          </div>
                          <span style={{ color: isSelected ? '#a78bfa' : isAuto ? 'rgba(167,139,250,0.8)' : 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>{s.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}

                <button onClick={fetchFortune} disabled={!selected || loading} className="btn-gold"
                  style={{ opacity: (!selected || loading) ? 0.4 : 1, cursor: (!selected || loading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? '✦ Reading the stars...' : "See Today's Fortune"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tarot tab ─────────────────────────────────────────── */}
        {activeTab === 'tarot' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                One card drawn from the full 78-card Rider-Waite deck.<br />
                {alreadyDrawn ? <span style={{ color: 'var(--gold)', fontSize: 12 }}>You&apos;ve drawn your card for today.</span> : 'One draw per day.'}
              </p>
            </div>

            {/* Card flip area */}
            <div style={{ width: 200, height: 340, perspective: '1000px' }}>
              <div style={{
                width: '100%', height: '100%', position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.7s ease',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>
                {/* Card back */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 14,
                  background: 'linear-gradient(145deg, #1a2a4a 0%, #0d1626 100%)',
                  border: '2px solid var(--gold)',
                  WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                  cursor: tarotCard ? 'default' : 'pointer',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }} onClick={!tarotCard ? drawCard : undefined}>
                  <div style={{ fontSize: 52, color: 'var(--gold)', opacity: 0.6, lineHeight: 1 }}>✦</div>
                  <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 4, opacity: 0.5 }}>ASTROPILLAR</div>
                  {!tarotCard && (
                    <div style={{ position: 'absolute', bottom: 20, fontSize: 11, color: 'rgba(201,168,76,0.6)', letterSpacing: 1 }}>
                      tap to draw
                    </div>
                  )}
                </div>

                {/* Card front */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden',
                  border: '2px solid var(--gold)',
                  WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                  {tarotCard && (
                    <Image
                      src={`${IMG}${tarotCard.file}.webp`}
                      alt={tarotCard.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Card name */}
            {tarotCard && (
              <p className="font-display" style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 600, letterSpacing: 1, textAlign: 'center' }}>
                {tarotCard.name}
              </p>
            )}

            {/* Draw button (before drawing) */}
            {!tarotCard && (
              <button onClick={drawCard} className="btn-gold" style={{ padding: '14px 40px', fontSize: 15 }}>
                Draw Your Card
              </button>
            )}

            {/* Loading */}
            {tarotLoading && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ color: 'var(--gold)', fontSize: 13 }}>✦ Reading the cards...</p>
              </div>
            )}

            {/* Error */}
            {tarotError && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{tarotError}</p>
                <button onClick={() => { apiCalledRef.current = false; fetchTarotReading(tarotCard!) }} className="btn-gold" style={{ fontSize: 13, padding: '10px 24px' }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Result */}
            {tarotResult && tarotSections.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tarotSections.map((sec, i) => (
                  <div key={i} className="card" style={{ padding: '16px 18px' }}>
                    {sec.header && (
                      <p style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{sec.header}</p>
                    )}
                    <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.8 }}>{sec.content}</p>
                  </div>
                ))}

                {/* Upsell */}
                <div className="card" style={{ textAlign: 'center', marginTop: 4 }}>
                  <p style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>Want a deeper reading?</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                    Try Three-Card, Relationship, or Celtic Cross spreads — personalized tarot with full AI interpretation.
                  </p>
                  <Link href="/menu" className="btn-gold" style={{ fontSize: 14, padding: '12px 28px' }}>
                    Explore Readings →
                  </Link>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
      <BottomNav />
    </main>
  )
}
