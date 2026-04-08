'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { searchRestaurants } from '@/lib/hotpepper'
import type { Restaurant } from '@/types'
import StarRating from '@/components/ui/StarRating'

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

const DEFAULT_CENTER: [number, number] = [35.6654, 139.7707]

export default function MapPage() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      doSearch('新橋')
    }
    init()
  }, [])

  const doSearch = async (kw: string) => {
    setLoading(true)
    try {
      const { restaurants: list } = await searchRestaurants({ keyword: kw || '東京', count: 30 })
      const withReviews = await Promise.all(
        list.map(async (r) => {
          const { data } = await supabase.from('reviews').select('rating, purpose_tags').eq('restaurant_id', r.id)
          if (!data || data.length === 0) return { ...r, average_rating: 0, review_count: 0, tags: [] }
          const avg = data.reduce((s, rv) => s + rv.rating, 0) / data.length
          const tags = [...new Set(data.flatMap((rv) => rv.purpose_tags))]
          return { ...r, average_rating: Math.round(avg * 10) / 10, review_count: data.length, tags }
        })
      )
      setRestaurants(withReviews)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(keyword)
  }

  const center: [number, number] = selected?.lat && selected?.lng
    ? [selected.lat, selected.lng]
    : DEFAULT_CENTER

  return (
    <div className="-mx-6 -mt-8 flex h-[calc(100vh-56px)]">
      {/* 左サイドパネル */}
      <div className="w-80 min-w-80 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="エリア・店名で検索..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </form>
        </div>

        <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">{restaurants.length}件表示中</span>
          <Link href="/search" className="text-xs text-orange-600 hover:underline">☰ 一覧表示</Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
          ) : (
            restaurants.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full flex gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer transition-colors text-left ${
                  selected?.id === r.id ? 'bg-orange-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-bold text-orange-600 min-w-5">{i + 1}</span>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center text-xl shrink-0">🍴</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{r.name}</h4>
                  {r.average_rating && r.average_rating > 0 ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating value={Math.round(r.average_rating)} readonly size="sm" />
                      <strong className="text-xs">{r.average_rating.toFixed(1)}</strong>
                    </div>
                  ) : null}
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{r.genre} ・ {r.access}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 地図エリア */}
      <div className="flex-1 relative">
        <MapView restaurants={restaurants} center={center} />

        {/* 選択店舗ポップアップ */}
        {selected && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl p-4 w-72 shadow-xl z-[1000]">
            <h3 className="text-sm font-bold text-gray-900 mb-1">{selected.name}</h3>
            {selected.average_rating && selected.average_rating > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <StarRating value={Math.round(selected.average_rating)} readonly size="sm" />
                <strong className="text-sm">{selected.average_rating.toFixed(1)}</strong>
              </div>
            )}
            <p className="text-xs text-gray-400 mb-3">{selected.genre} ・ {selected.access}</p>
            <div className="flex gap-2">
              <Link
                href={`/restaurants/${selected.id}`}
                className="flex-1 text-center bg-orange-600 text-white text-sm py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                詳細を見る
              </Link>
              <button
                onClick={() => setSelected(null)}
                className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
