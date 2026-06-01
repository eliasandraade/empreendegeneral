// components/map/MapView.tsx
// ATENÇÃO: este arquivo deve ser importado apenas via dynamic() com ssr: false
"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import { createBusinessIcon } from "@/components/map/mapIcons"
import type { BusinessMapPin } from "@/types"

// Corrige ícone padrão quebrado do Leaflet com webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface Props {
  businesses: BusinessMapPin[]
  userLocation: { lat: number; lng: number } | null
  selectedId: string | null
  onSelectBusiness: (pin: BusinessMapPin | null) => void
  categoryFilter: string | null
  searchQuery: string
  zoomLevel: number
  onZoomChange: (zoom: number) => void
}

const DEFAULT_CENTER: [number, number] = [-3.754, -39.453]
const DEFAULT_ZOOM = 14
const LABEL_ZOOM_THRESHOLD = 15

export function MapView({
  businesses,
  userLocation,
  selectedId,
  onSelectBusiness,
  categoryFilter,
  searchQuery,
  zoomLevel,
  onZoomChange,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  const filtered = businesses.filter((b) => {
    if (categoryFilter && b.category?.slug !== categoryFilter) return false
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredKey = JSON.stringify(filtered.map((b) => b.id)) + `-z${zoomLevel >= LABEL_ZOOM_THRESHOLD}`

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const handleZoom = () => onZoomChange(map.getZoom())
    map.on("zoomend", handleZoom)

    mapRef.current = map

    return () => {
      map.off("zoomend", handleZoom)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recriar markers quando filtro, busca ou threshold de zoom mudam
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    const showLabel = zoomLevel >= LABEL_ZOOM_THRESHOLD

    filtered.forEach((pin) => {
      if (pin.latitude === null || pin.longitude === null) return

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: createBusinessIcon(pin, showLabel),
      })

      marker.on("click", () => onSelectBusiness(pin))
      marker.addTo(map)
      markersRef.current.set(pin.id, marker)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredKey, onSelectBusiness])

  // Localização do usuário
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userLocation) return

    const userIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup("Você está aqui")

    map.setView([userLocation.lat, userLocation.lng], 15)

    return () => { marker.remove() }
  }, [userLocation])

  void selectedId

  return <div ref={containerRef} className="w-full h-full" />
}
