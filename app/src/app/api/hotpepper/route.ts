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

  if (!apiKey) {
    return NextResponse.json({ restaurants: [], total: 0 }, { status: 200 })
  }

  const params = new URLSearchParams({
    key: apiKey,
    format: 'json',
    count: searchParams.get('count') ?? '20',
    start: searchParams.get('start') ?? '1',
  })

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

  try {
    const res = await fetch(
      `http://webservice.recruit.co.jp/hotpepper/gourmet/v1/?${params.toString()}`,
      { next: { revalidate: 60 } }
    )
    const data: HotpepperResponse = await res.json()

    if (data.results.error) {
      return NextResponse.json({ restaurants: [], total: 0 })
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
  } catch {
    return NextResponse.json({ restaurants: [], total: 0 })
  }
}
