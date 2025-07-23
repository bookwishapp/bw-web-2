import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId, giftCardCode } = await request.json()

    // Update order status to confirmed
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        payment_id: `gift_card_${giftCardCode}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (orderError) {
      throw new Error('Failed to confirm order')
    }

    // Deduct amount from gift card balance
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('total, gift_card_discount')
      .eq('id', orderId)
      .single()

    if (order && giftCardCode) {
      const { data: giftCard } = await supabaseAdmin
        .from('gift_cards')
        .select('current_balance')
        .eq('code', giftCardCode)
        .single()

      if (giftCard) {
        const newBalance = giftCard.current_balance - order.gift_card_discount
        const newStatus = newBalance <= 0 ? 'redeemed' : 'active'

        await supabaseAdmin
          .from('gift_cards')
          .update({
            current_balance: Math.max(0, newBalance),
            status: newStatus,
            ...(newStatus === 'redeemed' && { fully_redeemed_at: new Date().toISOString() })
          })
          .eq('code', giftCardCode)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Gift card order confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm order' },
      { status: 500 }
    )
  }
}