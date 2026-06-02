// components/map/MiniMap.tsx
// ATENÇÃO: importar apenas via dynamic() com ssr: false
"use client"

import { Map, AdvancedMarker, APIProvider } from "@vis.gl/react-google-maps"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0c1b2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c1b2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ab4f8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a3a5c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7aa8d8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#071728" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
]

interface Props {
  lat: number
  lng: number
  name: string
}

export function MiniMap({ lat, lng, name }: Props) {
  const center = { lat, lng }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        mapId="empreende-general-minimap"
        center={center}
        zoom={15}
        disableDefaultUI
        gestureHandling="none"
        keyboardShortcuts={false}
        styles={DARK_STYLE}
        style={{ width: "100%", height: "100%" }}
      >
        <AdvancedMarker position={center} title={name}>
          <div style={{
            width: 16,
            height: 16,
            background: "#3b82f6",
            border: "3px solid white",
            borderRadius: "50%",
            boxShadow: "0 2px 8px rgba(59,130,246,0.6)",
          }} />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  )
}
