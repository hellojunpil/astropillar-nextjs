'use client'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function LegalFooter({ style }: { style?: React.CSSProperties }) {
  const locale = useLocale()
  const prefix = locale === 'en' ? '' : `/${locale}`

  const labels = {
    en: {
      privacy: 'Privacy Policy', terms: 'Terms of Service', refund: 'Refund Policy',
      copy: `© ${new Date().getFullYear()} PilLAB. All rights reserved.`,
      biz: 'PilLAB | CEO: Jun-pil Park | Business Reg: 496-74-00629\n315, 5F, 61 Dongpangyo-ro, Bundang-gu, Seongnam-si, Gyeonggi-do, Korea\nTel: 010-4448-8843 | Email: bbiribbiri09@gmail.com\nService Period: Credits are applied immediately upon payment with no expiration date.',
    },
    ko: {
      privacy: '개인정보처리방침', terms: '이용약관', refund: '환불정책',
      copy: `© ${new Date().getFullYear()} 필랩(PilLAB). All rights reserved.`,
      biz: '상호: 필랩(PilLAB) | 대표자: 박준필 | 사업자등록번호: 496-74-00629\n주소: 경기도 성남시 분당구 동판교로 61, 5층 504,505호 내 315 (백현동, 자유퍼스트프라자2)\n대표전화: 010-4448-8843 | 대표이메일: bbiribbiri09@gmail.com\n서비스 제공 기간: 크레딧 — 결제 즉시 지급, 유효기간 없음 (서비스 종료 시 소멸)',
    },
    ja: {
      privacy: 'プライバシーポリシー', terms: '利用規約', refund: '返金ポリシー',
      copy: `© ${new Date().getFullYear()} PilLAB. All rights reserved.`,
      biz: 'PilLAB | 代表者: 朴俊弼 | 事業者番号: 496-74-00629\n住所: 韓国 京畿道城南市盆唐区東板橋路61, 5階504,505号内315\nTel: 010-4448-8843 | Email: bbiribbiri09@gmail.com\nサービス提供期間: クレジット — 決済完了後すぐに付与、有効期限なし',
    },
  }
  const l = labels[locale as keyof typeof labels] ?? labels.en

  const linkSt: React.CSSProperties = {
    color: 'rgba(200,195,220,.45)',
    fontSize: 11,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }
  const dotSt: React.CSSProperties = { color: 'rgba(200,195,220,.2)', fontSize: 11 }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '20px 20px 10px',
      borderTop: '1px solid rgba(201,168,76,0.08)',
      ...style,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(200,195,220,.35)', textAlign: 'center', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{l.biz}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href={`${prefix}/privacy`} style={linkSt}>{l.privacy}</Link>
        <span style={dotSt}>·</span>
        <Link href={`${prefix}/terms`} style={linkSt}>{l.terms}</Link>
        <span style={dotSt}>·</span>
        <Link href={`${prefix}/refund`} style={linkSt}>{l.refund}</Link>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(200,195,220,.25)', textAlign: 'center' }}>{l.copy}</div>
    </div>
  )
}
