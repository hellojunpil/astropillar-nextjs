'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getShare, ShareRecord } from '@/lib/firestore'
import { BirthData } from '@/components/BirthForm'
import ReadingResult from '@/components/ReadingResult'
import Link from 'next/link'

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
        <ReadingResult
          raw={record.result}
          onReset={() => {}}
          birthData={record.birth_data as BirthData | undefined}
          isSharedView={true}
        />
      </div>
    </main>
  )
}
