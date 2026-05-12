import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''
const GUMROAD_SELLER_ID = process.env.GUMROAD_SELLER_ID || ''

export async function POST(req: NextRequest) {
  try {
    const { email, credits, transactionId, platform } = await req.json()

    if (!email || !credits || !transactionId) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }

    // iap_ios_<txId> 또는 iap_android_<txId> prefix로 Gumroad/PortOne 결제와 구별 및 중복 방지
    const saleId = `iap_${platform}_${transactionId}`
    const permalink = Number(credits) === 1 ? 'gveeli' : 'idksv'

    const res = await fetch(`${API_BASE}/gumroad_webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        sale_id: saleId,
        product_permalink: permalink,
        amount: Number(credits),
        seller_id: GUMROAD_SELLER_ID,
      }),
    })

    if (!res.ok) {
      console.error('IAP credit grant failed:', await res.text())
      return NextResponse.json({ ok: false, error: 'Credit grant failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, credits: Number(credits) })
  } catch (e) {
    console.error('iap-grant error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
