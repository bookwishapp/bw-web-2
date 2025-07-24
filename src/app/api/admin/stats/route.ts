// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    // Simple admin check
    const adminAuth = request.headers.get('admin-auth')
    if (adminAuth !== 'bookwish-admin-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total orders
    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Get total revenue
    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('status', 'confirmed')

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total, 0) || 0

    // Get pending orders
    const { count: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get confirmed orders
    const { count: completedOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    // Get gift cards issued
    const { count: giftCardsIssued } = await supabaseAdmin
      .from('gift_cards')
      .select('*', { count: 'exact', head: true })

    // Get gift cards redeemed
    const { count: giftCardsRedeemed } = await supabaseAdmin
      .from('gift_cards')
      .select('*', { count: 'exact', head: true })
      .gt('used_count', 0)

    const stats = {
      totalOrders: totalOrders || 0,
      totalRevenue: totalRevenue,
      pendingOrders: pendingOrders || 0,
      completedOrders: completedOrders || 0,
      giftCardsIssued: giftCardsIssued || 0,
      giftCardsRedeemed: giftCardsRedeemed || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}