'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from 'next-intl'
import BottomNav from '@/components/BottomNav'
import { apiGet, apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'
import { isNewYearSeason, yearlyPromo } from '@/lib/season'

const IMG = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

const HOROSCOPE_SIGNS = [
  { name: 'Aries',       img: '01_01_aries.png',       start: [3,21], end: [4,19] },
  { name: 'Taurus',      img: '01_02_taurus.png',      start: [4,20], end: [5,20] },
  { name: 'Gemini',      img: '01_03_gemini.png',      start: [5,21], end: [6,20] },
  { name: 'Cancer',      img: '01_04_cancer.png',      start: [6,21], end: [7,22] },
  { name: 'Leo',         img: '02_01_leo.png',         start: [7,23], end: [8,22] },
  { name: 'Virgo',       img: '02_02_virgo.png',       start: [8,23], end: [9,22] },
  { name: 'Libra',       img: '02_03_libra.png',       start: [9,23], end: [10,22] },
  { name: 'Scorpio',     img: '02_04_scorpio.png',     start: [10,23], end: [11,21] },
  { name: 'Sagittarius', img: '03_01_sagittarius.png', start: [11,22], end: [12,21] },
  { name: 'Capricorn',   img: '03_02_capricorn.png',   start: [12,22], end: [1,19] },
  { name: 'Aquarius',    img: '03_03_aquarius.png',    start: [1,20],  end: [2,18] },
  { name: 'Pisces',      img: '03_04_pisces.png',      start: [2,19],  end: [3,20] },
]

const CHINESE_SIGNS = [
  { name: 'Rat',     img: '01_01_rat.png'     },
  { name: 'Ox',      img: '01_02_ox.png'      },
  { name: 'Tiger',   img: '01_03_tiger.png'   },
  { name: 'Rabbit',  img: '01_04_rabbit.png'  },
  { name: 'Dragon',  img: '02_01_dragon.png'  },
  { name: 'Snake',   img: '02_02_snake.png'   },
  { name: 'Horse',   img: '02_03_horse.png'   },
  { name: 'Goat',    img: '02_04_goat.png'    },
  { name: 'Monkey',  img: '03_01_monkey.png'  },
  { name: 'Rooster', img: '03_02_rooster.png' },
  { name: 'Dog',     img: '03_03_dog.png'     },
  { name: 'Pig',     img: '03_04_pig.png'     },
]

const MAJOR_ARCANA = [
  { name: 'The Fool',           file: 'major_arcana_fool'        },
  { name: 'The Magician',       file: 'major_arcana_magician'    },
  { name: 'The High Priestess', file: 'major_arcana_priestess'   },
  { name: 'The Empress',        file: 'major_arcana_empress'     },
  { name: 'The Emperor',        file: 'major_arcana_emperor'     },
  { name: 'The Hierophant',     file: 'major_arcana_hierophant'  },
  { name: 'The Lovers',         file: 'major_arcana_lovers'      },
  { name: 'The Chariot',        file: 'major_arcana_chariot'     },
  { name: 'Strength',           file: 'major_arcana_strength'    },
  { name: 'The Hermit',         file: 'major_arcana_hermit'      },
  { name: 'Wheel of Fortune',   file: 'major_arcana_fortune'     },
  { name: 'Justice',            file: 'major_arcana_justice'     },
  { name: 'The Hanged Man',     file: 'major_arcana_hanged'      },
  { name: 'Death',              file: 'major_arcana_death'       },
  { name: 'Temperance',         file: 'major_arcana_temperance'  },
  { name: 'The Devil',          file: 'major_arcana_devil'       },
  { name: 'The Tower',          file: 'major_arcana_tower'       },
  { name: 'The Star',           file: 'major_arcana_star'        },
  { name: 'The Moon',           file: 'major_arcana_moon'        },
  { name: 'The Sun',            file: 'major_arcana_sun'         },
  { name: 'Judgement',          file: 'major_arcana_judgement'   },
  { name: 'The World',          file: 'major_arcana_world'       },
]

const CHINESE_ORDER = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = Array.from({length: 31}, (_, i) => i + 1)
const YEARS = Array.from({length: 100}, (_, i) => new Date().getFullYear() - i)

// 별자리 기호 (\uFE0E = 이모지 대신 텍스트 기호로 표시)
const SIGN_GLYPH: Record<string, string> = Object.fromEntries(
  ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
    .map((n, i) => [n, String.fromCodePoint(0x2648 + i) + '\uFE0E'])
)

// 달 위상(0=삭, .5=망) — 이모지 대신 선으로 그린 달
// 띠는 만화 일러스트 대신 지지 한자로
const CN_HANJA: Record<string, string> = {
  Rat:'子', Ox:'丑', Tiger:'寅', Rabbit:'卯', Dragon:'辰', Snake:'巳',
  Horse:'午', Goat:'未', Monkey:'申', Rooster:'酉', Dog:'戌', Pig:'亥',
}

const MOON_PHASE_FRACTION: Record<string, number> = {
  'new moon': 0, 'waxing crescent': 0.14, 'first quarter': 0.25,
  'waxing gibbous': 0.37, 'full moon': 0.5, 'waning gibbous': 0.63,
  'third quarter': 0.75, 'last quarter': 0.75, 'waning crescent': 0.86,
}

function MoonGlyph({ phase, size = 34 }: { phase: string; size?: number }) {
  const f = MOON_PHASE_FRACTION[phase.toLowerCase()] ?? 0.5
  const r = 14, c = 16
  const rx = Math.abs(Math.cos(2 * Math.PI * f)) * r
  let lit = ''
  if (f > 0.02 && f < 0.98 && Math.abs(f - 0.5) > 0.02) {
    if (f < 0.5) {
      // 차오르는 달: 오른쪽이 밝음
      lit = `M${c},${c - r} A${r},${r} 0 0 1 ${c},${c + r} A${rx},${r} 0 0 ${f < 0.25 ? 0 : 1} ${c},${c - r}Z`
    } else {
      // 기우는 달: 왼쪽이 밝음
      lit = `M${c},${c - r} A${r},${r} 0 0 0 ${c},${c + r} A${rx},${r} 0 0 ${f < 0.75 ? 0 : 1} ${c},${c - r}Z`
    }
  }
  const full = Math.abs(f - 0.5) <= 0.02
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="td-moon-glyph">
      <circle cx={c} cy={c} r={r} fill="rgba(170,165,209,0.08)" stroke="rgba(230,224,206,0.45)" strokeWidth="1" />
      {full && <circle cx={c} cy={c} r={r} fill="#e9e2cc" />}
      {lit && <path d={lit} fill="#e9e2cc" />}
    </svg>
  )
}

interface MoonPhaseData { phase?: string; illumination?: number | null; moon_age?: number | null }
interface FortuneData { [key: string]: unknown }

type ActiveTab = 'tarot' | 'horoscope' | 'chinese'

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getHoroscope(month: number, day: number): string {
  for (const s of HOROSCOPE_SIGNS) {
    const [sm, sd] = s.start, [em, ed] = s.end
    if (sm <= em) {
      if ((month===sm&&day>=sd)||(month===em&&day<=ed)||(month>sm&&month<em)) return s.name
    } else {
      if ((month===sm&&day>=sd)||month>sm||(month===em&&day<=ed)||month<em) return s.name
    }
  }
  return 'Capricorn'
}

function getChineseZodiac(year: number): string {
  return CHINESE_ORDER[((year-1924)%12+12)%12]
}

function parseTarotResult(text: string): Array<{ header: string; content: string }> {
  const sections: Array<{ header: string; content: string }> = []
  const re = /(?:^|\n)((?:🃏|✦|💡)[^\n]+)\n([\s\S]*?)(?=\n(?:🃏|✦|💡)|$)/g
  let m
  while ((m = re.exec(text)) !== null) {
    const content = m[2].trim()
    if (content) sections.push({ header: m[1].trim(), content })
  }
  return sections.length > 0 ? sections : [{ header: '', content: text.trim() }]
}

const TODAY_LOCALE_MAP: Record<string, string> = { ko: 'ko-KR', ja: 'ja-JP', en: 'en-US' }
function formatTodayStr(locale: string): string {
  return new Date().toLocaleDateString(TODAY_LOCALE_MAP[locale] ?? 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const MONTH_NAMES_MAP: Record<string, string[]> = {
  en: MONTHS,
  ko: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  ja: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
}

// ── UI Text (locale-aware) ──────────────────────────────────────
const HOROSCOPE_NAMES: Record<string, Record<string, string>> = {
  en: { Aries:'Aries', Taurus:'Taurus', Gemini:'Gemini', Cancer:'Cancer', Leo:'Leo', Virgo:'Virgo', Libra:'Libra', Scorpio:'Scorpio', Sagittarius:'Sagittarius', Capricorn:'Capricorn', Aquarius:'Aquarius', Pisces:'Pisces' },
  ko: { Aries:'양자리', Taurus:'황소자리', Gemini:'쌍둥이자리', Cancer:'게자리', Leo:'사자자리', Virgo:'처녀자리', Libra:'천칭자리', Scorpio:'전갈자리', Sagittarius:'사수자리', Capricorn:'염소자리', Aquarius:'물병자리', Pisces:'물고기자리' },
  ja: { Aries:'牡羊座', Taurus:'牡牛座', Gemini:'双子座', Cancer:'蟹座', Leo:'獅子座', Virgo:'乙女座', Libra:'天秤座', Scorpio:'蠍座', Sagittarius:'射手座', Capricorn:'山羊座', Aquarius:'水瓶座', Pisces:'魚座' },
}

const CHINESE_NAMES: Record<string, Record<string, string>> = {
  en: { Rat:'Rat', Ox:'Ox', Tiger:'Tiger', Rabbit:'Rabbit', Dragon:'Dragon', Snake:'Snake', Horse:'Horse', Goat:'Goat', Monkey:'Monkey', Rooster:'Rooster', Dog:'Dog', Pig:'Pig' },
  ko: { Rat:'쥐', Ox:'소', Tiger:'호랑이', Rabbit:'토끼', Dragon:'용', Snake:'뱀', Horse:'말', Goat:'양', Monkey:'원숭이', Rooster:'닭', Dog:'개', Pig:'돼지' },
  ja: { Rat:'子', Ox:'丑', Tiger:'寅', Rabbit:'卯', Dragon:'辰', Snake:'巳', Horse:'午', Goat:'未', Monkey:'申', Rooster:'酉', Dog:'戌', Pig:'亥' },
}

const MOON_PHASE_NAMES: Record<string, Record<string, string>> = {
  en: { 'new moon':'New Moon', 'waxing crescent':'Waxing Crescent', 'first quarter':'First Quarter', 'waxing gibbous':'Waxing Gibbous', 'full moon':'Full Moon', 'waning gibbous':'Waning Gibbous', 'third quarter':'Third Quarter', 'last quarter':'Last Quarter', 'waning crescent':'Waning Crescent' },
  ko: { 'new moon':'삭', 'waxing crescent':'초승달', 'first quarter':'상현달', 'waxing gibbous':'차오르는 달', 'full moon':'보름달', 'waning gibbous':'기우는 달', 'third quarter':'하현달', 'last quarter':'그믐달', 'waning crescent':'그믐달' },
  ja: { 'new moon':'新月', 'waxing crescent':'三日月', 'first quarter':'上弦の月', 'waxing gibbous':'十三夜月', 'full moon':'満月', 'waning gibbous':'十六夜', 'third quarter':'下弦の月', 'last quarter':'晦日月', 'waning crescent':'有明月' },
}

const UI_TEXT = {
  en: {
    tabs: [
      { id: 'tarot' as ActiveTab,     icon: 'style', label: 'Tarot' },
      { id: 'horoscope' as ActiveTab, icon: 'nights_stay', label: 'Horoscope' },
      { id: 'chinese' as ActiveTab,   icon: 'brightness_6', label: 'Zodiac' },
    ],
    freeBadge: 'Free · No login required',
    pageTitle: "Today's Fortune",
    pageSub: 'Draw a card, read your sign, meet your zodiac year. Free every day.',
    deepTitle: 'See deeper with your birth details',
    deepDesc: 'Your BaZi pillars and birth chart, read together as one story about you.',
    deepBtnIn: 'Choose a reading',
    deepBtnOut: 'Sign in to continue',
    ctaThreeCard: 'See a Three-Card reading',
    ctaPersonal: 'See my Personal Fortune',
    ctaSignup: 'Sign up · get 1 free credit',
    ctaSignupNote: 'New accounts get 1 credit right away, enough for this reading.',
    signIn: 'Sign in →',
    tarotTitle: 'Daily Tarot',
    tarotSubtitle: 'Choose one card and reveal your message.',
    tarotLoading: '✦ Reading the cards...',
    tarotDestiny: 'Your first draw is closest to your destiny.',
    tarotShare: '↗ Share Your Card',
    tarotDrawAgain: '↺ Draw Again',
    tarotDeeper: 'Want a deeper reading?',
    tarotDeeperDesc: 'Three-Card, Relationship and Celtic Cross spreads, each card read in depth.',
    exploreBtn: 'Explore Readings →',
    horoLabel: '✦ Horoscope',
    chineseLabel: '✦ Chinese Zodiac',
    bestMatch: 'Best Match Today',
    tipLabel: 'TIP FOR TODAY',
    seeHoro: "See Today's Horoscope",
    seeChinese: "See Today's Fortune",
    checkAnother: '← Check Another Sign',
    starsLoading: '✦ Reading the stars...',
    shareHoro: '↗ Share Your Horoscope',
    shareFortune: '↗ Share Your Fortune',
    personalCta: 'Want a personalized reading?',
    personalCtaDesc: 'Get your full BaZi chart + Astrology reading tailored to your exact birth details.',
    yourBirthday: 'Your Birthday',
    monthPlaceholder: 'Month',
    dayPlaceholder: 'Day',
    moonPhaseLabel: 'Moon Phase',
    illuminated: 'illuminated',
    birthYear: 'Birth Year',
    selectYear: 'Select year',
    yearOf: (animal: string) => `✦ Year of the ${animal}`,
    scoreLabels: { score_love:'LOVE', score_work:'WORK', score_money:'MONEY', score_health:'HEALTH', score_social:'SOCIAL', score_creative:'CREATIVE' },
  },
  ko: {
    tabs: [
      { id: 'tarot' as ActiveTab,     icon: 'style', label: '타로' },
      { id: 'horoscope' as ActiveTab, icon: 'nights_stay', label: '별자리' },
      { id: 'chinese' as ActiveTab,   icon: 'brightness_6', label: '띠별 운세' },
    ],
    freeBadge: '무료 · 로그인 없이',
    pageTitle: '오늘의 운세',
    pageSub: '카드 한 장, 나의 별자리, 나의 띠. 매일 무료로 열려 있어요.',
    deepTitle: '내 정보로 더 깊이 보기',
    deepDesc: '생년월일과 태어난 시간으로 사주와 별자리를 함께 풀어드려요.',
    deepBtnIn: '운세 고르기',
    deepBtnOut: '로그인하고 계속하기',
    ctaThreeCard: '쓰리카드 리딩 보기',
    ctaPersonal: '나의 운명 풀이 보기',
    ctaSignup: '가입하고 1크레딧 받기',
    ctaSignupNote: '가입하면 바로 1크레딧이 지급돼요. 이 리딩에 쓸 수 있어요.',
    signIn: '로그인 →',
    tarotTitle: '오늘의 타로',
    tarotSubtitle: '카드 한 장을 선택해 오늘의 메시지를 받아보세요.',
    tarotLoading: '✦ 카드를 읽는 중...',
    tarotDestiny: '첫 번째 선택이 운명에 가장 가깝습니다.',
    tarotShare: '↗ 카드 공유하기',
    tarotDrawAgain: '↺ 다시 뽑기',
    tarotDeeper: '더 깊은 타로 리딩을 원하세요?',
    tarotDeeperDesc: '쓰리카드, 관계 타로, 켈틱 크로스까지. 카드 한 장 한 장을 깊이 풀어드려요.',
    exploreBtn: '리딩 살펴보기 →',
    horoLabel: '✦ 오늘의 별자리',
    chineseLabel: '✦ 오늘의 띠별 운세',
    bestMatch: '오늘의 베스트 매치',
    tipLabel: '오늘의 팁',
    seeHoro: '오늘의 별자리 보기',
    seeChinese: '오늘의 운세 보기',
    checkAnother: '← 다른 운세 보기',
    starsLoading: '✦ 별을 읽는 중...',
    shareHoro: '↗ 별자리 운세 공유',
    shareFortune: '↗ 운세 공유하기',
    personalCta: '개인 맞춤 리딩을 원하세요?',
    personalCtaDesc: '생년월일 기반 사주+별자리 풀 리딩을 받아보세요.',
    yourBirthday: '생년월일',
    monthPlaceholder: '월',
    dayPlaceholder: '일',
    moonPhaseLabel: '달의 위상',
    illuminated: '조도',
    birthYear: '출생연도',
    selectYear: '연도 선택',
    yearOf: (animal: string) => `✦ ${animal}띠`,
    scoreLabels: { score_love:'사랑', score_work:'일', score_money:'돈', score_health:'건강', score_social:'대인', score_creative:'창의' },
  },
  ja: {
    tabs: [
      { id: 'tarot' as ActiveTab,     icon: 'style', label: 'タロット' },
      { id: 'horoscope' as ActiveTab, icon: 'nights_stay', label: '星座' },
      { id: 'chinese' as ActiveTab,   icon: 'brightness_6', label: '干支' },
    ],
    freeBadge: '無料 · ログイン不要',
    pageTitle: '今日の運勢',
    pageSub: 'カード一枚、あなたの星座、あなたの干支。毎日無料で。',
    deepTitle: 'あなたの情報でもっと深く',
    deepDesc: '生年月日と生まれた時間から、四柱推命と星を一緒に読み解きます。',
    deepBtnIn: '占いを選ぶ',
    deepBtnOut: 'ログインして続ける',
    ctaThreeCard: 'スリーカードを見る',
    ctaPersonal: '運命リーディングを見る',
    ctaSignup: '登録して1クレジットを受け取る',
    ctaSignupNote: '登録するとすぐに1クレジットが付与され、このリーディングに使えます。',
    signIn: 'ログイン →',
    tarotTitle: '今日のタロット',
    tarotSubtitle: 'カードを1枚選んでメッセージを受け取りましょう。',
    tarotLoading: '✦ カードを読んでいます...',
    tarotDestiny: '最初の1枚が運命に最も近い。',
    tarotShare: '↗ カードをシェア',
    tarotDrawAgain: '↺ もう一度引く',
    tarotDeeper: 'より深いタロット鑑定をご希望ですか？',
    tarotDeeperDesc: 'スリーカード・リレーションシップ・ケルト十字。一枚ずつ丁寧に読み解きます。',
    exploreBtn: '鑑定を見る →',
    horoLabel: '✦ 今日の星座占い',
    chineseLabel: '✦ 今日の干支占い',
    bestMatch: '今日のベストマッチ',
    tipLabel: '今日のアドバイス',
    seeHoro: '今日の星座占いを見る',
    seeChinese: '今日の運勢を見る',
    checkAnother: '← 別の運勢を確認',
    starsLoading: '✦ 星を読んでいます...',
    shareHoro: '↗ 星座占いをシェア',
    shareFortune: '↗ 運勢をシェア',
    personalCta: 'パーソナライズされた鑑定をご希望ですか？',
    personalCtaDesc: '生年月日から四柱推命+星座占いの完全鑑定を受けましょう。',
    yourBirthday: '誕生日',
    monthPlaceholder: '月',
    dayPlaceholder: '日',
    moonPhaseLabel: '月の位相',
    illuminated: '照度',
    birthYear: '生まれ年',
    selectYear: '年を選択',
    yearOf: (animal: string) => `✦ ${animal}年生まれ`,
    scoreLabels: { score_love:'恋愛', score_work:'仕事', score_money:'金運', score_health:'健康', score_social:'対人', score_creative:'創造' },
  },
}

export default function TodayFortunePage() {
  const { user } = useAuth(false)
  const locale = useLocale()
  const ui = UI_TEXT[locale as keyof typeof UI_TEXT] ?? UI_TEXT.en

  const [activeTab, setActiveTab] = useState<ActiveTab>('tarot')

  // ── Moon phase ────────────────────────────────────────────────
  const [moonPhase, setMoonPhase] = useState<MoonPhaseData | null>(null)

  // ── Horoscope tab state ───────────────────────────────────────
  const [horoMonth, setHoroMonth] = useState('')
  const [horoDay, setHoroDay] = useState('')
  const [horoAuto, setHoroAuto] = useState<string | null>(null)
  const [horoSelected, setHoroSelected] = useState<string | null>(null)
  const [horoFortune, setHoroFortune] = useState<FortuneData | null>(null)
  const [horoLoading, setHoroLoading] = useState(false)
  const [horoError, setHoroError] = useState('')
  const [horoStep, setHoroStep] = useState<'pick'|'result'>('pick')

  // ── Chinese tab state ─────────────────────────────────────────
  const [chineseYear, setChineseYear] = useState('')
  const [chineseAuto, setChineseAuto] = useState<string | null>(null)
  const [chineseSelected, setChineseSelected] = useState<string | null>(null)
  // 생일로 자동 판별된 값도 바로 조회 가능하게 (직접 고른 값이 우선)
  const horoEff = horoSelected ?? horoAuto
  const chineseEff = chineseSelected ?? chineseAuto
  const [chineseFortune, setChineseFortune] = useState<FortuneData | null>(null)
  const [chineseLoading, setChineseLoading] = useState(false)
  const [chineseError, setChineseError] = useState('')
  const [chineseStep, setChineseStep] = useState<'pick'|'result'>('pick')

  // ── Tarot tab state ───────────────────────────────────────────
  const [tarotCard, setTarotCard] = useState<{ name: string; file: string } | null>(null)
  const [tarotPhase, setTarotPhase] = useState<'grid' | 'flipping' | 'revealed'>('grid')
  const [tarotLoading, setTarotLoading] = useState(false)
  const [tarotResult, setTarotResult] = useState<string | null>(null)
  const [tarotError, setTarotError] = useState('')
  const [isFirstDraw, setIsFirstDraw] = useState(true)
  const apiCalledRef = useRef(false)
  const [shuffledCards, setShuffledCards] = useState<Array<{name: string; file: string}>>(() =>
    [...MAJOR_ARCANA].sort(() => Math.random() - 0.5)
  )
  const [shareToast, setShareToast] = useState('')

  useEffect(() => {
    apiGet<MoonPhaseData>('/moon_phase').then(d => setMoonPhase(d)).catch(() => {})
  }, [])


  async function fetchFortune(sign: string, mode: 'horoscope' | 'chinese') {
    const setLoading = mode === 'horoscope' ? setHoroLoading : setChineseLoading
    const setError   = mode === 'horoscope' ? setHoroError   : setChineseError
    const setFortune = mode === 'horoscope' ? setHoroFortune : setChineseFortune
    const setStep    = mode === 'horoscope' ? setHoroStep    : setChineseStep
    setLoading(true); setError('')
    try {
      const dateKey = getTodayKey()
      const baseId = mode === 'horoscope'
        ? `${dateKey}_horoscope_${sign.toLowerCase()}`
        : `${dateKey}_zodiac_${sign.toLowerCase()}`
      // locale별 doc 먼저 시도, 없으면 EN fallback
      const localeSuffix = locale !== 'en' ? `_${locale}` : ''
      const localeDocId = localeSuffix ? `${baseId}${localeSuffix}` : baseId
      let snap = await getDoc(doc(db, 'daily_fortunes', localeDocId))
      if (!snap.exists() && localeSuffix) {
        snap = await getDoc(doc(db, 'daily_fortunes', baseId))
      }
      if (!snap.exists()) { setError('No fortune available for today. Please check back later.'); return }
      setFortune(snap.data() as FortuneData)
      setStep('result')
      if (mode === 'horoscope') gtagEvent('today_horoscope_view', { sign })
      else gtagEvent('today_chinese_zodiac_view', { sign })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load fortune. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function selectTarotCard(card: { name: string; file: string }) {
    if (tarotPhase === 'flipping') return
    setTarotCard(card)
    setTarotPhase('flipping')
    setTimeout(() => {
      setTarotPhase('revealed')
      fetchTarotReading(card)
    }, 900)
  }

  function resetTarot() {
    setTarotCard(null)
    setTarotPhase('grid')
    setTarotResult(null)
    setTarotError('')
    setTarotLoading(false)
    apiCalledRef.current = false
    setShuffledCards([...MAJOR_ARCANA].sort(() => Math.random() - 0.5))
  }

  async function shareReading(label: string, type: 'tarot' | 'horoscope' | 'chinese', imgFile: string) {
    // 별자리/띠는 EN 키로 넘어오므로 뷰어 언어로 표시명 변환
    const displayLabel = type === 'horoscope'
      ? HOROSCOPE_NAMES[locale as keyof typeof HOROSCOPE_NAMES]?.[label] ?? label
      : type === 'chinese'
      ? CHINESE_NAMES[locale as keyof typeof CHINESE_NAMES]?.[label] ?? label
      : label
    const localePrefix = locale === 'en' ? '' : `/${locale}`
    const shareUrl = `https://astropillar.com${localePrefix}/today/share?type=${encodeURIComponent(type)}&id=${encodeURIComponent(imgFile)}&label=${encodeURIComponent(displayLabel)}`
    const text = locale === 'ko'
      ? (type === 'tarot'
        ? `✦ 오늘 메이저 아르카나에서 "${displayLabel}" 카드를 뽑았어요 — 당신의 카드는?`
        : type === 'horoscope'
        ? `✦ 오늘의 ${displayLabel} 운세가 공개됐어요 ✦`
        : `✦ ${displayLabel}띠 — 오늘의 운세 공개 ✦`)
      : locale === 'ja'
      ? (type === 'tarot'
        ? `✦ 今日メジャーアルカナから「${displayLabel}」を引きました — あなたのカードは？`
        : type === 'horoscope'
        ? `✦ 今日の${displayLabel}の運勢が公開されました ✦`
        : `✦ ${displayLabel}年生まれ — 今日の運勢公開 ✦`)
      : (type === 'tarot'
        ? `✦ I drew "${displayLabel}" from the Major Arcana today — what does your card say?`
        : type === 'horoscope'
        ? `✦ My ${displayLabel} horoscope for today has been revealed ✦`
        : `✦ Year of the ${displayLabel} — today's fortune revealed ✦`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any
      if (nav.share) {
        await nav.share({ title: 'AstroPillar', text, url: shareUrl })
        gtagEvent('share_click', { type, method: 'native' })
      } else {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`)
        gtagEvent('share_click', { type, method: 'copy' })
        setShareToast('Link copied to clipboard!')
        setTimeout(() => setShareToast(''), 2500)
      }
    } catch { /* user cancelled */ }
  }

  async function fetchTarotReading(card: { name: string; file: string }) {
    if (apiCalledRef.current) return
    apiCalledRef.current = true
    setTarotLoading(true); setTarotError('')
    try {
      // Firestore 캐시 우선 조회 (locale 버전만 — EN 폴백 없음, 언어별 별도 생성)
      try {
        const baseDocId = `${getTodayKey()}_${card.file}`
        const localeDocId = locale !== 'en' ? `${baseDocId}_${locale}` : baseDocId
        const snap = await getDoc(doc(db, 'daily_tarot', localeDocId))
        if (snap.exists()) {
          setTarotResult((snap.data() as { content_text: string }).content_text)
          if (isFirstDraw) { gtagEvent('tarot_daily_draw', { card: card.name }); setIsFirstDraw(false) }
          return
        }
      } catch {
        // Firestore 캐시 실패 시 API로 진행
      }
      // 캐시 없으면 API 호출 (locale 전달)
      const data = await apiPost<{ content_text: string }>('/tarot/daily', {
        card_name: card.name,
        card_image_url: `${IMG}${card.file}.webp`,
        language: locale,
      })
      setTarotResult(data.content_text)
      if (isFirstDraw) { gtagEvent('tarot_daily_draw', { card: card.name }); setIsFirstDraw(false) }
    } catch (e: unknown) {
      setTarotError(e instanceof Error ? e.message : 'Could not load your reading. Please try again.')
      apiCalledRef.current = false
    } finally {
      setTarotLoading(false)
    }
  }

  const scoreLabels = ui.scoreLabels as Record<string, string>
  const SCORE_ITEMS = [
    { key: 'score_love',     color: '#d9c48c' },
    { key: 'score_work',     color: '#d9c48c' },
    { key: 'score_money',    color: '#d9c48c' },
    { key: 'score_health',   color: '#d9c48c' },
    { key: 'score_social',   color: '#d9c48c' },
    { key: 'score_creative', color: '#d9c48c' },
  ] as const

  const localePrefix = locale === 'en' ? '' : `/${locale}`
  const menuHref = `${localePrefix}/menu`

  // 무료 결과 아래 부드러운 다음 단계 안내 (결과를 가리지 않음)
  function renderDeeperCta(title: string, desc: string, target: '/tarot/three-card' | '/reading/personal-fortune' | '/reading/yearly', memberLabel?: string) {
    const targetHref = `${localePrefix}${target}`
    // 비회원은 가입 탭으로 → 가입 후 바로 그 리딩으로 복귀 (가입 시 1크레딧 지급)
    const href = user ? targetHref : `${localePrefix}/login?tab=signup&returnUrl=${encodeURIComponent(targetHref)}`
    const label = user ? (memberLabel ?? (target === '/tarot/three-card' ? ui.ctaThreeCard : ui.ctaPersonal)) : ui.ctaSignup
    return (
      <div className="ap-glass ap-glass-gold td-deeper">
        <span className="td-deeper-glyph" aria-hidden="true">☉</span>
        <div className="td-deeper-text">
          <p className="td-deeper-title">{title}</p>
          <p className="td-deeper-desc">{desc}</p>
          {!user && <p className="td-deeper-note">{ui.ctaSignupNote}</p>}
        </div>
        <Link
          href={href}
          className="ap-btn td-deeper-btn"
          onClick={() => gtagEvent('today_next_click', { locale, source_tab: activeTab, target_service: target.slice(1).replace('/', '_'), auth_state: user ? 'member' : 'guest' })}
        >
          {label}
          <span className="material-icons" style={{ fontSize: 18 }} aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
    )
  }

  function FortuneResult({ fortune, mode, onBack, shareInfo }: { fortune: FortuneData; mode: 'horoscope'|'chinese'; onBack: () => void; shareInfo?: { label: string; imgFile: string } }) {
    const scores = SCORE_ITEMS.filter(s => typeof fortune[s.key] === 'number')
    const bestMatch = typeof fortune.best_match === 'string' ? fortune.best_match : null
    const bestMatchSign = bestMatch ? HOROSCOPE_SIGNS.find(s => s.name.toLowerCase() === bestMatch.toLowerCase()) : null
    const signImg = shareInfo?.imgFile
    const signName = shareInfo
      ? (mode === 'horoscope'
        ? HOROSCOPE_NAMES[locale as keyof typeof HOROSCOPE_NAMES]?.[shareInfo.label] ?? shareInfo.label
        : CHINESE_NAMES[locale as keyof typeof CHINESE_NAMES]?.[shareInfo.label] ?? shareInfo.label)
      : null
    return (
      <div className="td-fortune ap-rise">
        <aside className="td-fortune-side">
          <div className="ap-glass td-sign-card">
            {signImg && shareInfo && (
              <div className={`td-sign-orb${mode === 'horoscope' ? '' : ' is-cn'}`} aria-hidden="true">
                {mode === 'horoscope' ? SIGN_GLYPH[shareInfo.label] : CN_HANJA[shareInfo.label]}
              </div>
            )}
            <p className="td-kicker">{mode === 'horoscope' ? ui.horoLabel : ui.chineseLabel}</p>
            {signName && <p className="td-sign-name">{signName}</p>}

            {scores.length > 0 && (
              <div className="td-scores">
                {scores.map(s => (
                  <div key={s.key}>
                    <div className="td-score-row">
                      <span className="td-score-label">{scoreLabels[s.key] ?? s.key}</span>
                      <span className="td-score-num" style={{ color: s.color }}>{fortune[s.key] as number}</span>
                    </div>
                    <div className="td-score-track">
                      <div style={{ height: '100%', width: `${fortune[s.key] as number}%`, background: `linear-gradient(90deg, transparent, ${s.color})`, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bestMatch && (
              <div className="td-match">
                {bestMatchSign && <span className="td-match-glyph" aria-hidden="true">{SIGN_GLYPH[bestMatchSign.name]}</span>}
                <div>
                  <p className="td-match-label">{ui.bestMatch}</p>
                  <p className="td-match-name">{HOROSCOPE_NAMES[locale as keyof typeof HOROSCOPE_NAMES]?.[bestMatch] ?? bestMatch}</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="td-fortune-main">
          <article className="ap-glass td-reading">
            {!!fortune.intro && <p className="td-intro">{fortune.intro as string}</p>}
            {!!fortune.fortune && <p className="td-body">{(fortune.fortune as string).replace(/^\[[\w\s]+\]\s*/i, '')}</p>}
            {!!fortune.tip && (
              <div className="td-tip">
                <p className="td-tip-label"><span className="material-icons" style={{ fontSize: 15 }} aria-hidden="true">auto_awesome</span>{ui.tipLabel}</p>
                <p className="td-tip-body">{fortune.tip as string}</p>
              </div>
            )}
          </article>
          <div className="td-actions">
            {shareInfo && (
              <button className="ap-btn-ghost td-share" onClick={() => shareReading(shareInfo.label, mode, shareInfo.imgFile)}>
                {mode === 'horoscope' ? ui.shareHoro : ui.shareFortune}
              </button>
            )}
            <button className="ap-btn-ghost td-again" onClick={onBack}>{ui.checkAnother}</button>
          </div>
          {isNewYearSeason()
            ? (() => { const yp = yearlyPromo(locale); return renderDeeperCta(yp.title, yp.desc, '/reading/yearly', yp.cta) })()
            : renderDeeperCta(ui.deepTitle, ui.personalCtaDesc, '/reading/personal-fortune')}
        </div>
      </div>
    )
  }

  const tarotSections = tarotResult ? parseTarotResult(tarotResult) : []

  return (
    <main className="ap-page td">

      {shareToast && <div className="td-toast" role="status">{shareToast}</div>}

      {/* 모바일 전용 헤더 (PC는 전역 SiteNav) */}
      <header className="td-mhead ap-mobile-only">
        <Link href={`${localePrefix}/`} className="td-mlogo">ASTROPILLAR</Link>
        {user
          ? <Link href={menuHref} className="td-mlink">{user.email?.split('@')[0]} ✦</Link>
          : <Link href={`${localePrefix}/login`} className="td-mlink">{ui.signIn}</Link>
        }
      </header>

      <div className="ap-container td-wrap">

        {/* 페이지 머리 */}
        <section className="td-hero">
          <div className="td-moon-ring ap-orbit" aria-hidden="true" />
          <p className="td-date ap-rise">{formatTodayStr(locale)}</p>
          <h1 className="td-title ap-rise ap-d1">{ui.pageTitle}</h1>
          <p className="td-sub ap-rise ap-d2">{ui.pageSub}</p>
          <span className="ap-badge ap-badge-free ap-rise ap-d2" style={{ marginTop: 14 }}>{ui.freeBadge}</span>
        </section>

        {/* ── 탭 ─────────────────────────────────────────────── */}
        <div className="td-tabs ap-rise ap-d3" role="tablist">
          {ui.tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button key={tab.id} role="tab" aria-selected={active} onClick={() => setActiveTab(tab.id)} className={`td-tab${active ? ' is-active' : ''}`}>
                <span className="material-icons td-tab-icon" aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="td-panel">

          {/* ── Daily Tarot ───────────────────────────────────── */}
          {activeTab === 'tarot' && (
            <div>
              {tarotPhase !== 'revealed' && (
                <div className="ap-rise">
                  <div className="td-section-head">
                    <h2 className="td-h2">{ui.tarotTitle}</h2>
                    <p className="td-muted">{ui.tarotSubtitle}</p>
                  </div>

                  <div className={`td-deck${tarotCard ? ' is-locked' : ''}`}>
                    {shuffledCards.map((card, idx) => {
                      const isSelected = tarotCard?.file === card.file
                      const isFlipping = tarotPhase === 'flipping'
                      return (
                        <button
                          type="button"
                          key={card.file}
                          className={`td-card${isSelected ? ' is-selected' : ''}`}
                          aria-label={`${ui.tarotTitle} ${idx + 1}`}
                          style={{ opacity: isFlipping && !isSelected ? 0.12 : 1, animationDelay: `${idx * 0.025}s` }}
                          onClick={() => !tarotCard && selectTarotCard(card)}
                        >
                          <div className="td-card-inner" style={{ transform: isSelected && isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                            <div className="td-back"><span aria-hidden="true">✦</span></div>
                            <div className="td-front">
                              {isSelected && (
                                <Image src={`${IMG}${card.file}.webp`} alt={card.name} fill style={{ objectFit: 'cover' }} unoptimized />
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {tarotPhase === 'revealed' && tarotCard && (
                <div className="td-reveal ap-rise">
                  <div className="td-reveal-card">
                    <div className="td-big-card">
                      <div className="td-big-halo" aria-hidden="true" />
                      <div className="td-big-img">
                        <Image src={`${IMG}${tarotCard.file}.webp`} alt={tarotCard.name} fill style={{ objectFit: 'cover' }} unoptimized />
                      </div>
                    </div>
                    <p className="td-card-name">{tarotCard.name}</p>
                  </div>

                  <div className="td-reveal-text">
                    {tarotLoading && (
                      <div className="td-loading" role="status">
                        <span className="td-spinner" aria-hidden="true">✦</span>
                        <span>{ui.tarotLoading}</span>
                      </div>
                    )}

                    {tarotError && (
                      <div className="ap-glass td-error">
                        <p>{tarotError}</p>
                        <button onClick={() => { apiCalledRef.current = false; fetchTarotReading(tarotCard) }} className="ap-btn ap-btn-sm">Try Again</button>
                      </div>
                    )}

                    {tarotSections.length > 0 && (
                      <>
                        <article className="ap-glass td-reading">
                          {tarotSections.map((sec, i) => (
                            <section key={i} className="td-sec">
                              {sec.header && <h3 className="td-sec-head">{sec.header}</h3>}
                              <p className="td-body">{sec.content}</p>
                            </section>
                          ))}
                        </article>

                        <p className="td-destiny">{ui.tarotDestiny}</p>

                        <div className="td-actions">
                          <button className="ap-btn-ghost td-share" onClick={() => tarotCard && shareReading(tarotCard.name, 'tarot', `${tarotCard.file}.webp`)}>
                            {ui.tarotShare}
                          </button>
                          <button className="ap-btn-ghost td-again" onClick={resetTarot}>{ui.tarotDrawAgain}</button>
                        </div>

                        {renderDeeperCta(ui.tarotDeeper, ui.tarotDeeperDesc, '/tarot/three-card')}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Horoscope ─────────────────────────────────────── */}
          {activeTab === 'horoscope' && (
            <div>
              {moonPhase?.phase && (
                <div className="td-moon ap-rise">
                  <MoonGlyph phase={moonPhase.phase} />
                  <div>
                    <p className="td-moon-label">{ui.moonPhaseLabel}</p>
                    <p className="td-moon-name">
                      {MOON_PHASE_NAMES[locale as keyof typeof MOON_PHASE_NAMES]?.[moonPhase.phase.toLowerCase()] ?? moonPhase.phase}
                      {moonPhase.illumination != null && <span className="td-moon-ill"> · {Math.round(moonPhase.illumination <= 1 ? moonPhase.illumination*100 : moonPhase.illumination)}% {ui.illuminated}</span>}
                    </p>
                  </div>
                </div>
              )}

              {horoStep === 'result' && horoFortune ? (
                <FortuneResult
                  fortune={horoFortune} mode="horoscope"
                  onBack={() => { setHoroStep('pick'); setHoroFortune(null); setHoroSelected(null) }}
                  shareInfo={horoEff ? { label: horoEff, imgFile: HOROSCOPE_SIGNS.find(s => s.name === horoEff)?.img ?? '' } : undefined}
                />
              ) : (
                <div className="ap-glass td-picker ap-rise">
                  <div className="td-picker-top">
                    <div className="td-field">
                      <label className="td-label" htmlFor="td-horo-month">{ui.yourBirthday}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select id="td-horo-month" className="td-select" value={horoMonth} onChange={e => { setHoroMonth(e.target.value); const m=parseInt(e.target.value),d=parseInt(horoDay); if(m&&d) setHoroAuto(getHoroscope(m,d)); else setHoroAuto(null) }}>
                          <option value="">{ui.monthPlaceholder}</option>
                          {(MONTH_NAMES_MAP[locale] ?? MONTHS).map((m,i) => <option key={m} value={String(i+1)}>{m}</option>)}
                        </select>
                        <select className="td-select" style={{ maxWidth: 100 }} aria-label={ui.dayPlaceholder} value={horoDay} onChange={e => { setHoroDay(e.target.value); const m=parseInt(horoMonth),d=parseInt(e.target.value); if(m&&d) setHoroAuto(getHoroscope(m,d)); else setHoroAuto(null) }}>
                          <option value="">{ui.dayPlaceholder}</option>
                          {DAYS.map(d => <option key={d} value={String(d)}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    {horoAuto && <p className="td-auto"><span className="td-glyph-sm" aria-hidden="true">{SIGN_GLYPH[horoAuto]}</span> {HOROSCOPE_NAMES[locale as keyof typeof HOROSCOPE_NAMES]?.[horoAuto] ?? horoAuto}</p>}
                  </div>

                  <div className="td-signs">
                    {HOROSCOPE_SIGNS.map(s => {
                      const isSel = horoSelected === s.name
                      const isAuto = horoAuto === s.name && !horoSelected
                      const displayName = HOROSCOPE_NAMES[locale as keyof typeof HOROSCOPE_NAMES]?.[s.name] ?? s.name
                      return (
                        <button key={s.name} type="button" aria-pressed={isSel} onClick={() => setHoroSelected(horoSelected===s.name ? null : s.name)}
                          className={`td-sign${isSel ? ' is-sel' : ''}${isAuto ? ' is-auto' : ''}`}>
                          <span className="td-sign-img td-sign-glyph" aria-hidden="true">{SIGN_GLYPH[s.name]}</span>
                          <span className="td-sign-label">{displayName}</span>
                        </button>
                      )
                    })}
                  </div>
                  {horoError && <p className="td-err">{horoError}</p>}
                  <button onClick={() => horoEff && fetchFortune(horoEff, 'horoscope')} disabled={!horoEff || horoLoading} className="ap-btn td-submit">
                    {horoLoading ? ui.starsLoading : ui.seeHoro}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Chinese Zodiac ────────────────────────────────── */}
          {activeTab === 'chinese' && (
            <div>
              {chineseStep === 'result' && chineseFortune ? (
                <FortuneResult
                  fortune={chineseFortune} mode="chinese"
                  onBack={() => { setChineseStep('pick'); setChineseFortune(null); setChineseSelected(null) }}
                  shareInfo={chineseEff ? { label: chineseEff, imgFile: CHINESE_SIGNS.find(s => s.name === chineseEff)?.img ?? '' } : undefined}
                />
              ) : (
                <div className="ap-glass td-picker ap-rise">
                  <div className="td-picker-top">
                    <div className="td-field">
                      <label className="td-label" htmlFor="td-cn-year">{ui.birthYear}</label>
                      <select id="td-cn-year" className="td-select" style={{ maxWidth: 180 }} value={chineseYear} onChange={e => { setChineseYear(e.target.value); const y=parseInt(e.target.value); setChineseAuto(y ? getChineseZodiac(y) : null) }}>
                        <option value="">{ui.selectYear}</option>
                        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </div>
                    {chineseAuto && <p className="td-auto">{ui.yearOf(CHINESE_NAMES[locale as keyof typeof CHINESE_NAMES]?.[chineseAuto] ?? chineseAuto)}</p>}
                  </div>
                  <div className="td-signs">
                    {CHINESE_SIGNS.map(s => {
                      const isSel = chineseSelected === s.name
                      const isAuto = chineseAuto === s.name && !chineseSelected
                      return (
                        <button key={s.name} type="button" aria-pressed={isSel} onClick={() => setChineseSelected(chineseSelected===s.name ? null : s.name)}
                          className={`td-sign td-sign-cn${isSel ? ' is-sel' : ''}${isAuto ? ' is-auto' : ''}`}>
                          <span className="td-sign-img td-sign-hanja" aria-hidden="true">{CN_HANJA[s.name]}</span>
                          <span className="td-sign-label">{CHINESE_NAMES[locale as keyof typeof CHINESE_NAMES]?.[s.name] ?? s.name}</span>
                        </button>
                      )
                    })}
                  </div>
                  {chineseError && <p className="td-err">{chineseError}</p>}
                  <button onClick={() => chineseEff && fetchFortune(chineseEff, 'chinese')} disabled={!chineseEff || chineseLoading} className="ap-btn td-submit">
                    {chineseLoading ? ui.starsLoading : ui.seeChinese}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <BottomNav />

      <style>{`
        .td-toast { position: fixed; top: 84px; left: 50%; transform: translateX(-50%); z-index: 999;
          background: rgba(17,22,40,.96); color: var(--ink); border: 1px solid var(--gold-line); padding: 10px 20px; border-radius: 12px;
          font-size: 13px; font-weight: 500; white-space: nowrap; animation: fadeIn .2s ease; box-shadow: 0 16px 40px -16px rgba(0,0,0,.8); }

        .td-mhead { position: sticky; top: 0; z-index: 40; display:flex; justify-content:space-between; align-items:center;
          padding: 6px 20px; background: rgba(7,9,20,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
        .td-mlogo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size:16px; letter-spacing:.2em; color: var(--gold); text-decoration:none; }
        .td-mlink { color: var(--ink-2); font-size: 13px; text-decoration:none; min-height: 44px; display:flex; align-items:center; }

        .td-wrap { max-width: 1120px; }
        .td-hero { position: relative; text-align: center; padding: 12px 0 8px; display:flex; flex-direction:column; align-items:center; }
        .td-moon-ring { position:absolute; left:50%; top: 50%; width: 320px; height: 320px; margin: -160px 0 0 -160px; border-radius:50%;
          border: 1px dashed rgba(170,165,209,.12); pointer-events:none; }
        .td-date { font-size: 12.5px; letter-spacing: .14em; color: var(--lavender); }
        .td-title { margin-top: 8px; font-family: var(--font-display); font-size: clamp(30px, 6vw, 48px); font-weight: 600; line-height: 1.15; }
        html[lang="ko"] .td-title, html[lang="ja"] .td-title { font-family: 'Noto Serif KR','Noto Serif JP', serif; font-weight: 700; }
        .td-sub { margin-top: 10px; max-width: 36ch; font-size: 14.5px; line-height: 1.7; color: var(--ink-2); }

        .td-tabs { margin: 24px auto 0; display:grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 5px; max-width: 520px;
          border-radius: 999px; background: rgba(255,255,255,.035); border: 1px solid var(--line); }
        .td-tab { display:flex; align-items:center; justify-content:center; gap: 6px; min-height: 46px; border-radius: 999px; border: 0; cursor: pointer;
          background: transparent; color: var(--ink-2); font: inherit; font-size: 14px; font-weight: 500; white-space: nowrap; padding: 0 8px;
          transition: background var(--t-med), color var(--t-med), box-shadow var(--t-med); }
        .td-tab:hover { color: var(--ink); }
        .td-tab.is-active { color: var(--gold-light); background: rgba(241,237,228,.08); box-shadow: inset 0 0 0 1px rgba(201,168,76,.32); }
        .td-tab-icon { font-size: 19px; }

        .td-panel { margin-top: 28px; }
        .td-section-head { text-align:center; margin-bottom: 20px; }
        .td-h2 { font-family: var(--font-display); font-size: 24px; font-weight: 600; }
        html[lang="ko"] .td-h2, html[lang="ja"] .td-h2 { font-family: 'Noto Serif KR','Noto Serif JP', serif; font-size: 21px; }
        .td-muted { margin-top: 6px; color: var(--ink-2); font-size: 14px; }

        /* 덱 */
        .td-deck { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .td-card { appearance:none; background:none; border:0; padding:0; cursor:pointer; perspective: 700px; transition: opacity .35s ease;
          animation: apRise .7s var(--ease-out) both; }
        .td-deck.is-locked .td-card { cursor: default; }
        .td-card-inner { position: relative; width: 100%; aspect-ratio: 2/3; transform-style: preserve-3d; transition: transform .75s var(--ease-out); }
        .td-back, .td-front { position:absolute; inset:0; border-radius: 10px; -webkit-backface-visibility:hidden; backface-visibility:hidden; overflow:hidden; }
        .td-back { display:grid; place-items:center;
          background:
            radial-gradient(circle at 50% 50%, rgba(201,168,76,.18) 0 14%, transparent 15%),
            radial-gradient(circle at 50% 50%, transparent 0 30%, rgba(201,168,76,.12) 31% 32%, transparent 33%),
            repeating-linear-gradient(45deg, rgba(170,165,209,.05) 0 2px, transparent 2px 9px),
            linear-gradient(160deg, #1d2547 0%, #0e1328 100%);
          border: 1px solid rgba(201,168,76,.4);
          box-shadow: inset 0 0 0 4px rgba(7,9,20,.6), inset 0 0 0 5px rgba(201,168,76,.22), 0 8px 18px -8px rgba(0,0,0,.7);
          transition: transform .25s var(--ease-out), border-color .25s, box-shadow .25s; }
        .td-back span { color: var(--gold-light); font-size: 15px; text-shadow: 0 0 12px rgba(230,205,133,.8); }
        .td-front { transform: rotateY(180deg); border: 1px solid var(--gold); box-shadow: 0 0 24px rgba(230,205,133,.4); }
        @media (hover: hover) {
          .td-deck:not(.is-locked) .td-card:hover .td-back { transform: translateY(-6px); border-color: var(--gold-light);
            box-shadow: inset 0 0 0 4px rgba(7,9,20,.6), inset 0 0 0 5px rgba(230,205,133,.4), 0 16px 30px -10px rgba(201,168,76,.45); }
        }
        .td-card:focus-visible { outline: 2px solid var(--gold-light); outline-offset: 3px; border-radius: 10px; }

        /* 카드 공개 */
        .td-reveal { display:grid; grid-template-columns: 1fr; gap: 24px; }
        .td-reveal-card { display:flex; flex-direction:column; align-items:center; gap: 14px; }
        .td-destiny-top { font-size: 12px; letter-spacing: .08em; color: rgba(230,205,133,.7); text-align:center; }
        .td-big-card { position:relative; width: 200px; aspect-ratio: 3/5; }
        .td-big-halo { position:absolute; inset: -30%; border-radius: 50%;
          background: radial-gradient(circle, rgba(230,205,133,.28), rgba(120,104,190,.12) 45%, transparent 70%); animation: apGlow 4s ease-in-out infinite; }
        .td-big-img { position:absolute; inset:0; border-radius: 14px; overflow:hidden; border: 1px solid var(--gold);
          box-shadow: 0 0 0 6px rgba(201,168,76,.08), 0 30px 60px -20px rgba(0,0,0,.8); }
        .td-card-name { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; letter-spacing: .04em; color: var(--gold-light); text-align:center; }
        .td-reveal-text { display:flex; flex-direction:column; gap: 14px; min-width: 0; }
        .td-loading { display:flex; align-items:center; justify-content:center; gap: 10px; color: var(--gold-light); font-size: 14px; padding: 24px 0; }
        .td-spinner { display:inline-block; animation: apSpin 2.4s linear infinite; }
        .td-error { padding: 20px; text-align:center; display:flex; flex-direction:column; gap: 12px; align-items:center; }
        .td-error p { color: var(--danger); font-size: 14px; }

        .td-reading { padding: 22px 20px; }
        .td-sec + .td-sec { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line); }
        .td-sec-head { font-size: 14px; font-weight: 700; color: var(--gold-light); margin-bottom: 8px; letter-spacing: .01em; }
        .td-body { color: var(--ink); font-size: 15.5px; line-height: 1.85; white-space: pre-wrap; }
        .td-destiny { text-align:center; font-style: italic; font-size: 13.5px; color: rgba(230,205,133,.8); }
        .td-actions { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .td-actions > :only-child { grid-column: span 2; }
        .td-actions .ap-btn-ghost { font-size: 14px; min-height: 46px; padding: 0 12px; }
        .td-share { color: var(--gold-light) !important; border-color: var(--gold-line) !important; }

        .td-deeper-note { margin-top: 6px; font-size: 12.5px; color: var(--success); }
        .td-deeper { display:grid; grid-template-columns: auto 1fr; gap: 6px 14px; align-items:center; padding: 20px;
          background: radial-gradient(120% 140% at 100% 0%, rgba(120,104,190,.25), transparent 55%), linear-gradient(180deg, rgba(30,37,64,.7), rgba(15,19,36,.8)); }
        .td-deeper-glyph { width: 44px; height: 44px; border-radius: 50%; display:grid; place-items:center; font-size: 22px; color: var(--gold-light);
          border: 1px solid var(--gold-line); background: rgba(201,168,76,.08); text-shadow: 0 0 14px rgba(230,205,133,.6); }
        .td-deeper-title { font-weight: 700; font-size: 16px; }
        .td-deeper-desc { margin-top: 4px; font-size: 13.5px; line-height: 1.65; color: var(--ink-2); }
        .td-deeper-btn { grid-column: 1 / -1; margin-top: 10px; width: 100%; }

        /* 운세 결과 */
        .td-fortune { display:grid; grid-template-columns: 1fr; gap: 16px; }
        .td-sign-card { padding: 22px 20px; display:flex; flex-direction:column; align-items:center; text-align:center; }
        .td-sign-orb { width: 104px; height: 104px; border-radius: 50%; display:grid; place-items:center; margin-bottom: 14px;
          background: rgba(9,12,26,.55); border: 1px solid var(--gold-line); box-shadow: 0 0 0 6px rgba(201,168,76,.04);
          color: var(--gold-light); font-size: 46px; line-height: 1; font-weight: 300; }
        .td-sign-orb.is-cn { color: var(--ink); font-size: 44px; font-weight: 400; border-color: rgba(170,165,209,.35); }
        .td-kicker { font-size: 12px; letter-spacing: .1em; color: var(--lavender); }
        .td-sign-name { margin-top: 4px; font-size: 22px; font-weight: 600; display:flex; align-items:center; gap: 8px; }
        .td-match-glyph { width: 36px; height: 36px; flex-shrink: 0; display:grid; place-items:center; border-radius: 10px; border: 1px solid var(--line); color: var(--gold-light); font-size: 18px; }
        .td-glyph { color: var(--gold-light); font-family: 'Segoe UI Symbol','Noto Sans Symbols 2','Apple Symbols',serif; font-size: 22px; }
        .td-scores { width: 100%; margin-top: 18px; display:grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; text-align:left; }
        .td-score-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom: 5px; }
        .td-score-label { font-size: 12px; color: var(--ink-2); }
        .td-score-num { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .td-score-track { height: 3px; background: rgba(255,255,255,.06); border-radius: 2px; overflow:hidden; }
        .td-match { width: 100%; margin-top: 18px; display:flex; align-items:center; gap: 12px; padding: 12px 14px; border-radius: 12px;
          background: rgba(255,255,255,.03); border: 1px solid var(--line); text-align:left; }
        .td-match-label { font-size: 11.5px; color: var(--ink-3); }
        .td-match-name { font-size: 14.5px; font-weight: 700; }
        .td-fortune-main { display:flex; flex-direction:column; gap: 14px; min-width: 0; }
        .td-intro { color: var(--lavender); font-style: italic; font-size: 15px; line-height: 1.75; margin-bottom: 14px; }
        .td-tip { margin-top: 18px; padding: 14px 16px; border-radius: 12px; background: var(--gold-soft); border: 1px solid var(--gold-line); }
        .td-tip-label { display:flex; align-items:center; gap: 6px; color: var(--gold-light); font-size: 12.5px; font-weight: 700; margin-bottom: 6px; }
        .td-tip-body { color: var(--ink); font-size: 14.5px; line-height: 1.75; }

        /* 별자리·띠 선택 */
        .td-moon { display:flex; align-items:center; gap: 14px; padding: 12px 16px; margin-bottom: 16px; border-radius: 14px;
          background: linear-gradient(90deg, rgba(170,165,209,.1), rgba(170,165,209,.02)); border: 1px solid rgba(170,165,209,.22); }
        .td-moon-glyph { flex-shrink: 0; filter: drop-shadow(0 0 8px rgba(220,226,255,.18)); }
        .td-moon-label { font-size: 12px; color: var(--lavender); }
        .td-moon-name { font-size: 15px; font-weight: 700; }
        .td-moon-ill { color: var(--ink-2); font-weight: 400; font-size: 12.5px; }
        .td-picker { padding: 22px 18px; display:flex; flex-direction:column; gap: 20px; }
        .td-picker-top { display:flex; flex-direction:column; gap: 8px; }
        .td-field { display:flex; flex-direction:column; gap: 8px; }
        .td-label { font-size: 13px; color: var(--ink-2); font-weight: 500; }
        .td-select { flex: 1; min-height: 48px; padding: 0 36px 0 14px; border-radius: 10px; color: var(--ink); cursor: pointer;
          background-color: rgba(7,9,20,.6); border: 1px solid rgba(160,170,210,.3); outline: none; color-scheme: dark;
          appearance: none; -webkit-appearance: none;
          background-image: linear-gradient(45deg, transparent 50%, var(--gold) 50%), linear-gradient(135deg, var(--gold) 50%, transparent 50%);
          background-position: calc(100% - 18px) 21px, calc(100% - 13px) 21px; background-size: 5px 5px; background-repeat: no-repeat; }
        .td-select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,.18); }
        .td-auto { color: var(--gold-light); font-size: 14px; font-weight: 600; }
        .td-signs { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px 6px; }
        .td-sign { min-width: 0; }
        .td-sign { appearance:none; background:none; border:0; cursor:pointer; padding: 6px 0; display:flex; flex-direction:column; align-items:center; gap: 6px; font: inherit; border-radius: 14px; }
        .td-sign-img { width: min(64px, 100%); aspect-ratio: 1; height: auto; border-radius: 16px; display:grid; place-items:center; background: rgba(9,12,26,.5);
          border: 1px solid var(--line); line-height: 1; transition: transform .2s var(--ease-out), border-color .2s, background .2s, color .2s; }
        .td-sign-glyph { font-size: 26px; color: rgba(230,205,133,.85); }
        .td-sign-hanja { font-size: 25px; color: var(--ink); font-weight: 400; }
        @media (hover: hover) { .td-sign:hover .td-sign-img { transform: translateY(-3px); border-color: var(--line-strong); } }
        .td-sign.is-auto .td-sign-img { border-color: rgba(201,168,76,.45); background: rgba(201,168,76,.06); }
        .td-sign.is-sel .td-sign-img { border-color: var(--gold-light); background: rgba(201,168,76,.10); color: var(--gold-light); }
        .td-sign-cn.is-auto .td-sign-img { border-color: rgba(170,165,209,.5); background: rgba(170,165,209,.08); }
        .td-sign-cn.is-sel .td-sign-img { border-color: var(--lavender); background: rgba(170,165,209,.12); }
        .td-sign-label { font-size: 12px; color: var(--ink-2); font-weight: 500; display:flex; align-items:center; gap: 3px; white-space: nowrap; }
        .td-sign.is-sel .td-sign-label { color: var(--gold-light); }
        .td-sign-cn.is-sel .td-sign-label { color: var(--lavender); }
        .td-glyph-sm { font-family: 'Segoe UI Symbol','Noto Sans Symbols 2','Apple Symbols',serif; color: rgba(230,205,133,.7); font-size: 11px; }
        .td-err { color: var(--danger); font-size: 13.5px; text-align:center; }
        .td-submit { width: 100%; }

        @media (min-width: 640px) {
          .td-deck { grid-template-columns: repeat(6, 1fr); gap: 12px; }
          .td-signs { grid-template-columns: repeat(6, 1fr); }
          .td-deeper { grid-template-columns: auto 1fr auto; }
          .td-deeper-btn { grid-column: auto; margin-top: 0; width: auto; }
        }
        @media (min-width: 1024px) {
          .td-hero { padding-top: 40px; }
          .td-moon-ring { width: 460px; height: 460px; margin: -230px 0 0 -230px; }
          .td-sub { font-size: 16px; }
          .td-panel { margin-top: 40px; }
          .td-deck { grid-template-columns: repeat(11, 1fr); gap: 14px; }
          .td-reveal { grid-template-columns: 340px 1fr; gap: 48px; align-items:start; }
          .td-reveal-card { position: sticky; top: calc(var(--nav-h) + 32px); }
          .td-big-card { width: 260px; }
          .td-reading { padding: 32px 36px; }
          .td-fortune { grid-template-columns: 340px 1fr; gap: 28px; align-items:start; }
          .td-fortune-side { position: sticky; top: calc(var(--nav-h) + 32px); }
          .td-picker { padding: 32px 36px; max-width: 880px; margin: 0 auto; }
          .td-picker-top { flex-direction: row; align-items: flex-end; justify-content: space-between; gap: 20px; }
          .td-picker-top .td-field { flex: 1; max-width: 420px; }
          .td-sign-img { width: 84px; height: 84px; }
          .td-moon { max-width: 880px; margin: 0 auto 16px; }
          .td-submit { max-width: 360px; align-self: center; }
        }
      `}</style>
    </main>
  )
}
