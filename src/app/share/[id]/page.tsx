'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getShare, ShareRecord } from '@/lib/firestore'
import { BirthData } from '@/components/BirthForm'
import ReadingResult, { parseResult } from '@/components/ReadingResult'
import { localizeTarotTitle } from '@/lib/tarotTitles'
import { cardImageUrl } from '@/lib/tarotDeck'
import Link from 'next/link'

interface TarotSharedResult {
  content_text?: string
  cards?: Array<{ name?: string; position?: string; file?: string }>
  question?: string
}

function TarotSharedView({ record }: { record: ShareRecord }) {
  const locale = useLocale()
  const result = (record.result ?? {}) as TarotSharedResult
  const cards = result.cards ?? []
  const sections = result.content_text
    ? parseResult(result.content_text).filter(sec =>
        !sec.content.includes('Get Scenario Reading') && !sec.content.includes('Share & Earn Credits'))
    : []

  return (
    <div>
      {result.question && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginBottom: 20 }}>
          “{result.question}”
        </p>
      )}

      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {c.file && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cardImageUrl(c.file)} alt={c.name ?? ''} style={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--gold)' }} />
              )}
              {c.position && <p style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>{c.position}</p>}
              {c.name && <p style={{ color: 'var(--text-muted)', fontSize: 9, textAlign: 'center', maxWidth: 80 }}>{c.name}</p>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map((sec, i) => (
          <div key={i} className="card" style={{ padding: '14px 16px' }}>
            {sec.title && <p style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 700, marginBottom: 7 }}>{localizeTarotTitle(sec.title, locale)}</p>}
            <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{sec.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<ShareRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    getShare(id).then(r => {
      if (r) setRecord(r)
      else setNotFound(true)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Loading reading...</p>
      </main>
    )
  }

  if (notFound || !record) {
    return (
      <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: '#ef4444', fontSize: 16 }}>Reading not found.</p>
        <Link href="/" style={{ color: 'var(--gold)', fontSize: 14 }}>← Back to AstroPillar</Link>
      </main>
    )
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: 'var(--gold)', letterSpacing: 2, textDecoration: 'none' }}>
            ASTROPILLAR
          </Link>
          <Link href="/login" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px' }}>
            Get Your Reading →
          </Link>
        </div>
        {record.reading_type?.startsWith('tarot') ? (
          <TarotSharedView record={record} />
        ) : (
          <ReadingResult
            raw={record.result}
            onReset={() => {}}
            birthData={record.birth_data as BirthData | undefined}
            isSharedView={true}
          />
        )}
      </div>
    </main>
  )
}
