'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api'
import { BirthData } from './BirthForm'
import { usePricing } from '@/hooks/usePricing'

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

function extractPersonPillars(data: Record<string,unknown>, prefix: string): Pillar[] | null {
  const pillars: Pillar[] = []
  for (const key of PILLAR_KEYS) {
    const gan = (data[`${prefix}_${key}_gan`] ?? '') as string
    const zhi = (data[`${prefix}_${key}_zhi`] ?? '') as string
    if (gan && zhi) pillars.push({ gan, zhi })
  }
  return pillars.length >= 2 ? pillars : null
}

function extractPersonWestern(data: Record<string,unknown>, prefix: string): WesternData | null {
  const sun  = (data[`${prefix}_western_sun`]  as string) || ''
  const moon = (data[`${prefix}_western_moon`] as string) || ''
  const asc  = (data[`${prefix}_western_asc`]  as string) || ''
  if (!sun && !moon && !asc) return null
  const planets: Record<string,string> = {}
  for (const planet of ['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']) {
    const val = data[`${prefix}_western_${planet}`] as string | undefined
    if (val) planets[planet] = val
  }
  return {
    sun_sign:   sun  || undefined,
    moon_sign:  moon || undefined,
    ascendant:  asc  || undefined,
    planets: Object.keys(planets).length > 0 ? planets : undefined,
  }
}

const EMOJI_SET = '✨💼❤️💰🌿📊💡🌟⚡🏥📅🎯✅⚠️🔮🔥💫☁️📚💬🌱'
const EMOJI_RE = new RegExp(`[${EMOJI_SET}]`, 'u')
// \n+ handles both single and double newlines before section headers (fixes intermittent Yearly split bug)
const SPLIT_RE = new RegExp(`\\n+(?=#{1,3} |\\*\\*[A-Z\\u00C0-\\uFFFF]|[${EMOJI_SET}])`, 'u')

// ── Chinese character annotations ────────────────────────────────────
const GAN_LABELS: Record<string, string> = {
  '甲':'Bold Wood','乙':'Graceful Wood','丙':'Blazing Fire','丁':'Glowing Fire',
  '戊':'Steady Earth','己':'Grounded Earth','庚':'Forged Metal','辛':'Pure Metal',
  '壬':'Vast Water','癸':'Still Water',
}
const ZHI_LABELS: Record<string, string> = {
  '子':'Rat','丑':'Ox','寅':'Tiger','卯':'Rabbit','辰':'Dragon','巳':'Snake',
  '午':'Horse','未':'Goat','申':'Monkey','酉':'Rooster','戌':'Dog','亥':'Pig',
}
const CHINESE_ANNOTATIONS: Record<string, string> = {
  ...GAN_LABELS, ...ZHI_LABELS,
  '比肩':'Friend Star','劫財':'Rival Star','食神':'Creative Star',
  '傷官':'Expression Star','偏財':'Indirect Wealth','正財':'Direct Wealth',
  '偏官':'Power Star','正官':'Direct Officer','偏印':'Shadow Wisdom','正印':'Pure Wisdom',
  '年柱':'Year Pillar','月柱':'Month Pillar','日柱':'Day Pillar','時柱':'Hour Pillar',
  '木':'Wood','火':'Fire','土':'Earth','金':'Metal','水':'Water',
  '天干':'Sky Element','地支':'Earth Sign','大運':'Major Luck Cycle',
  '流年':'Annual Luck','格局':'Chart Pattern','用神':'Guiding Star',
  '空亡':'Void','陰':'Yin','陽':'Yang',
}
// Sort entries longest-first to avoid partial matches
const ANNOTATION_ENTRIES = Object.entries(CHINESE_ANNOTATIONS).sort((a,b) => b[0].length - a[0].length)

function annotateChineseChars(text: string): string {
  let result = text
  for (const [char, eng] of ANNOTATION_ENTRIES) {
    // Only replace if not already followed by " (..."
    const re = new RegExp(`${char}(?! \\()`, 'g')
    result = result.replace(re, `${char} (${eng})`)
  }
  return result
}

// Scenario reading section titles (GPT sometimes outputs without emoji/newline headers)
const SCENARIO_TITLES = ['Short Answer','In-Depth Analysis','Best Timing Today','Best Timing','How to Use This Today','Action Steps']
const SCENARIO_SPLIT_RE = new RegExp(`(?<=[.!?]\\s{0,2}|\\n)(?=(?:${SCENARIO_TITLES.join('|')})\\s)`)

function parseScenarioFallback(text: string): Section[] {
  // Split on known scenario section names when they appear after sentence boundaries
  const parts = text.split(SCENARIO_SPLIT_RE).filter(p => p && p.trim().length > 10)
  if (parts.length < 2) return []
  return parts.map(p => {
    const titleMatch = p.match(new RegExp(`^(${SCENARIO_TITLES.join('|')})\\s+(\\S[\\s\\S]*)`, 'u'))
    if (titleMatch) return { title: titleMatch[1], content: titleMatch[2].trim() }
    return { content: p.trim() }
  }).filter(s => s.content.length > 0)
}

export function parseResult(raw: unknown): Section[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    const blocks = raw.replace(/\r\n/g, '\n').split(SPLIT_RE)
    const sections = blocks.map(b => {
      const hMatch = b.match(/^#{1,3} (.+?)\n([\s\S]*)/)
      const bMatch = b.match(/^\*\*(.+?)\*\*\n?([\s\S]*)/)
      const eMatch = b.match(new RegExp(`^[${EMOJI_SET}]\\s*(.+?)\\n([\\s\\S]*)`, 'u'))
      if (hMatch) return { title: hMatch[1].replace(/\*\*/g,'').replace(EMOJI_RE,'').trim(), content: hMatch[2].trim() }
      if (bMatch) return { title: bMatch[1].replace(EMOJI_RE,'').trim(), content: bMatch[2].trim() }
      if (eMatch) return { title: eMatch[1].replace(/\s*—.*$/,'').trim(), content: eMatch[2].trim() }
      return { content: b.trim() }
    }).filter(s => s.content.length > 0)
    // If we got only 1-2 sections but content contains scenario section names, try scenario fallback
    if (sections.length <= 2) {
      const combined = sections.map(s => s.content).join(' ')
      if (SCENARIO_TITLES.slice(1).some(t => combined.includes(t + ' '))) {
        const fallback = parseScenarioFallback(combined)
        if (fallback.length >= 3) return fallback
      }
    }
    return sections
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
  'how you communicate': 'How You Communicate',
  'where you work': 'Where You Work Well',
  'where it gets': 'Where It Gets Complicated',
  'how you grow': 'How You Grow Together',
  'bottom line for': 'Bottom Line',
  'short answer': 'Short Answer',
  'in-depth analysis': 'In-Depth Analysis',
  'action steps': 'Action Steps',
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

// ── Day Master Labels for bold rendering ────────────────────────────
const DAY_MASTER_LABELS = [
  'Bold Wood','Graceful Wood','Blazing Fire','Glowing Fire','Steady Earth',
  'Grounded Earth','Forged Metal','Pure Metal','Vast Water','Still Water',
]
const DM_LABEL_RE = new RegExp(`(${DAY_MASTER_LABELS.join('|')})`, 'g')

function RichText({ text }: { text: string }) {
  const annotated = annotateChineseChars(text)
  const parts = annotated.split(DM_LABEL_RE)
  return (
    <p style={{ color:'#ddd', fontSize:14, lineHeight:1.9, whiteSpace:'pre-wrap', margin:0 }}>
      {parts.map((part, i) =>
        DAY_MASTER_LABELS.includes(part)
          ? <strong key={i} style={{ color:'var(--gold)', fontWeight:700 }}>{part}</strong>
          : part
      )}
    </p>
  )
}

// ── Radar (Hexagonal) Chart ──────────────────────────────────────────
const RADAR_AXES = ['Love','Career','Wealth','Health','Vitality','Life']
const RADAR_KEYS = ['love','career','wealth','health','vitality','life']
const RADAR_COLORS = ['#f472b6','#a78bfa','#fbbf24','#34d399','#60a5fa','#C9A84C']

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const N = RADAR_AXES.length
  const R = 72, CX = 105, CY = 105, W = 210, H = 210
  const pt = (i: number, val: number): [number, number] => {
    const angle = (i * 2 * Math.PI / N) - Math.PI / 2
    const r = (val / 100) * R
    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
  }
  const axisPts = RADAR_AXES.map((_, i) => pt(i, 100))
  const dataPts = RADAR_KEYS.map((k, i) => pt(i, scores[k] ?? 50))
  const poly = (pts: [number,number][]) => pts.map(([x,y]) => `${x},${y}`).join(' ')
  const gridLevels = [0.25, 0.5, 0.75, 1.0]
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:4 }}>
      <svg width={W} height={H} style={{ maxWidth:'100%', overflow:'visible' }}>
        {gridLevels.map((lv, li) => (
          <polygon key={li} points={poly(RADAR_AXES.map((_,i) => pt(i, lv*100)))}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}
        {axisPts.map(([x,y], i) => (
          <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
        <polygon points={poly(dataPts)} fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth="1.8" />
        {dataPts.map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={RADAR_COLORS[i]} />
        ))}
        {RADAR_AXES.map((label, i) => {
          const [x, y] = pt(i, 112)
          const anchor = x < CX - 4 ? 'end' : x > CX + 4 ? 'start' : 'middle'
          const score = Math.round(scores[RADAR_KEYS[i]] ?? 50)
          return (
            <g key={i}>
              <text x={x} y={y - 1} textAnchor={anchor} fontSize="8" fill={RADAR_COLORS[i]}
                fontWeight="700" letterSpacing="0.8" fontFamily="'Noto Sans', sans-serif">{label.toUpperCase()}</text>
              <text x={x} y={y + 9} textAnchor={anchor} fontSize="8" fill="rgba(255,255,255,0.55)"
                fontFamily="'Noto Sans', sans-serif">{score}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Lifespan Chart (0~120 에너지 커브, 2-row layout) — replaces LuckCycleBarChart ──
function LifespanChart({ points }: { points: Array<{age:number, energy:number}> }) {
  if (!points?.length) return null

  const ROW1 = points.filter(p => p.age <= 60)
  const ROW2 = points.filter(p => p.age > 60)

  function renderRow(data: typeof points, label: string) {
    if (!data.length) return null
    const W = 340, H = 70, PAD = { top:8, right:6, bottom:20, left:22 }
    const w = W - PAD.left - PAD.right
    const h = H - PAD.top - PAD.bottom
    const ages = data.map(p => p.age)
    const minAge = Math.min(...ages), maxAge = Math.max(...ages)
    const xScale = (age: number) => PAD.left + ((age - minAge) / (maxAge - minAge || 1)) * w
    const yScale = (e: number) => PAD.top + h - (e / 100) * h
    const pts = data.map(p => `${xScale(p.age)},${yScale(p.energy)}`)
    const areaPath = pts.length > 1
      ? `M${pts[0]} ${pts.slice(1).map((p, i) => {
          const [px, py] = pts[i].split(',').map(Number)
          const [cx, cy] = p.split(',').map(Number)
          const mx = (px + cx) / 2
          return `C${mx},${py} ${mx},${cy} ${cx},${cy}`
        }).join(' ')} L${PAD.left+w},${PAD.top+h} L${PAD.left},${PAD.top+h} Z`
      : ''
    const linePath = pts.length > 1
      ? `M${pts[0]} ${pts.slice(1).map((p, i) => {
          const [px, py] = pts[i].split(',').map(Number)
          const [cx, cy] = p.split(',').map(Number)
          const mx = (px + cx) / 2
          return `C${mx},${py} ${mx},${cy} ${cx},${cy}`
        }).join(' ')}`
      : ''
    const gradId = `lifespan_${label.replace(/\s/g,'')}`
    return (
      <div key={label}>
        <p style={{ color:'rgba(201,168,76,0.6)', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', marginBottom:2 }}>Ages {label}</p>
        <svg width={W} height={H} style={{ maxWidth:'100%', display:'block', overflow:'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25,0.5,0.75].map((f,i) => (
            <line key={i} x1={PAD.left} x2={PAD.left+w} y1={PAD.top+h*(1-f)} y2={PAD.top+h*(1-f)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
          {linePath && <path d={linePath} fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" />}
          {data.filter((_,i) => i % Math.ceil(data.length/8) === 0 || data.indexOf(_) === data.length-1).map(p => (
            <text key={p.age} x={xScale(p.age)} y={H-3} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="'Noto Sans', sans-serif">{p.age}</text>
          ))}
          <text x={PAD.left-2} y={PAD.top+h} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.28)" fontFamily="'Noto Sans', sans-serif">0</text>
          <text x={PAD.left-2} y={PAD.top+5} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.28)" fontFamily="'Noto Sans', sans-serif">100</text>
        </svg>
      </div>
    )
  }

  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ color:'#a78bfa', fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8, fontFamily:"'Cormorant Garamond', serif" }}>Fortune by Life Chapters</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {renderRow(ROW1, '0 – 60')}
        {renderRow(ROW2, '61 – 120')}
      </div>
    </div>
  )
}

// ── Luck Cycle Bar Chart (kept as fallback if lifespan data absent) ─
function LuckCycleBarChart({ cycles }: { cycles: Array<{period:string, score:number}> }) {
  if (!cycles?.length) return null
  const BAR_W = 38, GAP = 10, H = 80, PAD = 14
  const W = cycles.length * (BAR_W + GAP) + PAD * 2
  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ color:'#a78bfa', fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4, fontFamily:"'Cormorant Garamond', serif" }}>Fortune by Luck Cycle</p>
      <svg width={Math.min(W, 380)} height={H + 32} style={{ maxWidth:'100%', overflow:'visible' }}>
        {cycles.map((c, i) => {
          const barH = Math.max(4, (c.score / 100) * H)
          const x = PAD + i * (BAR_W + GAP)
          const [start, end] = c.period.split('-')
          return (
            <g key={i}>
              <rect x={x} y={H - barH} width={BAR_W} height={barH}
                fill="rgba(167,139,250,0.2)" stroke="#a78bfa" strokeWidth="1" rx="3" />
              <text x={x + BAR_W/2} y={H - barH - 4} textAnchor="middle" fontSize="9"
                fill="#a78bfa" fontWeight="700" fontFamily="'Noto Sans', sans-serif">{c.score}</text>
              <text x={x + BAR_W/2} y={H + 12} textAnchor="middle" fontSize="8"
                fill="rgba(255,255,255,0.45)" fontFamily="'Noto Sans', sans-serif">{start}</text>
              <text x={x + BAR_W/2} y={H + 22} textAnchor="middle" fontSize="7"
                fill="rgba(255,255,255,0.3)" fontFamily="'Noto Sans', sans-serif">~{end?.slice(-2)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── AM/PM Bar Chart ──────────────────────────────────────────────────
function AmPmBarChart({ am, pm }: { am:number, pm:number }) {
  const colors = { am:'#fbbf24', pm:'#818cf8' }
  const H = 72, BAR_W = 52, GAP = 22
  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ color:'var(--text-muted)', fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4, fontFamily:"'Cormorant Garamond', serif" }}>Today&apos;s Energy</p>
      <svg width={BAR_W*2 + GAP + 24} height={H + 28} style={{ overflow:'visible' }}>
        {(['am','pm'] as const).map((slot, i) => {
          const score = slot === 'am' ? am : pm
          const color = colors[slot]
          const barH = Math.max(4, (score / 100) * H)
          const x = 12 + i * (BAR_W + GAP)
          return (
            <g key={slot}>
              <rect x={x} y={H - barH} width={BAR_W} height={barH}
                fill={`${color}25`} stroke={color} strokeWidth="1.5" rx="4" />
              <text x={x + BAR_W/2} y={H - barH - 4} textAnchor="middle" fontSize="11"
                fill={color} fontWeight="700" fontFamily="'Noto Sans', sans-serif">{score}</text>
              <text x={x + BAR_W/2} y={H + 14} textAnchor="middle" fontSize="11"
                fill={color} fontWeight="600" fontFamily="'Noto Sans', sans-serif">{slot.toUpperCase()}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Wu Xing (Five Elements) Relationship Chart ───────────────────────
function WuXingChart({ soulElement, wood, fire, earth, metal, water }: {
  soulElement: string; wood: number; fire: number; earth: number; metal: number; water: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = 110

    const elements = [
      { name: 'Wood',  hanja: '木', color: '#4CAF50', score: wood  },
      { name: 'Fire',  hanja: '火', color: '#F44336', score: fire  },
      { name: 'Earth', hanja: '土', color: '#FF9800', score: earth },
      { name: 'Metal', hanja: '金', color: '#9E9E9E', score: metal },
      { name: 'Water', hanja: '水', color: '#2196F3', score: water },
    ]

    const positions = elements.map((_, i) => {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2
      return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) }
    })

    const totalScore = (wood + fire + earth + metal + water) || 1
    const nodeRadius = (score: number) => 18 + (score / totalScore) * 70

    const drawArrow = (fromIdx: number, toIdx: number, color: string, isDashed: boolean) => {
      const from = positions[fromIdx], to = positions[toIdx]
      const rFrom = nodeRadius(elements[fromIdx].score), rTo = nodeRadius(elements[toIdx].score)
      const angle = Math.atan2(to.y - from.y, to.x - from.x)
      const startX = from.x + rFrom * Math.cos(angle), startY = from.y + rFrom * Math.sin(angle)
      const endX = to.x - (rTo + 5) * Math.cos(angle), endY = to.y - (rTo + 5) * Math.sin(angle)

      ctx.beginPath()
      ctx.setLineDash(isDashed ? [5, 4] : [])
      ctx.strokeStyle = color
      ctx.lineWidth = isDashed ? 1.5 : 2
      ctx.globalAlpha = 0.75
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()

      ctx.globalAlpha = 0.9
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.save()
      ctx.translate(endX, endY)
      ctx.rotate(angle)
      ctx.moveTo(0, 0)
      ctx.lineTo(-8, 4)
      ctx.lineTo(-8, -4)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      ctx.globalAlpha = 1
    }

    ctx.clearRect(0, 0, W, H)

    ctx.beginPath()
    positions.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y) })
    ctx.closePath()
    ctx.strokeStyle = 'rgba(200,168,76,0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 4])
    ctx.stroke()
    ctx.setLineDash([])

    ;[0, 1, 2, 3, 4].forEach(i => drawArrow(i, (i + 1) % 5, '#4CAF50', false))
    ;([[0,2],[2,4],[4,1],[1,3],[3,0]] as [number,number][]).forEach(([a, b]) => drawArrow(a, b, '#F44336', true))

    elements.forEach((el, i) => {
      const p = positions[i]
      const r = nodeRadius(el.score)

      const grd = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r * 1.5)
      grd.addColorStop(0, el.color + '40')
      grd.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()

      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fillStyle = '#16213E'
      ctx.fill()
      ctx.strokeStyle = el.color
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = el.color
      ctx.font = `bold ${Math.round(r * 0.75)}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(el.hanja, p.x, p.y - r * 0.1)

      ctx.fillStyle = '#D7D7D9'
      ctx.font = `${Math.round(r * 0.32)}px Arial`
      ctx.fillText(el.name, p.x, p.y + r * 0.52)

      if (el.name === soulElement) {
        ctx.fillStyle = '#FFD700'
        ctx.font = `bold ${Math.round(r * 0.32)}px Arial`
        ctx.fillText('★ You', p.x, p.y + r + 12)
      }
    })
  }, [soulElement, wood, fire, earth, metal, water])

  return (
    <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
      <canvas ref={canvasRef} width={320} height={320} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Arial', fontSize: 11, color: '#D7D7D9' }}>
          <div style={{ width: 20, height: 2, borderRadius: 2, background: '#4CAF50' }} />
          Nourishes
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Arial', fontSize: 11, color: '#D7D7D9' }}>
          <div style={{ width: 20, height: 2, borderRadius: 2, background: '#F44336' }} />
          Restrains
        </div>
      </div>
    </div>
  )
}

// ── Monthly Line Chart ──────────────────────────────────────────────
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CHART_COLORS: Record<string, string> = {
  career: '#a78bfa',
  love: '#f472b6',
  health: '#34d399',
  money: '#fbbf24',
}

function MonthlyLineChart({ label, data, color, width = 330 }: { label: string; data: number[]; color: string; width?: number }) {
  const W = Math.min(width, 380)
  const H = Math.round(W * 0.3)
  const PAD = { top: 10, right: 8, bottom: 22, left: 26 }
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
  const gradId = `grad_${label}_${W}`
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ color: color, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3, fontFamily: "'Cormorant Garamond', serif" }}>{label}</p>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible', maxWidth: '100%' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((frac, i) => (
          <line key={i} x1={PAD.left} x2={PAD.left + w} y1={PAD.top + h * (1 - frac)} y2={PAD.top + h * (1 - frac)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        {pts.map((p, i) => {
          const [cx, cy] = p.split(',').map(Number)
          const isHigh = data[i] === Math.max(...data)
          const isLow = data[i] === Math.min(...data)
          const showLabel = isHigh || isLow || i === 0 || i === 11
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={isHigh || isLow ? 3 : 2.2} fill={color} />
              {showLabel && (
                <text x={cx} y={cy - 5} textAnchor="middle" fontSize="7.5" fill={color}
                  fontWeight="700" fontFamily="'Noto Sans', sans-serif">{data[i]}</text>
              )}
            </g>
          )
        })}
        {MONTHS_SHORT.map((m, i) => (
          <text key={m} x={PAD.left + i * xStep} y={H - 3} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="'Noto Sans', sans-serif">{m}</text>
        ))}
        <text x={PAD.left - 3} y={PAD.top + h} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.28)" fontFamily="'Noto Sans', sans-serif">{Math.round(min)}</text>
        <text x={PAD.left - 3} y={PAD.top + 6} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.28)" fontFamily="'Noto Sans', sans-serif">{Math.round(max)}</text>
      </svg>
    </div>
  )
}

// Returns chart JSX to embed inside a specific accordion section
function getSectionChart(sectionTitle: string, scores: Record<string, number[]>): React.ReactNode | null {
  const low = sectionTitle.toLowerCase()

  // At a Glance → overall average of career/love/health/money
  if (low.includes('glance')) {
    const base = ['career', 'love', 'health', 'money'].filter(k => Array.isArray(scores[k]) && scores[k].length === 12)
    if (base.length === 4) {
      const overall = Array.from({ length: 12 }, (_, i) =>
        Math.round(base.reduce((sum, k) => sum + scores[k][i], 0) / base.length)
      )
      return <div style={{ marginBottom: 14 }}><MonthlyLineChart label="Overall" data={overall} color="#C9A84C" width={330} /></div>
    }
    return null
  }

  let keys: string[] = []
  if (low.includes('career') && (low.includes('money') || low.includes('finance'))) keys = ['career', 'money']
  else if (low.includes('love') || low.includes('relationship')) keys = ['love']
  else if (low.includes('health')) keys = ['health']
  else if (low.includes('wealth') || (low.includes('money') && !low.includes('career'))) keys = ['money']
  else if (low.includes('career')) keys = ['career']
  else if (low.includes('monthly') || low.includes('highlight')) keys = ['career', 'love', 'health', 'money']
  const valid = keys.filter(k => Array.isArray(scores[k]) && scores[k].length === 12)
  if (!valid.length) return null
  if (valid.length === 4) {
    // 2×2 grid for Monthly Highlights
    const w = 152
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0px 8px', marginBottom: 14, padding: '10px 0 4px' }}>
        {valid.map(k => (
          <MonthlyLineChart key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} data={scores[k]} color={CHART_COLORS[k]} width={w} />
        ))}
      </div>
    )
  }
  if (valid.length === 2) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {valid.map(k => (
          <MonthlyLineChart key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} data={scores[k]} color={CHART_COLORS[k]} width={330} />
        ))}
      </div>
    )
  }
  return <div style={{ marginBottom: 14 }}><MonthlyLineChart label={valid[0].charAt(0).toUpperCase() + valid[0].slice(1)} data={scores[valid[0]]} color={CHART_COLORS[valid[0]]} width={330} /></div>
}

// ── Compatibility Radar Chart (dynamic labels from COMPAT_SCORES) ────
function CompatibilityRadarChart({ scores }: { scores: Record<string, {label:string; score:number} | number> }) {
  const dims = (['dim1','dim2','dim3','dim4','dim5','dim6'] as const)
    .map(k => scores[k])
    .filter((d): d is {label:string; score:number} => typeof d === 'object' && d !== null)
  if (dims.length < 3) return null
  const N = dims.length
  const R = 72, CX = 105, CY = 105, W = 210, H = 210
  const pt = (i: number, val: number): [number, number] => {
    const angle = (i * 2 * Math.PI / N) - Math.PI / 2
    const r = (val / 100) * R
    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
  }
  const axisPts = dims.map((_, i) => pt(i, 100))
  const dataPts = dims.map((d, i) => pt(i, d.score))
  const poly = (pts: [number,number][]) => pts.map(([x,y]) => `${x},${y}`).join(' ')
  const COLORS = ['#f472b6','#a78bfa','#fbbf24','#34d399','#60a5fa','#C9A84C']
  const gridLevels = [0.25, 0.5, 0.75, 1.0]
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:4 }}>
      <svg width={W} height={H} style={{ maxWidth:'100%', overflow:'visible' }}>
        {gridLevels.map((lv, li) => (
          <polygon key={li} points={poly(dims.map((_,i) => pt(i, lv*100)))}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}
        {axisPts.map(([x,y], i) => (
          <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
        <polygon points={poly(dataPts)} fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth="1.8" />
        {dataPts.map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={COLORS[i % COLORS.length]} />
        ))}
        {dims.map((d, i) => {
          const [x, y] = pt(i, 118)
          const anchor = x < CX - 4 ? 'end' : x > CX + 4 ? 'start' : 'middle'
          return (
            <g key={i}>
              <text x={x} y={y - 1} textAnchor={anchor} fontSize="7.5" fill={COLORS[i % COLORS.length]}
                fontWeight="700" letterSpacing="0.8" fontFamily="'Noto Sans', sans-serif">{d.label.toUpperCase()}</text>
              <text x={x} y={y + 9} textAnchor={anchor} fontSize="8" fill="rgba(255,255,255,0.55)"
                fontFamily="'Noto Sans', sans-serif">{d.score}</text>
            </g>
          )
        })}
      </svg>
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
        <PlanetCardBig planet="Rising" symbol={ZODIAC_SYMBOL[ascSign.toLowerCase().replace(/\s/g,'')] ?? '↑'} sign={ascSign} />
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

function NatalChartViewer({ birthData }: { birthData: BirthData }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function loadChart() {
    if (svg) { setOpen(true); return }
    setLoading(true)
    try {
      const hourVal = birthData.hour ?? 12
      const minVal = birthData.minute ?? 0
      const birthtimeStr = `${hourVal}:${String(minVal).padStart(2,'0')}`
      const res = await apiPost<{ ok: boolean; svg?: string }>('/natal_chart_svg', {
        year: birthData.year, month: birthData.month, day: birthData.day,
        birthtime: birthtimeStr,
        sex: birthData.sex || 'M',
        city: birthData.city || '',
      })
      if (res.ok && res.svg) { setSvg(res.svg); setOpen(true) }
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  return (
    <>
      <button onClick={loadChart} disabled={loading} style={{ width:'100%', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.4)', color:'var(--gold)', borderRadius:50, padding:12, fontSize:14, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
        {loading ? '✦ Loading chart...' : '🔭 View Birth Chart'}
      </button>
      {open && svg && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setOpen(false)}>
          <div style={{ background:'#fff', borderRadius:12, maxWidth:480, maxHeight:'85vh', overflow:'auto', padding:8 }}
            onClick={e => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width:'100%' }} />
          </div>
          <button onClick={() => setOpen(false)} style={{ marginTop:16, color:'#fff', background:'none', border:'1px solid rgba(255,255,255,0.3)', borderRadius:50, padding:'8px 24px', cursor:'pointer', fontSize:14 }}>
            Close
          </button>
        </div>
      )}
    </>
  )
}

function ScenarioButton({ birthData }: { birthData: BirthData }) {
  const router = useRouter()
  const pricing = usePricing()
  const scenarioCost = pricing.scenario
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
          Analyze <span style={{ background:'rgba(22,33,62,0.4)', borderRadius:20, padding:'2px 8px', fontSize:12 }}>{scenarioCost} {scenarioCost === 1 ? 'Credit' : 'Credits'}</span>
        </button>
      </div>
    </div>
  )
}

// ─── Accordion section ────────────────────────────────────────────────────────
function AccordionSection({ title, content, defaultOpen, chartContent }: { title: string; content: string; defaultOpen?: boolean; chartContent?: React.ReactNode }) {
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
          {chartContent}
          <RichText text={content} />
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
  const [personTab, setPersonTab] = useState<'p1'|'p2'>('p1')

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

  const woodScore  = (data.wood_points  as number) || 0
  const fireScore  = (data.fire_points  as number) || 0
  const earthScore = (data.earth_points as number) || 0
  const metalScore = (data.metal_points as number) || 0
  const waterScore = (data.water_points as number) || 0
  const soulElement = dayElement ? dayElement.charAt(0).toUpperCase() + dayElement.slice(1) : ''

  // Your Sign: western_sun × day_master_label (e.g. Scorpio × Forged Metal)
  const yourSignSun = ((data.western_sun as string) ?? western?.sun_sign ?? '').toLowerCase().replace(/\s/g,'')
  const yourSignLabel = (data.day_master_label as string) ?? ''
  const yourSignName = yourSignSun ? yourSignSun.charAt(0).toUpperCase() + yourSignSun.slice(1) : ''

  // ── Compatibility: person-specific data ──────────────────────────────
  const isCompatibility = data.reading_type === 'compatibility'
  const p1Pillars = isCompatibility ? extractPersonPillars(data, 'person1') : null
  const p1Western = isCompatibility ? extractPersonWestern(data, 'person1') : null
  const p2Pillars = isCompatibility ? extractPersonPillars(data, 'person2') : null
  const p2Western = isCompatibility ? extractPersonWestern(data, 'person2') : null

  const activePillars   = isCompatibility ? (personTab === 'p1' ? p1Pillars : p2Pillars) : pillars
  const activeWestern   = isCompatibility ? (personTab === 'p1' ? p1Western : p2Western) : western
  const activeDayPillar = activePillars?.[2] ?? null
  const activeDayGanKey = activeDayPillar ? (GAN_TO_KEY[activeDayPillar.gan] ?? '') : ''
  const activeDayElement = activeDayPillar ? (GAN_TO_ELEMENT[activeDayPillar.gan] ?? '') : ''
  const activeSoulElement = activeDayElement ? activeDayElement.charAt(0).toUpperCase() + activeDayElement.slice(1) : ''

  const getElem = (pfx: string, el: string) => ((data[`${pfx}_${el}_points`] as number) || 0)
  const activePfx = personTab === 'p1' ? 'person1' : 'person2'
  const activeWoodScore  = isCompatibility ? getElem(activePfx, 'wood')  : woodScore
  const activeFireScore  = isCompatibility ? getElem(activePfx, 'fire')  : fireScore
  const activeEarthScore = isCompatibility ? getElem(activePfx, 'earth') : earthScore
  const activeMetalScore = isCompatibility ? getElem(activePfx, 'metal') : metalScore
  const activeWaterScore = isCompatibility ? getElem(activePfx, 'water') : waterScore

  const activeYourSignSun = isCompatibility
    ? ((data[`${activePfx}_western_sun`] as string) ?? '').toLowerCase().replace(/\s/g,'')
    : yourSignSun
  const activeYourSignLabel = isCompatibility
    ? ((data[`${activePfx}_day_master_label`] as string) ?? '')
    : yourSignLabel
  const activeYourSignName = activeYourSignSun ? activeYourSignSun.charAt(0).toUpperCase() + activeYourSignSun.slice(1) : ''

  // COMPAT_SCORES
  const compatScores = data.compatibility_scores as Record<string, {label:string; score:number} | number> | undefined
  const overallCompatScore = compatScores ? (compatScores.overall as number ?? null) : null

  // Person names for switcher labels
  const p1Name = (data.person1_name ?? data.name ?? '') as string
  const p2Name = (data.person2_name ?? data.partner_name ?? '') as string

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
      {/* ── Compatibility Score Card ── */}
      {isCompatibility && compatScores && (
        <div className="card" style={{ marginBottom:20, padding:'16px 16px 12px' }}>
          {overallCompatScore !== null && (
            <div style={{ textAlign:'center', marginBottom:10 }}>
              <p style={{ color:'rgba(201,168,76,0.65)', fontSize:9, letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>Compatibility Score</p>
              <p style={{ fontSize:42, fontWeight:800, color:'#C9A84C', fontFamily:"'Cormorant Garamond', serif", lineHeight:1, margin:0 }}>
                {overallCompatScore} <span style={{ fontSize:18, color:'rgba(201,168,76,0.45)', fontWeight:400 }}>/ 100</span>
              </p>
            </div>
          )}
          <CompatibilityRadarChart scores={compatScores} />
        </div>
      )}

      {/* ── Chart Tabs ── */}
      {(activePillars || activeWestern || isCompatibility) && (
        <div className="card" style={{ marginBottom:20, padding:'16px' }}>
          {/* Person Switcher (Compatibility only) */}
          {isCompatibility && (
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {(['p1','p2'] as const).map(p => (
                <button key={p} onClick={() => setPersonTab(p)} style={{
                  flex:1, padding:'8px 0', borderRadius:50,
                  border: personTab === p ? 'none' : '1px solid rgba(201,168,76,0.3)',
                  cursor:'pointer', fontSize:12, fontWeight:600,
                  background: personTab === p ? 'var(--gold)' : 'transparent',
                  color: personTab === p ? '#16213E' : 'var(--text-muted)',
                }}>
                  {p === 'p1' ? `You${p1Name ? ` (${p1Name})` : ''}` : `Partner${p2Name ? ` (${p2Name})` : ''}`}
                </button>
              ))}
            </div>
          )}

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
              {activePillars && activePillars.length >= 2 ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:`repeat(${activePillars.length},1fr)`, gap:10, marginBottom:16 }}>
                    {activePillars.map((p,i) => (
                      <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                        <p style={{ color:'var(--text-muted)', fontSize:9, letterSpacing:1.5, textTransform:'uppercase' }}>{PILLAR_LABELS[i]}</p>
                        <Image src={ganImg(p.gan)} alt={p.gan} width={56} height={56} unoptimized style={{ borderRadius:8 }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                        <p style={{ color:'rgba(201,168,76,0.75)', fontSize:8, textAlign:'center', lineHeight:1.3 }}>
                          {p.gan}{GAN_LABELS[p.gan] ? ` (${GAN_LABELS[p.gan]})` : ''}
                        </p>
                        <Image src={zhiImg(p.zhi)} alt={p.zhi} width={56} height={56} unoptimized style={{ borderRadius:8 }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                        <p style={{ color:'rgba(170,170,170,0.7)', fontSize:8, textAlign:'center', lineHeight:1.3 }}>
                          {p.zhi}{ZHI_LABELS[p.zhi] ? ` (${ZHI_LABELS[p.zhi]})` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                  {activeYourSignName && activeYourSignLabel && (
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                      <div style={{
                        display:'inline-flex', flexDirection:'column', alignItems:'center', gap:4,
                        background:'linear-gradient(135deg,rgba(201,168,76,0.14) 0%,rgba(201,168,76,0.06) 100%)',
                        border:'1px solid rgba(201,168,76,0.45)',
                        borderRadius:50, padding:'8px 20px',
                      }}>
                        <span style={{ fontSize:9, color:'rgba(201,168,76,0.65)', letterSpacing:2, textTransform:'uppercase', fontWeight:700 }}>Your Sign</span>
                        <span style={{ color:'#fff', fontSize:15, fontWeight:700, fontFamily:'sans-serif', letterSpacing:0.3 }}>
                          {activeYourSignName}
                          <span style={{ color:'rgba(201,168,76,0.5)', margin:'0 8px', fontWeight:400 }}>·</span>
                          {activeYourSignLabel}
                        </span>
                      </div>
                    </div>
                  )}
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
              {activeDayElement ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ background:'rgba(201,168,76,0.04)', border:`1px solid ${ELEMENT_COLOR[activeDayElement]}40`, borderRadius:12, padding:'16px' }}>
                    <p style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Day Master Element</p>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <div style={{ width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`${ELEMENT_COLOR[activeDayElement]}18`, border:`1.5px solid ${ELEMENT_COLOR[activeDayElement]}`, color:ELEMENT_COLOR[activeDayElement], fontSize:20, fontWeight:700 }}>
                        {activeDayPillar?.gan}
                      </div>
                      <div>
                        <p style={{ color:'#fff', fontSize:16, fontWeight:700, textTransform:'capitalize' }}>{activeDayElement}</p>
                        <p style={{ color:'var(--text-muted)', fontSize:12 }}>{activeDayGanKey ? activeDayGanKey.charAt(0).toUpperCase()+activeDayGanKey.slice(1) : ''} Day Master</p>
                      </div>
                    </div>
                    <p style={{ color:'var(--text-muted)', fontSize:13, lineHeight:1.7, fontStyle:'italic' }}>{ELEMENT_DESC[activeDayElement]}</p>
                  </div>

                  {/* Wu Xing Relationship Chart */}
                  <div style={{ background:'rgba(22,33,62,0.5)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:12, padding:'16px 12px 12px' }}>
                    <p style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:2, textTransform:'uppercase', marginBottom:12, textAlign:'center' }}>Five Elements · Relationships</p>
                    <WuXingChart
                      soulElement={activeSoulElement}
                      wood={activeWoodScore} fire={activeFireScore} earth={activeEarthScore} metal={activeMetalScore} water={activeWaterScore}
                    />
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
            <AstrologyProfile western={activeWestern} data={data} />
          )}
        </div>
      )}

      {/* ── Overall Radar Chart (Personal Fortune / Daily) ── */}
      {(data.reading_type === 'personal_fortune' || data.reading_type === 'personal_daily_fortune') &&
        data.overall_scores != null && (
        <div className="card" style={{ marginBottom:16, padding:'16px 16px 8px' }}>
          <p style={{ color:'var(--gold)', fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', textAlign:'center', marginBottom:2, fontFamily:"'Cormorant Garamond', serif" }}>
            {data.reading_type === 'personal_daily_fortune' ? "Today's Fortune" : 'Lifetime Fortune'}
          </p>
          <RadarChart scores={data.overall_scores as Record<string,number>} />
          {data.reading_type === 'personal_daily_fortune' && data.am_pm_scores != null && (
            <div style={{ display:'flex', justifyContent:'center', marginTop:4 }}>
              <AmPmBarChart
                am={(data.am_pm_scores as Record<string,number>).am ?? 70}
                pm={(data.am_pm_scores as Record<string,number>).pm ?? 70}
              />
            </div>
          )}
        </div>
      )}

      {/* ── GPT Reading ── */}
      {sections.length > 0 && (
        <div style={{ marginBottom:20 }}>
          {sections.map((s,i) => {
            let normTitle = s.title ? normalizeTitle(s.title) : `Section ${i+1}`
            if (data.reading_type === 'daily' && normTitle === 'Who You Are Today' && data.target_date) {
              const d = new Date((data.target_date as string) + 'T00:00:00')
              const label = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
              normTitle = `Who You Are Today (${label})`
            }
            const monthlyScores = (data.reading_type === 'yearly' && data.monthly_scores != null)
              ? data.monthly_scores as Record<string, number[]>
              : null
            let chart: React.ReactNode = monthlyScores ? getSectionChart(normTitle, monthlyScores) : null

            // Personal Fortune: lifespan chart (or luck cycle fallback) inside "Life Chapters" section
            if (!chart && data.reading_type === 'personal_fortune') {
              const low = normTitle.toLowerCase()
              if (low.includes('life chapter') || low.includes('luck cycle')) {
                if (data.lifespan_points != null) {
                  chart = <LifespanChart points={data.lifespan_points as Array<{age:number,energy:number}>} />
                } else if (data.luck_cycles != null) {
                  chart = <LuckCycleBarChart cycles={data.luck_cycles as Array<{period:string,score:number}>} />
                }
              }
            }

            return (
              <AccordionSection
                key={i}
                title={normTitle}
                content={s.content}
                defaultOpen={i === 0}
                chartContent={chart}
              />
            )
          })}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
        {fromCache && (
          <div style={{ textAlign:'center', padding:'6px 12px', background:'rgba(46,204,113,0.08)', border:'1px solid rgba(46,204,113,0.3)', borderRadius:10 }}>
            <span style={{ color:'#2ecc71', fontSize:12 }}>✓ Cached result — no Credit charged</span>
          </div>
        )}
        {birthData && <NatalChartViewer birthData={birthData} />}
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
