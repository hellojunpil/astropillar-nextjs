'use client'
import Link from 'next/link'
import { useLocale } from 'next-intl'

const CONTENT = {
  en: {
    title: 'Privacy Policy',
    date: 'Effective: May 7, 2026',
    operator: 'PilLAB  |  Representative: Park Junpil  |  Contact: bbiribbiri09@gmail.com',
    back: '← Back',
    terms: 'Terms of Service',
    refund: 'Refund Policy',
    sections: [
      {
        h: '1. Information We Collect',
        p: 'When you create an account and use AstroPillar, we collect the following personal information:\n• Email address\n• Birth date, birth time, and city of birth\n• Gender\n• Fortune reading history and saved person profiles',
      },
      {
        h: '2. How We Use Your Information',
        p: 'Your personal information is used solely to:\n• Provide personalized BaZi and Western astrology readings\n• Maintain your account and reading history\n• Improve the quality of our service',
      },
      {
        h: '3. Third-Party Services',
        p: 'We use the following third-party providers that may process your data:\n• Google Firebase — Authentication and cloud database\n• OpenAI — AI-powered fortune reading generation\n• Gumroad — Secure credit purchase processing\n• Vercel — Website hosting and delivery\n• Google Analytics 4 — Anonymous usage analytics',
      },
      {
        h: '4. Data Retention',
        p: 'Your personal data is retained for as long as your account remains active. Upon requesting account deletion, all personal data will be permanently removed within 30 days.',
      },
      {
        h: '5. Your Rights',
        p: 'You have the right to access, correct, or request deletion of your personal data at any time. To exercise these rights, contact us at bbiribbiri09@gmail.com.',
      },
      {
        h: '6. Cookies',
        p: 'AstroPillar uses session cookies for authentication and Google Analytics cookies for anonymous usage tracking. You may disable cookies in your browser settings, though some features may not function properly.',
      },
      {
        h: '7. Contact',
        p: 'For any privacy-related inquiries:\nEmail: bbiribbiri09@gmail.com',
      },
    ],
  },
  ko: {
    title: '개인정보처리방침',
    date: '시행일: 2026년 5월 7일',
    operator: '필랩(PilLAB)  |  대표자: 박준필  |  문의: bbiribbiri09@gmail.com',
    back: '← 뒤로',
    terms: '이용약관',
    refund: '환불정책',
    sections: [
      {
        h: '1. 수집하는 개인정보 항목',
        p: '회원가입 및 서비스 이용 시 다음의 개인정보를 수집합니다.\n• 이메일 주소\n• 생년월일, 출생 시간, 출생 도시\n• 성별\n• 운세 리딩 기록 및 저장된 인물 정보',
      },
      {
        h: '2. 수집 및 이용 목적',
        p: '수집된 개인정보는 다음의 목적으로만 사용됩니다.\n• 사주명리 및 서양 점성술 기반 맞춤형 운세 서비스 제공\n• 계정 및 리딩 기록 유지\n• 서비스 품질 개선',
      },
      {
        h: '3. 개인정보 처리 위탁',
        p: '서비스 운영을 위해 아래의 제3자 서비스를 이용하며, 해당 업체들이 귀하의 데이터를 처리할 수 있습니다.\n• Google Firebase — 인증 및 클라우드 데이터베이스\n• OpenAI — AI 기반 운세 해석 생성\n• Gumroad — 크레딧 구매 결제 처리\n• Vercel — 웹사이트 호스팅\n• Google Analytics 4 — 익명 이용 통계 분석',
      },
      {
        h: '4. 보유 및 이용 기간',
        p: '개인정보는 계정이 활성화된 기간 동안 보유됩니다. 계정 삭제 요청 시 30일 이내에 모든 개인정보가 영구 삭제됩니다.',
      },
      {
        h: '5. 이용자의 권리',
        p: '이용자는 언제든지 본인의 개인정보에 대한 열람, 정정, 삭제를 요청할 수 있습니다. 요청은 bbiribbiri09@gmail.com으로 문의해 주세요.',
      },
      {
        h: '6. 쿠키 사용',
        p: 'AstroPillar는 로그인 유지를 위한 세션 쿠키와 익명 이용 통계 분석을 위한 Google Analytics 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 비활성화할 수 있으나, 일부 서비스 기능에 제한이 생길 수 있습니다.',
      },
      {
        h: '7. 개인정보 관련 문의',
        p: '개인정보 처리에 관한 문의:\n이메일: bbiribbiri09@gmail.com',
      },
    ],
  },
  ja: {
    title: 'プライバシーポリシー',
    date: '施行日: 2026年5月7日',
    operator: 'PilLAB  |  代表: Park Junpil  |  お問い合わせ: bbiribbiri09@gmail.com',
    back: '← 戻る',
    terms: '利用規約',
    refund: '返金ポリシー',
    sections: [
      {
        h: '1. 収集する個人情報',
        p: 'アカウント作成およびサービス利用時に、以下の個人情報を収集します。\n• メールアドレス\n• 生年月日・出生時刻・出生地\n• 性別\n• 鑑定履歴および登録人物情報',
      },
      {
        h: '2. 利用目的',
        p: '収集した個人情報は以下の目的のみに使用します。\n• 四柱推命・西洋占星術に基づくパーソナライズド鑑定の提供\n• アカウントおよび鑑定履歴の管理\n• サービス品質の改善',
      },
      {
        h: '3. 第三者への提供・委託',
        p: 'サービス運営のため、以下の第三者サービスを利用しており、データが処理される場合があります。\n• Google Firebase — 認証・クラウドデータベース\n• OpenAI — AI占い文章生成\n• Gumroad — クレジット購入決済処理\n• Vercel — ウェブサイトホスティング\n• Google Analytics 4 — 匿名利用統計分析',
      },
      {
        h: '4. 保有期間',
        p: '個人情報はアカウントが有効な期間中保持されます。アカウント削除のリクエスト後、30日以内にすべての個人情報は完全に削除されます。',
      },
      {
        h: '5. ユーザーの権利',
        p: 'ユーザーはいつでも個人情報の閲覧・訂正・削除を要求できます。ご要望はbbiribbiri09@gmail.comまでご連絡ください。',
      },
      {
        h: '6. Cookieの使用',
        p: 'AstroPillarはログイン維持のためのセッションCookieと、匿名利用分析のためのGoogle Analytics Cookieを使用しています。ブラウザ設定でCookieを無効にすることができますが、一部機能に影響が生じる場合があります。',
      },
      {
        h: '7. お問い合わせ',
        p: 'プライバシーに関するお問い合わせ:\nメール: bbiribbiri09@gmail.com',
      },
    ],
  },
}

export default function PrivacyPage() {
  const locale = useLocale()
  const c = CONTENT[locale as keyof typeof CONTENT] ?? CONTENT.en
  const prefix = locale === 'en' ? '' : `/${locale}`
  const ff = locale === 'ko' ? "'Noto Sans KR', sans-serif" : locale === 'ja' ? "'Noto Sans JP', sans-serif" : "'Noto Sans', sans-serif"

  return (
    <main style={{ fontFamily: ff, background: '#07071a', color: '#F6F6F8', minHeight: '100vh', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'rgba(10,10,26,0.97)', borderBottom: '1px solid rgba(201,168,76,.12)' }}>
        <Link href={prefix || '/'} style={{ color: 'rgba(201,168,76,.65)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>{c.back}</Link>
        <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 900, letterSpacing: '2.5px', fontFamily: "'Cormorant Garamond', serif" }}>ASTROPILLAR</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
        {/* Title block */}
        <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: '1px solid rgba(201,168,76,.12)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C', marginBottom: 10, margin: '0 0 10px' }}>{c.title}</h1>
          <p style={{ fontSize: 12, color: 'rgba(200,195,220,.45)', marginBottom: 6 }}>{c.date}</p>
          <p style={{ fontSize: 11, color: 'rgba(200,195,220,.35)', lineHeight: 1.7 }}>{c.operator}</p>
        </div>

        {/* Sections */}
        {c.sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C', marginBottom: 10, margin: '0 0 10px' }}>{s.h}</h2>
            {s.p.split('\n').map((line, j) => (
              <p key={j} style={{
                fontSize: 13, lineHeight: 1.85, color: 'rgba(200,195,220,.75)',
                margin: `0 0 ${line.startsWith('•') ? 3 : 8}px`,
                paddingLeft: line.startsWith('•') ? 14 : 0,
              }}>
                {line}
              </p>
            ))}
          </div>
        ))}

        {/* Cross-links */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(201,168,76,.1)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href={`${prefix}/terms`} style={{ fontSize: 12, color: 'rgba(201,168,76,.55)', textDecoration: 'none' }}>{c.terms}</Link>
          <Link href={`${prefix}/refund`} style={{ fontSize: 12, color: 'rgba(201,168,76,.55)', textDecoration: 'none' }}>{c.refund}</Link>
        </div>

        {/* Copyright */}
        <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(200,195,220,.2)' }}>
          {`© ${new Date().getFullYear()} PilLAB. All rights reserved.`}
        </p>
      </div>
    </main>
  )
}
