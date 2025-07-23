// src/app/admin/orders/[orderId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CheckIcon,
  TruckIcon,
  EnvelopeIcon,
  MapPinIcon,
  GiftIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'

interface OrderDetails {
  id: string
  total: number
  status: string
  created_at: string
  item_count: number
  shipping_address: any
  gift_message: string
  recipient_email: string
  is_gift: boolean
  items: OrderItem[]
}

interface OrderItem {
  id: string
  book_title: string
  book_author: string
  book_isbn: string
  book_cover_url: string
  quantity: number
  price: number
  gift_message: string
}

interface Props {
  params: { orderId: string }
}

export default function OrderDetailsPage({ params }: Props) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchOrderDetails()
  }, [params.orderId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.orderId}`, {
        headers: {
          'admin-auth': 'bookwish-admin-2025'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
        setTrackingNumber(data.order.tracking_number || '')
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/admin/orders/${params.orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'admin-auth': 'bookwish-admin-2025'
        },
        body: JSON.stringify({ 
          status: newStatus,
          tracking_number: trackingNumber 
        })
      })

      if (response.ok) {
        await fetchOrderDetails() // Refresh the order data
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'ordered':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
        <Link href="/admin/orders" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  const shippingAddress = order.shipping_address
  const customerName = shippingAddress 
    ? `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim()
    : 'Unknown Customer'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/orders"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Orders
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-gray-600">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Items Ordered ({order.item_count})
            </h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-16 h-20 bg-gray-100 rounded flex-shrink-0">
                    {item.book_cover_url ? (
                      <img
                        src={item.book_cover_url}
                        alt={item.book_title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpenIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.book_title}</h3>
                    <p className="text-gray-600">by {item.book_author}</p>
                    {item.book_isbn && (
                      <p className="text-sm text-gray-500">ISBN: {item.book_isbn}</p>
                    )}
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.price)}</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500">Loading items...</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Shipping Address
            </h2>
            <div className="text-gray-700">
              <p className="font-semibold">{customerName}</p>
              {shippingAddress?.company && (
                <p>{shippingAddress.company}</p>
              )}
              <p>{shippingAddress?.addressLine1}</p>
              {shippingAddress?.addressLine2 && (
                <p>{shippingAddress.addressLine2}</p>
              )}
              <p>
                {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.zipCode}
              </p>
              <p>{shippingAddress?.country}</p>
              {shippingAddress?.phone && (
                <p className="mt-2">Phone: {shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Customer Notes
            </h2>
            <div className="space-y-3">
              {order.gift_message && (
                <div>
                  <h3 className="font-medium text-gray-700">Gift Message:</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-700 italic">"{order.gift_message}"</p>
                  </div>
                </div>
              )}
              
              {order.items?.[0]?.gift_message && (
                <div>
                  <h3 className="font-medium text-gray-700">Special Instructions:</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-700">{order.items[0].gift_message}</p>
                  </div>
                </div>
              )}
              
              {!order.gift_message && !order.items?.[0]?.gift_message && (
                <p className="text-gray-500 italic">No customer notes for this order</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Order Status Workflow */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
            
            <div className="space-y-4">
              {/* Status progression */}
              <div className="space-y-3">
                <div className={`flex items-center ${order.status === 'confirmed' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <CheckIcon className="h-5 w-5 mr-3" />
                  <span>Order Confirmed</span>
                </div>
                <div className={`flex items-center ${order.status === 'ordered' ? 'text-yellow-600' : order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckIcon className="h-5 w-5 mr-3" />
                  <span>Ordered from Ingram</span>
                </div>
                <div className={`flex items-center ${order.status === 'shipped' ? 'text-green-600' : order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                  <TruckIcon className="h-5 w-5 mr-3" />
                  <span>Shipped</span>
                </div>
                <div className={`flex items-center ${order.status === 'delivered' ? 'text-purple-600' : 'text-gray-400'}`}>
                  <CheckIcon className="h-5 w-5 mr-3" />
                  <span>Delivered</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t space-y-3">
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus('ordered')}
                    disabled={isUpdatingStatus}
                    className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Mark as Ordered from Ingram
                  </button>
                )}

                {order.status === 'ordered' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => updateOrderStatus('shipped')}
                      disabled={isUpdatingStatus || !trackingNumber.trim()}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark as Shipped
                    </button>
                  </div>
                )}

                {order.status === 'shipped' && (
                  <button
                    onClick={() => updateOrderStatus('delivered')}
                    disabled={isUpdatingStatus}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>

              {/* Tracking Number Display */}
              {trackingNumber && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">Tracking Number</h3>
                  <p className="text-gray-700 font-mono text-sm bg-gray-50 p-2 rounded">
                    {trackingNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Communication */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Customer Communication
            </h2>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Send Status Update
              </button>
              <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                Send Custom Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}