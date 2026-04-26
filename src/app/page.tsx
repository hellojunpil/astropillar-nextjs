'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

// ── Zodiac / DayMaster calculation ──────────────────────────────────────────
const CUT = [20,20,21,20,21,21,23,23,23,23,22,22]
const ZODIAC_PAIRS = [
  ['Capricorn','Aquarius'],['Aquarius','Pisces'],['Pisces','Aries'],['Aries','Taurus'],
  ['Taurus','Gemini'],['Gemini','Cancer'],['Cancer','Leo'],['Leo','Virgo'],
  ['Virgo','Libra'],['Libra','Scorpio'],['Scorpio','Sagittarius'],['Sagittarius','Capricorn'],
]
const DM_NAMES = ['Fierce Wood','Flowing Wood','Fierce Fire','Flowing Fire','Fierce Earth','Flowing Earth','Fierce Metal','Flowing Metal','Fierce Water','Flowing Water']

function getZodiac(m: number, d: number) {
  return d >= CUT[m-1] ? ZODIAC_PAIRS[m-1][1] : ZODIAC_PAIRS[m-1][0]
}
function getDayMaster(year: number, month: number, day: number) {
  const a = Math.floor((14-month)/12), y = year+4800-a, mm = month+12*a-3
  const jdn = day + Math.floor((153*mm+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045
  return DM_NAMES[((jdn%10)+9)%10]
}

const TAGLINES: Record<string,Record<string,string>> = {
  'Aries':{'Fierce Wood':'The Fearless Leader','Flowing Wood':'The Smart Warrior','Fierce Fire':'The Unstoppable','Flowing Fire':'The Passionate Soul','Fierce Earth':'The Sleeping Giant','Flowing Earth':'The Caring Force','Fierce Metal':'The Cold Blade','Flowing Metal':'The Ice Queen','Fierce Water':'The Tidal Force','Flowing Water':'The Mystic'},
  'Taurus':{'Fierce Wood':'The Patient Builder','Flowing Wood':'The Steady Creator','Fierce Fire':'The Hidden Volcano','Flowing Fire':'The Warm Anchor','Fierce Earth':'The Unshakeable','Flowing Earth':'The Gentle Giant','Fierce Metal':'The Iron Vault','Flowing Metal':'The Quiet Achiever','Fierce Water':'The Deep River','Flowing Water':'The Still Lake'},
  'Gemini':{'Fierce Wood':'The Spark Plug','Flowing Wood':'The Quick Mind','Fierce Fire':'The Wildfire','Flowing Fire':'The Twin Flame','Fierce Earth':'The Grounded Talker','Flowing Earth':'The Storyteller','Fierce Metal':'The Sharp Tongue','Flowing Metal':'The Silver Voice','Fierce Water':'The Shapeshifter','Flowing Water':'The Dream Weaver'},
  'Cancer':{'Fierce Wood':'The Protective Tree','Flowing Wood':'The Nurturing Vine','Fierce Fire':'The Fierce Protector','Flowing Fire':'The Warm Shell','Fierce Earth':'The Safe Harbor','Flowing Earth':'The Gentle Mother','Fierce Metal':'The Steel Shell','Flowing Metal':'The Pearl','Fierce Water':'The Deep Ocean','Flowing Water':'The Moonlit Sea'},
  'Leo':{'Fierce Wood':'The Royal Oak','Flowing Wood':'The Golden Willow','Fierce Fire':'The Sun Itself','Flowing Fire':'The Warm King','Fierce Earth':'The Mountain King','Flowing Earth':'The Generous Lion','Fierce Metal':'The Golden Crown','Flowing Metal':'The Radiant Star','Fierce Water':'The Ocean King','Flowing Water':'The Shining Current'},
  'Virgo':{'Fierce Wood':'The Precise Craftsman','Flowing Wood':'The Healing Herb','Fierce Fire':'The Analytical Flame','Flowing Fire':'The Quiet Torch','Fierce Earth':'The Master Builder','Flowing Earth':'The Gentle Healer','Fierce Metal':'The Surgical Blade','Flowing Metal':'The Fine Crystal','Fierce Water':'The Clear Spring','Flowing Water':'The Gentle Rain'},
  'Libra':{'Fierce Wood':'The Just Judge','Flowing Wood':'The Peacemaker','Fierce Fire':'The Bright Scale','Flowing Fire':'The Warm Diplomat','Fierce Earth':'The Fair Mountain','Flowing Earth':'The Gentle Balance','Fierce Metal':'The Balanced Sword','Flowing Metal':'The Silver Scale','Fierce Water':'The Clear Mirror','Flowing Water':'The Still Pond'},
  'Scorpio':{'Fierce Wood':'The Dark Forest','Flowing Wood':'The Ivy Queen','Fierce Fire':'The Phoenix','Flowing Fire':'The Hidden Flame','Fierce Earth':'The Volcanic Island','Flowing Earth':'The Quiet Depths','Fierce Metal':'The Scorpion Sting','Flowing Metal':'The Dark Jewel','Fierce Water':'The Abyss','Flowing Water':'The Shadow Current'},
  'Sagittarius':{'Fierce Wood':'The Arrow of Truth','Flowing Wood':'The Wandering Vine','Fierce Fire':'The Blazing Arrow','Flowing Fire':'The Guiding Light','Fierce Earth':'The Free Mountain','Flowing Earth':'The Open Field','Fierce Metal':'The Iron Arrow','Flowing Metal':'The Silver Bow','Fierce Water':'The River Explorer','Flowing Water':'The Dream Traveler'},
  'Capricorn':{'Fierce Wood':'The Ancient Tree','Flowing Wood':'The Patient Root','Fierce Fire':'The Mountain Torch','Flowing Fire':'The Steady Flame','Fierce Earth':'The Summit','Flowing Earth':'The Foundation','Fierce Metal':'The Iron Peak','Flowing Metal':'The Polished Stone','Fierce Water':'The Glacier','Flowing Water':'The Mountain Stream'},
  'Aquarius':{'Fierce Wood':'The Revolution','Flowing Wood':'The Idea Tree','Fierce Fire':'The Lightning','Flowing Fire':'The Electric Heart','Fierce Earth':'The Future Architect','Flowing Earth':'The Visionary','Fierce Metal':'The Circuit','Flowing Metal':'The Silver Wave','Fierce Water':'The Storm Bringer','Flowing Water':'The Cosmic Current'},
  'Pisces':{'Fierce Wood':'The Drifting Forest','Flowing Wood':'The Weeping Willow','Fierce Fire':'The Deep Lantern','Flowing Fire':'The Gentle Glow','Fierce Earth':'The Sunken Treasure','Flowing Earth':'The Warm Tide','Fierce Metal':'The Crystal Fish','Flowing Metal':'The Silver Scale','Fierce Water':'The Infinite Sea','Flowing Water':'The Dream Ocean'},
}
const DM_DESC: Record<string,string> = {
  'Fierce Wood':'Bold and growth-driven. You charge forward with fierce ambition — nothing holds back a Fierce Wood Day Master.',
  'Flowing Wood':'Gentle but persistent. You bend with the wind but never break — always finding your way through.',
  'Fierce Fire':'Pure, radiant energy. Your chart burns bright — you inspire everyone around you just by showing up.',
  'Flowing Fire':'Warm and intuitive. You light the room without trying. Your inner fire is a lantern for those around you.',
  'Fierce Earth':'Unshakeable and steadfast. Your Day Master anchors everything — you are the mountain others lean on.',
  'Flowing Earth':'Nurturing and precise. Your power runs quietly and deeply — you care completely, and that changes people.',
  'Fierce Metal':'Sharp, decisive, just. You see the truth others miss — and you say it without flinching.',
  'Flowing Metal':'Refined and perceptive. Your elegance hides a razor edge. Beauty and strength, perfectly balanced.',
  'Fierce Water':'Deep, powerful, relentless. Your ambition flows like a river carving through stone.',
  'Flowing Water':'Intuitive and mysterious. You sense what others cannot see. Your wisdom rises from the depths.',
}

const TEASER_SETS = [
  {rel:"[Name], the pattern repeating in your relationships right now — your [Zodiac] sees it one way. Your [DayMaster] sees it differently. One of them is wrong.",money:"Your chart shows the window. Most people in your cycle miss it — not because it is hidden, but because they are facing the wrong direction."},
  {rel:"[Name], there is a connection your [DayMaster] can build that your [Zodiac] almost never sees coming. The problem is not finding it. It is not walking past it.",money:"You are in one of the more consequential cycles in your chart. What gets decided inside this window tends to define the next decade."},
  {rel:"[Name], your [Zodiac] is drawn to depth. Your [DayMaster] is built to carry it. What your chart flags is what happens after you have been carrying it for too long.",money:"Your chart is not missing opportunity. It is missing the structure to hold what comes in. In this cycle, that gap has been compounding quietly."},
  {rel:"[Name], the pattern is not random. Your [Zodiac] reads the person. Your [DayMaster] feels the pressure they create. Those two readings are not pointing at the same thing.",money:"Your chart shows a significant financial shift in this cycle. The shift rewards positioning — not effort."},
  {rel:"[Name], your chart can generate both intensity and real compatibility. The problem is they do not always arrive together — and in the moment, they feel identical.",money:"There is a financial decision in your chart that has been sitting unresolved. In this cycle, delay has a price."},
  {rel:"[Name], your [Zodiac] reads fast. Sometimes too fast. There is a signal in your relationship chart right now that is worth slowing down for.",money:"The financial pressure you are feeling this cycle may not mean what you think it means. Your chart flags a pattern of reading threat before the evidence is done speaking."},
  {rel:"[Name], your [DayMaster] absorbs. That is useful — until it is not. Your chart shows the absorption has been running longer than it should.",money:"Your chart is not asking you to work harder. It is asking you to stop building something that requires you to be overextended just to keep it standing."},
]

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
const ROLLING_TEXTS = [
  'Was I always the one who cared more?',
  'I work so hard. Why does nothing change?',
  'Is this person real, or am I fooling myself?',
  'Why do I keep doing this to myself?',
]

function ga(name: string, params?: Record<string,string>) {
  try { (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', name, params || {}) } catch { /* ignore */ }
}

type View = 'v1' | 'v2' | 'v3'

interface Result {
  displayName: string
  zodiac: string
  dm: string
  tagline: string
  desc: string
  rel: string
  money: string
}

export default function LandingPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [view, setView] = useState<View>('v1')

  // Birth form
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [gender, setGender] = useState<'M'|'F'|''>('')

  // Result
  const [result, setResult] = useState<Result | null>(null)

  // Counter
  const counterRef = useRef(10847)
  const [counter, setCounter] = useState(10847)

  // Rolling text
  const [rollingIdx, setRollingIdx] = useState(0)

  // Firebase Auth — redirect if logged in, preserving session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        router.replace('/menu')
      } else {
        setAuthChecked(true)
        ga('page_view', { page: 'index' })
        ga('view_1_landing')
      }
    })
    return () => unsub()
  }, [router])

  // Counter tick
  useEffect(() => {
    if (!authChecked) return
    function tick() {
      const add = Math.floor(Math.random() * 4) + 1
      counterRef.current += add
      setCounter(counterRef.current)
      setTimeout(tick, 1200 + Math.random() * 800)
    }
    const t = setTimeout(tick, 1500)
    return () => clearTimeout(t)
  }, [authChecked])

  // Rolling text cycle
  useEffect(() => {
    if (!authChecked) return
    const t = setInterval(() => setRollingIdx(i => (i + 1) % ROLLING_TEXTS.length), 3000)
    return () => clearInterval(t)
  }, [authChecked])

  function goToView(v: View) {
    setView(v)
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
    if (v === 'v1') ga('view_1_landing')
    if (v === 'v2') ga('view_2_form')
    if (v === 'v3') ga('view_3_result')
  }

  function calculate() {
    if (!name.trim()) { alert('Please enter your name.'); return }
    if (!year) { alert('Please select your birth year.'); return }
    if (!month) { alert('Please select your birth month.'); return }
    if (!day) { alert('Please select your birth day.'); return }
    const zodiac = getZodiac(parseInt(month), parseInt(day))
    const dm = getDayMaster(parseInt(year), parseInt(month), parseInt(day))
    const tagline = TAGLINES[zodiac]?.[dm] ? `"${TAGLINES[zodiac][dm]}"` : '"Your unique destiny awaits"'
    const desc = `${zodiac} meets ${dm}. ${DM_DESC[dm] || ''}`
    const idx = Math.floor(Math.random() * TEASER_SETS.length)
    const t = TEASER_SETS[idx]
    function fill(text: string) {
      return text.replace(/\[Name\]/g, name || 'Your chart').replace(/\[Zodiac\]/g, zodiac).replace(/\[DayMaster\]/g, dm)
    }
    setResult({ displayName: name ? `${name}'s Cosmic Identity` : 'Your Cosmic Identity', zodiac, dm, tagline, desc, rel: fill(t.rel), money: fill(t.money) })
    goToView('v3')
    ga('calculation_complete', { zodiac, day_master: dm })
  }

  if (!authChecked) return null

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 91 }, (_, i) => currentYear - i)

  const selectSt: React.CSSProperties = {
    width:'100%', background:'rgba(255,255,255,.05)', border:'1.5px solid rgba(201,168,76,.3)',
    borderRadius:10, padding:'13px 14px', color:'#F6F6F8',
    fontFamily:"'Noto Sans', sans-serif", fontSize:14, outline:'none',
    appearance:'none', WebkitAppearance:'none',
  }
  const inputSt: React.CSSProperties = { ...selectSt }
  const fieldLabelSt: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:700, color:'#C9A84C', letterSpacing:'1.5px', marginBottom:7,
  }

  return (
    <main style={{ fontFamily:"'Noto Sans', sans-serif", background:'#07071a', color:'#F6F6F8', minHeight:'100vh' }}>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes float2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-7px)} }
        .ap-select option { background:#16213E; color:#F6F6F8; }
        .ap-cta { width:100%; background:#C9A84C; color:#16213E; font-family:'Noto Sans',sans-serif; font-size:15px; font-weight:700; padding:13px; border-radius:50px; border:none; cursor:pointer; display:block; text-align:center; transition:transform .1s; }
        .ap-cta:active { transform:scale(0.98); }
        .ap-signin { background:transparent; border:1.5px solid #C9A84C; color:#C9A84C; font-family:'Noto Sans',sans-serif; font-size:11px; font-weight:700; padding:6px 14px; border-radius:20px; cursor:pointer; }
        .ap-signin:active { background:#C9A84C; color:#16213E; }
      `}</style>

      {/* ══════════ VIEW 1: LANDING ══════════ */}
      {view === 'v1' && (
        <div style={{ position:'relative', width:'100%', maxWidth:390, height:'100vh', margin:'0 auto', overflow:'hidden', background:'#07071a' }}>
          {/* Background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home.png"
            alt=""
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 25%', zIndex:1 }}
          />
          {/* Gradient overlay */}
          <div style={{ position:'absolute', inset:0, zIndex:2, background:'linear-gradient(to bottom,rgba(7,7,26,.6) 0%,rgba(7,7,26,0) 25%,rgba(7,7,26,0) 60%,rgba(7,7,26,.85) 85%,rgba(7,7,26,1) 100%)', pointerEvents:'none' }} />

          {/* Topbar */}
          <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 22px', background:'linear-gradient(to bottom,rgba(7,7,26,.65),transparent)' }}>
            <span style={{ color:'#C9A84C', fontSize:13, fontWeight:900, letterSpacing:'2.5px', fontFamily:"'Cormorant Garamond', serif" }}>ASTROPILLAR</span>
            <button className="ap-signin" onClick={() => { ga('login_attempt'); router.push('/login') }}>Sign In</button>
          </div>

          {/* Top title overlay */}
          <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, padding:'56px 20px 0', textAlign:'center' }}>
            <div style={{ fontSize:12, color:'rgba(240,235,255,.85)', fontWeight:400, letterSpacing:'0.3px', lineHeight:1.5, marginBottom:4, textShadow:'0 1px 8px rgba(0,0,0,.9)' }}>
              Where the stars meet your fate.
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:38, fontWeight:700, lineHeight:1.0, color:'#F6F6F8', letterSpacing:2, textShadow:'0 2px 20px rgba(0,0,0,1)' }}>
              ASTROPILLAR
            </div>
          </div>

          {/* Floating bubbles */}
          <div style={{ position:'absolute', top:'48%', left:'4%', zIndex:3, background:'rgba(0,0,0,.58)', border:'1px solid rgba(255,255,255,.22)', borderRadius:20, padding:'7px 14px', fontSize:13, color:'#fff', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', whiteSpace:'nowrap', boxShadow:'0 2px 12px rgba(0,0,0,.3)', animation:'float1 3s ease-in-out infinite' }}>
            My toxic trait 😈
          </div>
          <div style={{ position:'absolute', top:'52%', right:'4%', zIndex:3, background:'rgba(0,0,0,.58)', border:'1px solid rgba(255,255,255,.22)', borderRadius:20, padding:'7px 14px', fontSize:13, color:'#fff', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', whiteSpace:'nowrap', boxShadow:'0 2px 12px rgba(0,0,0,.3)', animation:'float2 4s ease-in-out infinite' }}>
            When will I meet them? 💕
          </div>
          <div style={{ position:'absolute', top:'68%', left:'4%', zIndex:3, background:'rgba(0,0,0,.58)', border:'1px solid rgba(255,255,255,.22)', borderRadius:20, padding:'7px 14px', fontSize:13, color:'#fff', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', whiteSpace:'nowrap', boxShadow:'0 2px 12px rgba(0,0,0,.3)', animation:'float1 3.5s ease-in-out infinite' }}>
            What my stars hide 🌌
          </div>

          {/* Bottom CTA area */}
          <div style={{ position:'absolute', bottom:50, left:0, right:0, zIndex:10, padding:'0 20px 16px', display:'flex', flexDirection:'column', alignItems:'center', background:'linear-gradient(to top,rgba(7,7,26,1) 75%,transparent 100%)' }}>
            {/* Rolling text */}
            <div style={{ height:20, overflow:'hidden', marginBottom:5, width:'100%', textAlign:'center' }}>
              <div style={{ fontSize:11, color:'rgba(200,195,220,.75)', fontWeight:300, fontStyle:'italic', lineHeight:'20px', transition:'transform 0.35s ease', transform:`translateY(-${rollingIdx * 20}px)` }}>
                {ROLLING_TEXTS.map((t, i) => <div key={i} style={{ lineHeight:'20px' }}>{t}</div>)}
              </div>
            </div>
            <button className="ap-cta" onClick={() => { goToView('v2'); ga('cta_click_v1') }}>
              ✦ &nbsp;Read My Stars &amp; Fate — Free
            </button>
            <div style={{ marginTop:6, textAlign:'center', fontSize:12, color:'rgba(200,195,220,.55)', fontWeight:300 }}>
              <span style={{ color:'rgba(201,168,76,.85)', fontWeight:600 }}>{counter.toLocaleString()}</span> people revealed their chart
            </div>
          </div>
        </div>
      )}

      {/* ══════════ VIEW 2: FORM ══════════ */}
      {view === 'v2' && (
        <div style={{ maxWidth:390, margin:'0 auto', minHeight:'100vh', background:'#07071a' }}>
          {/* Sticky topbar */}
          <div style={{ position:'sticky', top:0, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', background:'rgba(13,13,43,0.95)', borderBottom:'1px solid rgba(201,168,76,.1)' }}>
            <span style={{ color:'#C9A84C', fontSize:13, fontWeight:900, letterSpacing:'2.5px', fontFamily:"'Cormorant Garamond', serif" }}>ASTROPILLAR</span>
            <button className="ap-signin" onClick={() => { ga('login_attempt'); router.push('/login') }}>Sign In</button>
          </div>
          {/* Form header */}
          <div style={{ background:'linear-gradient(to bottom,#0d0d2b,#07071a)', padding:'20px 20px 16px', borderBottom:'1px solid rgba(201,168,76,.15)' }}>
            <button onClick={() => goToView('v1')} style={{ background:'none', border:'none', color:'rgba(201,168,76,.7)', fontFamily:"'Noto Sans',sans-serif", fontSize:13, cursor:'pointer', padding:0, marginBottom:14, display:'block' }}>← Back</button>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
              <div style={{ height:3, flex:1, borderRadius:2, background:'#C9A84C' }} />
              <div style={{ height:3, flex:1, borderRadius:2, background:'rgba(201,168,76,.22)' }} />
              <span style={{ fontSize:10, color:'rgba(201,168,76,.6)', letterSpacing:'1.2px', whiteSpace:'nowrap', fontWeight:400 }}>STEP 1 OF 2</span>
            </div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Enter your birth details</div>
            <div style={{ fontSize:12, color:'rgba(200,195,220,.5)', fontWeight:300 }}>You&apos;re one minute away from your Cosmic Identity</div>
          </div>
          {/* Form body */}
          <div style={{ padding:20 }}>
            <div style={{ marginBottom:16 }}>
              <label style={fieldLabelSt}>YOUR NAME</label>
              <input className="ap-select" style={inputSt} type="text" placeholder="e.g. Alex" maxLength={30} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={fieldLabelSt}>GENDER</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {(['M','F'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)} aria-pressed={gender===g} style={{
                    padding:13, borderRadius:10, cursor:'pointer', textAlign:'center', fontSize:13, fontWeight:600, fontFamily:"'Noto Sans',sans-serif", transition:'all .2s',
                    border:`2px solid ${gender===g ? '#C9A84C' : 'rgba(201,168,76,.3)'}`,
                    background: gender===g ? 'rgba(201,168,76,.22)' : 'rgba(255,255,255,.04)',
                    color: gender===g ? '#C9A84C' : 'rgba(200,195,220,.6)',
                    boxShadow: gender===g ? '0 0 0 1px rgba(201,168,76,.4)' : 'none',
                  }}>
                    {g === 'M' ? (gender==='M' ? '✓ Male' : '♂ Male') : (gender==='F' ? '✓ Female' : '♀ Female')}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={fieldLabelSt}>DATE OF BIRTH</label>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 2.2fr 1.3fr', gap:8 }}>
                <select className="ap-select" style={selectSt} value={year} onChange={e => setYear(e.target.value)}>
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="ap-select" style={selectSt} value={month} onChange={e => setMonth(e.target.value)}>
                  <option value="">Month</option>
                  {MONTHS_FULL.map((m, i) => <option key={i} value={i+1}>{i+1} · {m}</option>)}
                </select>
                <select className="ap-select" style={selectSt} value={day} onChange={e => setDay(e.target.value)}>
                  <option value="">Day</option>
                  {Array.from({length:31},(_,i) => i+1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <button className="ap-cta" style={{ fontSize:15, padding:16, marginTop:10 }} onClick={calculate}>
              ✦ &nbsp;Reveal My Cosmic Identity
            </button>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(201,168,76,.1)', border:'1.5px solid rgba(201,168,76,.4)', borderRadius:12, padding:'14px 16px', marginTop:16, fontSize:14, fontWeight:600, color:'#C9A84C', letterSpacing:'0.3px', boxShadow:'0 0 20px rgba(201,168,76,.1)', textAlign:'center' }}>
              <span style={{ fontSize:18, flexShrink:0 }}>🔒</span> 100% Private. Never stored. Never shared.
            </div>
            <div style={{ textAlign:'center', fontSize:11, color:'rgba(200,195,220,.35)', marginTop:10, lineHeight:1.6, fontWeight:300 }}>
              Your data is only used to calculate your chart.
            </div>
          </div>
        </div>
      )}

      {/* ══════════ VIEW 3: RESULT ══════════ */}
      {view === 'v3' && result && (
        <div style={{ maxWidth:390, margin:'0 auto', minHeight:'100vh', background:'#07071a' }}>
          {/* Sticky topbar */}
          <div style={{ position:'sticky', top:0, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', background:'rgba(13,13,43,0.95)', borderBottom:'1px solid rgba(201,168,76,.1)' }}>
            <span style={{ color:'#C9A84C', fontSize:13, fontWeight:900, letterSpacing:'2.5px', fontFamily:"'Cormorant Garamond', serif" }}>ASTROPILLAR</span>
            <button className="ap-signin" onClick={() => { ga('login_attempt'); router.push('/login') }}>Sign In</button>
          </div>
          {/* Result hero */}
          <div style={{ background:'linear-gradient(135deg,#0d0d2b 0%,#16213E 100%)', padding:'28px 20px', textAlign:'center', borderBottom:'1px solid rgba(201,168,76,.2)' }}>
            <div style={{ fontSize:10, color:'rgba(201,168,76,.5)', letterSpacing:'1.5px', marginBottom:10, fontWeight:400 }}>STEP 2 OF 2</div>
            <div style={{ fontSize:10, letterSpacing:3, color:'rgba(201,168,76,.6)', marginBottom:12, fontWeight:400 }}>YOUR COSMIC IDENTITY</div>
            <div style={{ fontSize:12, color:'rgba(200,195,220,.6)', marginBottom:10, fontWeight:300 }}>{result.displayName}</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:16, flexWrap:'wrap' }}>
              {[result.zodiac, result.dm].map(b => (
                <span key={b} style={{ display:'inline-flex', alignItems:'center', background:'rgba(201,168,76,.1)', border:'1px solid rgba(201,168,76,.35)', borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:700, color:'#C9A84C' }}>{b}</span>
              ))}
            </div>
            <div style={{ fontSize:24, fontWeight:700, color:'#C9A84C', marginBottom:6, lineHeight:1.3 }}>
              <span style={{ color:'#F6F6F8' }}>{result.zodiac}</span> &times; <span style={{ color:'#F6F6F8' }}>{result.dm}</span>
            </div>
            <div style={{ fontSize:12, color:'rgba(201,168,76,.7)', marginBottom:16, fontStyle:'italic', fontWeight:300 }}>{result.tagline}</div>
            <div style={{ fontSize:13, lineHeight:1.8, color:'rgba(200,195,220,.75)', textAlign:'left', background:'rgba(255,255,255,.04)', border:'1px solid rgba(201,168,76,.15)', borderRadius:12, padding:'14px 16px', fontWeight:300 }}>
              {result.desc}
            </div>
            <div style={{ marginTop:14, fontSize:12, color:'rgba(201,168,76,.6)', fontStyle:'italic', lineHeight:1.7, fontWeight:300 }}>
              This is only the beginning of your chart.
            </div>
            {/* Teaser */}
            <div style={{ marginTop:20, borderTop:'1px solid rgba(201,168,76,.15)', paddingTop:20 }}>
              <div style={{ fontSize:10, letterSpacing:2, color:'rgba(201,168,76,.5)', fontWeight:400, marginBottom:14 }}>YOUR CHART SIGNALS</div>
              <div style={{ fontSize:13, lineHeight:1.8, color:'rgba(200,195,220,.75)', fontWeight:300, marginBottom:14, paddingBottom:14, borderBottom:'1px solid rgba(201,168,76,.1)' }}>{result.rel}</div>
              <div style={{ fontSize:13, lineHeight:1.8, color:'rgba(200,195,220,.75)', fontWeight:300, marginBottom:20 }}>{result.money}</div>
              <div style={{ fontSize:13, color:'rgba(201,168,76,.8)', fontStyle:'italic', fontWeight:400, marginBottom:16, lineHeight:1.6 }}>Your chart is already pointing at more than this.</div>
              <button className="ap-cta" style={{ fontSize:14, padding:14 }} onClick={() => { ga('service_view', {service_type:'unlock_full_reading'}); router.push('/login?tab=signup') }}>
                Unlock My Full Chart — Free
              </button>
              <div style={{ textAlign:'center', marginTop:10, fontSize:11, color:'rgba(200,195,220,.35)', fontWeight:300 }}>New members get 1 FREE Credit &nbsp;·&nbsp; No credit card required</div>
            </div>
          </div>
          {/* Share event */}
          <div style={{ padding:'20px 20px 0' }}>
            <div style={{ background:'rgba(100,149,237,.08)', border:'1px solid rgba(100,149,237,.25)', borderRadius:14, padding:'14px 16px', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#89b4fa', marginBottom:4 }}>Share your result 3 times → 1 FREE Credit</div>
              <div style={{ fontSize:12, lineHeight:1.65, color:'rgba(200,195,220,.65)', fontWeight:300 }}>Share 3 times and earn a free reading. Let the stars speak for you.</div>
            </div>
          </div>
          {/* Why section */}
          <div style={{ padding:20 }}>
            <div style={{ fontSize:10, letterSpacing:3, color:'rgba(201,168,76,.6)', textAlign:'center', marginBottom:18, fontWeight:400 }}>WHY ASTROPILLAR IS DIFFERENT</div>
            {[
              { num:'01', title:'Two ancient wisdoms. One reading.', desc:"Western astrology reads the sky. Eastern BaZi reads the energy of time. Most horoscopes give you one lens. AstroPillar gives you both — and the truth that only appears when they're fused together." },
              { num:'02', title:'Built on real data. Not guesswork.', desc:'AstroPillar calculates your chart using verified astronomical and traditional BaZi pillar data — precise, personalized, written specifically for you.' },
              { num:'03', title:'Four ways to see your destiny', desc:'Personal Fortune — your complete lifetime reading\nDaily Fortune — your day, built around you\nCompatibility — the cosmic truth about your relationships\nYearly Fortune — everything this year holds for you' },
              { num:'04', title:'Ask what you actually want to know', desc:'"Should I quit?" "Is this person right for me?" AstroPillar answers your real questions using your actual chart — not generic advice.' },
            ].map(item => (
              <div key={item.num} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(201,168,76,.15)', borderRadius:14, padding:16, marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#C9A84C', letterSpacing:2, marginBottom:5 }}>{item.num}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'#F6F6F8', marginBottom:7 }}>{item.title}</div>
                <div style={{ fontSize:12, lineHeight:1.75, color:'rgba(200,195,220,.6)', fontWeight:300, whiteSpace:'pre-line' }}>{item.desc}</div>
              </div>
            ))}
          </div>
          {/* Bottom CTA */}
          <div style={{ padding:'0 20px 44px' }}>
            <button className="ap-cta" style={{ marginBottom:12 }} onClick={() => { ga('service_view', {service_type:'unlock_full_reading'}); router.push('/login?tab=signup') }}>
              ✦ &nbsp;Unlock My Full Chart — Free
            </button>
            <button onClick={() => { ga('login_attempt'); router.push('/login') }} style={{ width:'100%', padding:14, background:'transparent', border:'1.5px solid rgba(201,168,76,.4)', borderRadius:50, color:'#C9A84C', fontFamily:"'Noto Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', display:'block', textAlign:'center' }}>
              Already have an account? Sign In
            </button>
            <div style={{ textAlign:'center', fontSize:11, color:'rgba(200,195,220,.35)', marginTop:12, lineHeight:1.6, fontWeight:300 }}>
              New members get 1 FREE Credit on signup.<br />No credit card required.
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
