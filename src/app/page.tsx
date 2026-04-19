'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const ROLLING_TEXTS = [
  "Was I always the one who cared more?",
  "I work so hard. Why does nothing change?",
  "Is this person real, or am I fooling myself?",
  "Why do I keep doing this to myself?",
]

const BUBBLES = [
  { text: 'My toxic trait 😈', style: { top: '48%', left: '4%' }, duration: '3s' },
  { text: 'When will I meet them? 💕', style: { top: '52%', right: '4%' }, duration: '4s' },
  { text: 'What my stars hide 🌌', style: { top: '68%', left: '4%' }, duration: '3.5s' },
]

const REVIEWS = [
  { name: 'Sarah K.', country: '🇺🇸', text: 'This reading was eerily accurate. It described patterns in my life I never told anyone about.' },
  { name: 'Emily R.', country: '🇬🇧', text: 'I was skeptical at first. Now I check AstroPillar every morning. The daily reading is spot on.' },
  { name: 'Mia L.', country: '🇨🇦', text: 'The compatibility reading explained my relationship better than 3 years of therapy did.' },
]

const WHY_ITEMS = [
  {
    num: '01',
    title: 'Two ancient wisdoms. One reading.',
    desc: 'Western astrology reads the sky. Eastern BaZi reads the energy of time. AstroPillar gives you both — and the truth that only appears when they\'re fused.',
  },
  {
    num: '02',
    title: 'Built on real data. Not guesswork.',
    desc: 'Your chart is calculated using verified astronomical and BaZi pillar data — precise, personalized, written specifically for you.',
  },
  {
    num: '03',
    title: 'Ask what you actually want to know.',
    desc: '"Should I quit?" "Is this person right for me?" AstroPillar answers your real questions using your actual chart — not generic advice.',
  },
]

export default function LandingPage() {
  const [counter, setCounter] = useState(10847)
  const [rollingIdx, setRollingIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 4) + 1)
    }, 1200 + Math.random() * 800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setRollingIdx(prev => (prev + 1) % ROLLING_TEXTS.length)
        setVisible(true)
      }, 350)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <main style={{ background: '#07071a', color: '#F6F6F8', overflowX: 'hidden' }}>

      {/* ── HERO SECTION (100vh, full bleed image) ── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

        {/* wrap to 390px */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 390, height: '100%', margin: '0 auto' }}>

          {/* 배경 캐릭터 이미지 */}
          <Image
            src="https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/p_1_main.webp"
            alt="AstroPillar"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
            priority
            unoptimized
          />

          {/* 오버레이 그라디언트 */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(7,7,26,.6) 0%, rgba(7,7,26,0) 25%, rgba(7,7,26,0) 60%, rgba(7,7,26,.85) 85%, rgba(7,7,26,1) 100%)',
            pointerEvents: 'none',
          }} />

          {/* 탑바 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 22px',
            background: 'linear-gradient(to bottom, rgba(7,7,26,.65), transparent)',
          }}>
            <span className="font-display" style={{ color: '#C9A84C', fontSize: 13, fontWeight: 900, letterSpacing: '2.5px' }}>
              ASTROPILLAR
            </span>
            <Link href="/login" style={{
              background: 'transparent', border: '1.5px solid #C9A84C', color: '#C9A84C',
              fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
              textDecoration: 'none',
            }}>
              Sign In
            </Link>
          </div>

          {/* 상단 제목 (이미지 위에 오버랩) */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '56px 20px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'rgba(240,235,255,.85)', fontWeight: 400, letterSpacing: '0.3px', lineHeight: 1.5, marginBottom: 4, textShadow: '0 1px 8px rgba(0,0,0,.9)' }}>
              Where the stars meet your fate.
            </p>
            <h1 className="font-display" style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.0, color: '#F6F6F8', letterSpacing: 2, textShadow: '0 2px 20px rgba(0,0,0,1)' }}>
              ASTROPILLAR
            </h1>
          </div>

          {/* 떠다니는 버블 */}
          {BUBBLES.map((b, i) => (
            <div key={i} style={{
              position: 'absolute', zIndex: 3,
              background: 'rgba(0,0,0,.58)',
              border: '1px solid rgba(255,255,255,.22)',
              borderRadius: 20, padding: '7px 14px',
              fontSize: 13, color: '#fff', fontWeight: 400,
              backdropFilter: 'blur(10px)',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 12px rgba(0,0,0,.3)',
              animationName: 'floatBubble',
              animationDuration: b.duration,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              ...b.style,
            }}>
              {b.text}
            </div>
          ))}

          {/* 하단 CTA 영역 */}
          <div style={{
            position: 'absolute', bottom: 50, left: 0, right: 0, zIndex: 10,
            padding: '0 20px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'linear-gradient(to top, rgba(7,7,26,1) 75%, transparent 100%)',
          }}>
            {/* 롤링 문구 */}
            <div style={{ height: 20, overflow: 'hidden', marginBottom: 14, width: '100%', textAlign: 'center' }}>
              <p style={{
                fontSize: 11, color: 'rgba(200,195,220,.75)', fontWeight: 300,
                lineHeight: '20px', fontStyle: 'italic',
                opacity: visible ? 1 : 0, transition: 'opacity 0.35s',
              }}>
                &ldquo;{ROLLING_TEXTS[rollingIdx]}&rdquo;
              </p>
            </div>

            <Link href="/login" className="btn-gold" style={{ width: '100%', display: 'block', marginBottom: 0, fontSize: 15, padding: '13px', borderRadius: 50 }}>
              ✦ &nbsp;Read My Stars &amp; Fate — Free
            </Link>

            {/* 카운터 */}
            <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: 'rgba(200,195,220,.55)', fontWeight: 300 }}>
              <span style={{ color: 'rgba(201,168,76,.85)', fontWeight: 600 }}>{counter.toLocaleString()}</span> people revealed their chart
            </div>
          </div>

        </div>
      </section>

      {/* ── REVIEWS + WHY ── */}
      <section style={{ maxWidth: 390, margin: '0 auto', padding: '32px 20px 48px' }}>

        <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(201,168,76,.5)', letterSpacing: 4, marginBottom: 20 }}>
          WHAT PEOPLE SAY
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {REVIEWS.map((r, i) => (
            <div key={i} style={{
              background: 'rgba(201,168,76,.05)', border: '1px solid rgba(201,168,76,.15)',
              borderRadius: 14, padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{r.country} {r.name}</span>
                <span style={{ color: '#C9A84C', fontSize: 11, letterSpacing: 1 }}>★★★★★</span>
              </div>
              <p className="font-playfair" style={{ color: 'rgba(200,195,220,.75)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.7 }}>{r.text}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(201,168,76,.5)', letterSpacing: 4, marginBottom: 20 }}>
          WHY ASTROPILLAR
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
          {WHY_ITEMS.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,168,76,.15)',
              borderRadius: 14, padding: 16,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C', letterSpacing: 2, marginBottom: 5 }}>{item.num}</p>
              <p className="font-playfair" style={{ fontSize: 14, color: '#F6F6F8', marginBottom: 7 }}>{item.title}</p>
              <p style={{ fontSize: 12, lineHeight: 1.75, color: 'rgba(200,195,220,.6)', fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <Link href="/login" className="btn-gold" style={{ display: 'block', width: '100%', fontSize: 15, padding: '14px', borderRadius: 50, textAlign: 'center' }}>
          ✦ &nbsp;Unlock My Full Chart — Free
        </Link>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(200,195,220,.35)', marginTop: 10, lineHeight: 1.6, fontWeight: 300 }}>
          New members get 1 FREE Credit on signup · No credit card required
        </p>
      </section>

      <footer style={{ textAlign: 'center', paddingBottom: 32, color: 'rgba(200,195,220,.3)', fontSize: 11 }}>
        © 2026 AstroPillar · astropillar.com
      </footer>

      <style>{`
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .btn-gold {
          text-align: center;
        }
      `}</style>
    </main>
  )
}
