import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

const IMG_BASE = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

interface PageProps {
  searchParams: Promise<{ type?: string; id?: string; label?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { type = 'tarot', id = '', label = '' } = await searchParams
  const imgUrl = id ? `${IMG_BASE}${id}` : ''

  const descriptions: Record<string, string> = {
    tarot: `"${label}" was drawn from the Major Arcana. What does your card say?`,
    horoscope: `Today's ${label} horoscope has been revealed. Check yours at AstroPillar!`,
    chinese: `Year of the ${label} fortune revealed. Check yours at AstroPillar!`,
  }
  const description = descriptions[type] || 'Discover your daily fortune at AstroPillar.'
  const title = `${label} — AstroPillar`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imgUrl ? [{ url: imgUrl }] : [],
      url: 'https://astropillar.com/today',
      siteName: 'AstroPillar',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imgUrl ? [imgUrl] : [],
    },
  }
}

const SUBTITLES: Record<string, string> = {
  tarot: 'Daily Tarot Card',
  horoscope: 'Daily Horoscope',
  chinese: 'Chinese Zodiac Fortune',
}

export default async function SharePage({ searchParams }: PageProps) {
  const { type = 'tarot', id = '', label = '' } = await searchParams
  const imgUrl = id ? `${IMG_BASE}${id}` : ''
  const isTarot = type === 'tarot'

  return (
    <main style={{
      background: '#0a0a0f', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Noto Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <p style={{ color: '#C9A84C', fontSize: 11, letterSpacing: 4, fontWeight: 700, marginBottom: 32 }}>
          ASTROPILLAR
        </p>

        {imgUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Image
              src={imgUrl}
              alt={label}
              width={isTarot ? 180 : 150}
              height={isTarot ? 300 : 150}
              style={{
                borderRadius: 12,
                border: '2px solid #C9A84C',
                objectFit: 'cover',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              }}
              unoptimized
            />
          </div>
        )}

        <p style={{ color: '#aaaaaa', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          {SUBTITLES[type] || "Today's Fortune"}
        </p>
        <h1 style={{ color: '#C9A84C', fontSize: 28, fontWeight: 700, marginBottom: 32, fontFamily: "'Cormorant Garamond', serif", letterSpacing: 1 }}>
          {label}
        </h1>

        <Link
          href="/today"
          style={{
            background: '#C9A84C', color: '#16213E', fontWeight: 700,
            padding: '14px 32px', borderRadius: 50, textDecoration: 'none',
            fontSize: 15, display: 'inline-block',
          }}
        >
          ✦ Check My Fortune →
        </Link>

        <p style={{ color: '#444', fontSize: 11, marginTop: 20 }}>
          Free · No login required
        </p>
      </div>
    </main>
  )
}
