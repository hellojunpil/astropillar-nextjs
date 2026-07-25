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

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('Gumroad webhook error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
