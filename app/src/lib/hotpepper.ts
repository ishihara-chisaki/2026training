import type { Restaurant } from '@/types'

export interface HotpepperSearchParams {
  keyword?: string
  lat?: number
  lng?: number
  range?: 1 | 2 | 3 | 4 | 5
  genre?: string
  count?: number
  start?: number
}

export async function searchRestaurants(params: HotpepperSearchParams): Promise<{ restaurants: Restaurant[]; total: number }> {
  const searchParams = new URLSearchParams({
    keyword: params.keyword ?? '',
    ...(params.lat !== undefined && { lat: String(params.lat) }),
    ...(params.lng !== undefined && { lng: String(params.lng) }),
    range: String(params.range ?? 3),
    count: String(params.count ?? 20),
    start: String(params.start ?? 1),
    ...(params.genre && { genre: params.genre }),
  })

  const res = await fetch(`/api/hotpepper?${searchParams.toString()}`)
  if (!res.ok) throw new Error('飲食店情報の取得に失敗しました')
  return res.json()
}
