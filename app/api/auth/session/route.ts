// app/api/auth/session/route.ts — Criar e encerrar sessão Firebase
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { adminAuth } from "@/lib/firebase-admin"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

const SESSION_COOKIE = "__session"
const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000 // 5 dias em ms

// POST /api/auth/session — recebe idToken, cria sessão e seta cookie
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken) {
      return NextResponse.json({ error: "idToken obrigatório" }, { status: 400 })
    }

    // Verifica o ID token e cria cookie de sessão de longa duração
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    })

    // Decodifica para obter dados do usuário Firebase
    const decoded = await adminAuth.verifyIdToken(idToken)
    const { uid, email, name, picture } = decoded

    // Busca lista de admins no env
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    // Upsert do usuário no banco de dados
    const isAdmin = email ? adminEmails.includes(email.toLowerCase()) : false

    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: {
        name: name ?? undefined,
        email: email ?? undefined,
        image: picture ?? undefined,
        // Promove para SUPER_ADMIN se email estiver na lista e ainda não for admin
        ...(isAdmin && { role: "SUPER_ADMIN" as UserRole }),
      },
      create: {
        firebaseUid: uid,
        name: name ?? null,
        email: email ?? null,
        image: picture ?? null,
        role: (isAdmin ? "SUPER_ADMIN" : "USER") as UserRole,
      },
    })

    // Seta cookie HTTP-only seguro
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION / 1000, // em segundos
      path: "/",
    })

    return NextResponse.json({ ok: true, role: user.role })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Erro ao criar sessão:", msg)
    return NextResponse.json({ error: "Falha na autenticação", detail: msg }, { status: 401 })
  }
}

// DELETE /api/auth/session — encerra sessão (logout)
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
