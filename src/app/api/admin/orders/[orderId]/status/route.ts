// src/app/api/admin/orders/[orderId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Admin authentication
    const adminAuth = request.headers.get('admin-auth')
    if (adminAuth !== 'bookwish-admin-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, tracking_number } = await request.json()

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Add tracking number if provided
    if (tracking_number) {
      updateData.tracking_number = tracking_number
    }

    // Set timestamps based on status
    switch (status) {
      case 'ordered':
        updateData.ordered_at = new Date().toISOString()
        break
      case 'shipped':
        updateData.shipped_at = new Date().toISOString()
        break
      case 'delivered':
        updateData.delivered_at = new Date().toISOString()
        break
    }

    // Update the order
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', params.orderId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      order: data 
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}