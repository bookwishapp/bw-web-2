// src/app/api/lists/[shareCode]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { shareCode: string } }
) {
  const { shareCode } = params

  try {
    // Get the shareable list
    const { data: listData, error: listError } = await supabaseAdmin
      .from('shareable_lists')
      .select('*')
      .eq('share_code', shareCode.toUpperCase())
      .eq('is_public', true)
      .single()

    if (listError || !listData) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    // Get the list owner
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, display_name, avatar_url')
      .eq('id', listData.user_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get books in wishlist
    const { data: booksData, error: booksError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('user_id', listData.user_id)
      .eq('status', 'want')
      .order('priority', { ascending: true })
      .order('date_added', { ascending: false })

    if (booksError) {
      console.error('Error fetching books:', booksError)
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      )
    }

    // Update view count (fire and forget)
    supabaseAdmin
      .from('shareable_lists')
      .update({ 
        view_count: listData.view_count + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', listData.id)
    return NextResponse.json({
      list: listData,
      books: booksData || [],
      user: userData
    })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}