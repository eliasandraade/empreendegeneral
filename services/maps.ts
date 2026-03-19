// Integração com Google Maps Geocoding API
// Converte endereço em coordenadas geográficas

export type GeocodingResult = {
  latitude: number
  longitude: number
  formattedAddress: string
}

// Geocodifica um endereço usando a Google Geocoding API (server-side)
export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurada")
  }

  const encoded = encodeURIComponent(address)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`

  const response = await fetch(url)
  const data = (await response.json()) as {
    status: string
    results: Array<{
      geometry: { location: { lat: number; lng: number } }
      formatted_address: string
    }>
  }

  if (data.status !== "OK" || data.results.length === 0) {
    return null
  }

  const { lat, lng } = data.results[0].geometry.location

  return {
    latitude: lat,
    longitude: lng,
    formattedAddress: data.results[0].formatted_address,
  }
}
