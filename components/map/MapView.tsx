// components/map/MapView.tsx
// ATENÇÃO: este arquivo deve ser importado apenas via dynamic() com ssr: false
"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import type { BusinessMapPin } from "@/types"

// Corrige ícone padrão quebrado do Leaflet com webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  alimentacao:  { emoji: "🍽️", color: "#f97316" },
  beleza:       { emoji: "💅", color: "#ec4899" },
  comercio:     { emoji: "🛍️", color: "#3b82f6" },
  servicos:     { emoji: "🔧", color: "#6b7280" },
  agro:         { emoji: "🌾", color: "#22c55e" },
  saude:        { emoji: "❤️", color: "#ef4444" },
  default:      { emoji: "📍", color: "#1d4ed8" },
}

function getCategoryConfig(slug?: string | null) {
  if (!slug) return CATEGORY_CONFIG.default
  return CATEGORY_CONFIG[slug] ?? CATEGORY_CONFIG.default
}

function createBusinessIcon(pin: BusinessMapPin): L.DivIcon {
  const cfg = getCategoryConfig(pin.category?.slug)
  const size = pin.featured ? 44 : 36
  const border = pin.featured ? "3px solid #eab308" : "2px solid white"
  const shadow = pin.featured ? "0 2px 8px rgba(0,0,0,0.35)" : "0 1px 4px rgba(0,0,0,0.2)"

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${cfg.color};
        border:${border};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:${shadow};
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:${pin.featured ? 18 : 15}px;line-height:1">
          ${cfg.emoji}
        </span>
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

interface Props {
  businesses: BusinessMapPin[]
  userLocation: { lat: number; lng: number } | null
  selectedId: string | null
  onSelectBusiness: (pin: BusinessMapPin | null) => void
  categoryFilter: string | null
  searchQuery: string
}

const DEFAULT_CENTER: [number, number] = [-3.754, -39.453]
const DEFAULT_ZOOM = 14

export function MapView({ businesses, userLocation, selectedId, onSelectBusiness, categoryFilter, searchQuery }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  const filtered = businesses.filter((b) => {
    if (categoryFilter && b.category?.slug !== categoryFilter) return false
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Suprimir warning de exhaustive-deps — filtered é recalculado a cada render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredKey = JSON.stringify(filtered.map((b) => b.id))

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

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    filtered.forEach((pin) => {
      if (pin.latitude === null || pin.longitude === null) return

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: createBusinessIcon(pin),
      })

      marker.on("click", () => onSelectBusiness(pin))
      marker.addTo(map)
      markersRef.current.set(pin.id, marker)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredKey, onSelectBusiness])

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

  // selectedId é recebido mas o destaque visual pode ser adicionado futuramente
  void selectedId

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
