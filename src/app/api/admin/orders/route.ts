// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Simple admin check - in production you'd want proper JWT validation
    const adminAuth = request.headers.get('admin-auth')
    if (adminAuth !== 'bookwish-admin-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get orders with basic info
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        item_count,
        shipping_address
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Transform the data to extract customer name from shipping_address
    const transformedOrders = orders?.map(order => {
      const shippingAddress = order.shipping_address as any
      const customerName = shippingAddress 
        ? `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim()
        : 'Unknown Customer'

      return {
        id: order.id,
        customer_name: customerName,
        total_amount: order.total,
        status: order.status,
        created_at: order.created_at,
        items_count: order.item_count || 0
      }
    }) || []

    return NextResponse.json({
      orders: transformedOrders,
      total: orders?.length || 0
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error },
      { status: 500 }
    )
  }
}