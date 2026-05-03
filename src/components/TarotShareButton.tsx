'use client'
import { useState } from 'react'
import { apiPost } from '@/lib/api'

export default function TarotShareButton({ userEmail }: { userEmail: string }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    if (loading || !userEmail) return
    setLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    const shareData = {
      title: 'AstroPillar — Tarot Reading',
      text: 'I just got a tarot reading on AstroPillar ✨ Try yours free!',
      url: origin,
    }
    try {
      if (navigator.share) { await navigator.share(shareData) }
      else { await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); setMsg('Link copied!') }
      const res = await apiPost<{ share_count?: number; credit_earned?: boolean; credits_added?: number }>(
        '/record_share', { email: userEmail }
      )
      const count = res.share_count ?? 0
      if (res.credit_earned || res.credits_added) { setMsg('🎉 You earned 1 Credit!') }
      else { const r = 3 - (count % 3); setMsg(`Shared! ${r} more share${r !== 1 ? 's' : ''} → 1 Credit`) }
    } catch { setMsg('') }
    finally { setLoading(false) }
  }

  if (!userEmail) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <button onClick={handleShare} disabled={loading} style={{
        width: '100%', background: 'rgba(201,168,76,0.08)', border: '1px solid var(--gold)',
        color: 'var(--gold)', borderRadius: 50, padding: 12, fontSize: 14,
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
      }}>
        {loading ? '✦ Sharing...' : '↗ Share & Earn Credits'}
      </button>
      {msg && <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>{msg}</p>}
      <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>Every 3 shares = 1 free Credit · Max 1 Credit per day</p>
    </div>
  )
}
