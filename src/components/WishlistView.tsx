// src/components/WishlistView.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCartIcon, 
  HeartIcon, 
  GiftIcon,
  ShareIcon,
  StarIcon,
  TagIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { Book, ListResponse, CartItem } from '@/types'

interface Props {
  data: ListResponse
  shareCode: string
}

export default function WishlistView({ data, shareCode }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const router = useRouter()

  const { list, books, user } = data

  const addToCart = (book: Book) => {
    const existingItem = cart.find(item => item.book.id === book.id)
    
    if (existingItem) {
      toast.success('Already in cart!')
      return
    }

    const cartItem: CartItem = {
      book,
      quantity: 1,
      isGift: true,
      recipientEmail: user.id, // Store user ID for now
      giftMessage: ''
    }

    setCart([...cart, cartItem])
    setSelectedBooks(new Set([...selectedBooks, book.id]))
    toast.success(`Added "${book.title}" to cart`)
  }

  const removeFromCart = (bookId: string) => {
    setCart(cart.filter(item => item.book.id !== bookId))
    const newSelected = new Set(selectedBooks)
    newSelected.delete(bookId)
    setSelectedBooks(newSelected)
    toast.success('Removed from cart')
  }

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error('Please add some books to cart first')
      return
    }

    // Store cart in session storage
    sessionStorage.setItem('bookwish_cart', JSON.stringify({
      items: cart,
      recipient: {
        name: user.display_name,
        username: user.username,
        shareCode
      }
    }))

    router.push('/checkout')
  }

  const shareList = async () => {
    const url = `${window.location.origin}/list/${shareCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: list.title || `${user.display_name}'s Book Wishlist`,
          text: `Check out ${user.display_name}'s book wishlist on BookWish!`,
          url
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price)
  }

  const total = cart.reduce((sum, item) => {
    return sum + (item.book.list_price || 0) * item.quantity
  }, 0)

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
<Image
  src="/images/bookwish-logo.svg"
  alt="BookWish"
  width={24}
  height={24}
  className="mr-2"
/>              <span className="text-xl font-bold text-brand-blue">BookWish</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={shareList}
                className="flex items-center text-text-secondary hover:text-brand-blue transition-colors"
              >
                <ShareIcon className="h-5 w-5 mr-1" />
                Share
              </button>
              
              {cart.length > 0 && (
                <button
                  onClick={proceedToCheckout}
                  className="flex items-center btn-primary"
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Cart ({cart.length})
                  {total > 0 && (
                    <span className="ml-2">• {formatPrice(total)}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* List Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.display_name}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                ) : (
                  <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center mr-4">
                    <UserIcon className="h-6 w-6 text-brand-blue" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {list.title || `${user.display_name}'s Wishlist`}
                  </h1>
                  <p className="text-text-secondary">
                    by {user.display_name} (@{user.username})
                  </p>
                </div>
              </div>
              
              {list.description && (
                <p className="text-lg text-text-secondary mb-6">
                  {list.description}
                </p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-text-secondary">
                <div className="flex items-center">
                  <HeartIcon className="h-4 w-4 mr-1" />
                  {books.length} books
                </div>
                <div className="flex items-center">
                  <GiftIcon className="h-4 w-4 mr-1" />
                  {list.view_count} views
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Updated {new Date(list.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
<div className="bg-blue-600 rounded-lg p-6 mb-8 text-white">
  <h3 className="text-xl font-bold mb-2">Wish. Share. Read.</h3>
  <p className="mb-4">Create your own wishlist and share books you love</p>
  <a href="https://apps.apple.com/us/app/bookwish/id6444194391" className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg">
    Create Your Own Wishlist
  </a>
</div>
        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-16">
            <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No books yet
            </h3>
            <p className="text-text-secondary">
              {user.display_name} hasn't added any books to their wishlist yet.
            </p>
          </div>
        ) : (
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isSelected={selectedBooks.has(book.id)}
                onAddToCart={() => addToCart(book)}
                onRemoveFromCart={() => removeFromCart(book.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={proceedToCheckout}
            className="flex items-center bg-brand-blue hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-colors"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            Checkout ({cart.length})
            {total > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-sm">
                {formatPrice(total)}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// Book Card Component
function BookCard({ 
  book, 
  isSelected, 
  onAddToCart, 
  onRemoveFromCart 
}: {
  book: Book
  isSelected: boolean
  onAddToCart: () => void
  onRemoveFromCart: () => void
}) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[2/3] relative bg-gray-100">
        {!imageError && (book.cover_url || book.thumbnail_url) ? (
          <Image
            src={book.cover_url || book.thumbnail_url!}
            alt={book.title}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <div className="text-xs text-gray-500 px-2">
                {book.title.slice(0, 50)}...
              </div>
            </div>
          </div>
        )}
        
        {book.priority && book.priority <= 2 && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              High Priority
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {book.title}
        </h3>
        
        <p className="text-sm text-text-secondary mb-3 line-clamp-1">
          by {book.author}
        </p>
        
        {book.categories && book.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {book.categories.slice(0, 2).map((category) => (
              <span 
                key={category}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {category}
              </span>
            ))}
          </div>
        )}
        
        {book.average_rating && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(book.average_rating!)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-text-secondary ml-2">
              {book.average_rating.toFixed(1)}
              {book.rating_count && ` (${book.rating_count})`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            {book.list_price && book.list_price > 0 ? (
              <div className="text-lg font-bold text-green-600">
                ${book.list_price.toFixed(2)}
              </div>
            ) : (
              <div className="text-sm text-text-secondary">
                Price varies
              </div>
            )}
          </div>
          
{book.list_price && book.list_price > 0 && (
  <div>
    {isSelected ? (
      <button
        onClick={onRemoveFromCart}
        className="flex items-center bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors text-sm"
      >
        <HeartIconSolid className="h-4 w-4 mr-1" />
        Remove
      </button>
    ) : (
      <button
        onClick={onAddToCart}
        className="flex items-center btn-primary text-sm px-3 py-2"
      >
        <ShoppingCartIcon className="h-4 w-4 mr-1" />
        Add
      </button>
    )}
  </div>
)}
        </div>
      </div>
      
    </div>
    
  )
}