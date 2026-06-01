// components/map/BusinessMapCard.tsx
"use client"

import Link from "next/link"
import { X, Phone, MessageCircle, MapPin, Navigation, ExternalLink } from "lucide-react"
import type { BusinessMapPin } from "@/types"

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace(".", ",")} km`
}

interface Props {
  business: BusinessMapPin
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
}

export function BusinessMapCard({ business, userLocation, onClose }: Props) {
  const distance =
    userLocation
      ? haversineKm(userLocation.lat, userLocation.lng, business.latitude, business.longitude)
      : null

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`
    : null

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-8 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000] overflow-hidden">
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex-1 min-w-0">
          {business.category && (
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {business.category.name}
            </span>
          )}
          <h3 className="font-bold text-gray-800 text-base mt-1 truncate">{business.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            {distance !== null && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Navigation size={11} className="text-blue-500" />
                {formatDistance(distance)}
              </span>
            )}
            {business.address && (
              <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
                <MapPin size={11} />
                {business.address}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-2 shrink-0"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 pb-4">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>
        )}
        {business.phone && !whatsappUrl && (
          <a
            href={`tel:${business.phone}`}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Phone size={15} />
            Ligar
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <MapPin size={15} />
          Rota
        </a>
        <Link
          href={`/businesses/${business.slug}`}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors ml-auto"
        >
          Ver detalhes
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  )
}
