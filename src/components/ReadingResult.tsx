'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { apiPost } from '@/lib/api'
import { createShare, birthDateStr } from '@/lib/firestore'
import { zodiacSignName } from '@/lib/birthLabels'
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
  aries:'♈︎',taurus:'♉︎',gemini:'♊︎',cancer:'♋︎',leo:'♌︎',virgo:'♍︎',
  libra:'♎︎',scorpio:'♏︎',sagittarius:'♐︎',capricorn:'♑︎',aquarius:'♒︎',pisces:'♓︎',
}

const PILLAR_LABELS_MAP: Record<string, string[]> = {
  ko: ['연도','월','일','시'],
  ja: ['年','月','日','時'],
}
const PILLAR_LABELS_EN = ['YEAR','MONTH','DAY','HOUR']
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

const EMOJI_SET = '✨💼❤️💰🌿📊💡🌟⚡🏥📅🎯✅⚠️🔮🔥💫☁️📚💬🌱🂠✦🌀⚔⏪💭🌊🪞🌐🌗⭐'
const EMOJI_RE = new RegExp(`[${EMOJI_SET}]`, 'u')
// \n+ handles both single and double newlines before section headers (fixes intermittent Yearly split bug)
// 🂠 = tarot card-back emoji for card sections; ✦ = tarot answer section delimiter
const SPLIT_RE = new RegExp(`\\n+(?=#{1,3} |\\*\\*[A-Z\\u00C0-\\uFFFF]|[${EMOJI_SET}])`, 'u')

// ── Chinese character annotations ────────────────────────────────────
const ANNOTATIONS_BY_LOCALE: Record<string, Record<string, string>> = {
  en: {
    '甲':'Bold Wood','乙':'Graceful Wood','丙':'Blazing Fire','丁':'Glowing Fire',
    '戊':'Steady Earth','己':'Grounded Earth','庚':'Forged Metal','辛':'Pure Metal',
    '壬':'Vast Water','癸':'Still Water',
    '子':'Rat','丑':'Ox','寅':'Tiger','卯':'Rabbit','辰':'Dragon','巳':'Snake',
    '午':'Horse','未':'Goat','申':'Monkey','酉':'Rooster','戌':'Dog','亥':'Pig',
    '比肩':'Friend Star','劫財':'Rival Star','食神':'Creative Star',
    '傷官':'Expression Star','偏財':'Indirect Wealth','正財':'Direct Wealth',
    '偏官':'Power Star','正官':'Direct Officer','偏印':'Shadow Wisdom','正印':'Pure Wisdom',
    '年柱':'Year Pillar','月柱':'Month Pillar','日柱':'Day Pillar','時柱':'Hour Pillar',
    '木':'Wood','火':'Fire','土':'Earth','金':'Metal','水':'Water',
    '天干':'Sky Element','地支':'Earth Sign','大運':'Major Luck Cycle',
    '流年':'Annual Luck','格局':'Chart Pattern','用神':'Guiding Star',
    '空亡':'Void','陰':'Yin','陽':'Yang',
  },
  ko: {
    '甲':'굳센 나무','乙':'부드러운 나무','丙':'타오르는 불','丁':'은은한 불',
    '戊':'든든한 흙','己':'유연한 흙','庚':'단련된 금속','辛':'순수한 금속',
    '壬':'드넓은 물','癸':'고요한 물',
    '子':'쥐','丑':'소','寅':'호랑이','卯':'토끼','辰':'용','巳':'뱀',
    '午':'말','未':'양','申':'원숭이','酉':'닭','戌':'개','亥':'돼지',
    '比肩':'비견 · 자립심','劫財':'겁재 · 경쟁·추진력','食神':'식신 · 창의·기회',
    '傷官':'상관 · 재능·표현력','偏財':'편재 · 임시 재물','正財':'정재 · 직접 재물',
    '偏官':'편관 · 집중·권위','正官':'정관 · 규율·체계','偏印':'편인 · 직관·신뢰','正印':'정인 · 학식·지혜',
    '年柱':'연주','月柱':'월주','日柱':'일주','時柱':'시주',
    '木':'목','火':'화','土':'토','金':'금','水':'수',
    '天干':'천간','地支':'지지','大運':'대운',
    '流年':'유년','格局':'격국','用神':'용신',
    '空亡':'공망','陰':'음','陽':'양',
  },
  ja: {
    '甲':'大木','乙':'草花','丙':'太陽','丁':'灯火',
    '戊':'大山','己':'田園','庚':'刀剣','辛':'宝石',
    '壬':'大海','癸':'雨露',
    '子':'鼠','丑':'牛','寅':'虎','卯':'兎','辰':'龍','巳':'蛇',
    '午':'馬','未':'羊','申':'猿','酉':'鶏','戌':'犬','亥':'猪',
    '比肩':'自立星','劫財':'競争星','食神':'創造星',
    '傷官':'表現星','偏財':'偏財星','正財':'正財星',
    '偏官':'権威星','正官':'規律星','偏印':'直観星','正印':'知恵星',
    '年柱':'年柱','月柱':'月柱','日柱':'日柱','時柱':'時柱',
    '木':'木','火':'火','土':'土','金':'金','水':'水',
    '天干':'天干','地支':'地支','大運':'大運',
    '流年':'流年','格局':'格局','用神':'用神',
    '空亡':'空亡','陰':'陰','陽':'陽',
  },
}

const ANNOTATION_ENTRIES_BY_LOCALE: Record<string, [string, string][]> = Object.fromEntries(
  Object.entries(ANNOTATIONS_BY_LOCALE).map(([loc, map]) => [
    loc, Object.entries(map).sort((a, b) => b[0].length - a[0].length),
  ])
)

function annotateChineseChars(text: string, locale: string): string {
  const entries = ANNOTATION_ENTRIES_BY_LOCALE[locale] ?? ANNOTATION_ENTRIES_BY_LOCALE.en
  let result = text
  for (const [char, label] of entries) {
    const re = new RegExp(`${char}(?! \\()`, 'g')
    result = result.replace(re, `${char} (${label})`)
  }
  // 연속된 한자 어노테이션 사이 공백 추가: "己 (유연한 흙)酉" → "己 (유연한 흙) 酉"
  result = result.replace(/\)\s*([一-鿿㐀-䶿])/g, ') $1')
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

// Yearly reading keywords (GPT sometimes outputs section headers without emoji)
const YEARLY_KEYWORDS = ['Glance','Career','Love','Relationships','Health','Vitality','Growth','Learning','Monthly','Highlights','Strategy']
const YEARLY_SPLIT_RE = new RegExp(
  `\\n(?=[✨💼❤🌿📊📅💡]?\\s*(?:\\d{4}\\s+)?(?:Your\\s+)?(?:${YEARLY_KEYWORDS.join('|')}))`,
  'u'
)

function parseYearlyFallback(text: string): Section[] {
  const parts = text.split(YEARLY_SPLIT_RE).filter(p => p && p.trim().length > 30)
  if (parts.length < 3) return []
  return parts.map(p => {
    const trimmed = p.trim()
    const firstNl = trimmed.indexOf('\n')
    if (firstNl > 0 && firstNl < 80) {
      const rawTitle = trimmed.substring(0, firstNl).replace(/^[✨💼❤🌿📊📅💡]\s*/, '').trim()
      const content = trimmed.substring(firstNl + 1).trim()
      if (content.length > 20) return { title: rawTitle, content }
    }
    return { content: trimmed }
  }).filter(s => s.content.length > 0)
}

export function parseResult(raw: unknown, readingType?: string): Section[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    const blocks = raw.replace(/\r\n/g, '\n').split(SPLIT_RE)
    const sections = blocks.map(b => {
      const hMatch = b.match(/^#{1,3} (.+?)\n([\s\S]*)/)
      const bMatch = b.match(/^\*\*(.+?)\*\*\n?([\s\S]*)/)
      const eMatch = b.match(new RegExp(`^[${EMOJI_SET}]\\uFE0F?\\s*(.+?)\\n([\\s\\S]*)`, 'u'))
      if (hMatch) return { title: hMatch[1].replace(/\*\*/g,'').replace(EMOJI_RE,'').trim(), content: hMatch[2].trim() }
      if (bMatch) return { title: bMatch[1].replace(EMOJI_RE,'').trim(), content: bMatch[2].trim() }
      if (eMatch) return { title: eMatch[1].replace(/\s*—.*$/,'').trim(), content: eMatch[2].trim() }
      return { content: b.trim() }
    }).filter(s => s.content.length > 0)
    // If we got only 1-2 sections but content contains scenario section names, try scenario fallback
    if (sections.length <= 2) {
      const combined = sections.map(s => s.content).join(' ')
      if (SCENARIO_TITLES.slice(1).some(t => combined.includes(t + ' ') || combined.includes(t + '\n'))) {
        const fallback = parseScenarioFallback(combined)
        if (fallback.length >= 3) return fallback
      }
    }
    // If yearly reading got few sections, try yearly-specific keyword fallback
    if (sections.length <= 3 && readingType === 'yearly') {
      const combined = sections.map(s => [s.title, s.content].filter(Boolean).join('\n')).join('\n\n')
      if (YEARLY_KEYWORDS.some(k => combined.includes(k))) {
        const fallback = parseYearlyFallback(combined)
        if (fallback.length >= 4) return fallback
      }
    }
    return sections
  }
  if (Array.isArray(raw)) return raw as Section[]
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string,unknown>
    const textFields = ['reading','interpretation','result','content','summary','fortune','message','content_text']
    for (const f of textFields) {
      if (typeof obj[f] === 'string' && (obj[f] as string).length > 30) return parseResult(obj[f] as string, readingType)
    }
    if (obj.sections) return parseResult(obj.sections, readingType)
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

// ── Ten Gods tooltip data ────────────────────────────────────────────
const TEN_GODS_DATA: Record<string, Array<{ term: string; explanation: string }>> = {
  en: [
    { term: 'Friend Star',    explanation: 'Same element & polarity. Self-reliance, competition, and peer bonds.' },
    { term: 'Rival Star',     explanation: 'Same element, opposite polarity. Bold action and ambition — watch over-spending.' },
    { term: 'Creative Star',  explanation: 'Element you generate, same polarity. Talent, expression, and contentment.' },
    { term: 'Expression Star',explanation: 'Element you generate, opposite polarity. Creativity and rebellion — rule-breaker energy.' },
    { term: 'Indirect Wealth',explanation: 'Element you control, opposite polarity. Business, investment, and windfall luck.' },
    { term: 'Direct Wealth',  explanation: 'Element you control, same polarity. Steady income and diligent effort.' },
    { term: 'Power Star',     explanation: 'Element that controls you, opposite polarity. Ambition, pressure, and raw drive.' },
    { term: 'Direct Officer', explanation: 'Element that controls you, same polarity. Reputation, rules, and social standing.' },
    { term: 'Shadow Wisdom',  explanation: 'Element that feeds you, opposite polarity. Intuition and independence — can be erratic.' },
    { term: 'Pure Wisdom',    explanation: 'Element that feeds you, same polarity. Learning, wisdom, and steady support.' },
  ],
  ko: [
    { term: '비견', explanation: '나와 같은 오행·음양. 자존심·독립심·경쟁과 협력의 별.' },
    { term: '겁재', explanation: '같은 오행, 반대 음양. 추진력·모험심·재물 소모에 주의.' },
    { term: '식신', explanation: '내가 생하는 오행, 같은 음양. 재능·여유·행복을 부르는 별.' },
    { term: '상관', explanation: '내가 생하는 오행, 반대 음양. 창의력·예술성·반골 기질.' },
    { term: '편재', explanation: '내가 극하는 오행, 반대 음양. 사업·투자·우연한 횡재의 별.' },
    { term: '정재', explanation: '내가 극하는 오행, 같은 음양. 안정적 재물·성실·근면의 별.' },
    { term: '편관', explanation: '나를 극하는 오행, 반대 음양. 도전·압박·야망·칠살의 별.' },
    { term: '정관', explanation: '나를 극하는 오행, 같은 음양. 명예·규범·사회적 지위의 별.' },
    { term: '편인', explanation: '나를 생하는 오행, 반대 음양. 직관·독창성·불규칙한 흐름의 별.' },
    { term: '정인', explanation: '나를 생하는 오행, 같은 음양. 학문·지혜·안정적 지원의 별.' },
  ],
  ja: [
    { term: '比肩', explanation: '同じ五行・陰陽。自立心・競争と協力の星。' },
    { term: '劫財', explanation: '同じ五行、逆の陰陽。行動力と冒険心。財の消耗に注意。' },
    { term: '食神', explanation: '自分が生む五行、同じ陰陽。才能・表現・幸福の星。' },
    { term: '傷官', explanation: '自分が生む五行、逆の陰陽。創造力・芸術性・反骨精神の星。' },
    { term: '偏財', explanation: '自分が剋する五行、逆の陰陽。事業・投資・棚ぼた運の星。' },
    { term: '正財', explanation: '自分が剋する五行、同じ陰陽。安定収入・勤勉・誠実の星。' },
    { term: '偏官', explanation: '自分を剋する五行、逆の陰陽。挑戦・プレッシャー・野望の星。' },
    { term: '正官', explanation: '自分を剋する五行、同じ陰陽。名誉・規律・社会的地位の星。' },
    { term: '偏印', explanation: '自分を生む五行、逆の陰陽。直感・独創性・不規則な流れの星。' },
    { term: '正印', explanation: '自分を生む五行、同じ陰陽。学問・知恵・安定したサポートの星。' },
  ],
}

function TenGodTooltip({ term, explanation }: { term: string; explanation: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span
        style={{ color: 'var(--gold-light)', borderBottom: '1px dotted rgba(201,168,76,0.6)', cursor: 'help', fontWeight: 600 }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
      >
        {term}
      </span>
      {visible && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14,18,36,0.97)', border: '1px solid var(--gold-line)', borderRadius: 10,
          padding: '10px 14px', fontSize: 13, color: 'var(--ink)', lineHeight: 1.6,
          whiteSpace: 'normal', width: 220, zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)', pointerEvents: 'none',
          display: 'block',
        }}>
          <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: 4 }}>{term}</strong>
          {explanation}
        </span>
      )}
    </span>
  )
}

// ── Day Master Labels for bold rendering ────────────────────────────
const DAY_MASTER_LABELS_BY_LOCALE: Record<string, string[]> = {
  en: ['Bold Wood','Graceful Wood','Blazing Fire','Glowing Fire','Steady Earth','Grounded Earth','Forged Metal','Pure Metal','Vast Water','Still Water'],
  ko: ['굳센 나무','부드러운 나무','타오르는 불','은은한 불','든든한 흙','유연한 흙','단련된 금속','순수한 금속','드넓은 물','고요한 물'],
  ja: ['大木','草花','太陽','灯火','大山','田園','刀剣','宝石','大海','雨露'],
}

function RichText({ text }: { text: string }) {
  const locale = useLocale()
  const labels = DAY_MASTER_LABELS_BY_LOCALE[locale] ?? DAY_MASTER_LABELS_BY_LOCALE.en
  const tenGodsItems = TEN_GODS_DATA[locale] ?? TEN_GODS_DATA.en
  const tenGodsTerms = tenGodsItems.map(t => t.term)
  const tenGodsMap = Object.fromEntries(tenGodsItems.map(t => [t.term, t.explanation]))

  // longest-first to avoid partial match (e.g. "Direct Wealth" before "Wealth")
  const allTerms = [...labels, ...tenGodsTerms].sort((a, b) => b.length - a.length)
  const splitRe = new RegExp(`(${allTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gu')

  const annotated = annotateChineseChars(text, locale)
  const parts = annotated.split(splitRe)

  return (
    <p className="rr-prose" style={{ whiteSpace:'pre-wrap', margin:0 }}>
      {parts.map((part, i) => {
        if (labels.includes(part))
          return <strong key={i} style={{ color:'var(--gold-light)', fontWeight:700 }}>{part}</strong>
        if (tenGodsTerms.includes(part))
          return <TenGodTooltip key={i} term={part} explanation={tenGodsMap[part]} />
        return part
      })}
    </p>
  )
}

// ── Radar (Hexagonal) Chart ──────────────────────────────────────────
const RADAR_AXES_MAP: Record<string, string[]> = {
  ko: ['사랑','커리어','재물','건강','활력','인생'],
  ja: ['恋愛','キャリア','財運','健康','活力','人生'],
}
const RADAR_AXES_EN = ['Love','Career','Wealth','Health','Vitality','Life']
const RADAR_KEYS = ['love','career','wealth','health','vitality','life']
const RADAR_COLORS = ['#f472b6','#a78bfa','#fbbf24','#34d399','#60a5fa','#C9A84C']

function RadarChart({ scores, axes }: { scores: Record<string, number>; axes?: string[] }) {
  const radarAxes = axes ?? RADAR_AXES_EN
  const N = radarAxes.length
  const R = 72, CX = 105, CY = 105, W = 210, H = 210
  const pt = (i: number, val: number): [number, number] => {
    const angle = (i * 2 * Math.PI / N) - Math.PI / 2
    const r = (val / 100) * R
    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
  }
  const axisPts = radarAxes.map((_, i) => pt(i, 100))
  const dataPts = RADAR_KEYS.map((k, i) => pt(i, scores[k] ?? 50))
  const poly = (pts: [number,number][]) => pts.map(([x,y]) => `${x},${y}`).join(' ')
  const gridLevels = [0.25, 0.5, 0.75, 1.0]
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:4 }}>
      <svg width={W} height={H} style={{ maxWidth:'100%', overflow:'visible' }}>
        {gridLevels.map((lv, li) => (
          <polygon key={li} points={poly(radarAxes.map((_,i) => pt(i, lv*100)))}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}
        {axisPts.map(([x,y], i) => (
          <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
        <polygon points={poly(dataPts)} fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth="1.8" />
        {dataPts.map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={RADAR_COLORS[i]} />
        ))}
        {radarAxes.map((label, i) => {
          const [x, y] = pt(i, 112)
          const anchor = x < CX - 4 ? 'end' : x > CX + 4 ? 'start' : 'middle'
          const score = Math.round(scores[RADAR_KEYS[i]] ?? 50)
          return (
            <g key={i}>
              <text x={x} y={y - 1} textAnchor={anchor} fontSize="10" fill={RADAR_COLORS[i]}
                fontWeight="700" letterSpacing="0.8" fontFamily="'Noto Sans', sans-serif">{label.toUpperCase()}</text>
              <text x={x} y={y + 11} textAnchor={anchor} fontSize="10" fill="rgba(255,255,255,0.65)"
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
  const t = useTranslations('reading')
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
        <p style={{ color:'rgba(201,168,76,0.6)', fontSize:12, letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>Ages {label}</p>
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
            <text key={p.age} x={xScale(p.age)} y={H-3} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="'Noto Sans', sans-serif">{p.age}</text>
          ))}
          <text x={PAD.left-2} y={PAD.top+h} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.28)" fontFamily="'Noto Sans', sans-serif">0</text>
          <text x={PAD.left-2} y={PAD.top+5} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.28)" fontFamily="'Noto Sans', sans-serif">100</text>
        </svg>
      </div>
    )
  }

  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ color:'var(--lavender)', fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:8, fontFamily:"'Cormorant Garamond', serif" }}>{t('fortune_life_chapters')}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {renderRow(ROW1, '0 – 60')}
        {renderRow(ROW2, '61 – 120')}
      </div>
    </div>
  )
}

// ── Luck Cycle Bar Chart (kept as fallback if lifespan data absent) ─
function LuckCycleBarChart({ cycles }: { cycles: Array<{period:string, score:number}> }) {
  const t = useTranslations('reading')
  if (!cycles?.length) return null
  const BAR_W = 38, GAP = 10, H = 80, PAD = 14
  const W = cycles.length * (BAR_W + GAP) + PAD * 2
  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ color:'var(--lavender)', fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:4, fontFamily:"'Cormorant Garamond', serif" }}>{t('fortune_luck_cycle')}</p>
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
              <text x={x + BAR_W/2} y={H + 12} textAnchor="middle" fontSize="9.5"
                fill="rgba(255,255,255,0.45)" fontFamily="'Noto Sans', sans-serif">{start}</text>
              <text x={x + BAR_W/2} y={H + 22} textAnchor="middle" fontSize="9"
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
  const t = useTranslations('reading')
  const colors = { am:'#fbbf24', pm:'#818cf8' }
  const H = 72, BAR_W = 52, GAP = 22
  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ color:'var(--ink-2)', fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:4, fontFamily:"'Cormorant Garamond', serif" }}>{t('todays_energy')}</p>
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
  const t = useTranslations('reading')
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
          {t('nourishes')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Arial', fontSize: 11, color: '#D7D7D9' }}>
          <div style={{ width: 20, height: 2, borderRadius: 2, background: '#F44336' }} />
          {t('restrains')}
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
      <p style={{ color: color, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3, fontFamily: "'Cormorant Garamond', serif" }}>{label}</p>
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
          <text key={m} x={PAD.left + i * xStep} y={H - 3} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="'Noto Sans', sans-serif">{m}</text>
        ))}
        <text x={PAD.left - 3} y={PAD.top + h} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.28)" fontFamily="'Noto Sans', sans-serif">{Math.round(min)}</text>
        <text x={PAD.left - 3} y={PAD.top + 6} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.28)" fontFamily="'Noto Sans', sans-serif">{Math.round(max)}</text>
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
              <text x={x} y={y - 1} textAnchor={anchor} fontSize="9.5" fill={COLORS[i % COLORS.length]}
                fontWeight="700" letterSpacing="0.8" fontFamily="'Noto Sans', sans-serif">{d.label.toUpperCase()}</text>
              <text x={x} y={y + 11} textAnchor={anchor} fontSize="10" fill="rgba(255,255,255,0.65)"
                fontFamily="'Noto Sans', sans-serif">{d.score}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const PLANET_SYMBOLS: Record<string, string> = {
  sun:'☀︎', moon:'☽︎', mercury:'☿︎', venus:'♀︎', mars:'♂︎',
  jupiter:'♃︎', saturn:'♄︎', uranus:'♅︎', neptune:'♆︎', pluto:'♇︎',
}

function zodiacSvg(sign: string) {
  const key = sign.toLowerCase().replace(/\s/g,'')
  return ZODIAC_SVG_KEYS.includes(key) ? `${GH}r_${key}.svg` : ''
}

function PlanetCardBig({ planet, symbol, sign }: { planet: string; symbol: string; sign: string }) {
  const src = zodiacSvg(sign)
  const label = sign ? sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase() : 'Unknown'
  return (
    <div className="rr-planet rr-planet-big">
      <span style={{ fontSize:12, color:'var(--gold-light)', letterSpacing:1.5, textTransform:'uppercase' }}>{planet}</span>
      <span style={{ fontSize:18, color:'rgba(246,246,248,0.7)', lineHeight:1 }}>{symbol}</span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={sign} width={62} height={62} />
      ) : <div style={{ width:62, height:62, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{ZODIAC_SYMBOL[sign.toLowerCase()] ?? '✦'}</div>}
      <span style={{ fontSize:14, color:'var(--ink)', fontWeight:700, textAlign:'center' }}>{label}</span>
    </div>
  )
}

function PlanetCardSm({ planet, symbol, sign }: { planet: string; symbol: string; sign: string }) {
  const src = zodiacSvg(sign)
  const label = sign ? sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase() : 'Unknown'
  return (
    <div className="rr-planet">
      <span style={{ fontSize:12, color:'var(--gold-light)', letterSpacing:.5 }}>{planet}</span>
      <span style={{ fontSize:13, color:'rgba(246,246,248,0.55)', lineHeight:1 }}>{symbol}</span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={sign} width={36} height={36} />
      ) : <div style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{ZODIAC_SYMBOL[sign.toLowerCase()] ?? '✦'}</div>}
      <span style={{ fontSize:12, color:'var(--ink)', fontWeight:700, textAlign:'center' }}>{label}</span>
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ margin:'20px 0 12px', display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1, height:1, background:'linear-gradient(90deg, transparent, rgba(201,168,76,0.3))' }} />
      <span style={{ fontSize:12, color:'var(--gold-light)', letterSpacing:1.5, opacity:.85 }}>{label}</span>
      <div style={{ flex:1, height:1, background:'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)' }} />
    </div>
  )
}

function AstrologyProfile({ western, data }: { western: WesternData | null; data: Record<string,unknown> }) {
  const t = useTranslations('reading')
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
    return <p style={{ color:'var(--ink-2)', fontSize:14, textAlign:'center', padding:20 }}>{t('no_western')}</p>
  }

  return (
    <div>
      {/* Big Three */}
      <div style={{ display:'flex', gap:8, width:'100%' }}>
        <PlanetCardBig planet="Sun"    symbol="☀︎"  sign={sunSign} />
        <PlanetCardBig planet="Moon"   symbol="☽︎"  sign={moonSign} />
        <PlanetCardBig planet="Rising" symbol="↑"   sign={ascSign} />
      </div>
      <div style={{ display:'flex', gap:8, marginTop:10 }}>
        {[t('sun_desc'), t('moon_desc'), t('rising_desc')].map((desc,i) => (
          <div key={i} style={{ flex:1, textAlign:'center', fontSize:12, color:'var(--ink-2)', lineHeight:1.55 }}>{desc}</div>
        ))}
      </div>

      {/* Inner Planets */}
      <Divider label={t('inner_planets')} />
      <div style={{ display:'flex', gap:6, width:'100%' }}>
        {(['mercury','venus','mars','jupiter'] as const).map(p => (
          <PlanetCardSm key={p} planet={p.charAt(0).toUpperCase()+p.slice(1)} symbol={PLANET_SYMBOLS[p]} sign={pSign(p)} />
        ))}
      </div>

      {/* Outer Planets */}
      <Divider label={t('outer_planets')} />
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

function ShareButton({ shareId: shareIdProp, raw, birthData }: { shareId?: string; raw?: unknown; birthData?: BirthData }) {
  const t = useTranslations('reading')
  const locale = useLocale()
  const SHARE_TXT = {
    ko: { text: '사주와 별자리로 읽은 나의 운명 리딩이에요 ✨ 오늘의 운세는 무료로 볼 수 있어요.', copied: '링크를 복사했어요!' },
    ja: { text: '四柱推命と星で読んだ私の運命リーディング ✨ 今日の運勢は無料で見られます。', copied: 'リンクをコピーしました！' },
    en: { text: 'My BaZi + Astrology reading ✨ Your daily fortune is free.', copied: 'Link copied!' },
  }[locale as 'ko' | 'ja' | 'en'] ?? { text: 'My BaZi + Astrology reading ✨ Your daily fortune is free.', copied: 'Link copied!' }
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareId, setShareId] = useState<string | null>(shareIdProp ?? null)

  // 공유 레코드를 미리 생성 — 클릭 시점에 await하면 iOS Safari가 navigator.share의
  // 사용자 제스처 컨텍스트를 잃어 공유가 거부될 수 있음
  useEffect(() => {
    if (shareIdProp || !raw) return
    let cancelled = false
    createShare({
      reading_type: 'reading',
      name: birthData?.name ?? '',
      birth_date: birthData ? birthDateStr(birthData.year, birthData.month, birthData.day) : '',
      birth_city: birthData?.city ?? '',
      result: raw,
      birth_data: birthData ?? null,
    }).then(id => { if (!cancelled && id) setShareId(id) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleShare() {
    if (loading) return
    setLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    // 공유한 사람의 언어 유지 (en은 접두어 없음)
    const prefix = locale === 'en' ? '' : `/${locale}`
    const shareUrl = shareId ? `${origin}${prefix}/share/${shareId}` : `${origin}${prefix}/today`
    const shareData = { title:'AstroPillar', text: SHARE_TXT.text, url:shareUrl }
    try {
      if (navigator.share) { await navigator.share(shareData) }
      else { await navigator.clipboard.writeText(`${shareData.text} ${shareUrl}`); setMsg(SHARE_TXT.copied) }
    } catch { setMsg('') }
    finally { setLoading(false) }
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <button onClick={handleShare} disabled={loading} className="ap-btn-ghost rr-action" style={{ color:'var(--gold-light)', borderColor:'var(--gold-line)', opacity:loading?0.7:1 }}>
        {loading ? t('sharing') : t('share_earn')}
      </button>
      {msg && <p style={{ color:'var(--success)', fontSize:13, textAlign:'center' }}>{msg}</p>}
      <p style={{ color:'var(--ink-3)', fontSize:12.5, textAlign:'center' }}>{t('share_info')}</p>
    </div>
  )
}

function NatalChartViewer({ birthData }: { birthData: BirthData }) {
  const t = useTranslations('reading')
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
      <button onClick={loadChart} disabled={loading} className="ap-btn-ghost rr-action" style={{ opacity:loading?0.7:1 }}>
        {loading ? t('loading_chart') : t('view_birth_chart')}
      </button>
      {/* body로 portal: 등장 애니메이션(transform) 부모 안에서는 fixed가 화면 전체를 못 덮음 */}
      {open && svg && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(5,7,16,0.9)', backdropFilter:'blur(6px)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setOpen(false)}>
          <div style={{ background:'#fff', borderRadius:16, maxWidth:560, width:'100%', maxHeight:'82vh', overflow:'auto', padding:8, boxShadow:'0 30px 80px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}>
            <div className="rr-chart-svg" dangerouslySetInnerHTML={{ __html: svg }} style={{ width:'100%' }} />
            <style>{`.rr-chart-svg svg { width: 100% !important; height: auto !important; display: block; }`}</style>
          </div>
          <button onClick={() => setOpen(false)} className="ap-btn-ghost" style={{ marginTop:16 }}>
            {t('close')}
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

function ScenarioButton({ birthData }: { birthData: BirthData }) {
  const t = useTranslations('reading')
  const locale = useLocale()
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
    <button onClick={() => setOpen(true)} className="ap-btn-ghost rr-action" style={{ color:'var(--lavender)', borderColor:'rgba(170,165,209,.4)', background:'var(--lavender-soft)' }}>
      {t('analyze_scenario')}
    </button>
  )
  return (
    <div className="ap-glass" style={{ borderColor:'rgba(170,165,209,.4)', padding:20 }}>
      <p style={{ color:'var(--lavender)', fontSize:15, fontWeight:700, marginBottom:12 }}>{t('ask_scenario_q')}</p>
      <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder={t('scenario_textarea_ph')} rows={3}
        className="rr-textarea"
      />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:8 }}>
        <button onClick={()=>setOpen(false)} className="ap-btn-ghost">{t('cancel')}</button>
        <button onClick={handleGo} disabled={!question.trim()} className="ap-btn" style={{ background:'linear-gradient(180deg,#c3bdf0,#9a92d6)', color:'#14112a', boxShadow:'0 10px 30px -10px rgba(170,165,209,.6)' }}>
          {t('analyze_btn')} <span style={{ background:'rgba(20,17,42,0.18)', borderRadius:20, padding:'2px 8px', fontSize:12.5 }}>{locale === 'ko' ? `${scenarioCost} 크레딧` : locale === 'ja' ? `${scenarioCost}クレジット` : `${scenarioCost} ${scenarioCost === 1 ? 'Credit' : 'Credits'}`}</span>
        </button>
      </div>
    </div>
  )
}

// ─── Accordion section ────────────────────────────────────────────────────────
function AccordionSection({ title, content, defaultOpen, chartContent }: { title: string; content: string; defaultOpen?: boolean; chartContent?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className={`rr-acc${open ? ' is-open' : ''}`}>
      <button type="button" onClick={()=>setOpen(o=>!o)} className="rr-acc-head" aria-expanded={open}>
        <span className="rr-acc-star" aria-hidden="true">✦</span>
        <span className="rr-acc-title">{title}</span>
        <span className="rr-acc-chev" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="rr-acc-body">
          {chartContent && <div className="rr-acc-chart">{chartContent}</div>}
          <RichText text={content} />
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  raw: unknown; onReset: () => void; userEmail?: string; fromCache?: boolean; birthData?: BirthData
  shareId?: string; isSharedView?: boolean
}

export default function ReadingResult({ raw, onReset, userEmail, fromCache, birthData, shareId, isSharedView }: Props) {
  const t = useTranslations('reading')
  const locale = useLocale()
  const pillarLabels = PILLAR_LABELS_MAP[locale] ?? PILLAR_LABELS_EN
  const radarAxes = RADAR_AXES_MAP[locale] ?? RADAR_AXES_EN
  const [chartTab, setChartTab] = useState<'bazi'|'elements'|'astrology'>('bazi')
  const [personTab, setPersonTab] = useState<'p1'|'p2'>('p1')

  const data = (typeof raw === 'object' && raw !== null) ? raw as Record<string,unknown> : {}
  const pillars = extractPillars(data)
  const western = extractWestern(data)
  const sections = parseResult(raw, data.reading_type as string | undefined)

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
  const activeYourSignName = activeYourSignSun ? zodiacSignName(activeYourSignSun.charAt(0).toUpperCase() + activeYourSignSun.slice(1), locale) : ''

  // COMPAT_SCORES
  const compatScores = data.compatibility_scores as Record<string, {label:string; score:number} | number> | undefined
  const overallCompatScore = compatScores ? (compatScores.overall as number ?? null) : null

  // Person names for switcher labels
  const p1Name = (data.person1_name ?? data.name ?? '') as string
  const p2Name = (data.person2_name ?? data.partner_name ?? '') as string

  const TABS = [
    { key:'bazi', label: t('tab_bazi') },
    { key:'elements', label: t('tab_elements') },
    { key:'astrology', label: t('tab_astrology') },
  ] as const


  return (
    <div className="rr">
      <div className="rr-top">
      {/* ── Compatibility Score Card ── */}
      {isCompatibility && compatScores && (
        <div className="rr-card ap-glass rr-reveal" style={{ padding:'22px 18px 14px' }}>
          {overallCompatScore !== null && (
            <div style={{ textAlign:'center', marginBottom:10 }}>
              <p className="rr-kicker">{t('compat_score')}</p>
              <p className="ap-gold-text" style={{ fontSize:56, fontWeight:700, fontFamily:"'Cormorant Garamond', serif", lineHeight:1.05, margin:0 }}>
                {overallCompatScore} <span style={{ fontSize:22, color:'rgba(201,168,76,0.55)', WebkitTextFillColor:'rgba(201,168,76,0.55)', fontWeight:400 }}>/ 100</span>
              </p>
            </div>
          )}
          <CompatibilityRadarChart scores={compatScores} />
        </div>
      )}

      {/* ── Chart Tabs ── */}
      {(activePillars || activeWestern || isCompatibility) && (
        <div className="rr-card ap-glass rr-reveal" style={{ padding:'18px' }}>
          {/* Person Switcher (Compatibility only) */}
          {isCompatibility && (
            <div className="rr-seg rr-seg-person" role="tablist">
              {(['p1','p2'] as const).map(p => (
                <button key={p} role="tab" aria-selected={personTab === p} onClick={() => setPersonTab(p)} className={`rr-seg-btn${personTab === p ? ' is-on' : ''}`}>
                  {p === 'p1' ? `${t('you_label')}${p1Name ? ` (${p1Name})` : ''}` : `${t('partner_label')}${p2Name ? ` (${p2Name})` : ''}`}
                </button>
              ))}
            </div>
          )}

          {/* Tab switcher */}
          <div className="rr-seg" role="tablist">
            {TABS.map(t => (
              <button key={t.key} role="tab" aria-selected={chartTab === t.key} onClick={() => setChartTab(t.key)} className={`rr-seg-btn${chartTab === t.key ? ' is-on' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* BaZi Chart */}
          {chartTab === 'bazi' && (
            <div>
              {activePillars && activePillars.length >= 2 ? (
                <>
                  <div className="rr-pillars" style={{ gridTemplateColumns:`repeat(${activePillars.length},1fr)` }}>
                    {activePillars.map((p,i) => (
                      <div key={i} className={`rr-pillar${i === 2 ? ' is-day' : ''}`}>
                        <p className="rr-pillar-label">{pillarLabels[i]}</p>
                        <Image src={ganImg(p.gan)} alt={p.gan} width={64} height={64} unoptimized className="rr-pillar-img" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                        <p className="rr-pillar-note" style={{ color:'var(--gold-light)' }}>
                          {p.gan}{ANNOTATIONS_BY_LOCALE[locale]?.[p.gan] ? ` (${ANNOTATIONS_BY_LOCALE[locale][p.gan]})` : ''}
                        </p>
                        <Image src={zhiImg(p.zhi)} alt={p.zhi} width={64} height={64} unoptimized className="rr-pillar-img" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                        <p className="rr-pillar-note">
                          {p.zhi}{ANNOTATIONS_BY_LOCALE[locale]?.[p.zhi] ? ` (${ANNOTATIONS_BY_LOCALE[locale][p.zhi]})` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                  {activeYourSignName && activeYourSignLabel && (
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                      <div className="rr-sign">
                        <span className="rr-kicker" style={{ marginBottom:0 }}>{t('your_sign')}</span>
                        <span style={{ color:'var(--ink)', fontSize:16, fontWeight:700, letterSpacing:0.2 }}>
                          {activeYourSignName}
                          <span style={{ color:'rgba(201,168,76,0.5)', margin:'0 8px', fontWeight:400 }}>·</span>
                          {activeYourSignLabel}
                        </span>
                      </div>
                    </div>
                  )}
                  {hasExplainData && (
                    <Link href={explainUrl} className="rr-link">
                      {t('what_means')}
                    </Link>
                  )}
                </>
              ) : (
                <p style={{ color:'var(--ink-2)', fontSize:14, textAlign:'center', padding:20 }}>{t('no_bazi')}</p>
              )}
            </div>
          )}

          {/* Elements */}
          {chartTab === 'elements' && (
            <div>
              {activeDayElement ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ background:'rgba(201,168,76,0.04)', border:`1px solid ${ELEMENT_COLOR[activeDayElement]}40`, borderRadius:12, padding:'16px' }}>
                    <p className="rr-kicker" style={{ textAlign:'left' }}>{t('day_master_element')}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <div style={{ width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`${ELEMENT_COLOR[activeDayElement]}18`, border:`1.5px solid ${ELEMENT_COLOR[activeDayElement]}`, color:ELEMENT_COLOR[activeDayElement], fontSize:20, fontWeight:700 }}>
                        {activeDayPillar?.gan}
                      </div>
                      <div>
                        <p style={{ color:'var(--ink)', fontSize:18, fontWeight:700, textTransform:'capitalize' }}>{activeDayElement}</p>
                        <p style={{ color:'var(--ink-2)', fontSize:13 }}>{activeDayGanKey ? activeDayGanKey.charAt(0).toUpperCase()+activeDayGanKey.slice(1) : ''} {t('day_master')}</p>
                      </div>
                    </div>
                    <p style={{ color:'var(--ink-2)', fontSize:14.5, lineHeight:1.75 }}>{ELEMENT_DESC[activeDayElement]}</p>
                  </div>

                  {/* Wu Xing Relationship Chart */}
                  <div style={{ background:'rgba(9,12,26,0.45)', border:'1px solid var(--line)', borderRadius:14, padding:'16px 12px 12px' }}>
                    <p className="rr-kicker">{t('five_elements')}</p>
                    <WuXingChart
                      soulElement={activeSoulElement}
                      wood={activeWoodScore} fire={activeFireScore} earth={activeEarthScore} metal={activeMetalScore} water={activeWaterScore}
                    />
                  </div>

                  {hasExplainData && (
                    <Link href={explainUrl} className="rr-link">
                      {t('explore_elements')}
                    </Link>
                  )}
                </div>
              ) : (
                <p style={{ color:'var(--ink-2)', fontSize:14, textAlign:'center', padding:20 }}>{t('no_elements')}</p>
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
        <div className="rr-card ap-glass rr-reveal" style={{ padding:'20px 16px 12px' }}>
          <p className="rr-card-title">
            {data.reading_type === 'personal_daily_fortune' ? t('todays_fortune') : t('lifetime_fortune')}
          </p>
          <RadarChart scores={data.overall_scores as Record<string,number>} axes={radarAxes} />
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

      </div>

      {/* ── GPT Reading ── */}
      {sections.length > 0 && (
        <div className="rr-sections">
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
      <div className="rr-actions">
        {fromCache && (
          <div style={{ textAlign:'center', padding:'8px 12px', background:'rgba(147,197,174,0.08)', border:'1px solid rgba(147,197,174,0.3)', borderRadius:12 }}>
            <span style={{ color:'var(--success)', fontSize:13 }}>{t('cached_result')}</span>
          </div>
        )}
        {birthData && <NatalChartViewer birthData={birthData} />}
        {!isSharedView && birthData && <ScenarioButton birthData={birthData} />}
        {!isSharedView && userEmail && <ShareButton shareId={shareId} raw={raw} birthData={birthData} />}
        <button onClick={onReset} className="ap-btn-ghost rr-action">
          {t('new_reading')}
        </button>
        <Link href="/menu" className="rr-back">
          {t('back_to_menu')}
        </Link>
      </div>
      <style>{RR_CSS}</style>
    </div>
  )
}

const RR_CSS = `
  .rr { --rrw: 100%; }
  .rr-top { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px; }
  .rr-card { padding: 18px; min-width: 0; }
  .rr-reveal { animation: apRise .7s var(--ease-out) both; }
  .rr-kicker { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: rgba(230,205,133,.8); margin-bottom: 10px; }
  .rr-card-title { text-align: center; font-family: 'Cormorant Garamond','Noto Serif KR','Noto Serif JP',serif; font-size: 20px; font-weight: 600; color: var(--gold-light); margin-bottom: 4px; letter-spacing: .04em; }

  .rr-seg { display: flex; gap: 4px; padding: 4px; margin-bottom: 18px; border-radius: 14px;
    background: rgba(7,9,20,.6); border: 1px solid var(--line); }
  .rr-seg-person { margin-bottom: 12px; }
  .rr-seg-btn { flex: 1; min-height: 42px; padding: 0 8px; border-radius: 10px; border: 1px solid transparent; background: transparent; cursor: pointer;
    font: inherit; font-size: 14px; font-weight: 600; color: var(--ink-2); transition: all var(--t-fast); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rr-seg-btn:hover { color: var(--ink); }
  .rr-seg-btn.is-on { color: #1a1408; background: linear-gradient(180deg, #e3c879, #c9a84c); box-shadow: 0 6px 18px -8px rgba(201,168,76,.7); }

  .rr-pillars { display: grid; gap: 8px; margin-bottom: 18px; }
  .rr-pillar { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 2px 12px; border-radius: 14px;
    border: 1px solid transparent; }
  .rr-pillar.is-day { border-color: var(--gold-line); background: linear-gradient(180deg, rgba(201,168,76,.10), rgba(201,168,76,.02)); }
  .rr-pillar-label { font-size: 12px; font-weight: 700; letter-spacing: .08em; color: var(--ink-2); }
  .rr-pillar.is-day .rr-pillar-label { color: var(--gold-light); }
  .rr-pillar-img { border-radius: 10px; width: 100%; max-width: 64px; height: auto; aspect-ratio: 1; }
  .rr-pillar-note { font-size: 12px; text-align: center; line-height: 1.35; color: var(--ink-2); word-break: keep-all; }
  .rr-sign { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 22px; border-radius: 999px;
    background: linear-gradient(135deg, rgba(201,168,76,.16), rgba(120,104,190,.10)); border: 1px solid var(--gold-line); }
  .rr-link { display: flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 16px; border-radius: 12px; text-decoration: none;
    font-size: 14px; font-weight: 600; color: var(--gold-light); background: var(--gold-soft); border: 1px solid var(--gold-line); transition: background var(--t-fast); }
  .rr-link:hover { background: rgba(201,168,76,.22); }

  .rr-planet { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px;
    border-radius: 14px; background: rgba(9,12,26,.5); border: 1px solid var(--line); }
  .rr-planet-big { gap: 8px; padding: 16px 6px; border-color: var(--gold-line); background: linear-gradient(180deg, rgba(201,168,76,.08), rgba(9,12,26,.5)); }

  .rr-sections { margin-bottom: 24px; }
  .rr-acc { margin-bottom: 12px; border-radius: 16px; overflow: hidden; border: 1px solid var(--line);
    background: linear-gradient(180deg, rgba(27,34,58,.62), rgba(13,17,33,.78));
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: border-color var(--t-med); }
  .rr-acc.is-open { border-color: var(--gold-line); }
  .rr-acc-head { width: 100%; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 16px 20px; border: 0; background: transparent;
    cursor: pointer; text-align: left; font: inherit; color: inherit; }
  .rr-acc-head:hover .rr-acc-title { color: var(--gold-light); }
  .rr-acc-star { color: var(--gold); font-size: 12px; flex-shrink: 0; transition: transform var(--t-med); }
  .rr-acc.is-open .rr-acc-star { transform: rotate(45deg); color: var(--gold-light); }
  .rr-acc-title { flex: 1; font-family: 'Noto Serif KR','Noto Serif JP','Cormorant Garamond',serif; font-size: 17px; font-weight: 700; line-height: 1.4;
    color: var(--ink); transition: color var(--t-fast); }
  .rr-acc-chev { color: var(--gold); font-size: 18px; line-height: 1; transition: transform var(--t-med); flex-shrink: 0; }
  .rr-acc.is-open .rr-acc-chev { transform: rotate(180deg); }
  .rr-acc-body { padding: 4px 20px 22px; border-top: 1px solid rgba(201,168,76,.12); animation: fadeIn .35s var(--ease-out); }
  .rr-acc-chart { margin: 14px 0 6px; overflow-x: auto; }
  .rr-prose { padding-top: 14px; font-size: 16px; line-height: 1.85; color: rgba(241,237,228,.9); max-width: 68ch; }
  html[lang="ko"] .rr-prose, html[lang="ja"] .rr-prose { line-height: 1.9; }

  .rr-textarea { display: block; width: 100%; min-height: 96px; padding: 12px 14px; margin-bottom: 12px; resize: vertical;
    font: inherit; font-size: 16px; line-height: 1.6; color: var(--ink); background: rgba(9,12,26,.72);
    border: 1px solid var(--line-strong); border-radius: var(--r-sm); outline: none; transition: border-color var(--t-fast), box-shadow var(--t-fast); }
  .rr-textarea:focus { border-color: var(--lavender); box-shadow: 0 0 0 3px rgba(170,165,209,.22); }
  .rr-textarea::placeholder { color: var(--ink-3); }

  .rr-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
  .rr-action { width: 100%; }
  .rr-back { align-self: center; padding: 10px; min-height: 44px; display: inline-flex; align-items: center; font-size: 14px; color: var(--ink-2); text-decoration: none; }
  .rr-back:hover { color: var(--gold-light); }

  /* PC: 차트는 넓게 2단, 본문은 읽기 좋은 폭 유지 */
  @media (min-width: 1024px) {
    .rr { --rrw: min(1040px, calc(100vw - 96px)); width: var(--rrw); margin-left: calc((100% - var(--rrw)) / 2); }
    .rr-top { grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); align-items: start; gap: 20px; margin-bottom: 32px; }
    .rr-card { padding: 24px !important; }
    .rr-sections, .rr-actions { max-width: 720px; margin-left: auto; margin-right: auto; }
    .rr-acc-head { padding: 18px 24px; }
    .rr-acc-body { padding: 4px 28px 26px; }
    .rr-acc-title { font-size: 18px; }
    .rr-prose { font-size: 16.5px; }
    .rr-pillar-img { max-width: 72px; }
  }
`
