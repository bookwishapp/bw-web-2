import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    // Get the order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Update order status to confirmed
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    // If there was a gift card applied, deduct the balance
    if (order.gift_card_code && order.gift_card_discount > 0) {
      const { data: giftCard } = await supabaseAdmin
        .from('gift_cards')
        .select('current_balance')
        .eq('code', order.gift_card_code)
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
          .eq('code', order.gift_card_code)

        console.log(`Gift card ${order.gift_card_code} deducted $${order.gift_card_discount}, new balance: $${newBalance}`)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Order completion error:', error)
    return NextResponse.json(
      { error: 'Failed to complete order' },
      { status: 500 }
    )
  }
}