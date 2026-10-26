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
      biz: 'PilLAB | CEO: Jun-pil Park | Business Reg: 496-74-00629\n315, 5F, 61 Dongpangyo-ro, Bundang-gu, Seongnam-si, Gyeonggi-do, Korea\nTel: 010-4448-8843 | Email: bbiribbiri09@gmail.com\nService Period: Credits are applied immediately upon payment and are valid for 1 year from the date of purchase.',
    },
    ko: {
      privacy: '개인정보처리방침', terms: '이용약관', refund: '환불정책',
      copy: `© ${new Date().getFullYear()} 필랩(PilLAB). All rights reserved.`,
      biz: '상호: 필랩(PilLAB) | 대표자: 박준필 | 사업자등록번호: 496-74-00629\n주소: 경기도 성남시 분당구 동판교로 61, 5층 504,505호 내 315 (백현동, 자유퍼스트프라자2)\n대표전화: 010-4448-8843 | 대표이메일: bbiribbiri09@gmail.com\n서비스 제공 기간: 크레딧 — 결제 즉시 지급, 구매일로부터 1년 이내 사용 가능 (미사용 시 소멸)',
    },
    ja: {
      privacy: 'プライバシーポリシー', terms: '利用規約', refund: '返金ポリシー',
      copy: `© ${new Date().getFullYear()} PilLAB. All rights reserved.`,
      biz: 'PilLAB | 代表者: 朴俊弼 | 事業者番号: 496-74-00629\n住所: 韓国 京畿道城南市盆唐区東板橋路61, 5階504,505号内315\nTel: 010-4448-8843 | Email: bbiribbiri09@gmail.com\nサービス提供期間: クレジット — 決済完了後すぐに付与、購入日より1年間有効',
    },
  }
  const l = labels[locale as keyof typeof labels] ?? labels.en

  return (
    <footer className="ap-footer" style={style}>
      <div className="ap-footer-inner">
        <div className="ap-footer-brand">
          <span className="ap-footer-logo">ASTROPILLAR</span>
          <nav className="ap-footer-links" aria-label="Legal">
            <Link href={`${prefix}/privacy`}>{l.privacy}</Link>
            <Link href={`${prefix}/terms`}>{l.terms}</Link>
            <Link href={`${prefix}/refund`}>{l.refund}</Link>
          </nav>
        </div>
        <p className="ap-footer-biz">{l.biz}</p>
        <p className="ap-footer-copy">{l.copy}</p>
      </div>
      <style>{`
        .ap-footer { position: relative; z-index: 1; margin-top: 48px; padding: 28px 20px 16px; border-top: 1px solid var(--line); }
        .ap-footer::before { content:""; position:absolute; top:-1px; left:20%; right:20%; height:1px;
          background: linear-gradient(90deg, transparent, var(--gold-line), transparent); }
        .ap-footer-inner { max-width: 1200px; margin: 0 auto; display:flex; flex-direction:column; align-items:center; gap: 12px; text-align:center; }
        .ap-footer-brand { display:flex; flex-direction:column; align-items:center; gap: 10px; }
        .ap-footer-logo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size:14px; letter-spacing:.24em; color: rgba(201,168,76,.7); }
        .ap-footer-links { display:flex; flex-wrap:wrap; justify-content:center; gap: 4px 18px; }
        .ap-footer-links a { font-size: 12.5px; color: var(--ink-2); text-decoration:none; white-space:nowrap; min-height: 28px; display:inline-flex; align-items:center; }
        .ap-footer-links a:hover { color: var(--gold-light); }
        .ap-footer-biz { font-size: 11.5px; line-height: 1.75; color: var(--ink-3); white-space: pre-wrap; max-width: 760px; }
        .ap-footer-copy { font-size: 11px; color: rgba(138,143,163,.7); }
        @media (min-width: 1024px) {
          .ap-footer { padding: 36px 40px 24px; }
          .ap-footer-inner { align-items: stretch; text-align:left; }
          .ap-footer-brand { flex-direction: row; justify-content: space-between; }
        }
      `}</style>
    </footer>
  )
}
