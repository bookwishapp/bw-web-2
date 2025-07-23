// src/app/api/admin/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Admin authentication
    const adminAuth = request.headers.get('admin-auth')
    if (adminAuth !== 'bookwish-admin-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        total,
        subtotal,
        tax,
        shipping,
        status,
        created_at,
        item_count,
        shipping_address,
        gift_message,
        recipient_email,
        is_gift,
        tracking_number,
        platform
      `)
      .eq('id', params.orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Debug: Calculate time range
    const orderTime = new Date(order.created_at)
    const timeBefore = new Date(orderTime.getTime() - 10 * 60 * 1000).toISOString()
    const timeAfter = new Date(orderTime.getTime() + 10 * 60 * 1000).toISOString()
    
    console.log('Order time:', order.created_at)
    console.log('Search range:', timeBefore, 'to', timeAfter)

    // Find associated gifts using time-based matching
    const { data: gifts, error: giftsError } = await supabaseAdmin
      .from('gifts')
      .select(`
        id,
        book_id,
        message,
        created_at,
        books (
          title,
          author,
            isbn,
          isbn13,
          cover_url,
          thumbnail_url
        )
      `)
      .gte('created_at', timeBefore)
      .lte('created_at', timeAfter)

    console.log('Found gifts:', gifts?.length || 0)
    console.log('Gifts data:', gifts)
    
    if (giftsError) {
      console.log('Gifts error:', giftsError)
    }

    let items = []
    if (gifts && gifts.length > 0) {
      items = gifts.map(gift => ({
  id: gift.id,
  book_title: gift.books?.title || 'Unknown Title',
  book_author: gift.books?.author || 'Unknown Author',
  book_isbn: gift.books?.isbn13 || gift.books?.isbn || 'No ISBN available',
  book_cover_url: gift.books?.cover_url || gift.books?.thumbnail_url,
  quantity: 1,
  price: order.subtotal || 0,
  gift_message: gift.message
}))
    } else {
      // Debug info in the placeholder
      items = [{
        id: 'missing',
        book_title: `⚠️ No gifts found in range`,
        book_author: `${timeBefore} to ${timeAfter}`,
        book_isbn: 'Check console logs',
        book_cover_url: null,
        quantity: order.item_count || 1,
        price: order.subtotal || 0,
        gift_message: 'Check server console for debug info'
      }]
    }

    const orderDetails = {
      ...order,
      items
    }

    return NextResponse.json({ order: orderDetails })
  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}