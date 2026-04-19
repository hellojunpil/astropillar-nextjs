'use client'
import { useState, useEffect, useRef } from 'react'

const PHRASES = [
  "BaZi means 'Eight Characters' — your birth year, month, day, and hour each carry a heavenly stem and earthly branch.",
  "Western astrology tracks the positions of the Sun, Moon, and planets at the exact moment of your birth.",
  "The Five Elements — Wood, Fire, Earth, Metal, and Water — are the building blocks of all energy in BaZi.",
  "Your Sun sign shows your core identity. Your Moon sign reveals your emotional world. Your Rising sign is how others see you.",
  "Your Day Master is the most important pillar in BaZi. It represents your core self and true identity.",
  "Saturn is called the 'teacher' of the solar system — wherever it sits in your chart, that's where life asks you to grow.",
  "In BaZi, Wood feeds Fire, Fire creates Earth, Earth produces Metal, Metal holds Water, and Water nourishes Wood.",
  "In Western astrology, Venus governs love and beauty, while Mars rules ambition, drive, and desire.",
  "The 12 Earthly Branches correspond to the 12 animals of the Chinese zodiac — each carrying unique energy patterns.",
  "The 12 houses in a natal chart represent different life areas — from identity and money to relationships and career.",
  "Your Hour Pillar reveals your inner world — hidden talents, deepest desires, and how you see yourself.",
  "A stellium occurs when three or more planets cluster in one sign — creating an intense concentration of energy.",
  "The concept of 'luck pillars' in BaZi shows how your fortune shifts in 10-year cycles throughout your life.",
  "Jupiter is the planet of expansion and luck in Western astrology — its position shows where you naturally thrive.",
  "In BaZi, the clash between certain animals signals tension, transformation, and major life change.",
  "Pluto takes 248 years to orbit the Sun — its rare transits mark generational shifts and deep collective transformation.",
  "The concept of Yin and Yang underlies all of BaZi — every stem and branch carries either Yin or Yang energy.",
  "Mercury retrograde is actually an invitation to slow down, review, and reconsider.",
  "In BaZi, a well-balanced chart with all five elements suggests adaptability.",
  "BaZi and Western astrology were both developed independently over thousands of years — yet they often point to the same truths.",
]

interface Props {
  onComplete: () => void
}

export default function ReadingLoader({ onComplete }: Props) {
  const [progress, setProgress] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)
  const doneRef = useRef(false)

  // Progress bar: 0→100 over 60~120s
  useEffect(() => {
    const duration = 60000 + Math.random() * 60000
    const interval = 200
    const step = (100 / duration) * interval

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + step
        if (next >= 100) {
          clearInterval(timer)
          if (!doneRef.current) {
            doneRef.current = true
            setTimeout(onComplete, 300)
          }
          return 100
        }
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [onComplete])

  // Rolling phrases every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeIn(false)
      setTimeout(() => {
        setPhraseIndex(i => (i + 1) % PHRASES.length)
        setFadeIn(true)
      }, 400)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 32 }}>
      {/* Spinner / symbol */}
      <div style={{ fontSize: 36, color: 'var(--gold)', animation: 'spin 3s linear infinite' }}>✦</div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ background: 'rgba(201,168,76,0.12)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #C9A84C, #e8cc7a)',
            width: `${progress}%`,
            transition: 'width 0.2s linear',
          }} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'right', marginTop: 6 }}>
          {Math.round(progress)}%
        </p>
      </div>

      {/* Rolling phrase */}
      <div style={{
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 12,
        padding: '16px 20px',
        maxWidth: 360,
        width: '100%',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <p style={{ color: 'var(--gold)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.7, textAlign: 'center' }}>
          {PHRASES[phraseIndex]}
        </p>
      </div>

      {/* Bottom notice */}
      <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', lineHeight: 1.6, maxWidth: 320 }}>
        Reading the stars for you...<br />
        This may take 1–2 minutes. Please do not go back or close this page.
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
