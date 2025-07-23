// src/app/list/[shareCode]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import WishlistView from '@/components/WishlistView'
import { supabaseAdmin } from '@/lib/supabase'
import { ListResponse } from '@/types'

interface Props {
  params: { shareCode: string }
}

async function getWishlistData(shareCode: string): Promise<ListResponse | null> {
  try {
    // Get the shareable list
    const { data: listData, error: listError } = await supabaseAdmin
      .from('shareable_lists')
      .select('*')
      .eq('share_code', shareCode.toUpperCase())
      .eq('is_public', true)
      .single()

    if (listError || !listData) {
      return null
    }

    // Get the list owner
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, display_name, avatar_url')
      .eq('id', listData.user_id)
      .single()

    if (userError || !userData) {
      return null
    }

    // Get books in wishlist (status = 'want')
    const { data: booksData, error: booksError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('user_id', listData.user_id)
      .eq('status', 'want')
      .order('priority', { ascending: true })
      .order('date_added', { ascending: false })

    if (booksError) {
      console.error('Error fetching books:', booksError)
      return null
    }

    // Update view count
    await supabaseAdmin
      .from('shareable_lists')
      .update({ 
        view_count: listData.view_count + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', listData.id)

    return {
      list: listData,
      books: booksData || [],
      user: userData
    }
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getWishlistData(params.shareCode)
  
  if (!data) {
    return {
      title: 'Wishlist Not Found - BookWish'
    }
  }

  const title = data.list.title || `${data.user.display_name}'s Wishlist`
  const description = data.list.description || 
    `${data.user.display_name} wants ${data.books.length} books. Find the perfect gift!`

  return {
    title: `${title} - BookWish`,
    description,
    openGraph: {
      title,
      description,
      images: data.books.length > 0 && data.books[0].cover_url ? 
        [data.books[0].cover_url] : undefined,
    },
  }
}

export default async function WishlistPage({ params }: Props) {
  const data = await getWishlistData(params.shareCode)

  if (!data) {
    notFound()
  }

  return <WishlistView data={data} shareCode={params.shareCode} />
}