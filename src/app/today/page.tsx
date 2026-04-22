'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import BottomNav from '@/components/BottomNav'

const IMG = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

const HOROSCOPE_SIGNS = [
  { name: 'Aries',       img: '01_01_aries.png',       dates: 'Mar 21 – Apr 19' },
  { name: 'Taurus',      img: '01_02_taurus.png',      dates: 'Apr 20 – May 20' },
  { name: 'Gemini',      img: '01_03_gemini.png',      dates: 'May 21 – Jun 20' },
  { name: 'Cancer',      img: '01_04_cancer.png',      dates: 'Jun 21 – Jul 22' },
  { name: 'Leo',         img: '02_01_leo.png',         dates: 'Jul 23 – Aug 22' },
  { name: 'Virgo',       img: '02_02_virgo.png',       dates: 'Aug 23 – Sep 22' },
  { name: 'Libra',       img: '02_03_libra.png',       dates: 'Sep 23 – Oct 22' },
  { name: 'Scorpio',     img: '02_04_scorpio.png',     dates: 'Oct 23 – Nov 21' },
  { name: 'Sagittarius', img: '03_01_sagittarius.png', dates: 'Nov 22 – Dec 21' },
  { name: 'Capricorn',   img: '03_02_capricorn.png',   dates: 'Dec 22 – Jan 19' },
  { name: 'Aquarius',    img: '03_03_aquarius.png',    dates: 'Jan 20 – Feb 18' },
  { name: 'Pisces',      img: '03_04_pisces.png',      dates: 'Feb 19 – Mar 20' },
]

const CHINESE_SIGNS = [
  { name: 'Rat',     img: '01_01_rat.png',     years: '2008, 1996, 1984' },
  { name: 'Ox',      img: '01_02_ox.png',      years: '2009, 1997, 1985' },
  { name: 'Tiger',   img: '01_03_tiger.png',   years: '2010, 1998, 1986' },
  { name: 'Rabbit',  img: '01_04_rabbit.png',  years: '2011, 1999, 1987' },
  { name: 'Dragon',  img: '02_01_dragon.png',  years: '2012, 2000, 1988' },
  { name: 'Snake',   img: '02_02_snake.png',   years: '2013, 2001, 1989' },
  { name: 'Horse',   img: '02_03_horse.png',   years: '2014, 2002, 1990' },
  { name: 'Goat',    img: '02_04_goat.png',    years: '2015, 2003, 1991' },
  { name: 'Monkey',  img: '03_01_monkey.png',  years: '2016, 2004, 1992' },
  { name: 'Rooster', img: '03_02_rooster.png', years: '2017, 2005, 1993' },
  { name: 'Dog',     img: '03_03_dog.png',     years: '2018, 2006, 1994' },
  { name: 'Pig',     img: '03_04_pig.png',     years: '2019, 2007, 1995' },
]

interface FortuneData {
  [key: string]: unknown
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

export default function TodayFortunePage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode | null>(null)
  const [fortune, setFortune] = useState<FortuneData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'pick' | 'result'>('pick')

  function selectSign(name: string, m: Mode) {
    if (selected === name && mode === m) {
      setSelected(null)
      setMode(null)
    } else {
      setSelected(name)
      setMode(m)
    }
  }

  async function fetchFortune() {
    if (!selected || !mode) return
    setLoading(true)
    setError('')
    try {
      const dateKey = getTodayKey()
      const signKey = selected.toLowerCase()
      const docId = mode === 'horoscope'
        ? `${dateKey}_horoscope_${signKey}`
        : `${dateKey}_zodiac_${signKey}`
      const snap = await getDoc(doc(db, 'daily_fortunes', docId))
      if (!snap.exists()) {
        setError('No fortune available for today. Please check back later.')
        return
      }
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

      {/* Header */}
      <header style={{
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', maxWidth: 480, margin: '0 auto',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>
            ASTROPILLAR
          </span>
        </Link>
        <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
          Sign in →
        </Link>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px 0' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>🌙</p>
          <h1 className="font-display" style={{ color: '#fff', fontSize: 24, fontWeight: 600, marginBottom: 6 }}>
            Today&apos;s Fortune
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{todayStr}</p>
          <span style={{
            display: 'inline-block', marginTop: 8,
            border: '1px solid #2ecc71', color: '#2ecc71',
            borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700,
          }}>FREE — No login required</span>
        </div>

        {step === 'result' && fortune ? (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                {mode === 'horoscope' ? '✦ Horoscope' : '✦ Chinese Zodiac'} · {selected}
              </p>
              {Object.entries(fortune)
                .filter(([, v]) => typeof v === 'string' && (v as string).length > 0)
                .map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 16 }}>
                    <p style={{ color: 'var(--gold)', fontSize: 11, marginBottom: 6, textTransform: 'capitalize', letterSpacing: 1 }}>
                      {k.replace(/_/g, ' ')}
                    </p>
                    <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{v as string}</p>
                  </div>
                ))}
            </div>

            <button
              onClick={() => { setStep('pick'); setFortune(null); setSelected(null); setMode(null) }}
              style={{ width: '100%', background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 50, padding: '12px', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}
            >
              ← Check Another Sign
            </button>

            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>Want a personalized reading?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                Get your full BaZi chart + Astrology reading tailored to your exact birth details.
              </p>
              <Link href="/login" className="btn-gold" style={{ fontSize: 14, padding: '12px 28px' }}>
                Start for Free →
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Horoscope */}
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Horoscope
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {HOROSCOPE_SIGNS.map(s => {
                  const isSelected = selected === s.name && mode === 'horoscope'
                  return (
                    <button key={s.name} type="button" onClick={() => selectSign(s.name, 'horoscope')} style={{
                      background: isSelected ? 'rgba(201,168,76,0.15)' : '#0f1829',
                      border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '10px 6px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <Image src={`${IMG}${s.img}`} alt={s.name} width={32} height={32} style={{ objectFit: 'contain' }} unoptimized />
                      <span style={{ color: isSelected ? 'var(--gold)' : '#fff', fontSize: 11, fontWeight: 600 }}>{s.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chinese Zodiac */}
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Chinese Zodiac
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {CHINESE_SIGNS.map(s => {
                  const isSelected = selected === s.name && mode === 'chinese'
                  return (
                    <button key={s.name} type="button" onClick={() => selectSign(s.name, 'chinese')} style={{
                      background: isSelected ? 'rgba(167,139,250,0.15)' : '#0f1829',
                      border: `1px solid ${isSelected ? '#a78bfa' : 'var(--border)'}`,
                      borderRadius: 10, padding: '10px 6px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <Image src={`${IMG}${s.img}`} alt={s.name} width={32} height={32} style={{ objectFit: 'contain' }} unoptimized />
                      <span style={{ color: isSelected ? '#a78bfa' : '#fff', fontSize: 11, fontWeight: 600 }}>{s.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}

            <button
              onClick={fetchFortune}
              disabled={!canSubmit}
              className="btn-gold"
              style={{ opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? '✦ Reading the stars...' : 'See Today\'s Fortune'}
            </button>

          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}
