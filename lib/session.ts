// lib/session.ts — Leitura de sessão via cookie (Server Components)
import { cookies } from "next/headers"
import { adminAuth } from "@/lib/firebase-admin"
import { prisma } from "@/lib/prisma"
import { SESSION_COOKIE } from "@/lib/constants"
import type { UserRole } from "@prisma/client"

export interface SessionUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: UserRole
}

/**
 * Retorna o usuário autenticado a partir do cookie de sessão Firebase.
 * Retorna null se não autenticado ou token inválido.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value
    if (!sessionCookie) return null

    // Verifica e decodifica o cookie de sessão Firebase
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, name: true, email: true, image: true, role: true },
    })

    return user
  } catch {
    return null
  }
}

export { SESSION_COOKIE } from "@/lib/constants"
