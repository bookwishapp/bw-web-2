'use client'

import { Suspense } from 'react'

export default function OrderSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  )
}

function OrderSuccessContent() {
  const searchParams = useSearchParams() // Your existing code here
  const orderId = searchParams.get('order')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600">
            Your gift order has been successfully placed.
          </p>
        </div>

        {orderId && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Order Number</p>
            <p className="font-mono text-sm font-medium">
              {orderId.slice(-8).toUpperCase()}
            </p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <GiftIcon className="h-5 w-5 mr-2" />
            Gift will be shipped to the recipient
          </div>
          <div className="text-sm text-gray-600">
            You'll receive email confirmation shortly
          </div>
        </div>

        <div className="space-y-3">
          <Link 
            href="/"
            className="block w-full btn-primary py-3 text-center"
          >
            Find Another Wishlist
          </Link>
          
          <p className="text-xs text-gray-500">
            Questions? Contact support at support@bookwish.io
          </p>
        </div>
      </div>
    </div>
  )
}