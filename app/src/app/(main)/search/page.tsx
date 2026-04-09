'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { searchRestaurants } from '@/lib/hotpepper'
import RestaurantCard from '@/components/restaurant/RestaurantCard'
import type { Restaurant } from '@/types'

const GENRES = ['和食', '洋食', '中華', 'イタリアン', '焼肉', '寿司・海鮮', 'カフェ', '居酒屋']
const PURPOSES = ['ランチ向き', '会食向き', '接待向き', '大人数OK']

export default function SearchPage() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [genre, setGenre] = useState('')
  const [purpose, setPurpose] = useState('')
  const [userId, setUserId] = useState<string | undefined>()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const init = async () => {
      // テスト用: ハードコード認証モード
      if (typeof window !== 'undefined' && localStorage.getItem('__test_auth_mode') === 'true') {
        setUserId('test-user-id')
        doSearch('')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: favs } = await supabase.from('favorites').select('restaurant_id').eq('user_id', user.id)
      if (favs) setFavoriteIds(new Set(favs.map((f) => f.restaurant_id)))
      doSearch('')
    }
    init()
  }, [])

  const doSearch = useCallback(async (kw: string) => {
    setLoading(true)
    try {
      const { restaurants: res, total: t } = await searchRestaurants({
        keyword: kw || '東京',
        count: 20,
      })

      const reviewData = await Promise.all(
        res.map(async (r) => {
          const { data } = await supabase
            .from('reviews')
            .select('rating, purpose_tags')
            .eq('restaurant_id', r.id)
          if (!data || data.length === 0) return { ...r, average_rating: 0, review_count: 0, tags: [] }
          const avg = data.reduce((sum, rv) => sum + rv.rating, 0) / data.length
          const tags = [...new Set(data.flatMap((rv) => rv.purpose_tags))]
          return { ...r, average_rating: Math.round(avg * 10) / 10, review_count: data.length, tags }
        })
      )
      setRestaurants(reviewData)
      setTotal(t)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(keyword)
  }

  const filtered = restaurants.filter((r) => {
    if (genre && !r.genre.includes(genre)) return false
    if (purpose && !(r.tags ?? []).includes(purpose)) return false
    return true
  })

  return (
    <div className="-mx-6 -mt-8">
      {/* ヒーロー */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-400 text-white px-6 py-8 text-center">
        <h1 className="text-xl font-bold mb-4">今日のランチ・会食先を探そう</h1>
        <form onSubmit={handleSearch} className="flex max-w-xl mx-auto bg-white rounded-xl overflow-hidden shadow-lg">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="店名・エリア・駅名で検索..."
            className="flex-1 border-none px-4 py-3.5 text-sm text-gray-800 outline-none"
          />
          <button type="submit" className="bg-orange-600 text-white px-5 py-3.5 text-lg hover:bg-orange-700 transition-colors">
            🔍
          </button>
        </form>
      </div>

      {/* フィルターバー */}
      <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex gap-3 flex-wrap items-center">
        <span className="text-sm text-gray-500 font-semibold">絞り込み：</span>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-orange-500 bg-white"
        >
          <option value="">ジャンル</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-orange-500 bg-white"
        >
          <option value="">用途</option>
          {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <Link
            href="/search"
            className="border border-orange-600 bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            ☰ 一覧
          </Link>
          <Link
            href="/map"
            className="border border-gray-200 bg-white text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            📍 地図
          </Link>
        </div>
      </div>

      {/* 検索結果 */}
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-5">
          <span className="text-sm text-gray-500">
            {loading ? '検索中...' : `${filtered.length}件の飲食店が見つかりました`}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🍴</div>
            <p className="text-lg">飲食店が見つかりませんでした</p>
            <p className="text-sm mt-2">キーワードや絞り込み条件を変えてお試しください</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                isFavorited={favoriteIds.has(r.id)}
                userId={userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
