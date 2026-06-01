// lib/actions/business.ts
"use server"

import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { createBusinessSchema } from "@/validations"
import { generateUniqueSlug } from "@/lib/slug"
import type { ActionResult } from "@/types"

export async function createBusinessAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getServerSession()

  if (!session?.id) {
    return { success: false, error: "Você precisa estar autenticado." }
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || undefined,
    instagram: formData.get("instagram") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    zipCode: formData.get("zipCode") || undefined,
    hours: formData.get("hours") || undefined,
    formattedAddress: formData.get("formattedAddress") || undefined,
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  }

  const result = createBusinessSchema.safeParse(raw)

  if (!result.success) {
    const firstError = result.error.message ?? "Dados inválidos."
    return { success: false, error: firstError }
  }

  const data = result.data
  const slug = await generateUniqueSlug(data.name)

  await prisma.business.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      categoryId: data.categoryId,
      phone: data.phone,
      website: data.website,
      instagram: data.instagram,
      whatsapp: data.whatsapp,
      address: data.address ?? data.formattedAddress,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      hours: data.hours,
      latitude: data.latitude,
      longitude: data.longitude,
      status: "PENDING",
      ownerId: session.id,
    },
  })

  redirect("/dashboard?cadastro=sucesso")
}
