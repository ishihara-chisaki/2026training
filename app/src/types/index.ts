export type { Database, Profile, Review, Favorite } from './database'

export interface Restaurant {
  id: string
  name: string
  genre: string
  address: string
  access: string
  lat: number | null
  lng: number | null
  budget_lunch: string
  budget_dinner: string
  photo_url: string
  open: string
  close: string
  catch: string
  url: string
  average_rating?: number
  review_count?: number
  tags?: string[]
}

export interface ReviewWithProfile {
  id: string
  restaurant_id: string
  user_id: string
  rating: number
  comment: string
  photo_url: string | null
  purpose_tags: string[]
  created_at: string
  updated_at: string
  profiles: {
    name: string
    department: string | null
  } | null
}

export const PURPOSE_TAGS = [
  'ランチ向き',
  '接待向き',
  '会食向き',
  '大人数OK',
  '個室あり',
  'テラスあり',
  'コスパ良し',
] as const

export type PurposeTag = typeof PURPOSE_TAGS[number]

export const DEPARTMENTS = [
  { value: 'sales', label: '営業部' },
  { value: 'dev', label: '開発部' },
  { value: 'hr', label: '人事部' },
  { value: 'finance', label: '経理部' },
  { value: 'marketing', label: 'マーケティング部' },
  { value: 'other', label: 'その他' },
] as const
