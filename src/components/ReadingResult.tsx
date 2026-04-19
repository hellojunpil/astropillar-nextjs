'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { apiPost } from '@/lib/api'

const GH = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

function ganImg(char: string) {
  return `${GH}gan_${encodeURIComponent(char)}.png`
}
function zhiImg(char: string) {
  return `${GH}zhi_${encodeURIComponent(char)}.png`
}

// r_*.svg format — used for all zodiac displays in readings
const ZODIAC_SVG_KEYS = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces',
]

const ZODIAC_SYMBOL: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
}

const PILLAR_LABELS = ['Year', 'Month', 'Day', 'Hour']
const PILLAR_KEYS = ['year', 'month', 'day', 'hour']
const PILLAR_KR = ['년주', '월주', '일주', '시주']

interface Pillar {
  gan: string
  zhi: string
}

interface WesternData {
  sun_sign?: string
  moon_sign?: string
  ascendant?: string
  rising?: string
  [key: string]: unknown
}

interface Section {
  title?: string
  content: string
}

// ─── Pillar extraction ───────────────────────────────────────────────────────
function extractPillars(data: Record<string, unknown>): Pillar[] | null {
  // Try nested { year: {gan, zhi}, month: ... }
  const nested = (data.pillars ?? data.bazi ?? data.four_pillars ?? data.saju ?? data) as Record<string, unknown>

  const pillars: Pillar[] = []
  for (const key of PILLAR_KEYS) {
    const p = nested[key] as Record<string, unknown> | undefined
    if (!p) continue
    const gan = (p.gan ?? p.stem ?? p.heavenly_stem ?? p.tian_gan ?? '') as string
    const zhi = (p.zhi ?? p.branch ?? p.earthly_branch ?? p.di_zhi ?? '') as string
    if (gan && zhi) pillars.push({ gan, zhi })
  }
  if (pillars.length >= 2) return pillars

  // Try flat fields: year_gan, year_zhi, year_stem, year_branch ...
  const flat: Pillar[] = []
  for (const key of PILLAR_KEYS) {
    const gan = (nested[`${key}_gan`] ?? nested[`${key}_stem`] ?? nested[`${key}_heavenly_stem`] ?? '') as string
    const zhi = (nested[`${key}_zhi`] ?? nested[`${key}_branch`] ?? nested[`${key}_earthly_branch`] ?? '') as string
    if (gan && zhi) flat.push({ gan, zhi })
  }
  if (flat.length >= 2) return flat

  return null
}

// ─── Western chart extraction ─────────────────────────────────────────────────
function extractWestern(data: Record<string, unknown>): WesternData | null {
  const w = (data.western ?? data.astrology ?? data.natal_chart ?? data.western_chart) as WesternData | undefined
  if (w && (w.sun_sign || w.moon_sign)) return w
  // Maybe sun_sign is at the root
  if (data.sun_sign) return data as WesternData
  return null
}

// ─── Text sections extraction ─────────────────────────────────────────────────
export function parseResult(raw: unknown): Section[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    const blocks = raw.split(/\n(?=#{1,3} |\*\*[A-Z\u00C0-\uFFFF])/)
    return blocks.map(b => {
      const hMatch = b.match(/^#{1,3} (.+?)\n([\s\S]*)/)
      const bMatch = b.match(/^\*\*(.+?)\*\*\n?([\s\S]*)/)
      if (hMatch) return { title: hMatch[1].replace(/\*\*/g, ''), content: hMatch[2].trim() }
      if (bMatch) return { title: bMatch[1], content: bMatch[2].trim() }
      return { content: b.trim() }
    }).filter(s => s.content.length > 0)
  }
  if (Array.isArray(raw)) return raw as Section[]
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>
    // Text fields
    const textFields = ['reading', 'interpretation', 'result', 'content', 'summary', 'fortune', 'message']
    for (const f of textFields) {
      if (typeof obj[f] === 'string' && (obj[f] as string).length > 30) {
        return parseResult(obj[f] as string)
      }
    }
    if (obj.sections) return parseResult(obj.sections)
    // Fall back: collect all string values as sections
    return Object.entries(obj)
      .filter(([k, v]) => typeof v === 'string' && (v as string).length > 20 && !['sun_sign','moon_sign','ascendant','rising'].includes(k))
      .map(([k, v]) => ({
        title: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        content: v as string,
      }))
  }
  return []
}

// ─── Zodiac image helper ──────────────────────────────────────────────────────
function ZodiacBadge({ sign }: { sign: string }) {
  const key = sign.toLowerCase().replace(/\s/g, '')
  const isValid = ZODIAC_SVG_KEYS.includes(key)
  const symbol = ZODIAC_SYMBOL[key] ?? '✦'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {isValid ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${GH}r_${key}.svg`}
          alt={sign}
          width={52}
          height={52}
          style={{ borderRadius: 8, filter: 'invert(1) sepia(1) saturate(3) hue-rotate(10deg) brightness(0.9)' }}
          onError={(e) => { (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'), { textContent: symbol, style: 'font-size:32px' })) }}
        />
      ) : (
        <span style={{ fontSize: 32 }}>{symbol}</span>
      )}
      <span style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>{sign}</span>
    </div>
  )
}

// ─── Share Button ─────────────────────────────────────────────────────────────
function ShareButton({ userEmail }: { userEmail: string }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    if (loading) return
    setLoading(true)
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    const shareData = {
      title: 'AstroPillar — Where the stars meet your fate',
      text: 'Get your free BaZi + Astrology reading ✨',
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareUrl}`)
        setMsg('Link copied!')
      }
      const res = await apiPost<{ share_count?: number; credit_earned?: boolean; credits_added?: number }>('/record_share', { email: userEmail })
      const count = res.share_count ?? 0
      if (res.credit_earned || res.credits_added) {
        setMsg('🎉 You earned 1 Credit!')
      } else {
        const remaining = 3 - (count % 3)
        setMsg(`Shared! ${remaining} more share${remaining !== 1 ? 's' : ''} → 1 Credit`)
      }
    } catch {
      setMsg('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button
        onClick={handleShare}
        disabled={loading}
        style={{
          width: '100%', background: 'rgba(201,168,76,0.08)',
          border: '1px solid var(--gold)', color: 'var(--gold)',
          borderRadius: 50, padding: '12px', fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? '✦ Sharing...' : '↗ Share & Earn Credits'}
      </button>
      {msg && (
        <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>{msg}</p>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>
        Every 3 shares = 1 free Credit
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  raw: unknown
  onReset: () => void
  userEmail?: string
}

export default function ReadingResult({ raw, onReset, userEmail }: Props) {
  const data = (typeof raw === 'object' && raw !== null) ? raw as Record<string, unknown> : {}
  const pillars = extractPillars(data)
  const western = extractWestern(data)
  const sections = parseResult(raw)

  return (
    <div>
      {/* ── 사주팔자 (Four Pillars) ── */}
      {pillars && pillars.length >= 2 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            四柱八字 · Four Pillars
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pillars.length}, 1fr)`, gap: 10 }}>
            {pillars.map((p, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {PILLAR_LABELS[i]}
                </p>
                {/* 천간 */}
                <Image
                  src={ganImg(p.gan)}
                  alt={p.gan}
                  width={56}
                  height={56}
                  unoptimized
                  style={{ borderRadius: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {/* 지지 */}
                <Image
                  src={zhiImg(p.zhi)}
                  alt={p.zhi}
                  width={56}
                  height={56}
                  unoptimized
                  style={{ borderRadius: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <p style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'center' }}>
                  {PILLAR_KR[i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Western Chart ── */}
      {western && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ color: '#a78bfa', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            ☽ Western Astrology Chart
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {western.sun_sign && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 6 }}>☀ Sun Sign</p>
                <ZodiacBadge sign={western.sun_sign} />
              </div>
            )}
            {western.moon_sign && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 6 }}>☽ Moon Sign</p>
                <ZodiacBadge sign={western.moon_sign} />
              </div>
            )}
            {(western.ascendant || western.rising) && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 6 }}>↑ Rising</p>
                <ZodiacBadge sign={(western.ascendant || western.rising) as string} />
              </div>
            )}
          </div>

          {/* Other planets */}
          {western.planets && typeof western.planets === 'object' && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(western.planets as Record<string, string>).map(([planet, sign]) => (
                <span key={planet} style={{
                  background: '#0f1829', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)',
                }}>
                  <span style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{planet}</span> · {sign}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── GPT Interpretation ── */}
      {sections.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            ✦ Your Reading
          </p>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              {s.title && (
                <h3 style={{
                  color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 17, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5,
                }}>
                  {s.title}
                </h3>
              )}
              <p style={{ color: '#ddd', fontSize: 15, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                {s.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {userEmail && <ShareButton userEmail={userEmail} />}
        <button
          onClick={onReset}
          style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
            borderRadius: 50, padding: '12px', fontSize: 14, cursor: 'pointer',
          }}
        >
          ← New Reading
        </button>
        <Link href="/menu" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
          Back to Menu
        </Link>
      </div>
    </div>
  )
}
