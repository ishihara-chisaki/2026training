'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Restaurant, ReviewWithProfile } from '@/types'
import StarRating from '@/components/ui/StarRating'
import ReviewCard from '@/components/review/ReviewCard'

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([])
  const [isFavorited, setIsFavorited] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const res = await fetch(`/api/hotpepper?keyword=${id}&count=1`)
      if (res.ok) {
        const { restaurants: list } = await res.json()
        if (list.length > 0) setRestaurant(list[0])
      }

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*, profiles(name, department)')
        .eq('restaurant_id', id)
        .order('created_at', { ascending: false })
      if (reviewData) setReviews(reviewData as ReviewWithProfile[])

      const { data: fav } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('restaurant_id', id)
        .maybeSingle()
      setIsFavorited(!!fav)
      setLoading(false)
    }
    init()
  }, [id])

  useEffect(() => {
    const channel = supabase
      .channel(`reviews:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `restaurant_id=eq.${id}` }, async () => {
        const { data } = await supabase
          .from('reviews')
          .select('*, profiles(name, department)')
          .eq('restaurant_id', id)
          .order('created_at', { ascending: false })
        if (data) setReviews(data as ReviewWithProfile[])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  const toggleFavorite = async () => {
    if (!userId || favLoading) return
    setFavLoading(true)
    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().match({ user_id: userId, restaurant_id: id })
        setIsFavorited(false)
      } else {
        await supabase.from('favorites').insert({ user_id: userId, restaurant_id: id })
        setIsFavorited(true)
      }
    } finally {
      setFavLoading(false)
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null
  const tags = [...new Set(reviews.flatMap((r) => r.purpose_tags))]

  if (loading) return <div className="text-center py-20 text-gray-400">読み込み中...</div>

  const r = restaurant

  return (
    <div className="-mx-6 -mt-8">
      {/* ヒーロー */}
      <div className="h-60 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-8xl relative">
        {r?.photo_url ? (
          <img src={r.photo_url} alt={r?.name} className="w-full h-full object-cover" />
        ) : (
          <span>🍴</span>
        )}
        <div className="absolute top-4 right-6 flex gap-2.5">
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md text-lg hover:scale-110 transition-transform"
          >
            <span className={isFavorited ? 'text-orange-600' : 'text-gray-400'}>{isFavorited ? '♥' : '♡'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {/* パンくず */}
        <div className="text-xs text-gray-400 mb-4">
          <Link href="/search" className="text-orange-600 hover:underline">検索</Link>
          {' ＞ '}
          {r?.genre && <Link href="/search" className="text-orange-600 hover:underline">{r.genre}</Link>}
          {' ＞ '}
          {r?.name ?? id}
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
          {/* 左：メインコンテンツ */}
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2.5">{r?.name ?? id}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                {avgRating && (
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(parseFloat(avgRating))} readonly size="lg" />
                    <span className="text-3xl font-extrabold text-gray-800">{avgRating}</span>
                  </div>
                )}
                <span className="text-sm text-gray-400">レビュー {reviews.length}件</span>
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="bg-orange-50 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>

            {/* 基本情報 */}
            {r && (
              <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
                <table className="w-full border-collapse">
                  {[
                    ['ジャンル', r.genre],
                    ['住所', r.address],
                    ['アクセス', r.access],
                    ['営業時間', r.open],
                    ['予算(昼)', r.budget_lunch],
                    ['予算(夜)', r.budget_dinner],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-2 text-sm text-gray-400 font-semibold w-24">{label}</td>
                      <td className="py-3 text-sm text-gray-700">{value}</td>
                    </tr>
                  ))}
                </table>
              </div>
            )}

            {/* レビューセクション */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">社内レビュー（{reviews.length}件）</h2>
              <Link
                href={`/restaurants/${id}/review`}
                className="bg-orange-600 text-white text-sm font-semibold px-3.5 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                ＋ レビューを書く
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>まだレビューがありません</p>
                <p className="text-sm mt-1">最初のレビューを投稿しましょう！</p>
              </div>
            ) : (
              reviews.map((review) => <ReviewCard key={review.id} review={review} />)
            )}
          </div>

          {/* 右サイドバー */}
          <div>
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <Link
                href={`/restaurants/${id}/review`}
                className="w-full block text-center bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-700 transition-colors mb-2.5"
              >
                ＋ レビューを書く
              </Link>
              <button
                onClick={toggleFavorite}
                disabled={favLoading}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm border-2 transition-colors ${
                  isFavorited
                    ? 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700'
                    : 'bg-white text-orange-600 border-orange-600 hover:bg-orange-50'
                }`}
              >
                {isFavorited ? '♥ お気に入り済み' : '♡ お気に入りに追加'}
              </button>
            </div>

            {avgRating && (
              <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3.5">評価の内訳</h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-extrabold text-gray-800">{avgRating}</div>
                  <StarRating value={Math.round(parseFloat(avgRating))} readonly size="lg" />
                  <p className="text-xs text-gray-400 mt-1">{reviews.length}件のレビューより</p>
                </div>
              </div>
            )}

            {r && (r.lat || r.address) && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3.5">アクセス</h3>
                <div className="w-full h-36 bg-gray-100 rounded-lg flex items-center justify-center text-2xl mb-3">📍</div>
                <p className="text-xs text-gray-600 leading-7">
                  <strong>{r.name}</strong><br />
                  {r.address}<br />
                  {r.access}
                </p>
                <Link href="/map" className="text-xs text-orange-600 block mt-2.5 hover:underline">地図で見る →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
