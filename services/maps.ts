// services/maps.ts
// Geocodificação via Nominatim (OpenStreetMap) — gratuito, sem API key
// Rate limit: 1 req/s (aceitável para geocodificação manual de formulário)

export type GeocodingResult = {
  latitude: number
  longitude: number
  formattedAddress: string
}

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  const encoded = encodeURIComponent(address.trim())
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=br&addressdetails=1`

  const response = await fetch(url, {
    headers: {
      "User-Agent": "EmpreendedorGeneral/1.0 (contato@andradesystems.com.br)",
      "Accept-Language": "pt-BR,pt",
    },
    next: { revalidate: 3600 },
  })

  if (!response.ok) return null

  const data = (await response.json()) as Array<{
    lat: string
    lon: string
    display_name: string
  }>

  if (!data || data.length === 0) return null

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
    formattedAddress: data[0].display_name,
  }
}
