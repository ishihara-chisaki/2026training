'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isTestAuthMode, TEST_USER_ID } from '@/hooks/useAuth'
import { searchRestaurants } from '@/lib/hotpepper'
import type { Restaurant } from '@/types'
import StarRating from '@/components/ui/StarRating'

interface FavRestaurant extends Restaurant {
  favoriteCreatedAt: string
  average_rating: number
  review_count: number
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavRestaurant[]>([])
  const [loading, setLoading] = useState(true)

  const loadFavorites = async () => {
    let uid: string
    if (isTestAuthMode()) {
      uid = TEST_USER_ID
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      uid = user.id
    }

    const { data: favs } = await supabase
      .from('favorites')
      .select('restaurant_id, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (!favs || favs.length === 0) { setLoading(false); return }

    const results = await Promise.all(
      favs.map(async (fav) => {
        const { restaurants: list } = await searchRestaurants({ keyword: fav.restaurant_id, count: 1 })
        const r = list[0]
        if (!r) return null
        const { data: reviews } = await supabase.from('reviews').select('rating').eq('restaurant_id', fav.restaurant_id)
        const avg = reviews && reviews.length > 0 ? reviews.reduce((s, rv) => s + rv.rating, 0) / reviews.length : 0
        return { ...r, favoriteCreatedAt: fav.created_at, average_rating: Math.round(avg * 10) / 10, review_count: reviews?.length ?? 0 }
      })
    )
    setFavorites(results.filter((r): r is FavRestaurant => r !== null))
    setLoading(false)
  }

  useEffect(() => { loadFavorites() }, [])

  const removeFavorite = async (restaurantId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('favorites').delete().match({ user_id: user.id, restaurant_id: restaurantId })
    setFavorites((prev) => prev.filter((f) => f.id !== restaurantId))
  }

  if (loading) return <div className="text-center py-20 text-gray-400">読み込み中...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">お気に入り一覧</h1>
        <span className="text-sm text-gray-400">{favorites.length}件</span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 text-gray-200">♡</div>
          <h3 className="text-lg text-gray-400 mb-2">お気に入りはまだありません</h3>
          <p className="text-sm text-gray-300 mb-6">気になるお店をお気に入り登録しましょう</p>
          <Link href="/search" className="bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors">
            飲食店を探す
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {favorites.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden relative">
              <Link href={`/restaurants/${r.id}`} className="block">
                <div className="h-36 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-5xl">
                  {r.photo_url ? <img src={r.photo_url} alt={r.name} className="w-full h-full object-cover" /> : '🍴'}
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{r.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">{r.genre} ・ {r.access}</p>
                  {r.average_rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <StarRating value={Math.round(r.average_rating)} readonly size="sm" />
                      <strong className="text-sm">{r.average_rating.toFixed(1)}</strong>
                      <span className="text-xs text-gray-300">({r.review_count}件)</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-200 mt-2">
                    追加日：{new Date(r.favoriteCreatedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => removeFavorite(r.id)}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md text-orange-600 text-sm hover:scale-110 transition-transform"
                title="お気に入りを解除"
              >
                ♥
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
