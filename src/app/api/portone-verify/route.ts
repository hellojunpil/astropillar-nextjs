import { NextRequest, NextResponse } from 'next/server'

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || ''
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

// 크레딧 패키지 — 테스트는 소액, 실서비스 전환 시 실제 가격으로 교체
const CREDIT_PACKAGES: Record<string, { credits: number; amountKRW: number; amountJPY: number }> = {
  '1': { credits: 1, amountKRW: 100, amountJPY: 100 },   // 테스트용 소액
  '5': { credits: 5, amountKRW: 500, amountJPY: 500 },   // 테스트용 소액
}

export async function POST(req: NextRequest) {
  try {
    const { paymentId, credits, email, locale } = await req.json()

    if (!paymentId || !credits || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const pkg = CREDIT_PACKAGES[String(credits)]
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid credits package' }, { status: 400 })
    }

    // PortOne API로 결제 내역 조회 및 검증
    const verifyRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: {
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
      },
    })

    if (!verifyRes.ok) {
      const errText = await verifyRes.text()
      console.error('PortOne verify failed:', errText)
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    const payment = await verifyRes.json()

    if (payment.status !== 'PAID') {
      return NextResponse.json({ error: `Payment not completed: ${payment.status}` }, { status: 400 })
    }

    // 금액 검증
    const expectedAmount = locale === 'ja' ? pkg.amountJPY : pkg.amountKRW
    const expectedCurrency = locale === 'ja' ? 'JPY' : 'KRW'

    if (
      payment.amount?.total !== expectedAmount ||
      payment.currency !== expectedCurrency
    ) {
      console.error('Amount mismatch', { got: payment.amount?.total, expected: expectedAmount, currency: payment.currency })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // FastAPI 백엔드로 크레딧 지급 (gumroad webhook과 동일한 엔드포인트 재활용)
    const webhookRes = await fetch(`${API_BASE}/gumroad_webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        sale_id: `portone_${paymentId}`,  // portone_ prefix로 중복 방지
        product_permalink: credits === 1 ? 'gveeli' : 'idksv',
        amount: pkg.credits,
      }),
    })

    if (!webhookRes.ok) {
      const errText = await webhookRes.text()
      console.error('Credit grant failed:', errText)
      return NextResponse.json({ error: 'Credit grant failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, credits: pkg.credits })
  } catch (e) {
    console.error('portone-verify error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
