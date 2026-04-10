'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Restaurant } from '@/types'
import StarRating from '@/components/ui/StarRating'
import { supabase } from '@/lib/supabase'

interface RestaurantCardProps {
  restaurant: Restaurant
  isFavorited?: boolean
  userId?: string
}

const GENRE_EMOJI: Record<string, string> = {
  '和食': '🍱', '寿司': '🍣', 'ラーメン': '🍜', 'イタリアン': '🍝',
  '焼肉': '🥩', 'カフェ': '☕', '中華': '🥢', '洋食': '🍽️',
  '居酒屋': '🍶', 'フレンチ': '🥐',
}

function getEmoji(genre: string): string {
  for (const [key, emoji] of Object.entries(GENRE_EMOJI)) {
    if (genre.includes(key)) return emoji
  }
  return '🍴'
}

export default function RestaurantCard({ restaurant, isFavorited = false, userId }: RestaurantCardProps) {
  const [favorited, setFavorited] = useState(isFavorited)
  const [loading, setLoading] = useState(false)

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!userId || loading) return
    setLoading(true)
    try {
      if (favorited) {
        const { error } = await supabase.from('favorites').delete().match({ user_id: userId, restaurant_id: restaurant.id })
        if (!error) setFavorited(false)
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: userId, restaurant_id: restaurant.id })
        if (!error) setFavorited(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const emoji = getEmoji(restaurant.genre)
  const rating = restaurant.average_rating ?? 0
  const reviewCount = restaurant.review_count ?? 0
  const tags = restaurant.tags ?? []

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden block no-underline text-inherit">
      <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-5xl relative">
        {restaurant.photo_url ? (
          <img src={restaurant.photo_url} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <span>{emoji}</span>
        )}
        {userId && (
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md text-base hover:scale-110 transition-transform"
            title={favorited ? 'お気に入り解除' : 'お気に入り登録'}
          >
            <span className={favorited ? 'text-orange-600' : 'text-gray-400'}>
              {favorited ? '♥' : '♡'}
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-bold text-gray-900">{restaurant.name}</h3>
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-sm">★</span>
              <span className="text-base font-bold text-gray-800">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-2.5">{restaurant.genre} ・ {restaurant.access} ・ {restaurant.budget_lunch}</p>
        <div className="flex gap-1.5 flex-wrap">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-block bg-orange-50 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        {reviewCount > 0 && (
          <p className="text-xs text-gray-400 mt-2">レビュー {reviewCount}件</p>
        )}
      </div>
    </Link>
  )
}
