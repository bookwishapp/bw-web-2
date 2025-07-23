// src/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Check admin authentication
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get order statistics
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, created_at, customer_name, item_count')
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0
    const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'confirmed').length || 0
    const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0
    const recentOrders = orders?.slice(0, 10) || []

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      recentOrders
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}