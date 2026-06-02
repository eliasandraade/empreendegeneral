// components/map/MapView.tsx
// ATENÇÃO: importar apenas via dynamic() com ssr: false
"use client"

import { useEffect, useRef } from "react"
import { Map, useMap, APIProvider } from "@vis.gl/react-google-maps"
import { buildPinHtml } from "@/components/map/mapIcons"
import type { BusinessMapPin } from "@/types"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

const DEFAULT_CENTER = { lat: -3.754, lng: -39.453 }
const DEFAULT_ZOOM = 14
const LABEL_ZOOM_THRESHOLD = 15

// Estilos plain — sem referência a google.maps no nível do módulo
// (google só existe após o APIProvider carregar o script)
const CLEAN_STYLE = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
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

// Tipo opaco para os overlays — evita referenciar google.maps no nível do módulo
type AnyOverlay = {
  setMap(map: google.maps.Map | null): void
  updateHtml(html: string): void
}

// Factory: cria o overlay apenas quando google já está disponível (dentro de useEffect)
function createHtmlOverlay(
  position: google.maps.LatLng,
  html: string,
  anchorX: number,
  anchorY: number,
  onClick: () => void
): AnyOverlay {
  class HtmlOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null

    onAdd() {
      this.div = document.createElement("div")
      this.div.style.position = "absolute"
      this.div.style.cursor = "pointer"
      this.div.innerHTML = html
      this.div.addEventListener("click", (e) => {
        e.stopPropagation()
        onClick()
      })
      this.getPanes()!.overlayMouseTarget.appendChild(this.div)
    }

    draw() {
      if (!this.div) return
      const point = this.getProjection().fromLatLngToDivPixel(position)
      if (!point) return
      this.div.style.left = `${point.x - anchorX}px`
      this.div.style.top = `${point.y - anchorY}px`
    }

    onRemove() {
      if (this.div?.parentNode) this.div.parentNode.removeChild(this.div)
      this.div = null
    }

    updateHtml(newHtml: string) {
      if (this.div) this.div.innerHTML = newHtml
    }
  }

  return new HtmlOverlay()
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
  const overlaysRef = useRef<globalThis.Map<string, AnyOverlay>>(new globalThis.Map())
  const userOverlayRef = useRef<AnyOverlay | null>(null)

  const filtered = businesses.filter((b) => {
    if (categoryFilter && b.category?.slug !== categoryFilter) return false
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const showLabel = zoomLevel >= LABEL_ZOOM_THRESHOLD

  // Listener de zoom
  useEffect(() => {
    if (!map) return
    const listener = map.addListener("zoom_changed", () => {
      onZoomChange(map.getZoom() ?? DEFAULT_ZOOM)
    })
    return () => listener.remove()
  }, [map, onZoomChange])

  // Pan para localização do usuário
  useEffect(() => {
    if (!map || !userLocation) return
    map.panTo(userLocation)
    map.setZoom(15)
  }, [map, userLocation])

  // Gerencia overlays dos pins de negócios
  useEffect(() => {
    if (!map) return

    const currentIds = new Set(filtered.map((b) => b.id))
    const existingIds = new Set(overlaysRef.current.keys())

    // Remove pins que saíram do filtro
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        overlaysRef.current.get(id)?.setMap(null)
        overlaysRef.current.delete(id)
      }
    })

    // Adiciona ou atualiza pins
    filtered.forEach((pin) => {
      if (pin.latitude === null || pin.longitude === null) return
      const { html, anchorX, anchorY } = buildPinHtml(pin, showLabel)
      const latlng = new google.maps.LatLng(pin.latitude, pin.longitude)

      if (overlaysRef.current.has(pin.id)) {
        overlaysRef.current.get(pin.id)!.updateHtml(html)
      } else {
        const overlay = createHtmlOverlay(latlng, html, anchorX, anchorY, () =>
          onSelectBusiness(selectedId === pin.id ? null : pin)
        )
        ;(overlay as unknown as google.maps.OverlayView).setMap(map)
        overlaysRef.current.set(pin.id, overlay)
      }
    })
  }, [map, filtered, showLabel, selectedId, onSelectBusiness])

  // Limpa todos os overlays ao desmontar o componente
  useEffect(() => {
    const overlays = overlaysRef.current
    return () => {
      overlays.forEach((o) => o.setMap(null))
      overlays.clear()
    }
  }, [])

  // Overlay do marcador de localização do usuário
  useEffect(() => {
    if (!map) return

    userOverlayRef.current?.setMap(null)
    userOverlayRef.current = null

    if (!userLocation) return

    const html = `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(59,130,246,0.25);"></div>`
    const latlng = new google.maps.LatLng(userLocation.lat, userLocation.lng)
    const overlay = createHtmlOverlay(latlng, html, 10, 10, () => {})
    ;(overlay as unknown as google.maps.OverlayView).setMap(map)
    userOverlayRef.current = overlay

    return () => overlay.setMap(null)
  }, [map, userLocation])

  return null
}

export function MapView(props: Props) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
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
