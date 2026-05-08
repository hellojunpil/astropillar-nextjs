'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  onComplete: () => void
}

export default function ReadingLoader({ onComplete }: Props) {
  const t = useTranslations('reading')
  const phrases = t.raw('loader_phrases') as string[]

  const [progress, setProgress] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)
  const doneRef = useRef(false)

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

  useEffect(() => {
    const timer = setInterval(() => {
      setFadeIn(false)
      setTimeout(() => {
        setPhraseIndex(i => (i + 1) % phrases.length)
        setFadeIn(true)
      }, 400)
    }, 4000)
    return () => clearInterval(timer)
  }, [phrases.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 32 }}>
      <div style={{ fontSize: 36, color: 'var(--gold)', animation: 'spin 3s linear infinite' }}>✦</div>

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
          {phrases[phraseIndex]}
        </p>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', lineHeight: 1.6, maxWidth: 320 }}>
        {t('loader_for_you')}<br />
        {t('loader_notice')}
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
