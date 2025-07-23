'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Image from 'next/image'
import { 
  ShoppingCartIcon,
  TrashIcon,
  GiftIcon,
  CreditCardIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartData {
  items: Array<{
    book: {
      id: string
      title: string
      author: string
      cover_url?: string
      list_price?: number
    }
    quantity: number
    isGift: boolean
  }>
  recipient: {
    name: string
    username: string
    shareCode: string
  }
}

export default function CheckoutPage() {
  const [cartData, setCartData] = useState<CartData | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('bookwish_cart')
    if (stored) {
      setCartData(JSON.parse(stored))
    } else {
      router.push('/')
    }
  }, [router])

  if (!cartData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm cartData={cartData} />
    </Elements>
  )
}

function CheckoutForm({ cartData }: { cartData: CartData }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  })
  
  const [giftMessage, setGiftMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Gift card functionality
  const [giftCardCode, setGiftCardCode] = useState('')
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null)
  const [isCheckingGiftCard, setIsCheckingGiftCard] = useState(false)
  const [appliedGiftCard, setAppliedGiftCard] = useState<{code: string, amount: number} | null>(null)

  const subtotal = cartData.items.reduce((sum, item) => {
    return sum + (item.book.list_price || 0) * item.quantity
  }, 0)

  const shipping = subtotal > 35 ? 0 : 5.99
  const tax = subtotal * 0.095
  const giftCardDiscount = appliedGiftCard ? Math.min(appliedGiftCard.amount, subtotal + shipping + tax) : 0
  const total = Math.max(0, subtotal + shipping + tax - giftCardDiscount)

  // Check gift card balance
  const checkGiftCard = async () => {
    if (!giftCardCode.trim()) {
      toast.error('Please enter a gift card code')
      return
    }

    setIsCheckingGiftCard(true)
    
    try {
      const response = await fetch('/api/gift-cards/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: giftCardCode.trim().toUpperCase() })
      })

      const data = await response.json()

      if (response.ok && data.isValid) {
        setGiftCardBalance(data.balance)
        toast.success(`Gift card found! Balance: $${data.balance.toFixed(2)}`)
      } else {
        toast.error(data.message || 'Invalid gift card code')
        setGiftCardBalance(null)
      }
    } catch (error) {
      toast.error('Error checking gift card')
      setGiftCardBalance(null)
    } finally {
      setIsCheckingGiftCard(false)
    }
  }

  // Apply gift card
  const applyGiftCard = () => {
    if (giftCardBalance === null) {
      toast.error('Please check the gift card first')
      return
    }

    setAppliedGiftCard({
      code: giftCardCode.trim().toUpperCase(),
      amount: giftCardBalance
    })
    toast.success('Gift card applied!')
  }

  // Remove gift card
  const removeGiftCard = () => {
    setAppliedGiftCard(null)
    setGiftCardCode('')
    setGiftCardBalance(null)
    toast.success('Gift card removed')
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe not loaded')
      return
    }

    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName) {
      toast.error('Please fill in all required fields')
      return
    }

    if (total > 0) {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        toast.error('Card information required')
        return
      }
    }

    setIsProcessing(true)

    try {
      // Create order with gift card information
      const orderData = {
        items: cartData.items,
        customer: customerInfo,
        recipient: cartData.recipient,
        giftMessage,
        subtotal,
        tax,
        shipping,
        total: subtotal + shipping + tax, // Original total before gift card
        finalTotal: total, // Amount after gift card discount
        appliedGiftCard: appliedGiftCard || null
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const { clientSecret, orderId } = await response.json()

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      // If total is $0 due to gift card covering everything
      if (total === 0) {
        // Complete the order without payment
        const confirmResponse = await fetch('/api/orders/confirm-gift-card-only', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, giftCardCode: appliedGiftCard?.code })
        })

        if (confirmResponse.ok) {
          sessionStorage.removeItem('bookwish_cart')
          router.push(`/order-success?order=${orderId}`)
          return
        } else {
          throw new Error('Failed to process gift card payment')
        }
      }

      // Process Stripe payment for remaining amount
      const cardElement = elements.getElement(CardElement)!
      
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.zipCode,
              country: customerInfo.country,
            }
          }
        }
      })

if (error) {
  throw new Error(error.message)
}

// Complete the order (handle gift card deduction)
await fetch('/api/orders/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId })
})

// Success!
sessionStorage.removeItem('bookwish_cart')
router.push(`/order-success?order=${orderId}`)
    } catch (error: any) {
      toast.error(error.message || 'Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <GiftIcon className="h-8 w-8 text-brand-blue mr-2" />
              <h1 className="text-2xl font-bold text-brand-blue">BookWish</h1>
            </div>
            <button 
              onClick={() => router.back()}
              className="text-text-secondary hover:text-brand-blue"
            >
              ← Back to Wishlist
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <ShoppingCartIcon className="h-6 w-6 mr-2" />
                Order Summary
              </h2>

              {/* Books */}
              <div className="space-y-4 mb-6">
                {cartData.items.map((item) => (
                  <div key={item.book.id} className="flex items-center space-x-4">
                    <div className="w-16 h-24 bg-gray-100 rounded flex-shrink-0">
                      {item.book.cover_url ? (
                        <Image
                          src={item.book.cover_url}
                          alt={item.book.title}
                          width={64}
                          height={96}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <GiftIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.book.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        by {item.book.author}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        ${(item.book.list_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cartData.items.length} books)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                
                {appliedGiftCard && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Gift Card ({appliedGiftCard.code})</span>
                    <span>-${giftCardDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                {total === 0 && (
                  <p className="text-sm text-green-600 text-center">
                    🎉 Fully covered by gift card!
                  </p>
                )}
              </div>

              {/* Gift Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                  <GiftIcon className="h-5 w-5 mr-2" />
                  Gift for {cartData.recipient.name}
                </h3>
                <p className="text-sm text-blue-700">
                  These books will be shipped as a gift. We'll include a note
                  that they're from you!
                </p>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <CreditCardIcon className="h-6 w-6 mr-2" />
                Checkout
              </h2>

              <form className="space-y-6" onSubmit={handleCheckout}>
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Your Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name *"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Last Name *"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent mt-4"
                    required
                  />
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <TruckIcon className="h-5 w-5 mr-2" />
                    Shipping Address
                  </h3>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Street Address *"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      required
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="City *"
                        value={customerInfo.city}
                        onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State *"
                        value={customerInfo.state}
                        onChange={(e) => setCustomerInfo({...customerInfo, state: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        required
                      />
                      <input
                        type="text"
                        placeholder="ZIP Code *"
                        value={customerInfo.zipCode}
                        onChange={(e) => setCustomerInfo({...customerInfo, zipCode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Gift Card Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Gift Card (Optional)</h3>
                  
                  {!appliedGiftCard ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter gift card code"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={checkGiftCard}
                          disabled={isCheckingGiftCard || !giftCardCode.trim()}
                          className="btn-secondary disabled:opacity-50"
                        >
                          {isCheckingGiftCard ? 'Checking...' : 'Check'}
                        </button>
                      </div>
                      
                      {giftCardBalance !== null && (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <span className="text-sm text-green-700">
                            Balance: ${giftCardBalance.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={applyGiftCard}
                            className="btn-primary text-sm px-3 py-1"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-green-700">
                          {appliedGiftCard.code} Applied
                        </span>
                        <div className="text-xs text-green-600">
                          ${Math.min(appliedGiftCard.amount, subtotal + shipping + tax).toFixed(2)} discount
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeGiftCard}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Gift Message */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Gift Message (Optional)</h3>
                  <textarea
                    placeholder={`Write a personal message to ${cartData.recipient.name}...`}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                </div>

                {/* Payment */}
                {total > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Payment Information</h3>
                    <div className="p-4 border border-gray-300 rounded-lg">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isProcessing || !stripe}
                  className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : total === 0 ? (
                    `Complete Order • FREE (Gift Card Covers All)`
                  ) : (
                    `Complete Purchase • $${total.toFixed(2)}`
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}