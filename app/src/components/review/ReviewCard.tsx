import type { ReviewWithProfile } from '@/types'
import StarRating from '@/components/ui/StarRating'

interface ReviewCardProps {
  review: ReviewWithProfile
  onDelete?: (id: string) => void
  showDeleteButton?: boolean
}

export default function ReviewCard({ review, onDelete, showDeleteButton = false }: ReviewCardProps) {
  const name = review.profiles?.name ?? '不明なユーザー'
  const dept = review.profiles?.department ?? ''
  const initial = name.charAt(0)
  const date = new Date(review.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="bg-white rounded-xl p-4 mb-3.5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {initial}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">{name}{dept ? `（${dept}）` : ''}</p>
          <p className="text-xs text-gray-300">{date}</p>
        </div>
        {showDeleteButton && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-md font-semibold hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors"
          >
            削除
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <StarRating value={review.rating} readonly size="sm" />
        <strong className="text-sm">{review.rating.toFixed(1)}</strong>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
      {review.purpose_tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {review.purpose_tags.map((tag) => (
            <span key={tag} className="inline-block bg-orange-50 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
      {review.photo_url && (
        <img src={review.photo_url} alt="レビュー写真" className="mt-3 rounded-lg w-full max-h-48 object-cover" />
      )}
    </div>
  )
}
