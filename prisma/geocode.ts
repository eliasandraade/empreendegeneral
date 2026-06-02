/**
 * Geocodificação em lote — Empreende General
 * Popula latitude/longitude nos negócios que ainda não têm coordenadas.
 * Usa Google Geocoding API. Idempotente: ignora negócios já geocodificados.
 *
 * Execução: npx tsx prisma/geocode.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

if (!API_KEY) {
  console.error("❌ GOOGLE_MAPS_API_KEY não encontrada no ambiente")
  process.exit(1)
}

const DELAY_MS = 200 // respeitar rate limit da API (50 req/s)

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}` +
    `&key=${API_KEY}`

  const res = await fetch(url, {
    headers: { Referer: "https://empreende-general.vercel.app/" },
  })
  if (!res.ok) return null

  const data = (await res.json()) as {
    status: string
    results: { geometry: { location: { lat: number; lng: number } } }[]
  }

  if (data.status !== "OK" || !data.results[0]) return null
  return data.results[0].geometry.location
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log("🗺️  Geocodificação em lote — Empreende General\n")

  const businesses = await prisma.business.findMany({
    where: { latitude: null },
    select: { id: true, name: true, address: true },
  })

  console.log(`📍 ${businesses.length} negócios sem coordenadas\n`)

  if (businesses.length === 0) {
    console.log("✅ Todos os negócios já têm coordenadas.")
    return
  }

  let ok = 0
  let failed = 0

  for (let i = 0; i < businesses.length; i++) {
    const b = businesses[i]
    const address = b.address ?? "General Sampaio, CE"

    process.stdout.write(`\r   [${i + 1}/${businesses.length}] ${b.name.slice(0, 40).padEnd(40)}`)

    const coords = await geocodeAddress(address)

    if (coords) {
      await prisma.business.update({
        where: { id: b.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      })
      ok++
    } else {
      // Fallback: centro de General Sampaio
      await prisma.business.update({
        where: { id: b.id },
        data: { latitude: -3.7540, longitude: -39.4530 },
      })
      failed++
    }

    if (i < businesses.length - 1) await sleep(DELAY_MS)
  }

  console.log("\n\n📊 Relatório")
  console.log("─".repeat(30))
  console.log(`   ✅ Geocodificados : ${ok}`)
  console.log(`   📌 Fallback (centro): ${failed}`)
  console.log("\n🎉 Geocodificação concluída!")
}

main()
  .catch((e) => {
    console.error("\n❌ Falhou:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
