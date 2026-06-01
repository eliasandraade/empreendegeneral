// lib/actions/admin.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/types"

function isAdminRole(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN"
}

export async function approveBusinessAction(businessId: string): Promise<ActionResult<undefined>> {
  const session = await auth()

  if (!session?.user?.id || !isAdminRole(session.user.role as string)) {
    return { success: false, error: "Acesso negado." }
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: { select: { id: true, role: true } } },
  })

  if (!business) return { success: false, error: "Negócio não encontrado." }

  await prisma.$transaction(async (tx) => {
    await tx.business.update({ where: { id: businessId }, data: { status: "APPROVED" } })

    if (business.owner.role === "USER") {
      await tx.user.update({ where: { id: business.owner.id }, data: { role: "ENTREPRENEUR" } })
      await tx.entrepreneurProfile.upsert({
        where: { userId: business.owner.id },
        create: { userId: business.owner.id },
        update: {},
      })
    }

    await tx.adminAction.create({
      data: { adminId: session.user.id, action: "APPROVE_BUSINESS", targetId: businessId },
    })
  })

  revalidatePath("/admin/businesses")
  revalidatePath("/businesses")
  revalidatePath("/")
  revalidatePath(`/businesses/${business.slug}`)

  return { success: true, data: undefined }
}

export async function rejectBusinessAction(businessId: string, reason: string): Promise<ActionResult<undefined>> {
  const session = await auth()

  if (!session?.user?.id || !isAdminRole(session.user.role as string)) {
    return { success: false, error: "Acesso negado." }
  }

  if (!reason || reason.trim().length < 10) {
    return { success: false, error: "Informe o motivo da rejeição (mínimo 10 caracteres)." }
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  })

  if (!business) return { success: false, error: "Negócio não encontrado." }

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: businessId },
      data: { status: "REJECTED", rejectionReason: reason.trim() },
    })
    await tx.adminAction.create({
      data: { adminId: session.user.id, action: "REJECT_BUSINESS", targetId: businessId, reason: reason.trim() },
    })
  })

  revalidatePath("/admin/businesses")

  return { success: true, data: undefined }
}
