// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BookWish - Perfect Book Gifts',
  description: 'Find the perfect book gifts from curated wishlists. Share your reading wishlist and discover books your loved ones actually want.',
  keywords: 'books, gifts, wishlist, reading, book lovers',
  authors: [{ name: 'BookWish' }],
  openGraph: {
    title: 'BookWish - Perfect Book Gifts',
    description: 'Find the perfect book gifts from curated wishlists.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookWish - Perfect Book Gifts',
    description: 'Find the perfect book gifts from curated wishlists.',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}