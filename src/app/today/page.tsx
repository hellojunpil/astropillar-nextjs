'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiGet } from '@/lib/api'

const ZODIAC_SIGNS = [
  { name: 'Aries', emoji: '♈', dates: 'Mar 21 – Apr 19' },
  { name: 'Taurus', emoji: '♉', dates: 'Apr 20 – May 20' },
  { name: 'Gemini', emoji: '♊', dates: 'May 21 – Jun 20' },
  { name: 'Cancer', emoji: '♋', dates: 'Jun 21 – Jul 22' },
  { name: 'Leo', emoji: '♌', dates: 'Jul 23 – Aug 22' },
  { name: 'Virgo', emoji: '♍', dates: 'Aug 23 – Sep 22' },
  { name: 'Libra', emoji: '♎', dates: 'Sep 23 – Oct 22' },
  { name: 'Scorpio', emoji: '♏', dates: 'Oct 23 – Nov 21' },
  { name: 'Sagittarius', emoji: '♐', dates: 'Nov 22 – Dec 21' },
  { name: 'Capricorn', emoji: '♑', dates: 'Dec 22 – Jan 19' },
  { name: 'Aquarius', emoji: '♒', dates: 'Jan 20 – Feb 18' },
  { name: 'Pisces', emoji: '♓', dates: 'Feb 19 – Mar 20' },
]

const CHINESE_SIGNS = [
  { name: 'Rat', emoji: '🐭', years: '1924,1936,1948,1960,1972,1984,1996,2008,2020' },
  { name: 'Ox', emoji: '🐂', years: '1925,1937,1949,1961,1973,1985,1997,2009,2021' },
  { name: 'Tiger', emoji: '🐯', years: '1926,1938,1950,1962,1974,1986,1998,2010,2022' },
  { name: 'Rabbit', emoji: '🐰', years: '1927,1939,1951,1963,1975,1987,1999,2011,2023' },
  { name: 'Dragon', emoji: '🐲', years: '1928,1940,1952,1964,1976,1988,2000,2012,2024' },
  { name: 'Snake', emoji: '🐍', years: '1929,1941,1953,1965,1977,1989,2001,2013,2025' },
  { name: 'Horse', emoji: '🐴', years: '1930,1942,1954,1966,1978,1990,2002,2014,2026' },
  { name: 'Goat', emoji: '🐑', years: '1931,1943,1955,1967,1979,1991,2003,2015' },
  { name: 'Monkey', emoji: '🐒', years: '1932,1944,1956,1968,1980,1992,2004,2016' },
  { name: 'Rooster', emoji: '🐓', years: '1933,1945,1957,1969,1981,1993,2005,2017' },
  { name: 'Dog', emoji: '🐕', years: '1934,1946,1958,1970,1982,1994,2006,2018' },
  { name: 'Pig', emoji: '🐷', years: '1935,1947,1959,1971,1983,1995,2007,2019' },
]

interface FortuneData {
  fortune?: string
  message?: string
  summary?: string
  [key: string]: unknown
}

const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

export default function TodayFortunePage() {
  const [zodiac, setZodiac] = useState<string | null>(null)
  const [chinese, setChinese] = useState<string | null>(null)
  const [fortune, setFortune] = useState<FortuneData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'pick' | 'result'>('pick')

  async function fetchFortune() {
    if (!zodiac && !chinese) return
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (zodiac) params.zodiac = zodiac
      if (chinese) params.chinese = chinese
      const data = await apiGet<FortuneData>('/daily_fortune', params)
      setFortune(data)
      setStep('result')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load fortune. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fortuneText = fortune?.fortune || fortune?.message || fortune?.summary ||
    (typeof fortune === 'object' && fortune !== null
      ? Object.values(fortune).find(v => typeof v === 'string' && v.length > 30) as string
      : null)

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 48 }}>

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
            Today's Fortune
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
              {zodiac && <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                {ZODIAC_SIGNS.find(z => z.name === zodiac)?.emoji} {zodiac}
                {chinese && ` · ${CHINESE_SIGNS.find(c => c.name === chinese)?.emoji} Year of the ${chinese}`}
              </p>}
              {fortuneText ? (
                <p style={{ color: '#ddd', fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{fortuneText}</p>
              ) : (
                <div>
                  {Object.entries(fortune).filter(([, v]) => typeof v === 'string').map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 16 }}>
                      <p style={{ color: 'var(--gold)', fontSize: 12, marginBottom: 6, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</p>
                      <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.7 }}>{v as string}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => { setStep('pick'); setFortune(null); setZodiac(null); setChinese(null) }}
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

            {/* Western Zodiac */}
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Western Zodiac Sign
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {ZODIAC_SIGNS.map(s => (
                  <button key={s.name} type="button" onClick={() => setZodiac(zodiac === s.name ? null : s.name)} style={{
                    background: zodiac === s.name ? 'rgba(201,168,76,0.15)' : '#0f1829',
                    border: `1px solid ${zodiac === s.name ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 10, padding: '10px 6px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ fontSize: 18 }}>{s.emoji}</span>
                    <span style={{ color: zodiac === s.name ? 'var(--gold)' : '#fff', fontSize: 11, fontWeight: 600 }}>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chinese Zodiac */}
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Chinese Zodiac Sign <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>(optional)</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {CHINESE_SIGNS.map(s => (
                  <button key={s.name} type="button" onClick={() => setChinese(chinese === s.name ? null : s.name)} style={{
                    background: chinese === s.name ? 'rgba(167,139,250,0.15)' : '#0f1829',
                    border: `1px solid ${chinese === s.name ? '#a78bfa' : 'var(--border)'}`,
                    borderRadius: 10, padding: '10px 6px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ fontSize: 18 }}>{s.emoji}</span>
                    <span style={{ color: chinese === s.name ? '#a78bfa' : '#fff', fontSize: 11, fontWeight: 600 }}>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}

            <button
              onClick={fetchFortune}
              disabled={!zodiac || loading}
              className="btn-gold"
              style={{ opacity: (!zodiac || loading) ? 0.5 : 1, cursor: (!zodiac || loading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? '✦ Reading the stars...' : 'See Today\'s Fortune'}
            </button>

          </div>
        )}
      </div>
    </main>
  )
}
