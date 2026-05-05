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

export default function BuyPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('buy')
  const tMenu = useTranslations('menu')
  const { user, credits, loading } = useAuth()
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

  function handleBuy(credits: number, gumroadUrl: string) {
    const price = credits === 1 ? t('pack1_price') : t('pack5_price')
    gtagEvent('credit_purchase_click', { credits: String(credits), price })

    if (provider === 'portone') {
      // TODO: 포트원 가입 완료 후 구현
      // 현재는 Gumroad fallback
      alert(locale === 'ko' ? '포트원 결제 연동 준비 중입니다. 잠시 후 Gumroad로 안내합니다.' : locale === 'ja' ? 'PortOne決済は準備中です。Gumroadにリダイレクトします。' : 'PortOne payment coming soon.')
      window.open(gumroadUrl, '_blank')
    } else {
      window.open(gumroadUrl, '_blank')
    }
  }

  if (loading) return null

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
              <div style={{ fontSize: 24, fontWeight: 700, color: '#C9A84C' }}>{t('pack1_price')}</div>
            </div>
            <button onClick={() => handleBuy(1, GUMROAD_1)} style={{ width: '100%', padding: '13px', background: '#C9A84C', color: '#16213E', fontFamily, fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 50, cursor: 'pointer' }}>
              {t('cta')}
            </button>
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
              <div style={{ fontSize: 24, fontWeight: 700, color: '#C9A84C' }}>{t('pack5_price')}</div>
            </div>
            <button onClick={() => handleBuy(5, GUMROAD_5)} style={{ width: '100%', padding: '13px', background: '#C9A84C', color: '#16213E', fontFamily, fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 50, cursor: 'pointer' }}>
              {t('cta')}
            </button>
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

        {provider === 'portone' && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, fontSize: 12, color: 'rgba(201,168,76,0.7)', textAlign: 'center' }}>
            {locale === 'ko' ? '🚧 한국/일본 로컬 결제 연동 준비 중 · 현재 국제 카드로 결제 가능' : '🚧 ローカル決済連携準備中 · 現在は国際カードでお支払いいただけます'}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}
