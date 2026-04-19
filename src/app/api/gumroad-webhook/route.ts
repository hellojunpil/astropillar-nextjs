import { NextRequest, NextResponse } from 'next/server'
import { apiPost } from '@/lib/api'

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
    const productId = body.get('product_permalink')?.toString() || ''
    const saleId = body.get('sale_id')?.toString() || ''

    if (!email || !saleId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Determine credit amount by product
    const gumroad1 = process.env.NEXT_PUBLIC_GUMROAD_URL_1 || ''
    const gumroad5 = process.env.NEXT_PUBLIC_GUMROAD_URL_5 || ''
    const permalink1 = gumroad1.split('/').pop() || ''
    const permalink5 = gumroad5.split('/').pop() || ''

    let amount = 0
    if (productId === permalink1 || productId === 'gveeli') amount = 1
    else if (productId === permalink5 || productId === 'idksv') amount = 5

    if (amount === 0) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 400 })
    }

    // Forward to FastAPI
    await apiPost('/gumroad_webhook', {
      email,
      sale_id: saleId,
      product_permalink: productId,
      amount,
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('Gumroad webhook error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
