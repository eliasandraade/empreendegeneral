// lib/session.ts — Sessão via JWT cookie (sem Firebase)
import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"
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

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET não configurado")
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5d")
    .setIssuedAt()
    .sign(getSecret())
}

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecret())
    const userId = payload.sub as string
    if (!userId) return null

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, role: true },
    })

    return user
  } catch {
    return null
  }
}

export { SESSION_COOKIE } from "@/lib/constants"
