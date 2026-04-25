'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from '@/components/BottomNav'
import { apiGet } from '@/lib/api'

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

// base anchor: 1924 = Rat
const CHINESE_ORDER = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig']

function getHoroscope(month: number, day: number): string {
  for (const s of HOROSCOPE_SIGNS) {
    const [sm, sd] = s.start
    const [em, ed] = s.end
    if (sm <= em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em)) return s.name
    } else {
      // wrap around year (Capricorn: Dec22–Jan19)
      if ((month === sm && day >= sd) || month > sm || (month === em && day <= ed) || month < em) return s.name
    }
  }
  return 'Capricorn'
}

function getChineseZodiac(year: number): string {
  return CHINESE_ORDER[((year - 1924) % 12 + 12) % 12]
}

function getTodayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

type Mode = 'horoscope' | 'chinese'

interface FortuneData { [key: string]: unknown }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = Array.from({length: 31}, (_, i) => i + 1)
const YEARS = Array.from({length: 100}, (_, i) => new Date().getFullYear() - i)

const selectStyle: React.CSSProperties = {
  flex: 1, background: '#0f1829', border: '1px solid var(--border)',
  borderRadius: 12, padding: '8px 10px', color: '#fff',
  fontSize: 14, outline: 'none', colorScheme: 'dark', cursor: 'pointer',
  appearance: 'none' as const, WebkitAppearance: 'none' as const,
}

const MOON_PHASE_EMOJIS: Record<string, string> = {
  'new moon': '🌑',
  'waxing crescent': '🌒',
  'first quarter': '🌓',
  'waxing gibbous': '🌔',
  'full moon': '🌕',
  'waning gibbous': '🌖',
  'third quarter': '🌗',
  'last quarter': '🌗',
  'waning crescent': '🌘',
}

interface MoonPhaseData {
  phase?: string
  illumination?: number | null
  moon_age?: number | null
  next_full_moon?: string | null
}

export default function TodayFortunePage() {
  const { user } = useAuth(false)
  const [bMonth, setBMonth] = useState('')
  const [bDay, setBDay] = useState('')
  const [bYear, setBYear] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode | null>(null)
  const [autoHoro, setAutoHoro] = useState<string | null>(null)
  const [autoChinese, setAutoChinese] = useState<string | null>(null)
  const [fortune, setFortune] = useState<FortuneData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'pick' | 'result'>('pick')
  const [moonPhase, setMoonPhase] = useState<MoonPhaseData | null>(null)

  useEffect(() => {
    apiGet<MoonPhaseData>('/moon_phase')
      .then(data => setMoonPhase(data))
      .catch(() => {})
  }, [])

  function handleBirthday(m: string, d: string, y: string) {
    const month = parseInt(m), day = parseInt(d), year = parseInt(y)
    if (month && day) {
      setAutoHoro(getHoroscope(month, day))
    } else {
      setAutoHoro(null)
    }
    if (year) {
      setAutoChinese(getChineseZodiac(year))
    } else {
      setAutoChinese(null)
    }
  }

  function selectSign(name: string, m: Mode) {
    if (selected === name && mode === m) { setSelected(null); setMode(null) }
    else { setSelected(name); setMode(m) }
  }

  async function fetchFortune() {
    if (!selected || !mode) return
    setLoading(true)
    setError('')
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

  const canSubmit = !!selected && !loading

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 96 }}>

      <header style={{
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', maxWidth: 480, margin: '0 auto',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>ASTROPILLAR</span>
        </Link>
        {user
          ? <Link href="/menu" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>{user.email?.split('@')[0]} ✦</Link>
          : <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Sign in →</Link>
        }
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 20px 0' }}>

        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <h1 className="font-display" style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 2 }}>Today&apos;s Fortune</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{todayStr}</p>
          <span style={{ display: 'inline-block', marginTop: 5, border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>
            FREE — No login required
          </span>
        </div>

        {/* Moon Phase Card */}
        {moonPhase?.phase && (
          <div style={{ background: 'rgba(22,33,62,0.7)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 16, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>
              {moonPhase.phase ? (MOON_PHASE_EMOJIS[moonPhase.phase.toLowerCase()] ?? '🌙') : '🌙'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#a78bfa', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>Moon Phase</p>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{moonPhase.phase}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {moonPhase.illumination != null ? `${Math.round(moonPhase.illumination <= 1 ? moonPhase.illumination * 100 : moonPhase.illumination)}% illuminated` : ''}
                {moonPhase.moon_age != null ? ` · Day ${Math.round(moonPhase.moon_age)} of cycle` : ''}
              </p>
            </div>
          </div>
        )}

        {step === 'result' && fortune ? (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                {mode === 'horoscope' ? '✦ Horoscope' : '✦ Chinese Zodiac'} · {selected}
              </p>
              {fortune.intro && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', marginBottom: 16, lineHeight: 1.7 }}>
                  {fortune.intro as string}
                </p>
              )}
              {fortune.fortune && (
                <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.9, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                  {(fortune.fortune as string).replace(/^\[[\w\s]+\]\s*/i, '')}
                </p>
              )}
              {fortune.tip && (
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

            {/* Birthday input */}
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                Your Birthday
              </p>
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

            {/* Horoscope grid */}
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
                      <div style={{
                        width: 96, height: 96, borderRadius: 20,
                        background: highlight ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${isSelected ? 'var(--gold)' : isAuto ? 'rgba(201,168,76,0.5)' : 'transparent'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: highlight ? '0 0 12px rgba(201,168,76,0.3)' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        <Image src={`${IMG}${s.img}`} alt={s.name} width={72} height={72} style={{ objectFit: 'contain' }} unoptimized />
                      </div>
                      <span style={{ color: isSelected ? 'var(--gold)' : isAuto ? 'rgba(201,168,76,0.8)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{s.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chinese Zodiac grid */}
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
                      <div style={{
                        width: 96, height: 96, borderRadius: 20,
                        background: highlight ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${isSelected ? '#a78bfa' : isAuto ? 'rgba(167,139,250,0.5)' : 'transparent'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: highlight ? '0 0 12px rgba(167,139,250,0.3)' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        <Image src={`${IMG}${s.img}`} alt={s.name} width={72} height={72} style={{ objectFit: 'contain' }} unoptimized />
                      </div>
                      <span style={{ color: isSelected ? '#a78bfa' : isAuto ? 'rgba(167,139,250,0.8)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{s.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}

            <button onClick={fetchFortune} disabled={!canSubmit} className="btn-gold"
              style={{ opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? '✦ Reading the stars...' : "See Today's Fortune"}
            </button>

          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}
