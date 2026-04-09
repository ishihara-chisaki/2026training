'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isTestAuthMode, TEST_USER_ID } from '@/hooks/useAuth'
import type { Profile, ReviewWithProfile } from '@/types'
import StarRating from '@/components/ui/StarRating'

export default function MyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([])
  const [favCount, setFavCount] = useState(0)
  const [tab, setTab] = useState<'reviews' | 'settings'>('reviews')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      let uid: string
      if (isTestAuthMode()) {
        uid = TEST_USER_ID
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        uid = user.id
      }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (prof) setProfile(prof)

      const { data: revs } = await supabase
        .from('reviews')
        .select('*, profiles(name, department)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (revs) setReviews(revs as ReviewWithProfile[])

      const { count } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', uid)
      setFavCount(count ?? 0)
      setLoading(false)
    }
    init()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="text-center py-20 text-gray-400">読み込み中...</div>

  const initial = profile?.name ? profile.name.charAt(0) : '?'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">マイページ</h1>

      <div className="grid grid-cols-[280px_1fr] gap-6 items-start">
        {/* プロフィールカード */}
        <div className="bg-white rounded-2xl px-5 py-7 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4">
            {initial}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{profile?.name ?? '-'}</h2>
          <p className="text-sm text-gray-400 mt-1 mb-5">{profile?.department ?? ''}</p>

          <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-xl overflow-hidden mb-5">
            <div className="bg-white py-3.5 text-center">
              <div className="text-2xl font-extrabold text-orange-600">{reviews.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">投稿レビュー</div>
            </div>
            <div className="bg-white py-3.5 text-center">
              <div className="text-2xl font-extrabold text-orange-600">{favCount}</div>
              <div className="text-xs text-gray-400 mt-0.5">お気に入り</div>
            </div>
          </div>

          <button className="w-full border border-gray-200 text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            プロフィール編集
          </button>
        </div>

        {/* 右コンテンツ */}
        <div>
          {/* タブ */}
          <div className="flex border-b-2 border-gray-100 mb-5">
            {(['reviews', 'settings'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-0.5 transition-colors ${
                  tab === t ? 'text-orange-600 border-orange-600' : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {t === 'reviews' ? '投稿したレビュー' : 'アカウント設定'}
              </button>
            ))}
          </div>

          {tab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p>まだレビューを投稿していません</p>
                  <Link href="/search" className="text-orange-600 text-sm mt-2 block hover:underline">飲食店を探す</Link>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-xl p-4 mb-3.5 shadow-sm flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-2xl shrink-0">🍴</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-1">{review.restaurant_id}</h4>
                      <div className="flex items-center gap-3 mb-2">
                        <StarRating value={review.rating} readonly size="sm" />
                        <strong className="text-sm">{review.rating.toFixed(1)}</strong>
                        <span className="text-xs text-gray-300">
                          {new Date(review.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{review.comment}</p>
                      <div className="mt-2.5">
                        <Link
                          href={`/restaurants/${review.restaurant_id}/review`}
                          className="text-xs border border-gray-200 text-gray-500 px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          編集
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {[
                { label: 'メールアドレス変更', onClick: undefined },
                { label: 'パスワード変更', onClick: undefined },
              ].map(({ label }) => (
                <div key={label} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 text-sm text-gray-700">
                  <span>{label}</span>
                  <span className="text-gray-300">›</span>
                </div>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-5 py-4 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
