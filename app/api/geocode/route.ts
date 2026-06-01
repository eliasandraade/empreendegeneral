// app/api/geocode/route.ts
import { NextRequest, NextResponse } from "next/server"
import { geocodeAddress } from "@/services/maps"

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")

  if (!address || address.trim().length < 3) {
    return NextResponse.json({ error: "invalid_address" }, { status: 400 })
  }

  try {
    const result = await geocodeAddress(address.trim())

    if (!result) {
      return NextResponse.json({ error: "address_not_found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "geocoding_error" }, { status: 500 })
  }
}
