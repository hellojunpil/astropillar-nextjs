'use client'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function LegalFooter({ style }: { style?: React.CSSProperties }) {
  const locale = useLocale()
  const prefix = locale === 'en' ? '' : `/${locale}`

  const labels = {
    en: { privacy: 'Privacy Policy', terms: 'Terms of Service', refund: 'Refund Policy', copy: `© ${new Date().getFullYear()} PilLAB. All rights reserved.` },
    ko: { privacy: '개인정보처리방침', terms: '이용약관', refund: '환불정책', copy: `© ${new Date().getFullYear()} 필랩(PilLAB). All rights reserved.` },
    ja: { privacy: 'プライバシーポリシー', terms: '利用規約', refund: '返金ポリシー', copy: `© ${new Date().getFullYear()} PilLAB. All rights reserved.` },
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
      ...style,
    }}>
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
