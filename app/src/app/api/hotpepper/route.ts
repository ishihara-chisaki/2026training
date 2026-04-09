import { NextRequest, NextResponse } from 'next/server'
import type { Restaurant } from '@/types'

interface HotpepperShop {
  id: string
  name: string
  genre: { name: string }
  address: string
  access: string
  lat: string
  lng: string
  budget: { average: string }
  lunch: string
  open: string
  close: string
  catch: string
  urls: { pc: string }
  photo: { mobile: { l: string } }
}

interface HotpepperResponse {
  results: {
    shop?: HotpepperShop[]
    results_available?: number
    error?: Array<{ message: string }>
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const apiKey = process.env.HOTPEPPER_API_KEY

  // テスト用: APIキーがない場合、ダミーデータを返す
  if (!apiKey) {
    const dummyRestaurants: Restaurant[] = [
      {
        id: 'dummy-001',
        name: 'テスト和食店',
        genre: '和食',
        address: '東京都千代田区丸の内',
        access: '東京駅直結',
        lat: 35.6654,
        lng: 139.7707,
        budget_lunch: '1000円',
        budget_dinner: '3000円',
        photo_url: '',
        open: '11:30',
        close: '22:00',
        catch: 'テスト店舗です',
        url: 'https://example.com',
      },
      {
        id: 'dummy-002',
        name: 'テスト洋食屋',
        genre: '洋食',
        address: '東京都千代田区丸の内',
        access: '大手町駅徒歩3分',
        lat: 35.6655,
        lng: 139.7708,
        budget_lunch: '1500円',
        budget_dinner: '4000円',
        photo_url: '',
        open: '11:00',
        close: '23:00',
        catch: 'テスト店舗です',
        url: 'https://example.com',
      },
    ]
    return NextResponse.json({ restaurants: dummyRestaurants, total: 2 })
  }

  const params = new URLSearchParams({
    key: apiKey,
    format: 'json',
    count: searchParams.get('count') ?? '20',
    start: searchParams.get('start') ?? '1',
  })

  const shopId = searchParams.get('id')
  if (shopId) params.set('id', shopId)
  const keyword = searchParams.get('keyword')
  if (keyword) params.set('keyword', keyword)
  const lat = searchParams.get('lat')
  if (lat) params.set('lat', lat)
  const lng = searchParams.get('lng')
  if (lng) params.set('lng', lng)
  const range = searchParams.get('range')
  if (range) params.set('range', range)
  const genre = searchParams.get('genre')
  if (genre) params.set('genre', genre)

  const apiUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?${params.toString()}`

  try {
    const res = await fetch(apiUrl, { next: { revalidate: 60 } })

    if (!res.ok) {
      console.error(`HotPepper API error: ${res.status} ${res.statusText}`)
      return NextResponse.json({ restaurants: [], total: 0, error: `upstream ${res.status}` })
    }

    const data: HotpepperResponse = await res.json()

    if (data.results.error) {
      console.error('HotPepper API returned error:', data.results.error)
      return NextResponse.json({ restaurants: [], total: 0, error: data.results.error[0]?.message })
    }

    const shops = data.results.shop ?? []
    const restaurants: Restaurant[] = shops.map((s) => ({
      id: s.id,
      name: s.name,
      genre: s.genre?.name ?? '',
      address: s.address,
      access: s.access,
      lat: s.lat ? parseFloat(s.lat) : null,
      lng: s.lng ? parseFloat(s.lng) : null,
      budget_lunch: s.lunch ?? s.budget?.average ?? '',
      budget_dinner: s.budget?.average ?? '',
      photo_url: s.photo?.mobile?.l ?? '',
      open: s.open ?? '',
      close: s.close ?? '',
      catch: s.catch ?? '',
      url: s.urls?.pc ?? '',
    }))

    return NextResponse.json({
      restaurants,
      total: data.results.results_available ?? restaurants.length,
    })
  } catch (err) {
    console.error('HotPepper fetch failed:', err)
    return NextResponse.json({ restaurants: [], total: 0, error: String(err) })
  }
}
