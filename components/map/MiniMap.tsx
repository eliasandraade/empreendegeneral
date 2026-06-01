// components/map/MiniMap.tsx
// ATENÇÃO: importar apenas via dynamic() com ssr: false
"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface Props {
  lat: number
  lng: number
  name: string
}

export function MiniMap({ lat, lng, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const icon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.6)"></div>`,
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(name)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, name])

  return <div ref={containerRef} className="w-full h-full" />
}
