// middleware.ts — Protege rotas autenticadas via cookie de sessão Firebase
import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/constants"

const PROTECTED = ["/dashboard", "/admin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some((path) => pathname.startsWith(path))

  if (!isProtected) return NextResponse.next()

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
