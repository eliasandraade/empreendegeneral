// app/api/auth/session/route.ts — Login email/senha + logout
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { createSessionToken } from "@/lib/session"
import { SESSION_COOKIE } from "@/lib/constants"
import bcrypt from "bcryptjs"
import type { UserRole } from "@prisma/client"

const SESSION_MAX_AGE = 60 * 60 * 24 * 5 // 5 dias em segundos

// POST /api/auth/session — login com email/senha
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 })
    }

    // Verifica credenciais de admin via variável de ambiente
    const adminEmail = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase())
    const adminPassword = process.env.ADMIN_PASSWORD

    const isAdminEmail = adminEmail?.includes(email.toLowerCase())

    if (!isAdminEmail || !adminPassword) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Compara senha com hash armazenado (ou plain text em desenvolvimento)
    const passwordMatch = adminPassword.startsWith("$2")
      ? await bcrypt.compare(password, adminPassword)
      : password === adminPassword

    if (!passwordMatch) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Upsert do admin no banco
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { role: "SUPER_ADMIN" as UserRole },
      create: {
        email: email.toLowerCase(),
        name: "Admin",
        role: "SUPER_ADMIN" as UserRole,
      },
      select: { id: true, role: true },
    })

    // Cria token JWT e seta cookie HTTP-only
    const token = await createSessionToken(user.id)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    })

    return NextResponse.json({ ok: true, role: user.role })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Erro no login:", msg)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// DELETE /api/auth/session — logout
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
