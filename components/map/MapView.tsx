// components/map/MapView.tsx
// ATENÇÃO: importar apenas via dynamic() com ssr: false
"use client"

import { useEffect, useCallback } from "react"
import { Map, AdvancedMarker, useMap, APIProvider } from "@vis.gl/react-google-maps"
import { buildPinHtml } from "@/components/map/mapIcons"
import type { BusinessMapPin } from "@/types"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

const DEFAULT_CENTER = { lat: -3.754, lng: -39.453 }
const DEFAULT_ZOOM = 14
const LABEL_ZOOM_THRESHOLD = 15

// Estilo limpo: remove POIs desnecessários, mantém mapa claro e legível
const CLEAN_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "simplified" }] },
]

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

function MapInner({
  businesses,
  userLocation,
  selectedId,
  onSelectBusiness,
  categoryFilter,
  searchQuery,
  zoomLevel,
  onZoomChange,
}: Props) {
  const map = useMap()

  const filtered = businesses.filter((b) => {
    if (categoryFilter && b.category?.slug !== categoryFilter) return false
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const showLabel = zoomLevel >= LABEL_ZOOM_THRESHOLD

  useEffect(() => {
    if (!map) return
    const listener = map.addListener("zoom_changed", () => {
      onZoomChange(map.getZoom() ?? DEFAULT_ZOOM)
    })
    return () => listener.remove()
  }, [map, onZoomChange])

  useEffect(() => {
    if (!map || !userLocation) return
    map.panTo(userLocation)
    map.setZoom(15)
  }, [map, userLocation])

  const handlePinClick = useCallback(
    (pin: BusinessMapPin) => {
      onSelectBusiness(selectedId === pin.id ? null : pin)
    },
    [onSelectBusiness, selectedId]
  )

  return (
    <>
      {filtered.map((pin) => {
        if (pin.latitude === null || pin.longitude === null) return null
        const { html, width, height } = buildPinHtml(pin, showLabel)
        return (
          <AdvancedMarker
            key={pin.id}
            position={{ lat: pin.latitude, lng: pin.longitude }}
            onClick={() => handlePinClick(pin)}
            title={pin.name}
          >
            <div
              style={{ width, height }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </AdvancedMarker>
        )
      })}

      {userLocation && (
        <AdvancedMarker position={userLocation} title="Você está aqui">
          <div style={{
            width: 20,
            height: 20,
            background: "#3b82f6",
            border: "3px solid white",
            borderRadius: "50%",
            boxShadow: "0 0 0 6px rgba(59,130,246,0.25)",
          }} />
        </AdvancedMarker>
      )}
    </>
  )
}

export function MapView(props: Props) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        mapId="empreende-general-map"
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        disableDefaultUI={false}
        gestureHandling="greedy"
        styles={CLEAN_STYLE}
        style={{ width: "100%", height: "100%" }}
        onClick={() => props.onSelectBusiness(null)}
      >
        <MapInner {...props} />
      </Map>
    </APIProvider>
  )
}
