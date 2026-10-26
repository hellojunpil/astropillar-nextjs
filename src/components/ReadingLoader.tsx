'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  onComplete: () => void
}

// 텍스트 기호 강제 (︎): 이모지로 바뀌는 것 방지
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map(z => z + '︎')
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

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
    <div className="rl-wrap" role="status" aria-live="polite">
      <div className="rl-scene" aria-hidden="true">
        <div className="rl-halo" />
        <div className="rl-ring rl-ring-outer">
          {ZODIAC.map((z, i) => (
            <span key={i} style={{ transform: `rotate(${i * 30}deg) translateY(-50cqw) rotate(${-i * 30}deg)` }}>{z}</span>
          ))}
        </div>
        <div className="rl-ring rl-ring-mid">
          {STEMS.map((s, i) => (
            <span key={i} style={{ transform: `rotate(${i * 36}deg) translateY(-34cqw) rotate(${-i * 36}deg)` }}>{s}</span>
          ))}
        </div>
        <div className="rl-ring rl-ring-inner" />
        <div className="rl-planet" />
        <div className="rl-core">✦</div>
      </div>

      <div className="rl-progress">
        <div className="rl-track">
          <div className="rl-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="rl-pct">{Math.round(progress)}%</p>
      </div>

      <p className="rl-phrase" style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'none' : 'translateY(4px)' }}>
        {phrases[phraseIndex]}
      </p>

      <p className="rl-note">
        {t('loader_for_you')}<br />
        {t('loader_notice')}
      </p>

      <style>{`
        .rl-wrap { display: flex; flex-direction: column; align-items: center; gap: 28px; padding: 40px 8px 24px; }
        .rl-scene { position: relative; width: min(72vw, 280px); aspect-ratio: 1; container-type: inline-size; }
        .rl-halo { position: absolute; inset: 18%; border-radius: 50%;
          background: radial-gradient(circle, rgba(230,205,133,.28), rgba(120,104,190,.14) 45%, transparent 70%);
          animation: rlBreath 4.5s ease-in-out infinite; }
        .rl-ring { position: absolute; border-radius: 50%; left: 50%; top: 50%; translate: -50% -50%; }
        .rl-ring span { position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px;
          display: grid; place-items: center; line-height: 1; }
        .rl-ring-outer { width: 100%; height: 100%; border: 1px solid rgba(201,168,76,.22); animation: apSpin 60s linear infinite; }
        .rl-ring-outer span { font-family: 'Segoe UI Symbol','Noto Sans Symbols 2','Apple Symbols',serif; font-variant-emoji: text;
          font-size: 14px; color: rgba(230,205,133,.75); }
        .rl-ring-mid { width: 68%; height: 68%; border: 1px dashed rgba(170,165,209,.28); animation: apSpinRev 40s linear infinite; }
        .rl-ring-mid span { font-family: 'Noto Serif KR','Noto Serif JP',serif; font-size: 13px; color: rgba(170,165,209,.85); }
        .rl-ring-inner { width: 40%; height: 40%; border: 1px solid rgba(201,168,76,.35);
          box-shadow: 0 0 40px rgba(201,168,76,.18), inset 0 0 30px rgba(201,168,76,.12); }
        .rl-planet { position: absolute; left: 50%; top: 50%; width: 52%; height: 52%; translate: -50% -50%; border-radius: 50%;
          animation: apSpin 9s linear infinite; }
        .rl-planet::before { content: ""; position: absolute; top: -4px; left: 50%; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%;
          background: var(--gold-light); box-shadow: 0 0 12px 3px rgba(230,205,133,.7); }
        .rl-core { position: absolute; left: 50%; top: 50%; translate: -50% -50%; font-size: 30px; color: var(--gold-light);
          text-shadow: 0 0 22px rgba(230,205,133,.85); animation: apGlow 2.6s ease-in-out infinite; }
        @keyframes rlBreath { 0%,100% { transform: scale(.92); opacity: .7; } 50% { transform: scale(1.08); opacity: 1; } }

        .rl-progress { width: 100%; max-width: 360px; }
        .rl-track { height: 4px; border-radius: 999px; overflow: hidden; background: rgba(201,168,76,.12); }
        .rl-fill { height: 100%; border-radius: 999px; transition: width .2s linear;
          background: linear-gradient(90deg, #8f7bd0, #c9a84c 60%, #f0dc9c); box-shadow: 0 0 12px rgba(230,205,133,.6); }
        .rl-pct { margin-top: 8px; text-align: right; font-size: 12.5px; color: var(--ink-3); font-variant-numeric: tabular-nums; }

        .rl-phrase { max-width: 400px; min-height: 3.4em; text-align: center; font-family: 'Noto Serif KR','Noto Serif JP', var(--font-display), serif;
          font-size: 17px; line-height: 1.7; color: var(--gold-light); transition: opacity .4s ease, transform .4s ease; }
        .rl-note { max-width: 340px; text-align: center; font-size: 13.5px; line-height: 1.7; color: var(--ink-2); }
      `}</style>
    </div>
  )
}
