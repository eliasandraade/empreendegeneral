// Middleware do Next.js — protege rotas autenticadas via Auth.js v5

export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    // Protege rotas do painel do empreendedor e admin
    "/dashboard/:path*",
    "/admin/:path*",
  ],
}
