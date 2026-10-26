'use client'
import Link from 'next/link'
import { useLocale } from 'next-intl'

const CONTENT = {
  en: {
    title: 'Refund Policy',
    date: 'Effective: May 7, 2026',
    operator: 'PilLAB  |  Representative: Park Junpil  |  Contact: bbiribbiri09@gmail.com',
    back: '← Back',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    sections: [
      {
        h: '1. Unused Credits',
        p: 'If you have purchased credits and have not used them, you may request a full refund within 14 days of the purchase date. To be eligible, your credits must remain unused at the time of the request.',
      },
      {
        h: '2. Used Credits',
        p: 'Credits that have been used to unlock fortune readings are non-refundable. Each credit is consumed when a reading is successfully generated.',
      },
      {
        h: '3. Partial Refunds',
        p: 'If you have used some but not all of your purchased credits, you may request a partial refund for the unused credits only, provided the request is made within 14 days of the purchase date.',
      },
      {
        h: '4. How to Request a Refund',
        p: 'To request a refund, please email bbiribbiri09@gmail.com with the following information:\n• Your registered email address\n• Purchase date\n• Number of unused credits\n• Gumroad order receipt or confirmation number',
      },
      {
        h: '5. Processing Time',
        p: 'Approved refunds will be processed within 5–7 business days. The refund will be returned to the original payment method used at the time of purchase.',
      },
      {
        h: '6. Payment Platform',
        p: 'All credit purchases are processed through Gumroad. Gumroad\'s own refund terms may also apply. For purchase-related issues, you may also contact Gumroad support directly.',
      },
      {
        h: '7. Contact',
        p: 'For refund inquiries:\nEmail: bbiribbiri09@gmail.com',
      },
    ],
  },
  ko: {
    title: '환불정책',
    date: '시행일: 2026년 5월 7일',
    operator: '필랩(PilLAB)  |  대표자: 박준필  |  문의: bbiribbiri09@gmail.com',
    back: '← 뒤로',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    sections: [
      {
        h: '1. 미사용 크레딧 환불',
        p: '구매한 크레딧을 사용하지 않은 경우, 구매일로부터 14일 이내에 전액 환불을 요청할 수 있습니다. 환불 요청 시점에 해당 크레딧이 미사용 상태여야 합니다.',
      },
      {
        h: '2. 사용된 크레딧',
        p: '운세 리딩에 사용된 크레딧은 환불되지 않습니다. 리딩이 성공적으로 생성되면 해당 크레딧이 소모된 것으로 처리됩니다.',
      },
      {
        h: '3. 부분 환불',
        p: '구매한 크레딧 중 일부만 사용한 경우, 구매일로부터 14일 이내에 미사용 크레딧에 한해 부분 환불을 요청할 수 있습니다.',
      },
      {
        h: '4. 환불 신청 방법',
        p: '환불을 요청하시려면 아래 정보를 포함하여 bbiribbiri09@gmail.com으로 이메일을 보내주세요.\n• 가입 이메일 주소\n• 구매 날짜\n• 미사용 크레딧 수\n• Gumroad 주문 영수증 또는 확인 번호',
      },
      {
        h: '5. 처리 기간',
        p: '승인된 환불은 영업일 기준 5~7일 이내에 처리됩니다. 환불금은 구매 시 사용한 결제 수단으로 반환됩니다.',
      },
      {
        h: '6. 결제 플랫폼',
        p: '모든 크레딧 구매는 Gumroad를 통해 처리됩니다. Gumroad 자체 환불 정책도 적용될 수 있습니다. 결제 관련 문제는 Gumroad 고객센터에 직접 문의하실 수도 있습니다.',
      },
      {
        h: '7. 환불 문의',
        p: '환불 관련 문의:\n이메일: bbiribbiri09@gmail.com',
      },
    ],
  },
  ja: {
    title: '返金ポリシー',
    date: '施行日: 2026年5月7日',
    operator: 'PilLAB  |  代表: Park Junpil  |  お問い合わせ: bbiribbiri09@gmail.com',
    back: '← 戻る',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    sections: [
      {
        h: '1. 未使用クレジットの返金',
        p: '購入したクレジットを使用していない場合、購入日から14日以内に全額返金を申請することができます。申請時点でそのクレジットが未使用である必要があります。',
      },
      {
        h: '2. 使用済みクレジット',
        p: '占い鑑定に使用されたクレジットは返金されません。鑑定が正常に生成された時点でクレジットが消費されたものとみなします。',
      },
      {
        h: '3. 一部返金',
        p: '購入したクレジットの一部のみ使用した場合、購入日から14日以内であれば未使用分のみ部分返金を申請することができます。',
      },
      {
        h: '4. 返金の申請方法',
        p: '返金をご希望の場合は、以下の情報を記載してbbiribbiri09@gmail.comまでメールをお送りください。\n• ご登録のメールアドレス\n• 購入日\n• 未使用クレジット数\n• Gumroadの注文領収書または確認番号',
      },
      {
        h: '5. 処理期間',
        p: '承認された返金は営業日5〜7日以内に処理されます。返金は購入時に使用したお支払い方法に返還されます。',
      },
      {
        h: '6. 決済プラットフォーム',
        p: 'すべてのクレジット購入はGumroadを通じて処理されます。Gumroad独自の返金規定も適用される場合があります。購入に関する問題は、Gumroadサポートに直接お問い合わせいただくこともできます。',
      },
      {
        h: '7. お問い合わせ',
        p: '返金に関するお問い合わせ:\nメール: bbiribbiri09@gmail.com',
      },
    ],
  },
}

export default function RefundPage() {
  const locale = useLocale()
  const c = CONTENT[locale as keyof typeof CONTENT] ?? CONTENT.en
  const prefix = locale === 'en' ? '' : `/${locale}`
  const ff = locale === 'ko' ? "'Noto Sans KR', sans-serif" : locale === 'ja' ? "'Noto Sans JP', sans-serif" : "'Noto Sans', sans-serif"

  return (
    <main style={{ fontFamily: ff, background: '#07071a', color: '#F6F6F8', minHeight: '100vh', paddingBottom: 48 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'rgba(10,10,26,0.97)', borderBottom: '1px solid rgba(201,168,76,.12)' }}>
        <Link href={prefix || '/'} style={{ color: 'rgba(201,168,76,.65)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>{c.back}</Link>
        <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 900, letterSpacing: '2.5px', fontFamily: "'Cormorant Garamond', serif" }}>ASTROPILLAR</span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: '1px solid rgba(201,168,76,.12)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>{c.title}</h1>
          <p style={{ fontSize: 12, color: 'rgba(200,195,220,.45)', marginBottom: 6 }}>{c.date}</p>
          <p style={{ fontSize: 11, color: 'rgba(200,195,220,.35)', lineHeight: 1.7 }}>{c.operator}</p>
        </div>

        {c.sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>{s.h}</h2>
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

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(201,168,76,.1)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href={`${prefix}/privacy`} style={{ fontSize: 12, color: 'rgba(201,168,76,.55)', textDecoration: 'none' }}>{c.privacy}</Link>
          <Link href={`${prefix}/terms`} style={{ fontSize: 12, color: 'rgba(201,168,76,.55)', textDecoration: 'none' }}>{c.terms}</Link>
        </div>

        <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(200,195,220,.2)' }}>
          {`© ${new Date().getFullYear()} PilLAB. All rights reserved.`}
        </p>
      </div>
    </main>
  )
}
