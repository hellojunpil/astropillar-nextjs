'use client'
import { useState, useEffect } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import BottomNav from '@/components/BottomNav'
import LegalFooter from '@/components/LegalFooter'
import LanguageSwitcher from '@/components/LanguageSwitcher'

function ga(name: string, params?: Record<string,string>) {
  try { (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', name, params || {}) } catch { /* ignore */ }
}

const DIFFERENTIATORS: Record<string, { icon: string; text: string }[]> = {
  en: [
    { icon: '🔮', text: 'BaZi + Western astrology, read as one' },
    { icon: '🃏', text: 'Free daily tarot, horoscope & zodiac' },
    { icon: '✨', text: 'Your personal AI-powered destiny chart' },
  ],
  ko: [
    { icon: '🔮', text: '사주 + 서양 점성술을 하나로 통합 해석' },
    { icon: '🃏', text: '매일 무료 타로 · 별자리 · 띠 운세' },
    { icon: '✨', text: 'AI가 분석하는 나만의 운명 차트' },
  ],
  ja: [
    { icon: '🔮', text: '四柱推命と西洋占星術を融合解析' },
    { icon: '🃏', text: '毎日無料のタロット・星座・干支運勢' },
    { icon: '✨', text: 'AIが分析するあなただけの運命チャート' },
  ],
}

export default function LandingPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('landing')

  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        router.replace('/menu')
      } else {
        setAuthChecked(true)
        ga('view_1_landing')
      }
    })
    return () => unsub()
  }, [router])

  if (!authChecked) return null

  const fontFamily = locale === 'ko' ? "'Noto Sans KR', sans-serif" : locale === 'ja' ? "'Noto Sans JP', sans-serif" : "'Noto Sans', sans-serif"
  const signInLabel = locale === 'ko' ? '로그인' : locale === 'ja' ? 'ログイン' : 'Sign In'
  const ctaLabel = locale === 'ko' ? '내 운세 보러가기' : locale === 'ja' ? '私の運勢を見る' : 'See My Fortune'
  const diffs = DIFFERENTIATORS[locale] ?? DIFFERENTIATORS.en

  function goToMenu() {
    ga('cta_click_v1')
    router.push('/menu')
  }

  return (
    <main style={{ fontFamily, background:'#07071a', color:'#F6F6F8', minHeight:'100vh' }}>

      <style>{`
        .ap-cta { width:100%; background:#C9A84C; color:#16213E; font-family:${fontFamily}; font-size:15px; font-weight:700; padding:13px; border-radius:50px; border:none; cursor:pointer; display:block; text-align:center; transition:transform .1s; }
        .ap-cta:active { transform:scale(0.98); }
        .ap-signin { background:transparent; border:1.5px solid #C9A84C; color:#C9A84C; font-family:${fontFamily}; font-size:11px; font-weight:700; padding:6px 14px; border-radius:20px; cursor:pointer; }
        .ap-signin:active { background:#C9A84C; color:#16213E; }
      `}</style>

      {/* ══════════ 랜딩 ══════════ */}
      <div style={{ position:'relative', width:'100%', maxWidth:390, height:'100vh', margin:'0 auto', overflow:'hidden', background:'#07071a' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home.png" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 25%', zIndex:1 }} />
        <div style={{ position:'absolute', inset:0, zIndex:2, background:'linear-gradient(to bottom,rgba(7,7,26,.6) 0%,rgba(7,7,26,0) 25%,rgba(7,7,26,0) 55%,rgba(7,7,26,.85) 82%,rgba(7,7,26,1) 100%)', pointerEvents:'none' }} />

        {/* 탑바 */}
        <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 22px', background:'linear-gradient(to bottom,rgba(7,7,26,.65),transparent)' }}>
          <span style={{ color:'#C9A84C', fontSize:13, fontWeight:900, letterSpacing:'2.5px', fontFamily:"'Cormorant Garamond', serif" }}>ASTROPILLAR</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <LanguageSwitcher />
            <button className="ap-signin" onClick={() => { ga('login_attempt'); router.push('/login') }}>{signInLabel}</button>
          </div>
        </div>

        {/* 타이틀 */}
        <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, padding:'56px 20px 0', textAlign:'center' }}>
          <div style={{ fontSize:12, color:'rgba(240,235,255,.85)', fontWeight:400, letterSpacing:'0.3px', lineHeight:1.5, marginBottom:4, textShadow:'0 1px 8px rgba(0,0,0,.9)' }}>
            {t('tagline')}
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:38, fontWeight:700, lineHeight:1.0, color:'#F6F6F8', letterSpacing:2, textShadow:'0 2px 20px rgba(0,0,0,1)' }}>
            ASTROPILLAR
          </div>
        </div>

        {/* 하단 차별점 + CTA */}
        <div style={{ position:'absolute', bottom:86, left:0, right:0, zIndex:10, padding:'44px 20px 16px', display:'flex', flexDirection:'column', alignItems:'center', background:'linear-gradient(to top,rgba(7,7,26,1) 58%,rgba(7,7,26,.82) 80%,transparent 100%)' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18, width:'100%', maxWidth:330 }}>
            {diffs.map((d, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13.5, color:'rgba(240,235,255,.92)', fontWeight:400, lineHeight:1.35, textShadow:'0 1px 6px rgba(0,0,0,.85)' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{d.icon}</span>
                <span>{d.text}</span>
              </div>
            ))}
          </div>
          <button className="ap-cta" onClick={goToMenu}>
            ✦ &nbsp;{ctaLabel}
          </button>
        </div>
      </div>
      <LegalFooter style={{ paddingTop: 28, paddingBottom: 96 }} />

      <BottomNav />
    </main>
  )
}
