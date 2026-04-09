'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { isTestAuthMode, TEST_USER_ID } from '@/hooks/useAuth'
import StarRating from '@/components/ui/StarRating'
import { PURPOSE_TAGS } from '@/types'

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [restaurantName, setRestaurantName] = useState<string>(id)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      if (isTestAuthMode()) {
        setUserId(TEST_USER_ID)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUserId(user.id)
      }

      const res = await fetch(`/api/hotpepper?keyword=${id}&count=1`)
      if (res.ok) {
        const { restaurants: list } = await res.json()
        if (list.length > 0) setRestaurantName(list[0].name)
      }
    }
    init()
  }, [id])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    if (rating === 0) { setError('評価を選択してください。'); return }
    if (!comment.trim()) { setError('コメントを入力してください。'); return }
    setError('')
    setLoading(true)
    try {
      let photoUrl: string | null = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('review-photos').upload(path, photoFile)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('review-photos').getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
      }
      const { error: insertError } = await supabase.from('reviews').insert({
        restaurant_id: id,
        user_id: userId,
        rating,
        comment: comment.trim(),
        purpose_tags: selectedTags,
        photo_url: photoUrl,
      })
      if (insertError) throw insertError
      router.push(`/restaurants/${id}`)
    } catch {
      setError('投稿に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/restaurants/${id}`} className="text-orange-600 text-xl hover:opacity-70">←</Link>
        <h1 className="text-xl font-bold text-gray-900">レビューを投稿する</h1>
      </div>

      {/* 対象店舗バナー */}
      <div className="bg-white rounded-xl px-5 py-4 flex items-center gap-3.5 mb-7 shadow-sm">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center text-3xl shrink-0">🍴</div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{restaurantName}</h3>
        </div>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 text-sm text-orange-700 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 評価 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-50">
            評価 <span className="text-orange-600 text-xs font-bold">必須</span>
          </h3>
          <div className="space-y-3">
            {[{ label: '総合評価', key: 'overall' }].map(({ label }) => (
              <div key={label} className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
                <span className="w-20 text-sm text-gray-600">{label}</span>
                <StarRating value={rating} onChange={setRating} size="lg" />
                <span className="text-base font-bold text-gray-800 min-w-8">{rating > 0 ? `${rating}.0` : '-'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* コメント */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-50">
            コメント <span className="text-orange-600 text-xs font-bold">必須</span>
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`店の雰囲気、料理、サービスなど社内の同僚に伝えたい情報を書いてください。\n（例：接待利用OK / ランチは混むので11:45頃がおすすめ など）`}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors min-h-36 resize-y"
          />
        </div>

        {/* 用途タグ */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-50">
            用途タグ <span className="text-gray-400 text-xs font-normal">（任意）</span>
          </h3>
          <div className="flex gap-2.5 flex-wrap">
            {PURPOSE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`border-2 rounded-full px-3.5 py-1.5 text-sm cursor-pointer transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-orange-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 写真アップロード */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-50">
            写真 <span className="text-gray-400 text-xs font-normal">（任意）</span>
          </h3>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="プレビュー" className="w-full max-h-48 object-cover rounded-xl" />
              <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70">
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 transition-colors bg-gray-50"
            >
              <div className="text-4xl mb-2.5">📷</div>
              <p className="text-sm text-gray-500">クリックして写真を追加</p>
              <p className="text-xs text-gray-300 mt-1">JPG・PNG対応 ／ 最大10MB</p>
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="flex gap-3 justify-end mt-8">
          <Link
            href={`/restaurants/${id}`}
            className="border border-gray-200 text-gray-500 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  )
}
