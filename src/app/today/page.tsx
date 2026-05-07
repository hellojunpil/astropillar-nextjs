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

const selectStyle: React.CSSProperties = {
  flex: 1, background: '#0f1829', border: '1px solid var(--border)',
  borderRadius: 10, padding: '8px 10px', color: '#fff',
  fontSize: 13, outline: 'none', colorScheme: 'dark', cursor: 'pointer',
  appearance: 'none' as const, WebkitAppearance: 'none' as const,
}

const MOON_PHASE_EMOJIS: Record<string, string> = {
  'new moon': '🌑', 'waxing crescent': '🌒', 'first quarter': '🌓',
  'waxing gibbous': '🌔', 'full moon': '🌕', 'waning gibbous': '🌖',
  'third quarter': '🌗', 'last quarter': '🌗', 'waning crescent': '🌘',
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

const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

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
      { id: 'tarot' as ActiveTab,     label: '🃏 Daily Tarot' },
      { id: 'horoscope' as ActiveTab, label: '🌙 Horoscope' },
      { id: 'chinese' as ActiveTab,   label: '☯ Chinese Zodiac' },
    ],
    freeBadge: 'FREE — No login required',
    signIn: 'Sign in →',
    tarotTitle: 'Daily Tarot',
    tarotSubtitle: 'Choose one card and reveal your message.',
    tarotLoading: '✦ Reading the cards...',
    tarotDestiny: 'Your first draw is closest to your destiny.',
    tarotShare: '↗ Share Your Card',
    tarotDrawAgain: '↺ Draw Again',
    tarotDeeper: 'Want a deeper reading?',
    tarotDeeperDesc: 'Three-Card, Relationship, or Celtic Cross spreads — full AI tarot interpretation.',
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
    shareNote: 'Free Fortune shares do not count toward the 3-share Credit promotion.',
    scoreLabels: { score_love:'LOVE', score_work:'WORK', score_money:'MONEY', score_health:'HEALTH', score_social:'SOCIAL', score_creative:'CREATIVE' },
  },
  ko: {
    tabs: [
      { id: 'tarot' as ActiveTab,     label: '🃏 오늘의 타로' },
      { id: 'horoscope' as ActiveTab, label: '🌙 오늘의 별자리' },
      { id: 'chinese' as ActiveTab,   label: '☯ 오늘의 띠별 운세' },
    ],
    freeBadge: '무료 — 로그인 불필요',
    signIn: '로그인 →',
    tarotTitle: '오늘의 타로',
    tarotSubtitle: '카드 한 장을 선택해 오늘의 메시지를 받아보세요.',
    tarotLoading: '✦ 카드를 읽는 중...',
    tarotDestiny: '첫 번째 선택이 운명에 가장 가깝습니다.',
    tarotShare: '↗ 카드 공유하기',
    tarotDrawAgain: '↺ 다시 뽑기',
    tarotDeeper: '더 깊은 타로 리딩을 원하세요?',
    tarotDeeperDesc: '쓰리카드, 관계 타로, 켈틱 크로스 — 풀 AI 타로 해석.',
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
    shareNote: '무료 운세 공유는 크레딧 적립(3회) 대상에 포함되지 않습니다.',
    scoreLabels: { score_love:'사랑', score_work:'일', score_money:'돈', score_health:'건강', score_social:'대인', score_creative:'창의' },
  },
  ja: {
    tabs: [
      { id: 'tarot' as ActiveTab,     label: '🃏 今日のタロット' },
      { id: 'horoscope' as ActiveTab, label: '🌙 今日の星座占い' },
      { id: 'chinese' as ActiveTab,   label: '☯ 今日の干支占い' },
    ],
    freeBadge: '無料 — ログイン不要',
    signIn: 'ログイン →',
    tarotTitle: '今日のタロット',
    tarotSubtitle: 'カードを1枚選んでメッセージを受け取りましょう。',
    tarotLoading: '✦ カードを読んでいます...',
    tarotDestiny: '最初の1枚が運命に最も近い。',
    tarotShare: '↗ カードをシェア',
    tarotDrawAgain: '↺ もう一度引く',
    tarotDeeper: 'より深いタロット鑑定をご希望ですか？',
    tarotDeeperDesc: 'スリーカード・リレーションシップ・ケルト十字 — フルAIタロット鑑定。',
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
    shareNote: '無料の運勢シェアはクレジット積立（3回）の対象外です。',
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
    const shareUrl = `https://astropillar.com/today/share?type=${encodeURIComponent(type)}&id=${encodeURIComponent(imgFile)}&label=${encodeURIComponent(label)}`
    const text = type === 'tarot'
      ? `✦ I drew "${label}" from the Major Arcana today — what does your card say?`
      : type === 'horoscope'
      ? `✦ My ${label} horoscope for today has been revealed ✦`
      : `✦ Year of the ${label} — today's fortune revealed ✦`
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
    { key: 'score_love',     color: '#f472b6' },
    { key: 'score_work',     color: '#C9A84C' },
    { key: 'score_money',    color: '#4ade80' },
    { key: 'score_health',   color: '#a78bfa' },
    { key: 'score_social',   color: '#60a5fa' },
    { key: 'score_creative', color: '#fb923c' },
  ] as const

  function FortuneResult({ fortune, mode, onBack, shareInfo }: { fortune: FortuneData; mode: 'horoscope'|'chinese'; onBack: () => void; shareInfo?: { label: string; imgFile: string } }) {
    const scores = SCORE_ITEMS.filter(s => typeof fortune[s.key] === 'number')
    const bestMatch = typeof fortune.best_match === 'string' ? fortune.best_match : null
    const bestMatchSign = bestMatch ? HOROSCOPE_SIGNS.find(s => s.name.toLowerCase() === bestMatch.toLowerCase()) : null
    return (
      <div>
        <div className="card" style={{ marginBottom: 12 }}>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
            {mode === 'horoscope' ? ui.horoLabel : ui.chineseLabel}
          </p>
          {scores.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 16 }}>
              {scores.map(s => (
                <div key={s.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{scoreLabels[s.key] ?? s.key}</span>
                    <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{fortune[s.key] as number}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${fortune[s.key] as number}%`, background: s.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {bestMatch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
              {bestMatchSign && <Image src={`${IMG}${bestMatchSign.img}`} alt={bestMatch} width={32} height={32} style={{ objectFit: 'contain' }} unoptimized />}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>{ui.bestMatch}</p>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{HOROSCOPE_NAMES[locale as keyof typeof HOROSCOPE_NAMES]?.[bestMatch] ?? bestMatch}</p>
              </div>
            </div>
          )}
          {!!fortune.intro && <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', marginBottom: 12, lineHeight: 1.7 }}>{fortune.intro as string}</p>}
          {!!fortune.fortune && <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.9, marginBottom: 14, whiteSpace: 'pre-wrap' }}>{(fortune.fortune as string).replace(/^\[[\w\s]+\]\s*/i, '')}</p>}
          {!!fortune.tip && (
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>{ui.tipLabel}</p>
              <p style={{ color: '#ddd', fontSize: 13, lineHeight: 1.7 }}>{fortune.tip as string}</p>
            </div>
          )}
        </div>
        {shareInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <button
              onClick={() => shareReading(shareInfo.label, mode, shareInfo.imgFile)}
              style={{ width: '100%', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.4)', color: 'var(--gold)', borderRadius: 50, padding: '11px', fontSize: 13, cursor: 'pointer' }}>
              {mode === 'horoscope' ? ui.shareHoro : ui.shareFortune}
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'center' }}>
              {ui.shareNote}
            </p>
          </div>
        )}
        <button onClick={onBack} style={{ width: '100%', background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 50, padding: '11px', fontSize: 13, cursor: 'pointer', marginBottom: 14 }}>
          {ui.checkAnother}
        </button>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>{ui.personalCta}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>{ui.personalCtaDesc}</p>
          <Link href="/menu" className="btn-gold" style={{ fontSize: 13, padding: '11px 24px' }}>{ui.exploreBtn}</Link>
        </div>
      </div>
    )
  }

  const tarotSections = tarotResult ? parseTarotResult(tarotResult) : []

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 96 }}>

      {shareToast && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          background: '#C9A84C', color: '#16213E', padding: '10px 22px',
          borderRadius: 24, fontSize: 13, fontWeight: 700, zIndex: 999,
          animation: 'fadeIn 0.2s ease', whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {shareToast}
        </div>
      )}

      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{ color: 'var(--gold)', fontSize: 20, letterSpacing: 3, fontWeight: 600 }}>ASTROPILLAR</span>
        </Link>
        {user
          ? <Link href="/menu" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>{user.email?.split('@')[0]} ✦</Link>
          : <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>{ui.signIn}</Link>
        }
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ textAlign: 'center', padding: '14px 20px 0' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{todayStr}</p>
          <span style={{ display: 'inline-block', marginTop: 4, border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>
            {ui.freeBadge}
          </span>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border)',
          margin: '14px 0 0',
        }}>
          {ui.tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1,
                padding: '12px 4px',
                background: active ? 'rgba(201,168,76,0.06)' : 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
                marginBottom: -2,
                color: active ? '#fff' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.18s',
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </button>
            )
          })}
        </div>

        <div style={{ padding: '20px 20px 0' }}>

          {/* ── Daily Tarot tab ─────────────────────────────────── */}
          {activeTab === 'tarot' && (
            <div>
              {/* Grid phase: show all 22 cards face-down */}
              <div style={{
                opacity: tarotPhase === 'revealed' ? 0 : 1,
                transition: 'opacity 0.4s ease',
                pointerEvents: tarotPhase === 'revealed' ? 'none' : 'auto',
                display: tarotPhase === 'revealed' ? 'none' : 'block',
              }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <p className="font-display" style={{ color: '#fff', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{ui.tarotTitle}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ui.tarotSubtitle}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {shuffledCards.map(card => {
                    const isSelected = tarotCard?.file === card.file
                    const isFlipping = tarotPhase === 'flipping'
                    return (
                      <div key={card.file} style={{
                        perspective: '600px',
                        opacity: isFlipping && !isSelected ? 0.12 : 1,
                        transition: 'opacity 0.35s ease',
                        cursor: tarotCard ? 'default' : 'pointer',
                      }} onClick={() => !tarotCard && selectTarotCard(card)}>
                        <div style={{
                          width: '100%', aspectRatio: '2/3',
                          position: 'relative',
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.75s ease',
                          transform: isSelected && isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}>
                          {/* Back face */}
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: 8,
                            background: 'linear-gradient(145deg, #1a2a4a 0%, #0d1626 100%)',
                            border: `1.5px solid ${isSelected && isFlipping ? 'var(--gold)' : 'rgba(201,168,76,0.35)'}`,
                            WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
                            transition: 'border-color 0.15s, transform 0.15s',
                          }}
                            onMouseEnter={e => { if (!tarotCard) { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.35)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
                          >
                            <span style={{ color: 'rgba(201,168,76,0.45)', fontSize: 16 }}>✦</span>
                          </div>
                          {/* Front face — only load image for selected card */}
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden',
                            border: '1.5px solid var(--gold)',
                            WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
                          }}>
                            {isSelected && (
                              <Image src={`${IMG}${card.file}.webp`} alt={card.name} fill style={{ objectFit: 'cover' }} unoptimized />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Result phase: large card + interpretation */}
              {tarotPhase === 'revealed' && tarotCard && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                  animation: 'fadeIn 0.5s ease',
                }}>
                  {!isFirstDraw && (
                    <p style={{ color: 'rgba(201,168,76,0.6)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                      {ui.tarotDestiny}
                    </p>
                  )}

                  <div style={{ width: 200, height: 333, borderRadius: 14, overflow: 'hidden', border: '2px solid var(--gold)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', position: 'relative' }}>
                    <Image src={`${IMG}${tarotCard.file}.webp`} alt={tarotCard.name} fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>

                  <p className="font-display" style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 600, letterSpacing: 1, textAlign: 'center' }}>
                    {tarotCard.name}
                  </p>

                  {tarotLoading && (
                    <p style={{ color: 'var(--gold)', fontSize: 13 }}>{ui.tarotLoading}</p>
                  )}

                  {tarotError && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{tarotError}</p>
                      <button onClick={() => { apiCalledRef.current = false; fetchTarotReading(tarotCard) }} className="btn-gold" style={{ fontSize: 13, padding: '10px 22px' }}>Try Again</button>
                    </div>
                  )}

                  {tarotSections.length > 0 && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {tarotSections.map((sec, i) => (
                        <div key={i} className="card" style={{ padding: '14px 16px' }}>
                          {sec.header && <p style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 700, marginBottom: 7 }}>{sec.header}</p>}
                          <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.8 }}>{sec.content}</p>
                        </div>
                      ))}

                      <p style={{ color: 'rgba(201,168,76,0.75)', fontSize: 13, textAlign: 'center', fontStyle: 'italic', marginTop: 4 }}>
                        {ui.tarotDestiny}
                      </p>

                      <button
                        onClick={() => tarotCard && shareReading(tarotCard.name, 'tarot', `${tarotCard.file}.webp`)}
                        style={{ width: '100%', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.4)', color: 'var(--gold)', borderRadius: 50, padding: '11px', fontSize: 13, cursor: 'pointer', letterSpacing: 0.5 }}>
                        {ui.tarotShare}
                      </button>
                      <p style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'center', marginTop: -4 }}>
                        {ui.shareNote}
                      </p>

                      <button onClick={resetTarot} style={{
                        width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                        color: 'var(--text-muted)', borderRadius: 50, padding: '11px', fontSize: 13,
                        cursor: 'pointer', letterSpacing: 0.5,
                      }}>
                        {ui.tarotDrawAgain}
                      </button>

                      <div className="card" style={{ textAlign: 'center', marginTop: 4 }}>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>{ui.tarotDeeper}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>{ui.tarotDeeperDesc}</p>
                        <Link href="/menu" className="btn-gold" style={{ fontSize: 13, padding: '11px 24px' }}>{ui.exploreBtn}</Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Horoscope tab ───────────────────────────────────── */}
          {activeTab === 'horoscope' && (
            <div>
              {moonPhase?.phase && (
                <div style={{ background: 'rgba(22,33,62,0.7)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 14, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{MOON_PHASE_EMOJIS[moonPhase.phase.toLowerCase()] ?? '🌙'}</span>
                  <div>
                    <p style={{ color: '#a78bfa', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>{ui.moonPhaseLabel}</p>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                      {MOON_PHASE_NAMES[locale as keyof typeof MOON_PHASE_NAMES]?.[moonPhase.phase.toLowerCase()] ?? moonPhase.phase}
                      {moonPhase.illumination != null && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 11 }}> · {Math.round(moonPhase.illumination <= 1 ? moonPhase.illumination*100 : moonPhase.illumination)}% {ui.illuminated}</span>}
                    </p>
                  </div>
                </div>
              )}

              {horoStep === 'result' && horoFortune ? (
                <FortuneResult
                  fortune={horoFortune} mode="horoscope"
                  onBack={() => { setHoroStep('pick'); setHoroFortune(null); setHoroSelected(null) }}
                  shareInfo={horoSelected ? { label: horoSelected, imgFile: HOROSCOPE_SIGNS.find(s => s.name === horoSelected)?.img ?? '' } : undefined}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{ui.yourBirthday}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={horoMonth} onChange={e => { setHoroMonth(e.target.value); const m=parseInt(e.target.value),d=parseInt(horoDay); if(m&&d) setHoroAuto(getHoroscope(m,d)); else setHoroAuto(null) }} style={selectStyle}>
                        <option value="">{ui.monthPlaceholder}</option>
                        {MONTHS.map((m,i) => <option key={m} value={String(i+1)}>{m}</option>)}
                      </select>
                      <select value={horoDay} onChange={e => { setHoroDay(e.target.value); const m=parseInt(horoMonth),d=parseInt(e.target.value); if(m&&d) setHoroAuto(getHoroscope(m,d)); else setHoroAuto(null) }} style={{...selectStyle, maxWidth: 90}}>
                        <option value="">{ui.dayPlaceholder}</option>
                        {DAYS.map(d => <option key={d} value={String(d)}>{d}</option>)}
                      </select>
                    </div>
                    {horoAuto && <p style={{ color: 'var(--gold)', fontSize: 12, marginTop: 6 }}>✦ {HOROSCOPE_NAMES[locale as keyof typeof HOROSCOPE_NAMES]?.[horoAuto] ?? horoAuto}</p>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {HOROSCOPE_SIGNS.map(s => {
                      const isSel = horoSelected === s.name
                      const isAuto = horoAuto === s.name && !horoSelected
                      const hi = isSel || isAuto
                      const displayName = HOROSCOPE_NAMES[locale as keyof typeof HOROSCOPE_NAMES]?.[s.name] ?? s.name
                      return (
                        <button key={s.name} type="button" onClick={() => setHoroSelected(horoSelected===s.name ? null : s.name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 72, height: 72, borderRadius: 16, background: hi ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)', border: `2px solid ${isSel ? 'var(--gold)' : isAuto ? 'rgba(201,168,76,0.5)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hi ? '0 0 10px rgba(201,168,76,0.25)' : 'none', transition: 'all 0.15s' }}>
                            <Image src={`${IMG}${s.img}`} alt={s.name} width={52} height={52} style={{ objectFit: 'contain' }} unoptimized />
                          </div>
                          <span style={{ color: isSel ? 'var(--gold)' : isAuto ? 'rgba(201,168,76,0.8)' : 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>{displayName}</span>
                        </button>
                      )
                    })}
                  </div>
                  {horoError && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{horoError}</p>}
                  <button onClick={() => horoSelected && fetchFortune(horoSelected, 'horoscope')} disabled={!horoSelected || horoLoading} className="btn-gold"
                    style={{ opacity: (!horoSelected || horoLoading) ? 0.4 : 1, cursor: (!horoSelected || horoLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {horoLoading ? ui.starsLoading : ui.seeHoro}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Chinese Zodiac tab ──────────────────────────────── */}
          {activeTab === 'chinese' && (
            <div>
              {chineseStep === 'result' && chineseFortune ? (
                <FortuneResult
                  fortune={chineseFortune} mode="chinese"
                  onBack={() => { setChineseStep('pick'); setChineseFortune(null); setChineseSelected(null) }}
                  shareInfo={chineseSelected ? { label: chineseSelected, imgFile: CHINESE_SIGNS.find(s => s.name === chineseSelected)?.img ?? '' } : undefined}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{ui.birthYear}</p>
                    <select value={chineseYear} onChange={e => { setChineseYear(e.target.value); const y=parseInt(e.target.value); setChineseAuto(y ? getChineseZodiac(y) : null) }} style={{...selectStyle, maxWidth: 140}}>
                      <option value="">{ui.selectYear}</option>
                      {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                    {chineseAuto && <p style={{ color: 'var(--gold)', fontSize: 12, marginTop: 6 }}>{ui.yearOf(CHINESE_NAMES[locale as keyof typeof CHINESE_NAMES]?.[chineseAuto] ?? chineseAuto)}</p>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {CHINESE_SIGNS.map(s => {
                      const isSel = chineseSelected === s.name
                      const isAuto = chineseAuto === s.name && !chineseSelected
                      const hi = isSel || isAuto
                      return (
                        <button key={s.name} type="button" onClick={() => setChineseSelected(chineseSelected===s.name ? null : s.name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 72, height: 72, borderRadius: 16, background: hi ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)', border: `2px solid ${isSel ? '#a78bfa' : isAuto ? 'rgba(167,139,250,0.5)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hi ? '0 0 10px rgba(167,139,250,0.25)' : 'none', transition: 'all 0.15s' }}>
                            <Image src={`${IMG}${s.img}`} alt={s.name} width={52} height={52} style={{ objectFit: 'contain' }} unoptimized />
                          </div>
                          <span style={{ color: isSel ? '#a78bfa' : isAuto ? 'rgba(167,139,250,0.8)' : 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>{CHINESE_NAMES[locale as keyof typeof CHINESE_NAMES]?.[s.name] ?? s.name}</span>
                        </button>
                      )
                    })}
                  </div>
                  {chineseError && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{chineseError}</p>}
                  <button onClick={() => chineseSelected && fetchFortune(chineseSelected, 'chinese')} disabled={!chineseSelected || chineseLoading} className="btn-gold"
                    style={{ opacity: (!chineseSelected || chineseLoading) ? 0.4 : 1, cursor: (!chineseSelected || chineseLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {chineseLoading ? ui.starsLoading : ui.seeChinese}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <BottomNav />
    </main>
  )
}
