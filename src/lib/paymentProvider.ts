// 접속 국가에 따른 결제 서비스 결정
// 포트원 가입 완료 후 portone 분기 구현 예정

export type PaymentProvider = 'gumroad' | 'portone'

// 포트원 대상 국가
const PORTONE_COUNTRIES = new Set(['KR', 'JP', 'PH', 'MY', 'SG', 'ID', 'TH', 'VN'])

export function getPaymentProvider(country: string | null): PaymentProvider {
  if (!country) return 'gumroad'
  if (PORTONE_COUNTRIES.has(country)) return 'portone'
  return 'gumroad'
}

// 로케일 → 결제 서비스 (클라이언트 사이드 fallback)
export function getPaymentProviderByLocale(locale: string): PaymentProvider {
  if (locale === 'ko' || locale === 'ja') return 'portone'
  return 'gumroad'
}
