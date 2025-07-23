// src/app/api/orders/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const {
      items,
      shippingAddress,
      paymentInfo,
      giftInfo,
      total,
      subtotal,
      tax,
      shipping
    } = await request.json()

    // Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: paymentInfo.customer_id || null,
        subtotal,
        tax,
        shipping,
        total,
        status: 'confirmed',
        payment_id: paymentInfo.payment_intent_id,
        platform: 'web',
        item_count: items.length,
        shipping_address: shippingAddress,
        gift_message: giftInfo?.message || null,
        recipient_email: giftInfo?.recipientEmail || null,
        is_gift: giftInfo?.isGift || false,
        gift_card_code: giftInfo?.giftCardCode || null,
        gift_card_discount: giftInfo?.giftCardDiscount || 0
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    // Create gift records for each book (this was missing!)
    for (const item of items) {
      await supabaseAdmin
        .from('gifts')
        .insert({
          book_id: item.book.id,
          from_user_id: paymentInfo.customer_id || null,
          to_user_id: giftInfo?.recipientUserId || null,
          message: giftInfo?.message || null,
          status: 'purchased'
        })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}