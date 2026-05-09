'use client'
import { useRouter } from '@/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/hooks/useAuth'
import { usePricing } from '@/hooks/usePricing'
import { auth } from '@/lib/firebase'
import { gtagEvent } from '@/lib/gtag'
import BottomNav from '@/components/BottomNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getPaymentProviderByLocale } from '@/lib/paymentProvider'

const GUMROAD_1 = process.env.NEXT_PUBLIC_GUMROAD_URL_1 || ''
const GUMROAD_5 = process.env.NEXT_PUBLIC_GUMROAD_URL_5 || ''
const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || ''
const PORTONE_KAKAOPAY_KEY = process.env.NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY || ''
const PORTONE_TOSS_KEY = process.env.NEXT_PUBLIC_PORTONE_TOSS_CHANNEL_KEY || ''

// 테스트 금액 (실서비스 전환 시 수정)
const PRICES_KRW = { 1: 100, 5: 500 }
const PRICES_JPY = { 1: 100, 5: 500 }

export default function BuyPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('buy')
  const tMenu = useTranslations('menu')
  const { user, credits, loading, refreshCredits } = useAuth()
  const pricing = usePricing()
  const provider = getPaymentProviderByLocale(locale)

  const fontFamily = locale === 'ko' ? "'Noto Sans KR', sans-serif" : locale === 'ja' ? "'Noto Sans JP', sans-serif" : "'Noto Sans', sans-serif"

  const SERVICE_NAMES: Record<string, string> = {
    personal_fortune: (tMenu.raw('services.personal_fortune') as { title: string }).title,
    personal_daily_fortune: (tMenu.raw('services.daily') as { title: string }).title,
    yearly: (tMenu.raw('services.yearly') as { title: string }).title,
    compatibility: (tMenu.raw('services.compatibility') as { title: string }).title,
    scenario: (tMenu.raw('services.scenario') as { title: string }).title,
  }

  const SERVICES = Object.entries(SERVICE_NAMES).map(([key, name]) => {
    const n = pricing[key] ?? 1
    const badge = n === 1 ? tMenu('credit_badge', { n }) : tMenu('credits_badge', { n })
    return { name, cost: badge }
  })

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  async function handlePortOneBuy(creditCount: 1 | 5, method: 'kakaopay' | 'card') {
    if (!user?.email) {
      alert(locale === 'ko' ? '로그인이 필요합니다.' : locale === 'ja' ? 'ログインが必要です。' : 'Please log in.')
      return
    }

    const amount = locale === 'ja' ? PRICES_JPY[creditCount] : PRICES_KRW[creditCount]
    const currency = locale === 'ja' ? 'JPY' : 'KRW'
    const paymentId = `astropillar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const orderName = creditCount === 1
      ? (locale === 'ko' ? '1 크레딧' : locale === 'ja' ? '1クレジット' : '1 Credit')
      : (locale === 'ko' ? '5 크레딧 패키지' : locale === 'ja' ? '5クレジットパック' : '5 Credits Pack')

    gtagEvent('credit_purchase_click', { credits: String(creditCount), price: `${amount}${currency}`, method })

    try {
      // PortOne browser SDK 동적 import
      const PortOne = await import('@portone/browser-sdk/v2')

      const channelKey = method === 'kakaopay' ? PORTONE_KAKAOPAY_KEY : PORTONE_TOSS_KEY

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (PortOne.requestPayment as any)({
        storeId: PORTONE_STORE_ID,
        channelKey,
        paymentId,
        orderName,
        totalAmount: amount,
        currency,
        payMethod: method === 'kakaopay' ? 'EASY_PAY' : 'CARD',
        ...(method === 'kakaopay' ? {
          easyPay: { easyPayProvider: 'KAKAOPAY' }
        } : {}),
        customer: {
          email: user.email,
        },
      })

      if (!response || response.code) {
        // 사용자가 취소하거나 오류 발생
        if (response?.code !== 'USER_CANCEL') {
          console.error('PortOne payment failed:', response)
          alert(locale === 'ko' ? '결제 중 오류가 발생했습니다.' : locale === 'ja' ? '決済中にエラーが発生しました。' : 'Payment error occurred.')
        }
        return
      }

      // 서버사이드 결제 검증 + 크레딧 지급
      const verifyRes = await fetch('/api/portone-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: response.paymentId,
          credits: creditCount,
          email: user.email,
          locale,
        }),
      })

      const verifyData = await verifyRes.json()
      if (!verifyData.ok) {
        console.error('Verify failed:', verifyData)
        alert(locale === 'ko' ? '결제 검증 실패. 고객센터로 문의해주세요.' : locale === 'ja' ? '決済の確認に失敗しました。' : 'Payment verification failed.')
        return
      }

      // 크레딧 UI 갱신
      refreshCredits(creditCount)

      alert(locale === 'ko' ? `${creditCount} 크레딧이 충전되었습니다! 🎉` : locale === 'ja' ? `${creditCount}クレジットが追加されました！🎉` : `${creditCount} credits added! 🎉`)
    } catch (e) {
      console.error('PortOne buy error:', e)
      alert(locale === 'ko' ? '결제 중 오류가 발생했습니다.' : locale === 'ja' ? '決済中にエラーが発生しました。' : 'Payment error occurred.')
    }
  }

  function handleGumroadBuy(creditCount: number, gumroadUrl: string) {
    const price = creditCount === 1 ? t('pack1_price') : t('pack5_price')
    gtagEvent('credit_purchase_click', { credits: String(creditCount), price })
    window.open(gumroadUrl, '_blank')
  }

  if (loading) return null

  const isPortOne = provider === 'portone'

  return (
    <main style={{ fontFamily, background: '#07071a', color: '#F6F6F8', minHeight: '100vh', paddingBottom: 96 }}>
      {/* 헤더 */}
      <div style={{ background: 'rgba(13,13,43,0.95)', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#C9A84C', letterSpacing: 3 }}>ASTROPILLAR</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LanguageSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 20, padding: '6px 12px' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C' }}>{credits ?? 0}</span>
              <span style={{ fontSize: 11, color: 'rgba(201,168,76,0.8)' }}>{tMenu('credits_label')}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t('title')}</h1>
        <p style={{ fontSize: 13, color: 'rgba(200,195,220,0.6)', marginBottom: 28 }}>{t('subtitle')}</p>

        {/* 패키지 카드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {/* 1 크레딧 */}
          <div style={{ background: 'rgba(22,33,62,0.8)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>✦ {t('pack1_title')}</div>
                <div style={{ fontSize: 12, color: 'rgba(200,195,220,0.5)', marginTop: 2 }}>
                  {locale === 'ko' ? '리딩 1회 이용 가능' : locale === 'ja' ? 'リーディング1回分' : 'One premium reading'}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C' }}>
                {locale === 'ko' ? '₩1,900' : locale === 'ja' ? '¥300' : t('pack1_price')}
              </div>
            </div>
            {isPortOne ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {locale === 'ko' && (
                  <button onClick={() => handlePortOneBuy(1, 'kakaopay')} style={{ width: '100%', padding: '12px', background: '#FEE500', color: '#191919', fontFamily, fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span>카카오페이로 결제</span>
                  </button>
                )}
                <button onClick={() => handlePortOneBuy(1, 'card')} style={{ width: '100%', padding: '12px', background: '#C9A84C', color: '#16213E', fontFamily, fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 50, cursor: 'pointer' }}>
                  {locale === 'ko' ? '카드로 결제' : locale === 'ja' ? 'カードで支払う' : t('cta')}
                </button>
              </div>
            ) : (
              <button onClick={() => handleGumroadBuy(1, GUMROAD_1)} style={{ width: '100%', padding: '13px', background: '#C9A84C', color: '#16213E', fontFamily, fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 50, cursor: 'pointer' }}>
                {t('cta')}
              </button>
            )}
          </div>

          {/* 5 크레딧 */}
          <div style={{ background: 'rgba(22,33,62,0.8)', border: '2px solid rgba(201,168,76,0.5)', borderRadius: 18, padding: 20, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -10, right: 16, background: '#C9A84C', color: '#16213E', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12 }}>
              {t('pack5_save')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>✦✦✦ {t('pack5_title')}</div>
                <div style={{ fontSize: 12, color: 'rgba(200,195,220,0.5)', marginTop: 2 }}>
                  {locale === 'ko' ? '리딩 5회 이용 가능' : locale === 'ja' ? 'リーディング5回分' : 'Five premium readings'}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C' }}>
                {locale === 'ko' ? '₩8,900' : locale === 'ja' ? '¥1,200' : t('pack5_price')}
              </div>
            </div>
            {isPortOne ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {locale === 'ko' && (
                  <button onClick={() => handlePortOneBuy(5, 'kakaopay')} style={{ width: '100%', padding: '12px', background: '#FEE500', color: '#191919', fontFamily, fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span>카카오페이로 결제</span>
                  </button>
                )}
                <button onClick={() => handlePortOneBuy(5, 'card')} style={{ width: '100%', padding: '12px', background: '#C9A84C', color: '#16213E', fontFamily, fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 50, cursor: 'pointer' }}>
                  {locale === 'ko' ? '카드로 결제' : locale === 'ja' ? 'カードで支払う' : t('cta')}
                </button>
              </div>
            ) : (
              <button onClick={() => handleGumroadBuy(5, GUMROAD_5)} style={{ width: '100%', padding: '13px', background: '#C9A84C', color: '#16213E', fontFamily, fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 50, cursor: 'pointer' }}>
                {t('cta')}
              </button>
            )}
          </div>
        </div>

        {/* 서비스별 가격 */}
        <div style={{ background: 'rgba(22,33,62,0.5)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,168,76,0.6)', letterSpacing: 2, marginBottom: 14 }}>
            {locale === 'ko' ? '서비스별 크레딧' : locale === 'ja' ? 'サービス別クレジット' : 'CREDITS PER SERVICE'}
          </div>
          {SERVICES.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < SERVICES.length - 1 ? '1px solid rgba(201,168,76,0.08)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'rgba(200,195,220,0.7)' }}>{s.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C' }}>{s.cost}</span>
            </div>
          ))}
        </div>

        {/* 신뢰 배지 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(200,195,220,0.4)' }}>🔒 {t('secure')}</span>
          <span style={{ fontSize: 12, color: 'rgba(200,195,220,0.4)' }}>∞ {t('no_expiry')}</span>
        </div>

        {isPortOne && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, fontSize: 11, color: 'rgba(201,168,76,0.5)', textAlign: 'center' }}>
            {locale === 'ko' ? '🔒 PortOne 보안 결제 · 카카오페이 / 신용카드' : '🔒 PortOne セキュア決済 · クレジットカード'}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}
