import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const getNativePlatform = () => Capacitor.getPlatform() as 'ios' | 'android' | 'web'

// App Store Connect + Google Play Console에 등록된 Product ID와 반드시 일치해야 함
export const IAP_PRODUCT_IDS = {
  credits_1: 'credits_1',
  credits_5: 'credits_5',
} as const

const RC_APPLE_KEY = process.env.NEXT_PUBLIC_REVENUECAT_APPLE_KEY || ''
const RC_GOOGLE_KEY = process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY || ''

let rcReady = false

export async function initRevenueCat(userId: string): Promise<void> {
  if (!isNative() || rcReady) return
  const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor')
  const apiKey = getNativePlatform() === 'ios' ? RC_APPLE_KEY : RC_GOOGLE_KEY
  await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR })
  await Purchases.configure({ apiKey, appUserID: userId })
  rcReady = true
}

export async function getIAPPrices(): Promise<{ credits1: string; credits5: string }> {
  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  const { offerings } = await Purchases.getOfferings()
  const pkgs = offerings.current?.availablePackages ?? []
  const p1 = pkgs.find(p => p.product.identifier === IAP_PRODUCT_IDS.credits_1)
  const p5 = pkgs.find(p => p.product.identifier === IAP_PRODUCT_IDS.credits_5)
  return {
    credits1: p1?.product.priceString ?? '$0.99',
    credits5: p5?.product.priceString ?? '$3.99',
  }
}

export async function buyCreditsIAP(productId: 'credits_1' | 'credits_5', email: string): Promise<number> {
  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  const credits = productId === 'credits_1' ? 1 : 5

  const { offerings } = await Purchases.getOfferings()
  const pkg = offerings.current?.availablePackages.find(
    p => p.product.identifier === productId
  )
  if (!pkg) throw new Error('Product not available')

  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })

  // 마지막 트랜잭션 ID로 중복 결제 방지
  const txs = customerInfo.nonSubscriptionTransactions ?? []
  const tx = txs[txs.length - 1]
  const txId = tx?.transactionIdentifier ?? `fallback_${Date.now()}`

  const res = await fetch('/api/iap-grant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, credits, transactionId: txId, platform: getNativePlatform() }),
  })

  const data = await res.json()
  if (!data.ok) throw new Error(data.error ?? 'Credit grant failed')
  return credits
}
