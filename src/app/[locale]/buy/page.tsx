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
import { isNative, initRevenueCat, getIAPPrices, buyCreditsIAP } from '@/lib/iap'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const GUMROAD_1 = process.env.NEXT_PUBLIC_GUMROAD_URL_1 || ''
const GUMROAD_5 = process.env.NEXT_PUBLIC_GUMROAD_URL_5 || ''
const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || ''
const PORTONE_KAKAOPAY_KEY = process.env.NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY || ''
const PORTONE_TOSS_KEY = process.env.NEXT_PUBLIC_PORTONE_TOSS_CHANNEL_KEY || ''

// 테스트 금액 (실서비스 전환 시 수정)
const PRICES_KRW = { 1: 990, 5: 3900 }
const PRICES_JPY = { 1: 100, 5: 400 }

function BuyContent() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('buy')
  const tMenu = useTranslations('menu')
  const { user, credits, loading, refreshCredits } = useAuth()
  const pricing = usePricing()
  const provider = getPaymentProviderByLocale(locale)
  const searchParams = useSearchParams()
  const verifyCalledRef = useRef(false)
  const [nativePrices, setNativePrices] = useState<{ credits1: string; credits5: string } | null>(null)
  const [iapLoading, setIapLoading] = useState(false)
  const nativeApp = isNative()


  // 카카오페이 모바일 리다이렉트 복귀 처리
  useEffect(() => {
    const paymentId = searchParams.get('paymentId')
    const creditsParam = searchParams.get('credits')
    if (!paymentId || !creditsParam || !user?.email || verifyCalledRef.current) return
    verifyCalledRef.current = true

    const creditCount = Number(creditsParam)
    fetch('/api/portone-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, credits: creditCount, email: user.email, locale }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          refreshCredits(creditCount)
          gtagEvent('purchase', {
            transaction_id: paymentId,
            value: locale === 'ja' ? PRICES_JPY[creditCount as 1 | 5] : PRICES_KRW[creditCount as 1 | 5],
            currency: locale === 'ja' ? 'JPY' : 'KRW',
            items: [{ item_id: `credits_${creditCount}`, item_name: `${creditCount} Credits`, quantity: 1 }],
          })
          alert(locale === 'ko' ? `${creditCount} 크레딧이 충전되었습니다! 🎉` : locale === 'ja' ? `${creditCount}クレジットが追加されました！🎉` : `${creditCount} credits added! 🎉`)
          // URL 파라미터 제거
          window.history.replaceState({}, '', window.location.pathname)
        } else {
          alert(locale === 'ko' ? '결제 검증 실패. 고객센터로 문의해주세요.' : locale === 'ja' ? '決済の確認に失敗しました。' : 'Payment verification failed.')
        }
      })
      .catch(() => {
        alert(locale === 'ko' ? '결제 확인 중 오류가 발생했습니다.' : '結済確認エラーが発生しました。')
      })
  }, [searchParams, user, locale, refreshCredits])

  // 네이티브 앱일 때 RevenueCat 초기화 + 가격 로드
  useEffect(() => {
    if (!nativeApp || !user?.email) return
    initRevenueCat(user.email)
      .then(() => getIAPPrices())
      .then(prices => setNativePrices(prices))
      .catch(e => console.error('IAP init error:', e))
  }, [nativeApp, user?.email])

  async function handleIAPBuy(productId: 'credits_1' | 'credits_5') {
    if (!user?.email) {
      alert(locale === 'ko' ? '로그인이 필요합니다.' : locale === 'ja' ? 'ログインが必要です。' : 'Please log in.')
      return
    }
    setIapLoading(true)
    try {
      const credits = await buyCreditsIAP(productId, user.email)
      refreshCredits(credits)
      alert(locale === 'ko' ? `${credits} 크레딧이 충전되었습니다! 🎉` : locale === 'ja' ? `${credits}クレジットが追加されました！🎉` : `${credits} credits added! 🎉`)
      gtagEvent('credit_purchase_iap', { credits: String(credits), platform: productId })
    } catch (e) {
      const msg = (e as Error).message ?? ''
      if (!msg.includes('cancel') && !msg.includes('Cancel')) {
        alert(locale === 'ko' ? '결제 중 오류가 발생했습니다.' : locale === 'ja' ? '決済中にエラーが発生しました。' : 'Purchase failed. Please try again.')
      }
    } finally {
      setIapLoading(false)
    }
  }

  const SERVICE_NAMES: Record<string, string> = {
    personal_fortune: (tMenu.raw('services.personal_fortune') as { title: string }).title,
    personal_daily_fortune: (tMenu.raw('services.daily') as { title: string }).title,
    yearly: (tMenu.raw('services.yearly') as { title: string }).title,
    compatibility: (tMenu.raw('services.compatibility') as { title: string }).title,
    scenario: (tMenu.raw('services.scenario') as { title: string }).title,
    tarot_three_card: (tMenu.raw('tarot.three_card') as { title: string }).title,
    tarot_relationship: (tMenu.raw('tarot.relationship') as { title: string }).title,
    tarot_celtic_cross: (tMenu.raw('tarot.celtic_cross') as { title: string }).title,
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
    gtagEvent('begin_checkout', {
      value: amount,
      currency,
      items: [{ item_id: `credits_${creditCount}`, item_name: `${creditCount} Credits`, quantity: 1 }],
    })

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
        // 모바일 앱투앱 결제 후 복귀 URL (카카오페이 필수)
        redirectUrl: `${window.location.origin}/${locale}/buy?paymentId=${paymentId}&credits=${creditCount}`,
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

      gtagEvent('purchase', {
        transaction_id: response.paymentId,
        value: amount,
        currency,
        items: [{ item_id: `credits_${creditCount}`, item_name: `${creditCount} Credits`, quantity: 1 }],
      })

      alert(locale === 'ko' ? `${creditCount} 크레딧이 충전되었습니다! 🎉` : locale === 'ja' ? `${creditCount}クレジットが追加されました！🎉` : `${creditCount} credits added! 🎉`)
    } catch (e) {
      console.error('PortOne buy error:', e)
      alert(locale === 'ko' ? '결제 중 오류가 발생했습니다.' : locale === 'ja' ? '決済中にエラーが発生しました。' : 'Payment error occurred.')
    }
  }

  function handleGumroadBuy(creditCount: number, gumroadUrl: string) {
    const price = creditCount === 1 ? t('pack1_price') : t('pack5_price')
    gtagEvent('credit_purchase_click', { credits: String(creditCount), price })
    gtagEvent('begin_checkout', {
      value: locale === 'ja' ? PRICES_JPY[creditCount as 1 | 5] : parseFloat(price.replace(/[^0-9.]/g, '')) || 0,
      currency: locale === 'ja' ? 'JPY' : 'USD',
      items: [{ item_id: `credits_${creditCount}`, item_name: `${creditCount} Credits`, quantity: 1 }],
    })
    window.open(gumroadUrl, '_blank')
  }

  if (loading) return null

  const isPortOne = provider === 'portone'

  const L = locale === 'ko' ? 'ko' : locale === 'ja' ? 'ja' : 'en'
  const prefix = locale === 'en' ? '' : `/${locale}`
  const UI = {
    ko: { balance: '보유 크레딧', perCredit: '크레딧당', one: '1크레딧 리딩 1회', five: '1크레딧 리딩 기준 5회', best: '가장 알뜰한 구성', method: '카카오페이로 안전하게 결제되며, 결제 즉시 크레딧이 충전돼요.', methodG: '', svc: '서비스별 필요 크레딧', refund: '환불정책', terms: '이용약관', vat: '(VAT 별도)', what: '대부분의 리딩은 1크레딧이고, 신년 운세·궁합·심층 분석 타로는 2크레딧이에요.' },
    ja: { balance: '保有クレジット', perCredit: '1クレジットあたり', one: '1クレジットのリーディング1回', five: '1クレジットのリーディング5回分', best: 'いちばんお得', method: '', methodG: 'Gumroadの安全な決済ページに移動します。ログイン中のメールアドレスで決済するとクレジットが自動で反映されます。', svc: 'サービス別クレジット', refund: '返金ポリシー', terms: '利用規約', vat: '(税抜)', what: 'ほとんどのリーディングは1クレジット、年運・相性・ケルト十字は2クレジットです。' },
    en: { balance: 'Your balance', perCredit: 'per credit', one: 'One 1-credit reading', five: 'Five 1-credit readings', best: 'Best value', method: '', methodG: 'You will continue to Gumroad’s secure checkout. Pay with the same email you signed in with and credits are added automatically.', svc: 'Credits per reading', refund: 'Refund Policy', terms: 'Terms of Service', vat: '(excl. VAT)', what: 'Most readings use 1 credit. Yearly Fortune, Compatibility and Celtic Cross use 2.' },
  }[L]

  const price1 = locale === 'ko' ? '₩990' : locale === 'ja' ? '¥100' : t('pack1_price')
  const price5 = locale === 'ko' ? '₩3,900' : locale === 'ja' ? '¥400' : t('pack5_price')
  const per5 = locale === 'ko' ? '₩780' : locale === 'ja' ? '¥80' : (() => {
    const n = parseFloat(t('pack5_price').replace(/[^0-9.]/g, ''))
    return n ? `$${(n / 5).toFixed(2)}` : ''
  })()
  const methodNote = nativeApp ? '' : (isPortOne ? UI.method : UI.methodG)

  // 결제 버튼: 분기/핸들러는 기존 로직 그대로 (네이티브 IAP / 카카오페이 / Gumroad)
  function renderBuyButton(count: 1 | 5) {
    if (nativeApp) {
      return (
        <button onClick={() => handleIAPBuy(count === 1 ? 'credits_1' : 'credits_5')} disabled={iapLoading} className="ap-btn bp-cta">
          {iapLoading ? '...' : (count === 1 ? nativePrices?.credits1 ?? '$0.99' : nativePrices?.credits5 ?? '$3.99')}
        </button>
      )
    }
    if (isPortOne) {
      return (
        <>
          <button onClick={() => handlePortOneBuy(count, 'kakaopay')} className="bp-kakao">
            카카오페이
          </button>
          <p className="bp-vat">{locale === 'ko' ? '(VAT 별도)' : locale === 'ja' ? '(税抜)' : '(excl. VAT)'}</p>
        </>
      )
    }
    return (
      <>
        <button onClick={() => handleGumroadBuy(count, count === 1 ? GUMROAD_1 : GUMROAD_5)} className="ap-btn bp-cta">
          {t('cta')}
        </button>
        <p className="bp-vat">{locale === 'ja' ? '(税抜)' : '(excl. VAT)'}</p>
      </>
    )
  }

  return (
    <main className="ap-page bp">
      {/* 모바일 헤더 (PC는 SiteNav) */}
      <div className="bp-mhead ap-mobile-only">
        <span className="bp-mlogo">ASTROPILLAR</span>
        <LanguageSwitcher />
      </div>

      <div className="ap-container bp-wrap">
        <header className="bp-head">
          <div>
            <h1 className="ap-h1">{t('title')}</h1>
            <p className="ap-lead" style={{ marginTop: 8 }}>{t('subtitle')}</p>
          </div>
          <div className="bp-balance ap-glass ap-glass-gold">
            <span className="bp-balance-label">{UI.balance}</span>
            <span className="bp-balance-num"><span className="ap-gold-text">{credits ?? 0}</span><small>{tMenu('credits_label')}</small></span>
          </div>
        </header>

        <div className="bp-grid">
          <section className="bp-packs">
            <article className="bp-pack ap-glass">
              <div className="bp-pack-top">
                <div>
                  <h2 className="bp-pack-title"><span aria-hidden="true" className="bp-star">✦</span>{t('pack1_title')}</h2>
                  <p className="bp-pack-sub">{UI.one}</p>
                </div>
                <div className="bp-price">
                  <span className="bp-price-main">{price1}</span>
                  <span className="bp-price-per">{UI.perCredit} {price1}</span>
                </div>
              </div>
              <div className="bp-btn-wrap">{renderBuyButton(1)}</div>
            </article>

            <article className="bp-pack bp-pack-best ap-glass ap-glass-gold">
              <span className="bp-ribbon">{t('pack5_save')}</span>
              <div className="bp-pack-top">
                <div>
                  <p className="bp-best-label">{UI.best}</p>
                  <h2 className="bp-pack-title"><span aria-hidden="true" className="bp-star">✦✦✦</span>{t('pack5_title')}</h2>
                  <p className="bp-pack-sub">{UI.five}</p>
                </div>
                <div className="bp-price">
                  <span className="bp-price-main ap-gold-text">{price5}</span>
                  {per5 && <span className="bp-price-per">{UI.perCredit} {per5}</span>}
                </div>
              </div>
              <div className="bp-btn-wrap">{renderBuyButton(5)}</div>
            </article>

            <div className="bp-trust">
              <p className="bp-what">{UI.what}</p>
              {methodNote && <p className="bp-method">{methodNote}</p>}
              <div className="bp-trust-row">
                <span><span className="material-icons" aria-hidden="true">lock</span>{t('secure')}</span>
                <span><span className="material-icons" aria-hidden="true">hourglass_empty</span>{t('no_expiry')}</span>
              </div>
              <div className="bp-links">
                <a href={`${prefix}/refund`}>{UI.refund}</a>
                <a href={`${prefix}/terms`}>{UI.terms}</a>
              </div>
            </div>
          </section>

          <aside className="bp-services ap-glass">
            <h2 className="bp-svc-title">{UI.svc}</h2>
            <ul>
              {SERVICES.map((s, i) => (
                <li key={i}>
                  <span>{s.name}</span>
                  <span className="ap-badge">{s.cost}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      <BottomNav />

      <style>{`
        .bp-mhead { display:flex; justify-content:space-between; align-items:center; padding: 12px 16px; }
        .bp-mlogo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size:16px; letter-spacing:.2em; color: var(--gold); }
        .bp-wrap { padding-top: 16px; }
        .bp-head { display:flex; flex-direction:column; gap: 20px; margin-bottom: 28px; }
        .bp-balance { display:flex; align-items:center; justify-content:space-between; gap: 16px; padding: 16px 20px; }
        .bp-balance-label { font-size: 13px; color: var(--ink-2); }
        .bp-balance-num { display:flex; align-items:baseline; gap: 6px; font-family: var(--font-display); font-size: 34px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
        .bp-balance-num small { font-family: var(--font-body); font-size: 13px; color: var(--gold-light); font-weight: 500; }
        .bp-grid { display:grid; grid-template-columns: 1fr; gap: 20px; }
        .bp-packs { display:flex; flex-direction:column; gap: 18px; }
        .bp-pack { position:relative; padding: 22px; display:flex; flex-direction:column; gap: 18px; }
        .bp-pack-best { padding-top: 26px; background: radial-gradient(120% 120% at 100% 0%, rgba(201,168,76,.14), transparent 55%), linear-gradient(180deg, rgba(30,37,64,.7), rgba(15,19,36,.82)); box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 24px 60px -24px rgba(201,168,76,.35); }
        .bp-ribbon { position:absolute; top: -11px; right: 18px; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; color: #1a1408;
          background: linear-gradient(180deg, #e3c879, #c9a84c); box-shadow: 0 6px 18px -6px rgba(201,168,76,.6); }
        .bp-best-label { font-size: 12px; color: var(--lavender); letter-spacing: .06em; margin-bottom: 4px; }
        .bp-pack-top { display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; }
        .bp-pack-title { display:flex; align-items:center; gap: 8px; font-size: 19px; font-weight: 700; }
        .bp-star { color: var(--gold-light); font-size: 13px; letter-spacing: 2px; }
        .bp-pack-sub { margin-top: 4px; font-size: 13.5px; color: var(--ink-2); }
        .bp-price { display:flex; flex-direction:column; align-items:flex-end; gap: 2px; }
        .bp-price-main { font-family: var(--font-display); font-size: 30px; font-weight: 700; color: var(--gold-light); line-height: 1.1; font-variant-numeric: tabular-nums; }
        .bp-price-per { font-size: 12px; color: var(--ink-3); white-space: nowrap; }
        .bp-btn-wrap { display:flex; flex-direction:column; gap: 8px; }
        .bp-cta { width: 100%; }
        .bp-kakao { width:100%; min-height: 50px; display:flex; align-items:center; justify-content:center; border: none; border-radius: 999px; cursor:pointer;
          background: #FAE100; color: #3A1D1D; font: inherit; font-size: 15px; font-weight: 700; transition: transform .16s, filter .2s; }
        .bp-kakao:hover { filter: brightness(1.04); }
        .bp-kakao:active { transform: scale(.98); }
        .bp-vat { text-align:center; font-size: 12px; color: var(--ink-3); }
        .bp-trust { padding: 4px 4px 0; display:flex; flex-direction:column; gap: 12px; }
        .bp-what { font-size: 14px; line-height: 1.7; color: var(--ink-2); }
        .bp-method { font-size: 13px; line-height: 1.7; color: var(--ink-3); }
        .bp-trust-row { display:flex; flex-wrap:wrap; gap: 8px 18px; font-size: 13px; color: var(--ink-2); }
        .bp-trust-row > span { display:inline-flex; align-items:center; gap: 6px; }
        .bp-trust-row .material-icons { font-size: 16px; color: var(--success); }
        .bp-links { display:flex; gap: 16px; }
        .bp-links a { font-size: 13px; color: var(--gold-light); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(230,205,133,.35); }
        .bp-services { padding: 22px; align-self: start; }
        .bp-svc-title { font-size: 15px; font-weight: 700; margin-bottom: 10px; }
        .bp-services ul { list-style: none; }
        .bp-services li { display:flex; justify-content:space-between; align-items:center; gap: 12px; padding: 11px 0; font-size: 14px; color: var(--ink-2); }
        .bp-services li + li { border-top: 1px solid var(--line); }
        @media (min-width: 900px) {
          .bp-head { flex-direction: row; align-items: flex-end; justify-content: space-between; }
          .bp-balance { min-width: 260px; }
          .bp-grid { grid-template-columns: 1.35fr 1fr; gap: 28px; }
          .bp-packs { display:grid; grid-template-columns: 1fr 1fr; gap: 20px; align-content: start; }
          .bp-pack { justify-content: space-between; min-height: 230px; }
          .bp-trust { grid-column: span 2; }
        }
        @media (min-width: 1024px) { .bp-wrap { padding-top: 48px; } }
      `}</style>
    </main>
  )
}

export default function BuyPage() {
  return (
    <Suspense>
      <BuyContent />
    </Suspense>
  )
}
