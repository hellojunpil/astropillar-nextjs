'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/navigation'
import { useTransition } from 'react'

const LOCALES = ['en', 'ko', 'ja'] as const
const LABELS: Record<string, string> = { en: 'EN', ko: '한국어', ja: '日本語' }
const SHORT: Record<string, string> = { en: 'EN', ko: 'KO', ja: 'JA' }

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleChange(next: string) {
    // 쿠키에 저장해서 다음 방문에도 유지
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div className="ap-lang" role="group" aria-label="Language">
      {LOCALES.map(l => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          disabled={isPending}
          aria-pressed={locale === l}
          aria-label={LABELS[l]}
          className={`ap-lang-btn${locale === l ? ' is-on' : ''}`}
        >
          <span className="ap-lang-full">{LABELS[l]}</span>
          <span className="ap-lang-short" aria-hidden="true">{SHORT[l]}</span>
        </button>
      ))}
      <style>{`
        .ap-lang { display:flex; align-items:center; padding:3px; gap:2px; border-radius:999px;
          background: rgba(255,255,255,.04); border: 1px solid var(--line); }
        .ap-lang-btn { background: transparent; border: 0; border-radius: 999px; cursor: pointer;
          color: rgba(241,237,228,.55); font: inherit; font-size: 11.5px; padding: 5px 9px; min-height: 28px;
          transition: color .2s, background .2s; }
        .ap-lang-btn:hover { color: var(--ink); }
        .ap-lang-btn { white-space: nowrap; }
        .ap-lang-short { display: none; }
        @media (max-width: 420px) {
          .ap-lang-full { display: none; }
          .ap-lang-short { display: inline; }
          .ap-lang-btn { padding: 5px 7px; font-size: 11px; }
        }
        .ap-lang-btn.is-on { background: var(--gold-soft); color: var(--gold-light); font-weight: 700; }
      `}</style>
    </div>
  )
}
