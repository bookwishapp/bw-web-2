// src/app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MagnifyingGlassIcon, GiftIcon, HeartIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function HomePage() {
  const [shareCode, setShareCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!shareCode.trim()) {
      toast.error('Please enter a share code')
      return
    }

    setIsLoading(true)
    
    // Clean and validate share code
    const cleanCode = shareCode.trim().toUpperCase()
    
    try {
      // Check if list exists
      const response = await fetch(`/api/lists/${cleanCode}`)
      
      if (response.ok) {
        router.push(`/list/${cleanCode}`)
      } else if (response.status === 404) {
        toast.error('Wishlist not found. Please check the share code and try again.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } catch (error) {
      toast.error('Unable to load wishlist. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue/5 to-brand-teal/5">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image
                src="/images/bookwish-logo.svg"
                alt="BookWish"
                width={32}
                height={32}
                className="mr-2"
              />
              <h1 className="text-2xl font-bold text-brand-blue">BookWish</h1>
            </div>
            {/* Admin link removed from public view */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="mb-8">
            <Image
              src="/images/bookwish-logo.svg"
              alt="BookWish"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find the Perfect Book Gift
          </h1>
          
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Enter a share code to view someone's carefully curated book wishlist 
            and purchase the perfect gift they'll actually love.
          </p>
          
          {/* Share Code Form */}
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="shareCode" className="sr-only">
                  Share Code
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="shareCode"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value)}
                    placeholder="Enter share code (e.g., BOOKLOV3)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-center text-lg uppercase tracking-wider"
                    maxLength={10}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  'View Wishlist'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="bg-brand-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <HeartIcon className="h-8 w-8 text-brand-blue" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Curated Wishlists</h3>
            <p className="text-text-secondary">
              Browse carefully selected books your loved ones actually want to read.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-brand-teal/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <GiftIcon className="h-8 w-8 text-brand-teal" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Perfect Gifts</h3>
            <p className="text-text-secondary">
              Give books they'll love. No more guessing what they want to read.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-brand-gold/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-brand-gold" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Discovery</h3>
            <p className="text-text-secondary">
              Simple share codes make finding and gifting books effortless.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 p-8 bg-white rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Wish. Share. Read.</h2>
          <p className="text-text-secondary mb-6">
            Create your own wishlist and share books you love with friends and family.
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="https://apps.apple.com/app/bookwish/id6444194391" 
              className="btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              📱 Download BookWish App
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image
                src="/images/bookwish-logo.svg"
                alt="BookWish"
                width={24}
                height={24}
                className="mr-2"
              />
              <span className="text-brand-blue font-semibold">BookWish</span>
            </div>
            <div className="text-sm text-text-secondary">
              © {currentYear} BookWish. Perfect gifts for book lovers.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}