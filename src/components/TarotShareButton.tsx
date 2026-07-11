'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { gtagEvent } from '@/lib/gtag'
import { createShare } from '@/lib/firestore'

export interface TarotShareData {
  reading_type: string
  name: string
  result: unknown
}

const SHARE_TEXT_MAP = {
  en: {
    sharing: '✦ Sharing...',
    share: '↗ Share',
    modalLabel: 'Share',
    modalDesc: 'Share AstroPillar with friends ✨',
    twitter: 'Share on X (Twitter)',
    instagram: 'Share on Instagram',
    copyLink: 'Copy Link',
    cancel: 'Cancel',
    copied: 'Link copied!',
    copiedInsta: 'Link copied! Paste it in your Instagram story or bio.',
    copyFail: 'Copy the link and share on Instagram!',
    shareMsg: 'I just got a tarot reading on AstroPillar ✨ Try yours free!',
    shareTitle: 'AstroPillar — Tarot Reading',
  },
  ko: {
    sharing: '✦ 공유 중...',
    share: '↗ 공유하기',
    modalLabel: '공유하기',
    modalDesc: '친구에게 AstroPillar를 공유해보세요 ✨',
    twitter: 'X(트위터)에 공유',
    instagram: '인스타그램에 공유',
    copyLink: '링크 복사',
    cancel: '취소',
    copied: '링크가 복사됐어요!',
    copiedInsta: '링크가 복사됐어요! 인스타그램 스토리나 프로필에 붙여넣어 보세요.',
    copyFail: '링크를 복사해서 인스타그램에 공유해보세요!',
    shareMsg: 'AstroPillar에서 타로 리딩을 받았어요 ✨ 당신도 무료로 받아보세요!',
    shareTitle: 'AstroPillar — 타로 리딩',
  },
  ja: {
    sharing: '✦ 共有中...',
    share: '↗ シェア',
    modalLabel: 'シェア',
    modalDesc: '友達にAstroPillarをシェアしましょう ✨',
    twitter: 'X（Twitter）でシェア',
    instagram: 'Instagramでシェア',
    copyLink: 'リンクをコピー',
    cancel: 'キャンセル',
    copied: 'リンクをコピーしました！',
    copiedInsta: 'リンクをコピーしました！Instagramのストーリーやプロフィールに貼り付けてください。',
    copyFail: 'リンクをコピーしてInstagramでシェアしてください！',
    shareMsg: 'AstroPillarでタロットリーディングを受けました ✨ あなたも無料で試してみて！',
    shareTitle: 'AstroPillar — タロットリーディング',
  },
}

export default function TarotShareButton({ userEmail, share }: { userEmail: string; share?: TarotShareData | null }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [shareId, setShareId] = useState<string | null>(null)
  const createdRef = useRef(false)
  const locale = useLocale()
  const t = SHARE_TEXT_MAP[locale as keyof typeof SHARE_TEXT_MAP] ?? SHARE_TEXT_MAP.en

  // 공유 레코드를 미리 생성 — 클릭 시점에 await하면 iOS Safari가 공유 제스처를 거부할 수 있음
  useEffect(() => {
    if (!share || createdRef.current) return
    createdRef.current = true
    createShare({
      reading_type: share.reading_type,
      name: share.name,
      birth_date: '',
      birth_city: '',
      result: share.result,
    }).then(id => { if (id) setShareId(id) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share])

  function shareLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://astropillar.com'
    return shareId ? `${origin}/share/${shareId}` : origin
  }

  async function handleShare() {
    if (loading || !userEmail) return
    setLoading(true)
    const shareUrl = shareLink()
    try {
      if (navigator.share) {
        await navigator.share({ title: t.shareTitle, text: t.shareMsg, url: shareUrl })
        gtagEvent('share_click', { type: 'tarot', method: 'native' })
      } else {
        setShowModal(true)
      }
    } catch { /* dismissed by user */ }
    finally { setLoading(false) }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${t.shareMsg} ${shareLink()}`)
      setMsg(t.copied)
    } catch {
      setMsg(t.copied)
    }
    gtagEvent('share_click', { type: 'tarot', method: 'copy' })
    setShowModal(false)
  }

  function handleTwitter() {
    const text = encodeURIComponent(`${t.shareMsg} ${shareLink()}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    gtagEvent('share_click', { type: 'tarot', method: 'twitter' })
    setShowModal(false)
  }

  function handleInstagram() {
    navigator.clipboard.writeText(`${t.shareMsg} ${shareLink()}`)
      .then(() => setMsg(t.copiedInsta))
      .catch(() => setMsg(t.copyFail))
    gtagEvent('share_click', { type: 'tarot', method: 'instagram' })
    setShowModal(false)
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
          {loading ? t.sharing : t.share}
        </button>
        {msg && <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>{msg}</p>}
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#16213E', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{t.modalLabel}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>{t.modalDesc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleTwitter} style={{ width: '100%', background: '#1da1f2', border: 'none', borderRadius: 50, color: '#fff', padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {t.twitter}
              </button>
              <button onClick={handleInstagram} style={{ width: '100%', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border: 'none', borderRadius: 50, color: '#fff', padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {t.instagram}
              </button>
              <button onClick={handleCopyLink} style={{ width: '100%', background: 'rgba(201,168,76,0.12)', border: '1px solid var(--gold)', borderRadius: 50, color: 'var(--gold)', padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {t.copyLink}
              </button>
              <button onClick={() => setShowModal(false)} style={{ width: '100%', background: 'none', border: '1px solid var(--border)', borderRadius: 50, color: 'var(--text-muted)', padding: 10, fontSize: 13, cursor: 'pointer' }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
