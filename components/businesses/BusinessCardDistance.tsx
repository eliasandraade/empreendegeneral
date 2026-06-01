"use client"

import { useEffect, useState } from "react"
import { haversineKm, formatDistance } from "@/lib/distance"

interface Props {
  lat: number
  lng: number
}

export function BusinessCardDistance({ lat, lng }: Props) {
  const [distance, setDistance] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, lat, lng)
        setDistance(formatDistance(km))
      },
      () => {
        // Permissão negada ou erro — ocultar silenciosamente
      },
      { timeout: 8000 }
    )
  }, [lat, lng])

  if (!distance) return null

  return <span className="text-white/50">• {distance}</span>
}
