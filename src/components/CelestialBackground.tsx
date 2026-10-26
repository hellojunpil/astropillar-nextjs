'use client'
import { useEffect, useRef } from 'react'

/**
 * 전 페이지 공통 밤하늘 배경.
 * - 깜빡이는 별 + 아주 느린 회전 드리프트 + 가끔 지나가는 유성
 * - prefers-reduced-motion 이면 한 번만 그리고 멈춤
 * - 탭이 숨겨지면 애니메이션 중단 (배터리 절약)
 */
type Star = { x: number; y: number; r: number; base: number; speed: number; phase: number; warm: boolean }
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number }

export default function CelestialBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, dpr = 1
    let stars: Star[] = []
    let meteor: Meteor | null = null
    let raf = 0
    let last = 0
    let nextMeteor = 4000 + Math.random() * 6000

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas!.width = Math.floor(w * dpr)
      canvas!.height = Math.floor(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(260, Math.floor((w * h) / 5200))
      stars = Array.from({ length: count }, () => {
        const big = Math.random() < 0.06
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: big ? 1.1 + Math.random() * 0.9 : 0.3 + Math.random() * 0.7,
          base: big ? 0.75 : 0.2 + Math.random() * 0.5,
          speed: 0.4 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
          warm: Math.random() < 0.18,
        }
      })
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h)
      const drift = reduce ? 0 : t * 0.0000035 // 아주 느린 하늘 회전 느낌
      for (const s of stars) {
        const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase)
        const a = s.base * tw
        const x = (s.x + drift * w * (s.y / h)) % w
        ctx!.beginPath()
        ctx!.fillStyle = s.warm ? `rgba(240,214,150,${a})` : `rgba(220,226,255,${a})`
        ctx!.arc(x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fill()
        if (s.r > 1.2) { // 밝은 별에는 은은한 십자 광채
          ctx!.strokeStyle = `rgba(240,225,180,${a * 0.35})`
          ctx!.lineWidth = 0.6
          ctx!.beginPath()
          ctx!.moveTo(x - s.r * 4, s.y); ctx!.lineTo(x + s.r * 4, s.y)
          ctx!.moveTo(x, s.y - s.r * 4); ctx!.lineTo(x, s.y + s.r * 4)
          ctx!.stroke()
        }
      }
      if (meteor) {
        const m = meteor
        const p = m.life / m.max
        const alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8
        const g = ctx!.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14)
        g.addColorStop(0, `rgba(255,240,200,${0.9 * alpha})`)
        g.addColorStop(1, 'rgba(255,240,200,0)')
        ctx!.strokeStyle = g
        ctx!.lineWidth = 1.4
        ctx!.beginPath()
        ctx!.moveTo(m.x, m.y)
        ctx!.lineTo(m.x - m.vx * 14, m.y - m.vy * 14)
        ctx!.stroke()
      }
    }

    function loop(t: number) {
      const dt = last ? t - last : 16
      last = t
      nextMeteor -= dt
      if (!meteor && nextMeteor <= 0) {
        const fromLeft = Math.random() < 0.5
        meteor = {
          x: fromLeft ? Math.random() * w * 0.5 : w * 0.5 + Math.random() * w * 0.5,
          y: Math.random() * h * 0.35,
          vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 3),
          vy: 2 + Math.random() * 1.5,
          life: 0,
          max: 55 + Math.random() * 25,
        }
        nextMeteor = 9000 + Math.random() * 12000
      }
      if (meteor) {
        meteor.x += meteor.vx
        meteor.y += meteor.vy
        meteor.life += 1
        if (meteor.life > meteor.max) meteor = null
      }
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    build()
    if (reduce) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
    }

    let resizeTimer: ReturnType<typeof setTimeout>
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => { build(); if (reduce) draw(0) }, 150)
    }
    function onVisibility() {
      if (reduce) return
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
      else if (!raf) { last = 0; raf = requestAnimationFrame(loop) }
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div className="ap-sky" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  )
}
