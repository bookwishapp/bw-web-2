// src/types/index.ts

// Core Models (matching iOS app exactly)
export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  subscription_status: 'none' | 'trial' | 'active' | 'grace_period' | 'expired' | 'cancelled';
  shipping_address?: ShippingAddress;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  isbn13?: string;
  cover_url?: string;
  thumbnail_url?: string;
  description?: string;
  published_date?: string;
  page_count?: number;
  average_rating?: number;
  rating_count?: number;
  categories: string[];
  status: 'want' | 'own' | 'read' | 'reading' | 'abandoned';
  personal_rating?: number;
  personal_notes?: string;
  date_added: string;
  date_status_changed?: string;
  current_page?: number;
  user_id: string;
  is_purchased_gift: boolean;
  gift_purchase_id?: string;
  priority?: number;
  date_read?: string;
  list_price?: number;
  retail_price?: number;
  currency_code?: string;
  saleability?: string;
  is_ebook?: boolean;
  buy_link?: string;
  country?: string;
  pricing_last_updated?: string;
  needs_pricing_update: boolean;
}

export interface ShareableList {
  id: string;
  user_id: string;
  share_code: string;
  title: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  view_count: number;
  last_viewed_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_id: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  tax_calculation_id?: string;
  shipping_address?: ShippingAddress;
  tracking_number?: string;
  carrier?: string;
  is_gift: boolean;
  gift_message?: string;
  recipient_email?: string;
  item_count: number;
  platform: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  book_id: string;
  book?: Book;
  quantity: number;
  price: number;
  is_gift: boolean;
  recipient_user_id?: string;
  created_at: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_verified: boolean;
}

export interface GiftCard {
  id: string;
  code: string;
  original_amount: number;
  current_balance: number;
  currency: string;
  purchaser_id: string;
  recipient_email: string;
  recipient_id?: string;
  message?: string;
  stripe_payment_intent_id: string;
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  expires_at?: string;
  created_at: string;
  claimed_at?: string;
  fully_redeemed_at?: string;
}

// API Response Types
export interface ListResponse {
  list: ShareableList;
  books: Book[];
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface CartItem {
  book: Book;
  quantity: number;
  isGift: boolean;
  recipientEmail?: string;
  giftMessage?: string;
}