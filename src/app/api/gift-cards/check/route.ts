import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { isValid: false, message: 'Gift card code is required' },
        { status: 400 }
      )
    }

    // Query the gift_cards table
    const { data: giftCard, error } = await supabaseAdmin
      .from('gift_cards')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .single()

    if (error || !giftCard) {
      return NextResponse.json({
        isValid: false,
        message: 'Gift card not found or inactive'
      })
    }

    // Check if gift card has balance
    if (giftCard.current_balance <= 0) {
      return NextResponse.json({
        isValid: false,
        message: 'Gift card balance is empty'
      })
    }

    // Check if gift card is expired (if you have expiration logic)
    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json({
        isValid: false,
        message: 'Gift card has expired'
      })
    }

    return NextResponse.json({
      isValid: true,
      balance: giftCard.current_balance,
      code: giftCard.code
    })

  } catch (error) {
    console.error('Gift card check error:', error)
    return NextResponse.json(
      { isValid: false, message: 'Error checking gift card' },
      { status: 500 }
    )
  }
}