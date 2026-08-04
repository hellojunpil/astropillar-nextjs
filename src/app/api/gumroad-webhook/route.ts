import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const sellerIdEnv = process.env.GUMROAD_SELLER_ID || ''

    // Verify seller
    const sellerId = body.get('seller_id')?.toString() || ''
    if (sellerId !== sellerIdEnv) {
      return NextResponse.json({ error: 'Invalid seller' }, { status: 403 })
    }

    const email = body.get('email')?.toString() || ''
    const saleId = body.get('sale_id')?.toString() || ''
    // Gumroad은 permalink(슬러그) 또는 product_permalink(전체 URL)로 옴 — 슬러그로 정규화
    const rawPermalink = body.get('permalink')?.toString()
      || body.get('product_permalink')?.toString() || ''
    const slug = rawPermalink.split('/').pop()?.toLowerCase() || ''

    if (!email || !saleId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const gumroad1 = process.env.NEXT_PUBLIC_GUMROAD_URL_1 || ''
    const gumroad5 = process.env.NEXT_PUBLIC_GUMROAD_URL_5 || ''
    const permalink1 = gumroad1.split('/').pop() || 'gveeli'
    const permalink5 = gumroad5.split('/').pop() || 'idksv'

    let permalink = ''
    if (slug === permalink1 || slug === 'gveeli') permalink = permalink1
    else if (slug === permalink5 || slug === 'idksv') permalink = permalink5

    if (!permalink) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 400 })
    }

    // FastAPI /gumroad_webhook 계약: form-encoded + seller_id + permalink (JSON 아님)
    const form = new URLSearchParams({
      seller_id: sellerIdEnv,
      email,
      sale_id: saleId,
      permalink,
    })
    const res = await fetch(`${API_BASE}/gumroad_webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('Gumroad webhook forward failed:', errText)
      return NextResponse.json({ error: 'Grant failed', detail: errText }, { status: 500 })
    }

    // Gumroad 결제는 외부 체크아웃이라 클라이언트 gtag가 못 잡음 → 서버에서 GA4 Measurement Protocol로 purchase 전송
    // GA4_API_SECRET: GA4 관리 → 데이터 스트림 → Measurement Protocol API 비밀번호에서 발급 후 Vercel env에 등록
    const ga4Id = process.env.NEXT_PUBLIC_GA4_ID || ''
    const ga4Secret = process.env.GA4_API_SECRET || ''
    if (ga4Id && ga4Secret) {
      const cents = Number(body.get('price')?.toString() || '')
      const currency = (body.get('currency')?.toString() || 'usd').toUpperCase()
      const credits = permalink === permalink5 ? 5 : 1
      try {
        await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${ga4Id}&api_secret=${ga4Secret}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: `gumroad.${saleId}`,
            events: [{
              name: 'purchase',
              params: {
                transaction_id: saleId,
                // Gumroad price는 센트 단위 (JPY 등 무소수점 통화는 그대로)
                ...(Number.isFinite(cents) && cents > 0
                  ? { value: currency === 'JPY' ? cents : cents / 100 }
                  : {}),
                currency,
                items: [{ item_id: `credits_${credits}`, item_name: `${credits} Credits`, quantity: 1 }],
              },
            }],
          }),
        })
      } catch (mpError) {
        console.error('GA4 MP purchase failed:', mpError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('Gumroad webhook error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
