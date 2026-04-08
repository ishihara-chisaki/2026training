'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { ReviewWithProfile } from '@/types'
import StarRating from '@/components/ui/StarRating'

interface AdminStats {
  totalReviews: number
  activeUsers: number
}

export default function AdminPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([])
  const [stats, setStats] = useState<AdminStats>({ totalReviews: 0, activeUsers: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!prof?.is_admin) { router.push('/search'); return }

      await loadReviews()
    }
    init()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('admin:reviews')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reviews' }, () => {
        loadReviews()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(name, department)')
      .order('created_at', { ascending: false })
    if (data) setReviews(data as ReviewWithProfile[])

    const { count: reviewCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true })
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    setStats({ totalReviews: reviewCount ?? 0, activeUsers: userCount ?? 0 })
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このレビューを削除しますか？')) return
    setDeleteId(id)
    await supabase.from('reviews').delete().eq('id', id)
    setReviews((prev) => prev.filter((r) => r.id !== id))
    setDeleteId(null)
  }

  const filtered = reviews.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.comment.toLowerCase().includes(q) ||
      (r.profiles?.name ?? '').toLowerCase().includes(q) ||
      r.restaurant_id.toLowerCase().includes(q)
    )
  })

  if (loading) return <div className="text-center py-20 text-gray-400">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 管理者ヘッダー */}
      <header className="bg-[#1a1a2e] px-6 h-14 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold">MeshiLog</span>
          <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded font-bold">ADMIN</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/search" className="text-sm text-white/80 hover:text-white transition-colors">一般画面に戻る</Link>
        </nav>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">管理者ダッシュボード</h1>

        {/* サマリー */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { num: stats.totalReviews, label: '総レビュー数', sub: '' },
            { num: stats.activeUsers, label: '登録ユーザー数', sub: '' },
            { num: filtered.length, label: '表示中', sub: '' },
            { num: 0, label: '要確認レビュー', sub: '' },
          ].map(({ num, label }) => (
            <div key={label} className="bg-white rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl font-extrabold text-orange-600">{num}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* 検索バー */}
        <div className="bg-white rounded-xl px-5 py-4 mb-5 flex gap-3 items-center shadow-sm flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="店名・投稿者名・コメント内容で検索..."
            className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-gray-800"
          />
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors">
            検索
          </button>
        </div>

        {/* レビューテーブル */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">レビュー管理（{filtered.length}件）</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {['投稿者', '店舗ID', '評価', 'コメント（抜粋）', '投稿日', '操作'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((review) => (
                  <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {(review.profiles?.name ?? '?').charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{review.profiles?.name ?? '不明'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 max-w-32 truncate">{review.restaurant_id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <StarRating value={review.rating} readonly size="sm" />
                        <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="max-w-72 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-500">
                        {review.comment}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deleteId === review.id}
                        className="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-md text-xs font-semibold hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors disabled:opacity-50"
                      >
                        {deleteId === review.id ? '削除中...' : '削除'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                      レビューがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
