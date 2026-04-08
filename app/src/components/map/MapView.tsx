'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import type { Restaurant } from '@/types'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface MapViewProps {
  restaurants: Restaurant[]
  center: [number, number]
}

export default function MapView({ restaurants, center }: MapViewProps) {
  useEffect(() => {
    L.Marker.prototype.options.icon = icon
  }, [])

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="w-full h-full"
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {restaurants
        .filter((r) => r.lat && r.lng)
        .map((r) => (
          <Marker key={r.id} position={[r.lat!, r.lng!]} icon={icon}>
            <Popup>
              <div className="min-w-48">
                <h3 className="font-bold text-sm mb-1">{r.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{r.genre} ・ {r.access}</p>
                {r.average_rating && r.average_rating > 0 && (
                  <p className="text-xs text-amber-500 mb-2">★ {r.average_rating.toFixed(1)}</p>
                )}
                <Link
                  href={`/restaurants/${r.id}`}
                  className="block text-center bg-orange-600 text-white text-xs py-1.5 px-3 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  詳細を見る
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}
