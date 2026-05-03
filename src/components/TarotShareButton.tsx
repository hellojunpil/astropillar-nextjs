'use client'
import { useState } from 'react'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'

export default function TarotShareButton({ userEmail }: { userEmail: string }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  async function recordShare() {
    try {
      const res = await apiPost<{ share_count?: number; credit_earned?: boolean; credits_added?: number }>(
        '/record_share', { email: userEmail }
      )
      const count = res.share_count ?? 0
      if (res.credit_earned || res.credits_added) { setMsg('🎉 You earned 1 Credit!') }
      else { const r = 3 - (count % 3); setMsg(`Shared! ${r} more share${r !== 1 ? 's' : ''} → 1 Credit`) }
    } catch { /* silent */ }
  }

  async function handleShare() {
    if (loading || !userEmail) return
    setLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    const shareText = 'I just got a tarot reading on AstroPillar ✨ Try yours free!'
    const shareUrl = origin
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AstroPillar — Tarot Reading', text: shareText, url: shareUrl })
        gtagEvent('share_click', { type: 'tarot', method: 'native' })
        await recordShare()
      } else {
        setShowModal(true)
      }
    } catch { /* dismissed by user */ }
    finally { setLoading(false) }
  }

  async function handleCopyLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    try {
      await navigator.clipboard.writeText(`I just got a tarot reading on AstroPillar ✨ Try yours free! ${origin}`)
      setMsg('Link copied!')
    } catch {
      setMsg('Link copied!')
    }
    gtagEvent('share_click', { type: 'tarot', method: 'copy' })
    setShowModal(false)
    await recordShare()
  }

  function handleTwitter() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    const text = encodeURIComponent(`I just got a tarot reading on AstroPillar ✨ Try yours free! ${origin}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    gtagEvent('share_click', { type: 'tarot', method: 'twitter' })
    setShowModal(false)
    recordShare()
  }

  function handleInstagram() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    navigator.clipboard.writeText(`I just got a tarot reading on AstroPillar ✨ Try yours free! ${origin}`)
      .then(() => setMsg('Link copied! Paste it in your Instagram story or bio.'))
      .catch(() => setMsg('Copy the link and share on Instagram!'))
    gtagEvent('share_click', { type: 'tarot', method: 'instagram' })
    setShowModal(false)
    recordShare()
  }

  if (!userEmail) return null

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <button
          data-testid="share-earn-btn"
          onClick={handleShare}
          disabled={loading}
          style={{
            width: '100%', background: 'rgba(201,168,76,0.08)', border: '1px solid var(--gold)',
            color: 'var(--gold)', borderRadius: 50, padding: 12, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
          {loading ? '✦ Sharing...' : '↗ Share & Earn Credits'}
        </button>
        {msg && <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>{msg}</p>}
        <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>Every 3 shares = 1 free Credit · Max 1 Credit per day</p>
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#16213E', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Share & Earn Credits</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Every 3 shares = 1 free Credit (max 1/day)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleTwitter} style={{ width: '100%', background: '#1da1f2', border: 'none', borderRadius: 50, color: '#fff', padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Share on X (Twitter)
              </button>
              <button onClick={handleInstagram} style={{ width: '100%', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border: 'none', borderRadius: 50, color: '#fff', padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Share on Instagram
              </button>
              <button onClick={handleCopyLink} style={{ width: '100%', background: 'rgba(201,168,76,0.12)', border: '1px solid var(--gold)', borderRadius: 50, color: 'var(--gold)', padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Copy Link
              </button>
              <button onClick={() => setShowModal(false)} style={{ width: '100%', background: 'none', border: '1px solid var(--border)', borderRadius: 50, color: 'var(--text-muted)', padding: 10, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
