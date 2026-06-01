// components/map/MapCanvas.tsx
// Orquestrador client — gerencia estado do mapa, localização, seleção, filtros
"use client"

import { useState, useCallback } from "react"
import { MapPin } from "lucide-react"
import { MapView } from "./MapView"
import { BusinessMapCard } from "./BusinessMapCard"
import { MapOverlayHeader } from "./MapOverlayHeader"
import type { BusinessMapPin } from "@/types"
import type { Category } from "@prisma/client"

interface Props {
  businesses: BusinessMapPin[]
  categories: Pick<Category, "id" | "name" | "slug">[]
  isAuthenticated: boolean
  appName: string
  slogan: string
}

export default function MapCanvas({ businesses, categories, isAuthenticated, appName, slogan }: Props) {
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessMapPin | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [zoomLevel, setZoomLevel] = useState<number>(14)

  const handleSelectBusiness = useCallback((pin: BusinessMapPin | null) => {
    setSelectedBusiness(pin)
  }, [])

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationError(false)
      },
      () => setLocationError(true),
      { timeout: 10000 }
    )
  }

  return (
    <>
      <MapView
        businesses={businesses}
        userLocation={userLocation}
        selectedId={selectedBusiness?.id ?? null}
        onSelectBusiness={handleSelectBusiness}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
      />

      <MapOverlayHeader
        appName={appName}
        slogan={slogan}
        categories={categories}
        isAuthenticated={isAuthenticated}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <button
        onClick={requestLocation}
        title={locationError ? "Localização não disponível" : "Usar minha localização"}
        className={`absolute bottom-6 left-4 z-[500] flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg transition-colors ${
          userLocation
            ? "bg-blue-600 text-white"
            : locationError
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <MapPin size={16} className={userLocation ? "text-white" : "text-blue-600"} />
        {userLocation ? "Localização ativa" : "Usar minha localização"}
      </button>

      {selectedBusiness && (
        <BusinessMapCard
          business={selectedBusiness}
          userLocation={userLocation}
          onClose={() => setSelectedBusiness(null)}
        />
      )}
    </>
  )
}
