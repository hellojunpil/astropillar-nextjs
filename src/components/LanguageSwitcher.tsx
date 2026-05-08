'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/navigation'
import { useTransition } from 'react'

const LOCALES = ['en', 'ko', 'ja'] as const
const LABELS: Record<string, string> = { en: 'EN', ko: '한국어', ja: '日本語' }

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
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {LOCALES.map(l => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          disabled={isPending}
          style={{
            background: locale === l ? 'rgba(201,168,76,0.2)' : 'transparent',
            border: `1px solid ${locale === l ? '#C9A84C' : 'rgba(201,168,76,0.3)'}`,
            borderRadius: 6,
            color: locale === l ? '#C9A84C' : 'rgba(246,246,248,0.6)',
            fontSize: 11,
            fontWeight: locale === l ? 700 : 400,
            padding: '3px 7px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
