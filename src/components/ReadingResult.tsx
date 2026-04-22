'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api'
import { BirthData } from './BirthForm'

const GH = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

function ganImg(char: string) { return `${GH}gan_${encodeURIComponent(char)}.png` }
function zhiImg(char: string) { return `${GH}zhi_${encodeURIComponent(char)}.png` }

const ZODIAC_SVG_KEYS = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces',
]
const ZODIAC_SYMBOL: Record<string, string> = {
  aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',
  libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓',
}

const PILLAR_LABELS = ['YEAR','MONTH','DAY','HOUR']
const PILLAR_KEYS = ['year','month','day','hour']

// Day stem → romanized key & element
const GAN_TO_KEY: Record<string,string> = {
  '甲':'jia','乙':'yi','丙':'bing','丁':'ding','戊':'wu',
  '己':'ji','庚':'geng','辛':'xin','壬':'ren','癸':'gui',
}
const GAN_TO_ELEMENT: Record<string,string> = {
  '甲':'wood','乙':'wood','丙':'fire','丁':'fire','戊':'earth',
  '己':'earth','庚':'metal','辛':'metal','壬':'water','癸':'water',
}
const ELEMENT_COLOR: Record<string,string> = {
  wood:'#4CAF50',fire:'#F44336',earth:'#FF9800',metal:'#9E9E9E',water:'#2196F3',
}
const ELEMENT_DESC: Record<string,string> = {
  wood:'Growth-driven and ambitious. Energized by new challenges. At best when building something meaningful.',
  fire:'Connection and expression. Feels deeply, communicates powerfully, brings life to every room.',
  earth:'The steady one. Grounded, dependable, turns ideas into real results. People rely on you.',
  metal:'Precision and integrity. High standards, strong convictions, pushes self and others toward excellence.',
  water:'Wisdom and depth. Reads people and situations well, adapts to anything, carries quiet insight.',
}

interface Pillar { gan: string; zhi: string }
interface WesternData {
  sun_sign?: string; moon_sign?: string; ascendant?: string; rising?: string
  planets?: Record<string, string>; [key: string]: unknown
}
interface Section { title?: string; content: string }

function extractPillars(data: Record<string,unknown>): Pillar[] | null {
  const nested = (data.pillars ?? data.bazi ?? data.four_pillars ?? data.saju ?? data) as Record<string,unknown>
  const pillars: Pillar[] = []
  for (const key of PILLAR_KEYS) {
    const p = nested[key] as Record<string,unknown> | undefined
    if (!p) continue
    const gan = (p.gan ?? p.stem ?? p.heavenly_stem ?? p.tian_gan ?? '') as string
    const zhi = (p.zhi ?? p.branch ?? p.earthly_branch ?? p.di_zhi ?? '') as string
    if (gan && zhi) pillars.push({ gan, zhi })
  }
  if (pillars.length >= 2) return pillars
  const flat: Pillar[] = []
  for (const key of PILLAR_KEYS) {
    const gan = (nested[`${key}_gan`] ?? nested[`${key}_stem`] ?? '') as string
    const zhi = (nested[`${key}_zhi`] ?? nested[`${key}_branch`] ?? '') as string
    if (gan && zhi) flat.push({ gan, zhi })
  }
  return flat.length >= 2 ? flat : null
}

function extractWestern(data: Record<string,unknown>): WesternData | null {
  const w = (data.western ?? data.astrology ?? data.natal_chart ?? data.western_chart) as WesternData | undefined
  if (w && (w.sun_sign || w.moon_sign)) return w
  if (data.sun_sign) return data as WesternData
  // Flat fields from FastAPI: western_sun, western_moon, western_asc, western_mercury, ...
  if (data.western_sun || data.western_moon || data.western_asc) {
    const planets: Record<string,string> = {}
    for (const planet of ['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']) {
      const val = data[`western_${planet}`] as string | undefined
      if (val) planets[planet] = val
    }
    return {
      sun_sign: (data.western_sun as string) || undefined,
      moon_sign: (data.western_moon as string) || undefined,
      ascendant: (data.western_asc as string) || undefined,
      planets: Object.keys(planets).length > 0 ? planets : undefined,
    }
  }
  return null
}

const EMOJI_SET = '✨💼❤️💰🌿📊💡🌟⚡🏥📅🎯✅⚠️🔮🔥💫☁️📚'
const EMOJI_RE = new RegExp(`[${EMOJI_SET}]`)
const SPLIT_RE = new RegExp(`\\n(?=#{1,3} |\\*\\*[A-Z\\u00C0-\\uFFFF]|[${EMOJI_SET}])`)

export function parseResult(raw: unknown): Section[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    const blocks = raw.split(SPLIT_RE)
    return blocks.map(b => {
      const hMatch = b.match(/^#{1,3} (.+?)\n([\s\S]*)/)
      const bMatch = b.match(/^\*\*(.+?)\*\*\n?([\s\S]*)/)
      const eMatch = b.match(new RegExp(`^[${EMOJI_SET}]\\s*(.+?)\\n([\\s\\S]*)`))
      if (hMatch) return { title: hMatch[1].replace(/\*\*/g,'').replace(EMOJI_RE,'').trim(), content: hMatch[2].trim() }
      if (bMatch) return { title: bMatch[1].replace(EMOJI_RE,'').trim(), content: bMatch[2].trim() }
      if (eMatch) return { title: eMatch[1].replace(/\s*—.*$/,'').trim(), content: eMatch[2].trim() }
      return { content: b.trim() }
    }).filter(s => s.content.length > 0)
  }
  if (Array.isArray(raw)) return raw as Section[]
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string,unknown>
    const textFields = ['reading','interpretation','result','content','summary','fortune','message','content_text']
    for (const f of textFields) {
      if (typeof obj[f] === 'string' && (obj[f] as string).length > 30) return parseResult(obj[f] as string)
    }
    if (obj.sections) return parseResult(obj.sections)
    return Object.entries(obj)
      .filter(([k,v]) => typeof v === 'string' && (v as string).length > 20 && !['sun_sign','moon_sign','ascendant','rising'].includes(k))
      .map(([k,v]) => ({ title: k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), content: v as string }))
  }
  return []
}

// Known section title mapping for accordion labels
const SECTION_LABELS: Record<string,string> = {
  'who you are today': 'Who You Are Today',
  'who you are': 'Who You Are',
  'career': 'Career & Life Path',
  'career & life path': 'Career & Life Path',
  'career & money': 'Career & Money',
  'career & focus': 'Career & Focus',
  'career & learning': 'Career & Learning',
  'money & opportunities': 'Money & Opportunities',
  'money': 'Money & Opportunities',
  'love': 'Love & Relationships',
  'love & relationships': 'Love & Relationships',
  'wealth': 'Wealth & Money',
  'wealth & money': 'Wealth & Money',
  'health': 'Health & Vitality',
  'health & vitality': 'Health & Vitality',
  'health & energy': 'Health & Vitality',
  'life chapters': 'Life Chapters',
  'one thing': 'One Thing to Remember',
  'one thing to remember': 'One Thing to Remember',
  'one thing for today': 'One Thing for Today',
  'your chart today': 'Your Chart Today',
  'today': "Today's Energy",
  "today's energy": "Today's Energy",
  'bottom line': 'Bottom Line',
  'working in your favor': 'What\'s Working',
  'what\'s working': 'What\'s Working in Your Favor',
  'watch out': 'Watch Out For',
  'best timing': 'Best Timing',
  'how to make': 'How to Make It Work',
  'how to use': 'How to Use This Today',
  'who you': 'Who You\'re Both Dealing With',
  'where you work': 'Where You Work Well',
  'where it gets': 'Where It Gets Complicated',
  'bottom line for': 'Bottom Line',
  'at a glance': 'At a Glance',
  'monthly highlights': 'Monthly Highlights',
  'strategy': 'Your Strategy',
  'what your chart': 'What Your Chart Says',
}
function normalizeTitle(t: string): string {
  const low = t.toLowerCase().replace(/[^a-z& ]/g,'').trim()
  // Sort by key length descending so specific keys match before general ones
  const sorted = Object.entries(SECTION_LABELS).sort((a, b) => b[0].length - a[0].length)
  for (const [key, val] of sorted) {
    if (low.includes(key)) return val
  }
  return t.replace(EMOJI_RE,'').replace(/\s*—.*$/,'').trim()
}

// ── Monthly Line Chart ──────────────────────────────────────────────
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CHART_COLORS: Record<string, string> = {
  career: '#a78bfa',
  love: '#f472b6',
  health: '#34d399',
  money: '#fbbf24',
}

function MonthlyLineChart({ label, data, color }: { label: string; data: number[]; color: string }) {
  const W = 280, H = 90, PAD = { top: 10, right: 10, bottom: 22, left: 28 }
  const w = W - PAD.left - PAD.right
  const h = H - PAD.top - PAD.bottom
  const min = Math.max(0, Math.min(...data) - 5)
  const max = Math.min(100, Math.max(...data) + 5)
  const xStep = w / 11
  const yScale = (v: number) => h - ((v - min) / (max - min || 1)) * h
  const pts = data.map((v, i) => `${PAD.left + i * xStep},${PAD.top + yScale(v)}`)
  const area = [
    `M${pts[0]}`,
    ...pts.slice(1).map((p, i) => {
      const [px, py] = pts[i].split(',').map(Number)
      const [cx, cy] = p.split(',').map(Number)
      return `C${px + xStep/2},${py} ${cx - xStep/2},${cy} ${cx},${cy}`
    }),
    `L${PAD.left + 11 * xStep},${PAD.top + h}`,
    `L${PAD.left},${PAD.top + h} Z`,
  ].join(' ')
  const line = [
    `M${pts[0]}`,
    ...pts.slice(1).map((p, i) => {
      const [px, py] = pts[i].split(',').map(Number)
      const [cx, cy] = p.split(',').map(Number)
      return `C${px + xStep/2},${py} ${cx - xStep/2},${cy} ${cx},${cy}`
    }),
  ].join(' ')
  const gradId = `grad_${label}`
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ color: color, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Cormorant Garamond', serif" }}>{label}</p>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Y gridlines */}
        {[0.25, 0.5, 0.75].map((frac, i) => (
          <line key={i} x1={PAD.left} x2={PAD.left + w} y1={PAD.top + h * (1 - frac)} y2={PAD.top + h * (1 - frac)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={area} fill={`url(#${gradId})`} />
        {/* Line */}
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* Dots */}
        {pts.map((p, i) => {
          const [cx, cy] = p.split(',').map(Number)
          return <circle key={i} cx={cx} cy={cy} r="2.5" fill={color} />
        })}
        {/* X axis labels */}
        {MONTHS_SHORT.map((m, i) => (
          <text key={m} x={PAD.left + i * xStep} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="'Noto Sans', sans-serif">{m}</text>
        ))}
        {/* Y axis label min/max */}
        <text x={PAD.left - 4} y={PAD.top + h} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="'Noto Sans', sans-serif">{Math.round(min)}</text>
        <text x={PAD.left - 4} y={PAD.top + 6} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="'Noto Sans', sans-serif">{Math.round(max)}</text>
      </svg>
    </div>
  )
}

function MonthlyTrendsCard({ scores }: { scores: Record<string, number[]> }) {
  const entries = (['career','love','health','money'] as const).filter(k => Array.isArray(scores[k]) && scores[k].length === 12)
  if (!entries.length) return null
  return (
    <div style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
      <p style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, fontFamily: "'Cormorant Garamond', serif" }}>Monthly Trends</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
        {entries.map(k => (
          <MonthlyLineChart key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} data={scores[k]} color={CHART_COLORS[k]} />
        ))}
      </div>
    </div>
  )
}

const PLANET_SYMBOLS: Record<string, string> = {
  sun:'☀', moon:'☽', mercury:'☿', venus:'♀', mars:'♂',
  jupiter:'♃', saturn:'♄', uranus:'♅', neptune:'♆', pluto:'♇',
}

function zodiacSvg(sign: string) {
  const key = sign.toLowerCase().replace(/\s/g,'')
  return ZODIAC_SVG_KEYS.includes(key) ? `${GH}r_${key}.svg` : ''
}

function PlanetCardBig({ planet, symbol, sign }: { planet: string; symbol: string; sign: string }) {
  const src = zodiacSvg(sign)
  const label = sign ? sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase() : 'Unknown'
  return (
    <div style={{ flex:1, background:'rgba(22,33,62,0.85)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:16, padding:'14px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:9, color:'#C9A84C', letterSpacing:2, textTransform:'uppercase', opacity:0.85 }}>{planet}</span>
      <span style={{ fontSize:18, color:'rgba(246,246,248,0.7)', lineHeight:1 }}>{symbol}</span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={sign} width={62} height={62} />
      ) : <div style={{ width:62, height:62, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{ZODIAC_SYMBOL[sign.toLowerCase()] ?? '✦'}</div>}
      <span style={{ fontSize:12, color:'#F6F6F8', fontWeight:700, textAlign:'center' }}>{label}</span>
    </div>
  )
}

function PlanetCardSm({ planet, symbol, sign }: { planet: string; symbol: string; sign: string }) {
  const src = zodiacSvg(sign)
  const label = sign ? sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase() : 'Unknown'
  return (
    <div style={{ flex:1, background:'rgba(22,33,62,0.6)', border:'1px solid rgba(201,168,76,0.18)', borderRadius:12, padding:'10px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
      <span style={{ fontSize:8, color:'#C9A84C', letterSpacing:1.5, textTransform:'uppercase', opacity:0.75 }}>{planet}</span>
      <span style={{ fontSize:13, color:'rgba(246,246,248,0.55)', lineHeight:1 }}>{symbol}</span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={sign} width={36} height={36} />
      ) : <div style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{ZODIAC_SYMBOL[sign.toLowerCase()] ?? '✦'}</div>}
      <span style={{ fontSize:9, color:'rgba(246,246,248,0.75)', fontWeight:700, textAlign:'center' }}>{label}</span>
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ margin:'14px 0 10px', display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:1, background:'rgba(201,168,76,0.2)' }} />
      <span style={{ fontSize:8, color:'rgba(201,168,76,0.5)', letterSpacing:2, textTransform:'uppercase' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'rgba(201,168,76,0.2)' }} />
    </div>
  )
}

function AstrologyProfile({ western, data }: { western: WesternData | null; data: Record<string,unknown> }) {
  const sunSign   = (western?.sun_sign  ?? (data.western_sun  as string) ?? '').toLowerCase().trim()
  const moonSign  = (western?.moon_sign ?? (data.western_moon as string) ?? '').toLowerCase().trim()
  const ascSign   = (
    western?.ascendant ?? western?.rising ??
    (western as Record<string,unknown> | null)?.['asc'] as string ??
    (western as Record<string,unknown> | null)?.['ascendant_sign'] as string ??
    (data.western_asc as string) ?? ''
  ).toLowerCase().trim()
  const planets   = (western?.planets ?? {}) as Record<string,string>

  console.log('[AstrologyProfile] western:', JSON.stringify(western))
  console.log('[AstrologyProfile] sun:', sunSign, 'moon:', moonSign, 'asc:', ascSign)

  const pSign = (key: string) => ((planets[key] ?? (data[`western_${key}`] as string) ?? '') as string).toLowerCase().trim()

  const hasAny = sunSign || moonSign || ascSign

  if (!hasAny) {
    return <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:20 }}>No Western chart data available.</p>
  }

  return (
    <div>
      {/* Big Three */}
      <div style={{ display:'flex', gap:8, width:'100%' }}>
        <PlanetCardBig planet="Sun"    symbol="☀"  sign={sunSign} />
        <PlanetCardBig planet="Moon"   symbol="☽"  sign={moonSign} />
        <PlanetCardBig planet="Rising" symbol="ASC" sign={ascSign} />
      </div>
      <div style={{ display:'flex', gap:8, marginTop:10 }}>
        {['Your core identity — the self you were born to express','Your inner world — emotions and what makes you feel safe','How the world sees you — your outer mask and first impression'].map((t,i) => (
          <div key={i} style={{ flex:1, textAlign:'center', fontSize:10, color:'rgba(215,215,217,0.55)', lineHeight:1.6 }}>{t}</div>
        ))}
      </div>

      {/* Inner Planets */}
      <Divider label="Inner Planets" />
      <div style={{ display:'flex', gap:6, width:'100%' }}>
        {(['mercury','venus','mars','jupiter'] as const).map(p => (
          <PlanetCardSm key={p} planet={p.charAt(0).toUpperCase()+p.slice(1)} symbol={PLANET_SYMBOLS[p]} sign={pSign(p)} />
        ))}
      </div>

      {/* Outer Planets */}
      <Divider label="Outer Planets" />
      <div style={{ display:'flex', gap:6, width:'100%' }}>
        {(['saturn','uranus','neptune','pluto'] as const).map(p => (
          <PlanetCardSm key={p} planet={p.charAt(0).toUpperCase()+p.slice(1)} symbol={PLANET_SYMBOLS[p]} sign={pSign(p)} />
        ))}
      </div>
    </div>
  )
}

function ZodiacBadge({ sign }: { sign: string }) {
  const key = sign.toLowerCase().replace(/\s/g,'')
  const isValid = ZODIAC_SVG_KEYS.includes(key)
  const symbol = ZODIAC_SYMBOL[key] ?? '✦'
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      {isValid ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${GH}r_${key}.svg`} alt={sign} width={52} height={52}
          style={{ borderRadius:8 }}
          onError={e => { (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'),{textContent:symbol,style:'font-size:32px'})) }}
        />
      ) : <span style={{ fontSize:32 }}>{symbol}</span>}
      <span style={{ color:'var(--text-muted)', fontSize:11, textAlign:'center' }}>{sign}</span>
    </div>
  )
}

function ShareButton({ userEmail }: { userEmail: string }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  async function handleShare() {
    if (loading) return
    setLoading(true)
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    const shareData = { title:'AstroPillar — Where the stars meet your fate', text:'Get your free BaZi + Astrology reading ✨', url:shareUrl }
    try {
      if (navigator.share) { await navigator.share(shareData) }
      else { await navigator.clipboard.writeText(`${shareData.text} ${shareUrl}`); setMsg('Link copied!') }
      const res = await apiPost<{ share_count?: number; credit_earned?: boolean; credits_added?: number }>('/record_share', { email:userEmail })
      const count = res.share_count ?? 0
      if (res.credit_earned || res.credits_added) { setMsg('🎉 You earned 1 Credit!') }
      else { const r = 3-(count%3); setMsg(`Shared! ${r} more share${r!==1?'s':''} → 1 Credit`) }
    } catch { setMsg('') }
    finally { setLoading(false) }
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <button onClick={handleShare} disabled={loading} style={{ width:'100%', background:'rgba(201,168,76,0.08)', border:'1px solid var(--gold)', color:'var(--gold)', borderRadius:50, padding:12, fontSize:14, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
        {loading ? '✦ Sharing...' : '↗ Share & Earn Credits'}
      </button>
      {msg && <p style={{ color:'#aaa', fontSize:12, textAlign:'center' }}>{msg}</p>}
      <p style={{ color:'var(--text-muted)', fontSize:11, textAlign:'center' }}>Every 3 shares = 1 free Credit · Max 1 Credit per day</p>
    </div>
  )
}

function ScenarioButton({ birthData }: { birthData: BirthData }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  function handleGo() {
    if (!question.trim()) return
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('scenario_birth', JSON.stringify(birthData))
      sessionStorage.setItem('scenario_question', question.trim())
    }
    router.push('/reading/scenario')
  }
  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width:'100%', background:'rgba(167,139,250,0.08)', border:'1px solid #a78bfa', color:'#a78bfa', borderRadius:50, padding:12, fontSize:14, cursor:'pointer' }}>
      🔮 Analyze This Scenario
    </button>
  )
  return (
    <div style={{ background:'var(--card)', border:'1px solid #a78bfa', borderRadius:16, padding:20 }}>
      <p style={{ color:'#a78bfa', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Ask a Scenario Question</p>
      <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What do you want the stars to reveal about this situation?" rows={3}
        style={{ width:'100%', background:'#0f1829', border:'1px solid var(--border)', borderRadius:10, color:'#fff', padding:'12px 14px', fontSize:14, outline:'none', resize:'vertical', fontFamily:"'Noto Sans', sans-serif", lineHeight:1.6, marginBottom:12 }}
      />
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={()=>setOpen(false)} style={{ flex:1, background:'none', border:'1px solid var(--border)', borderRadius:50, color:'var(--text-muted)', fontSize:13, padding:10, cursor:'pointer' }}>Cancel</button>
        <button onClick={handleGo} disabled={!question.trim()} style={{ flex:2, background:'#a78bfa', border:'none', borderRadius:50, color:'#fff', fontSize:14, fontWeight:700, padding:10, cursor:'pointer', opacity:!question.trim()?0.5:1 }}>
          Analyze <span style={{ background:'rgba(22,33,62,0.4)', borderRadius:20, padding:'2px 8px', fontSize:12 }}>2 Credits</span>
        </button>
      </div>
    </div>
  )
}

// ─── Accordion section ────────────────────────────────────────────────────────
function AccordionSection({ title, content, defaultOpen }: { title: string; content: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div style={{ border:'1px solid rgba(201,168,76,0.2)', borderRadius:14, overflow:'hidden', marginBottom:10 }}>
      <button type="button" onClick={()=>setOpen(o=>!o)} style={{
        width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'15px 18px', background:'var(--card)', border:'none', cursor:'pointer',
        textAlign:'left',
      }}>
        <span style={{ color:'var(--gold)', fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', fontFamily:"'Cormorant Garamond', serif" }}>{title}</span>
        <span style={{ color:'var(--gold)', fontSize:11, transform:open?'rotate(180deg)':'none', transition:'transform 0.2s', flexShrink:0, marginLeft:10 }}>▼</span>
      </button>
      {open && (
        <div style={{ padding:'16px 18px', background:'var(--card)', borderTop:'1px solid rgba(201,168,76,0.12)' }}>
          <p style={{ color:'#ddd', fontSize:14, lineHeight:1.9, whiteSpace:'pre-wrap' }}>{content}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  raw: unknown; onReset: () => void; userEmail?: string; fromCache?: boolean; birthData?: BirthData
}

export default function ReadingResult({ raw, onReset, userEmail, fromCache, birthData }: Props) {
  const [chartTab, setChartTab] = useState<'bazi'|'elements'|'astrology'>('bazi')

  const data = (typeof raw === 'object' && raw !== null) ? raw as Record<string,unknown> : {}
  const pillars = extractPillars(data)
  const western = extractWestern(data)
  const sections = parseResult(raw)

  // Day master info for /explain link
  const dayPillar = pillars?.[2] ?? null
  const dayGanKey = dayPillar ? (GAN_TO_KEY[dayPillar.gan] ?? '') : ''
  const dayElement = dayPillar ? (GAN_TO_ELEMENT[dayPillar.gan] ?? '') : ''
  const sunSign = western?.sun_sign?.toLowerCase().replace(/\s/g,'') ?? ''

  const explainUrl = `/explain?day_gan=${dayGanKey}&element=${dayElement}&sun=${sunSign}`
  const hasExplainData = dayGanKey || dayElement || sunSign

  const TABS = [
    { key:'bazi', label:'BaZi Chart' },
    { key:'elements', label:'Elements' },
    { key:'astrology', label:'Astrology Profile' },
  ] as const

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex:1, padding:'9px 0', borderRadius:8, border:'none', cursor:'pointer',
    fontSize:12, fontWeight:600, background: active ? 'var(--gold)' : 'transparent',
    color: active ? '#16213E' : 'var(--text-muted)',
  })

  return (
    <div>
      {/* ── Chart Tabs ── */}
      {(pillars || western) && (
        <div className="card" style={{ marginBottom:20, padding:'16px' }}>
          {/* Tab switcher */}
          <div style={{ display:'flex', background:'#0a0a1a', borderRadius:10, padding:4, marginBottom:16 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setChartTab(t.key)} style={tabStyle(chartTab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* BaZi Chart */}
          {chartTab === 'bazi' && (
            <div>
              {pillars && pillars.length >= 2 ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:`repeat(${pillars.length},1fr)`, gap:10, marginBottom:16 }}>
                    {pillars.map((p,i) => (
                      <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                        <p style={{ color:'var(--text-muted)', fontSize:9, letterSpacing:1.5, textTransform:'uppercase' }}>{PILLAR_LABELS[i]}</p>
                        <Image src={ganImg(p.gan)} alt={p.gan} width={56} height={56} unoptimized style={{ borderRadius:8 }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                        <Image src={zhiImg(p.zhi)} alt={p.zhi} width={56} height={56} unoptimized style={{ borderRadius:8 }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                      </div>
                    ))}
                  </div>
                  {hasExplainData && (
                    <Link href={explainUrl} style={{ display:'block', textAlign:'center', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, padding:'10px 16px', color:'var(--gold)', fontSize:13, textDecoration:'none' }}>
                      What does this mean? →
                    </Link>
                  )}
                </>
              ) : (
                <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:20 }}>No BaZi chart data available.</p>
              )}
            </div>
          )}

          {/* Elements */}
          {chartTab === 'elements' && (
            <div>
              {dayElement ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ background:'rgba(201,168,76,0.04)', border:`1px solid ${ELEMENT_COLOR[dayElement]}40`, borderRadius:12, padding:'16px' }}>
                    <p style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Day Master Element</p>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <div style={{ width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`${ELEMENT_COLOR[dayElement]}18`, border:`1.5px solid ${ELEMENT_COLOR[dayElement]}`, color:ELEMENT_COLOR[dayElement], fontSize:20, fontWeight:700 }}>
                        {dayPillar?.gan}
                      </div>
                      <div>
                        <p style={{ color:'#fff', fontSize:16, fontWeight:700, textTransform:'capitalize' }}>{dayElement}</p>
                        <p style={{ color:'var(--text-muted)', fontSize:12 }}>{dayGanKey ? dayGanKey.charAt(0).toUpperCase()+dayGanKey.slice(1) : ''} Day Master</p>
                      </div>
                    </div>
                    <p style={{ color:'var(--text-muted)', fontSize:13, lineHeight:1.7, fontStyle:'italic' }}>{ELEMENT_DESC[dayElement]}</p>
                  </div>
                  {hasExplainData && (
                    <Link href={explainUrl} style={{ textAlign:'center', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, padding:'10px 16px', color:'var(--gold)', fontSize:13, textDecoration:'none', display:'block' }}>
                      Explore all Five Elements →
                    </Link>
                  )}
                </div>
              ) : (
                <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:20 }}>Element data not available.</p>
              )}
            </div>
          )}

          {/* Astrology Profile */}
          {chartTab === 'astrology' && (
            <AstrologyProfile western={western} data={data} />
          )}
        </div>
      )}

      {/* ── Monthly Trends (Yearly Reading only) ── */}
      {data.reading_type === 'yearly' && data.monthly_scores != null && (
        <MonthlyTrendsCard scores={data.monthly_scores as Record<string, number[]>} />
      )}

      {/* ── GPT Reading ── */}
      {sections.length > 0 && (
        <div style={{ marginBottom:20 }}>
          {data.reading_type === 'situation' ? (
            // Scenario Reading: plain flowing text, no accordion
            sections.map((s,i) => (
              <div key={i} style={{ marginBottom:20 }}>
                {s.title && (
                  <p style={{ color:'var(--gold)', fontSize:13, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', fontFamily:"'Cormorant Garamond', serif", marginBottom:10 }}>
                    {normalizeTitle(s.title)}
                  </p>
                )}
                <p style={{ color:'#ddd', fontSize:14, lineHeight:1.9, whiteSpace:'pre-wrap' }}>{s.content}</p>
              </div>
            ))
          ) : (
            // All other readings: accordion
            sections.map((s,i) => (
              <AccordionSection
                key={i}
                title={s.title ? normalizeTitle(s.title) : `Section ${i+1}`}
                content={s.content}
                defaultOpen={i === 0}
              />
            ))
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
        {fromCache && (
          <div style={{ textAlign:'center', padding:'6px 12px', background:'rgba(46,204,113,0.08)', border:'1px solid rgba(46,204,113,0.3)', borderRadius:10 }}>
            <span style={{ color:'#2ecc71', fontSize:12 }}>✓ Cached result — no Credit charged</span>
          </div>
        )}
        {birthData && <ScenarioButton birthData={birthData} />}
        {userEmail && <ShareButton userEmail={userEmail} />}
        <button onClick={onReset} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:50, padding:12, fontSize:14, cursor:'pointer' }}>
          ← New Reading
        </button>
        <Link href="/menu" style={{ textAlign:'center', color:'var(--text-muted)', fontSize:13, textDecoration:'none' }}>
          Back to Menu
        </Link>
      </div>
    </div>
  )
}
