// app/api/auth/logout/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/constants"

export async function GET() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "https://empreende-general.vercel.app"))
}
