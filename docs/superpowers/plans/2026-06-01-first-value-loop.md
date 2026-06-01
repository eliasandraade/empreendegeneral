# First Value Loop Implementation Plan (v2 — mapa-first)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Login Google → cadastro de negócio com localização → aprovação admin → negócio aparece como pin no mapa público.

**Architecture:** Auth.js v5 com PrismaAdapter + ADMIN_EMAILS callback para SUPER_ADMIN. Geocodificação via Nominatim (OpenStreetMap, sem API key). Homepage map-first com Leaflet/React-Leaflet. Route groups separam rotas com Header (`(main)`) da homepage mapa. Server Actions para todas as mutations.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Prisma/PostgreSQL, Auth.js v5, Zod, Tailwind CSS, Leaflet + React-Leaflet, Nominatim (geocodificação gratuita).

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `prisma/schema.prisma` | Modify | ✅ DONE — SUPER_ADMIN, EntrepreneurProfile, AdminAction, hours, rejectionReason |
| `auth.ts` | Modify | Callback signIn para promoção via ADMIN_EMAILS |
| `services/maps.ts` | Modify | Nominatim geocoding (sem API key) |
| `lib/slug.ts` | Create | Utilitário de geração de slug único |
| `lib/actions/business.ts` | Create | createBusinessAction (Server Action) |
| `lib/actions/admin.ts` | Create | approveBusinessAction + rejectBusinessAction |
| `validations/index.ts` | Modify | lat/lng obrigatórios em createBusinessSchema |
| `app/api/geocode/route.ts` | Create | Route handler GET /api/geocode via Nominatim |
| `app/layout.tsx` | Modify | Root layout mínimo (sem Header/Footer) |
| `app/(main)/layout.tsx` | Create | Layout com Header + Footer para rotas secundárias |
| `app/(main)/login/page.tsx` | Create | Página de login com Google |
| `app/(main)/businesses/` | Move | Mover de app/businesses/ para app/(main)/businesses/ |
| `components/layout/UserMenu.tsx` | Create | Dropdown de usuário autenticado (client) |
| `components/layout/MobileMenuButton.tsx` | Create | Menu mobile (client) |
| `components/layout/Header.tsx` | Modify | Server Component + UserMenu |
| `components/businesses/LocationPicker.tsx` | Create | Seletor de localização com OSM (client) |
| `components/businesses/BusinessForm.tsx` | Create | Formulário completo de cadastro (client) |
| `app/(main)/dashboard/new/page.tsx` | Create | Página de cadastro de negócio |
| `app/(main)/dashboard/page.tsx` | Create | Dashboard do empreendedor |
| `app/(main)/admin/businesses/page.tsx` | Create | Painel admin — lista de negócios |
| `components/map/MapView.tsx` | Create | Mapa Leaflet SSR-safe com pins por categoria |
| `components/map/BusinessMapCard.tsx` | Create | Card overlay ao clicar em pin |
| `components/map/MapOverlayHeader.tsx` | Create | Header/busca/filtros sobre o mapa (client) |
| `app/page.tsx` | Modify | Homepage map-first (substitui hero atual) |
| `types/index.ts` | Modify | Adicionar LocationData, BusinessMapPin |

---

## Task 1: Schema Prisma — novos modelos e campos ✅ CONCLUÍDA

Schema já foi atualizado. Migration pendente (banco Railway estava inacessível no momento).

**Quando o banco estiver acessível, rodar:**

```bash
cd C:/Users/Elias/Documents/Prefeitura/empreende-general
npx prisma migrate dev --name add-super-admin-entrepreneur-profile-admin-action-hours
npx prisma generate
git add prisma/
git commit -m "feat: add SUPER_ADMIN role, EntrepreneurProfile, AdminAction, rejectionReason, hours"
```

---

## Task 2: Geocodificação via Nominatim (sem API key)

**Files:**
- Modify: `services/maps.ts`

- [ ] **Step 1: Reescrever services/maps.ts com Nominatim**

Substituir todo o conteúdo de `services/maps.ts`:

```ts
// services/maps.ts
// Geocodificação via Nominatim (OpenStreetMap) — gratuito, sem API key
// Rate limit: 1 req/s (aceitável para geocodificação manual de formulário)

export type GeocodingResult = {
  latitude: number
  longitude: number
  formattedAddress: string
}

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  const encoded = encodeURIComponent(address.trim())
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=br&addressdetails=1`

  const response = await fetch(url, {
    headers: {
      "User-Agent": "EmpreendedorGeneral/1.0 (contato@andradesystems.com.br)",
      "Accept-Language": "pt-BR,pt",
    },
    next: { revalidate: 3600 }, // cache resultado por 1h no Next.js
  })

  if (!response.ok) return null

  const data = (await response.json()) as Array<{
    lat: string
    lon: string
    display_name: string
  }>

  if (!data || data.length === 0) return null

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
    formattedAddress: data[0].display_name,
  }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add services/maps.ts
git commit -m "feat: replace Google Maps geocoding with Nominatim (OpenStreetMap, no API key)"
```

---

## Task 3: Auth.js — callback signIn para promoção SUPER_ADMIN

**Files:**
- Modify: `auth.ts`

- [ ] **Step 1: Adicionar callback signIn**

Substituir o bloco `callbacks` em `auth.ts` por:

```ts
callbacks: {
  async signIn({ user }) {
    if (!user?.email) return true

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    if (adminEmails.includes(user.email.toLowerCase())) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, role: true },
      })
      if (dbUser && dbUser.role !== "SUPER_ADMIN") {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: "SUPER_ADMIN" },
        })
      }
    }

    return true
  },
  async session({ session, user }) {
    if (session.user) {
      session.user.id = user.id
      session.user.role = user.role as UserRole
    }
    return session
  },
},
```

O `auth.ts` completo:

```ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"
import type { Adapter } from "next-auth/adapters"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return true

      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)

      if (adminEmails.includes(user.email.toLowerCase())) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true },
        })
        if (dbUser && dbUser.role !== "SUPER_ADMIN") {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: "SUPER_ADMIN" },
          })
        }
      }

      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
```

- [ ] **Step 2: Adicionar ADMIN_EMAILS ao .env.local**

```env
ADMIN_EMAILS=seuemail@gmail.com
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add auth.ts
git commit -m "feat: promote SUPER_ADMIN on first login via ADMIN_EMAILS env var"
```

---

## Task 4: Route Groups — separar homepage de rotas com header

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/(main)/layout.tsx`
- Move: `app/businesses/` → `app/(main)/businesses/`

> Contexto: o root layout atual tem Header e Footer. A homepage map-first não quer esses elementos. Route groups resolvem isso elegantemente no Next.js App Router.

- [ ] **Step 1: Simplificar app/layout.tsx (remover Header e Footer)**

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { APP_CONFIG } from "@/config"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Criar app/(main)/layout.tsx com Header + Footer**

```tsx
// app/(main)/layout.tsx
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 3: Mover app/businesses/ para app/(main)/businesses/**

No Windows PowerShell:

```powershell
New-Item -ItemType Directory -Path "app/(main)" -Force
Move-Item "app/businesses" "app/(main)/businesses"
```

- [ ] **Step 4: Verificar que as rotas continuam funcionando**

```bash
npm run build 2>&1 | head -50
```

Saída esperada: sem erros de rotas. `/businesses` e `/businesses/[slug]` devem continuar acessíveis.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx "app/(main)/"
git commit -m "refactor: root layout minimal, (main) route group with Header+Footer"
```

---

## Task 5: Página de login e Header com UserMenu

**Files:**
- Create: `app/(main)/login/page.tsx`
- Create: `components/layout/UserMenu.tsx`
- Create: `components/layout/MobileMenuButton.tsx`
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Criar app/(main)/login/page.tsx**

```tsx
// app/(main)/login/page.tsx
import { signIn } from "@/auth"

export const metadata = { title: "Entrar — Empreende General" }

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Entrar</h1>
          <p className="text-gray-500 text-sm">
            Use sua conta Google para acessar a plataforma.
          </p>
        </div>

        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/dashboard" })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao entrar, você concorda com nossos{" "}
          <a href="/termos" className="underline">Termos de Uso</a> e{" "}
          <a href="/privacidade" className="underline">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar components/layout/UserMenu.tsx**

```tsx
// components/layout/UserMenu.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react"

interface UserMenuProps {
  name: string | null | undefined
  email: string | null | undefined
  image: string | null | undefined
  role: string
}

export function UserMenu({ name, email, image, role }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const initials = name?.slice(0, 1).toUpperCase() ?? "?"
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors"
      >
        {image ? (
          <Image src={image} alt={name ?? "Usuário"} width={28} height={28} className="rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden md:block">
          {name ?? email}
        </span>
        <ChevronDown size={14} className="text-gray-400 hidden md:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
            <LayoutDashboard size={15} className="text-gray-400" />
            Meu painel
          </Link>
          {isAdmin && (
            <Link href="/admin/businesses" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
              <ShieldCheck size={15} className="text-blue-600" />
              Painel admin
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Criar components/layout/MobileMenuButton.tsx**

```tsx
// components/layout/MobileMenuButton.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { signOut } from "next-auth/react"

interface Props {
  navLinks: { href: string; label: string }[]
  user: { name?: string | null; email?: string | null; role: string } | null
}

export function MobileMenuButton({ navLinks, user }: Props) {
  const [open, setOpen] = useState(false)
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

  return (
    <>
      <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(!open)} aria-label="Menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-t border-gray-100 bg-white shadow-md z-40">
          <nav className="container flex flex-col py-4 gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-gray-600 hover:text-blue-700" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-100" />
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>Meu painel</Link>
                {isAdmin && (
                  <Link href="/admin/businesses" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>Painel admin</Link>
                )}
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-sm font-medium text-red-600">Sair</button>
              </>
            ) : (
              <>
                <Link href="/dashboard/new" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>Cadastrar negócio</Link>
                <Link href="/login" className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg text-center" onClick={() => setOpen(false)}>Entrar</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Reescrever Header como Server Component**

```tsx
// components/layout/Header.tsx
import Link from "next/link"
import { auth } from "@/auth"
import { APP_CONFIG } from "@/config"
import { UserMenu } from "./UserMenu"
import { MobileMenuButton } from "./MobileMenuButton"

const navLinks = [
  { href: "/businesses", label: "Negócios" },
]

export async function Header() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-700">{APP_CONFIG.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-gray-600 hover:text-blue-700 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <UserMenu name={user.name} email={user.email} image={user.image} role={user.role} />
          ) : (
            <>
              <Link href="/dashboard/new" className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors">
                Cadastrar negócio
              </Link>
              <Link href="/login" className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                Entrar
              </Link>
            </>
          )}
        </div>

        <MobileMenuButton user={user ?? null} navLinks={navLinks} />
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Atualizar middleware.ts para incluir nova rota /login**

O middleware já protege `/dashboard/*` e `/admin/*`. Verificar que `/login` NÃO está protegido (não deve estar). Verificar `middleware.ts`:

```ts
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
```

Nenhuma mudança necessária se já estiver assim.

- [ ] **Step 6: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add "app/(main)/login/" components/layout/
git commit -m "feat: login page, Header as Server Component, UserMenu, MobileMenuButton"
```

---

## Task 6: Route Handler GET /api/geocode (Nominatim)

**Files:**
- Create: `app/api/geocode/route.ts`

- [ ] **Step 1: Criar route handler**

```ts
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
```

- [ ] **Step 2: Testar manualmente com o servidor rodando**

```bash
npm run dev
```

Em outro terminal ou no browser:

```
http://localhost:3000/api/geocode?address=General+Sampaio+CE
```

Saída esperada:
```json
{ "latitude": -3.754, "longitude": -39.453, "formattedAddress": "General Sampaio, Ceará, Brasil" }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/geocode/
git commit -m "feat: GET /api/geocode route handler via Nominatim (no API key)"
```

---

## Task 7: LocationPicker + LocationData type

**Files:**
- Modify: `types/index.ts`
- Create: `components/businesses/LocationPicker.tsx`

- [ ] **Step 1: Adicionar LocationData e BusinessMapPin a types/index.ts**

Adicionar ao final de `types/index.ts`:

```ts
export type LocationData = {
  latitude: number
  longitude: number
  formattedAddress: string
}

export type BusinessMapPin = {
  id: string
  name: string
  slug: string
  latitude: number
  longitude: number
  featured: boolean
  phone: string | null
  whatsapp: string | null
  address: string | null
  category: { name: string; slug: string; icon: string | null } | null
}
```

- [ ] **Step 2: Criar LocationPicker**

```tsx
// components/businesses/LocationPicker.tsx
"use client"

import { useState } from "react"
import { MapPin, Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import type { LocationData } from "@/types"

interface Props {
  onConfirm: (data: LocationData) => void
  onReset: () => void
  confirmed: boolean
}

type State = "idle" | "searching" | "preview" | "confirmed" | "error"

export function LocationPicker({ onConfirm, onReset, confirmed }: Props) {
  const [address, setAddress] = useState("")
  const [state, setState] = useState<State>(confirmed ? "confirmed" : "idle")
  const [result, setResult] = useState<LocationData | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSearch() {
    if (address.trim().length < 3) return
    setState("searching")
    setErrorMsg("")

    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        if (data.error === "address_not_found") {
          setErrorMsg("Endereço não encontrado. Tente ser mais específico.")
        } else {
          setErrorMsg("Erro ao buscar endereço. Tente novamente.")
        }
        setState("error")
        return
      }

      setResult(data as LocationData)
      setState("preview")
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua internet.")
      setState("error")
    }
  }

  function handleConfirm() {
    if (!result) return
    onConfirm(result)
    setState("confirmed")
  }

  function handleReset() {
    setAddress("")
    setState("idle")
    setResult(null)
    setErrorMsg("")
    onReset()
  }

  const mapSrc = result
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${result.longitude - 0.01},${result.latitude - 0.01},${result.longitude + 0.01},${result.latitude + 0.01}&layer=mapnik&marker=${result.latitude},${result.longitude}`
    : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-blue-400 transition-colors">
          <MapPin size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            placeholder="Ex.: Rua das Flores 123, General Sampaio, CE"
            disabled={state === "confirmed"}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={state === "searching" || state === "confirmed" || address.trim().length < 3}
          className="flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {state === "searching" ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Buscar
        </button>
      </div>

      {state === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      {state === "preview" && mapSrc && result && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl overflow-hidden border border-gray-200 h-48">
            <iframe src={mapSrc} width="100%" height="100%" className="border-0" loading="lazy" title="Localização no mapa" />
          </div>
          <p className="text-sm text-gray-600 flex items-start gap-2">
            <MapPin size={14} className="text-blue-600 mt-0.5 shrink-0" />
            {result.formattedAddress}
          </p>
          <p className="text-xs text-gray-400">Não é o endereço certo? Corrija o campo e busque novamente.</p>
          <button
            type="button"
            onClick={handleConfirm}
            className="self-start flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 size={15} />
            Confirmar localização
          </button>
        </div>
      )}

      {state === "confirmed" && result && (
        <div className="flex items-start justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Localização confirmada</p>
              <p className="text-xs text-green-600 mt-0.5">{result.formattedAddress}</p>
            </div>
          </div>
          <button type="button" onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0 ml-3">
            Corrigir
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add types/index.ts components/businesses/LocationPicker.tsx
git commit -m "feat: LocationPicker with OSM preview, LocationData and BusinessMapPin types"
```

---

## Task 8: Slug utility + createBusinessSchema atualizado

**Files:**
- Create: `lib/slug.ts`
- Modify: `validations/index.ts`

- [ ] **Step 1: Criar lib/slug.ts**

```ts
// lib/slug.ts
import { prisma } from "@/lib/prisma"

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name)

  const exists = await prisma.business.findUnique({
    where: { slug: base },
    select: { id: true },
  })
  if (!exists) return base

  let counter = 2
  while (true) {
    const candidate = `${base}-${counter}`
    const taken = await prisma.business.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!taken) return candidate
    counter++
  }
}
```

- [ ] **Step 2: Atualizar createBusinessSchema em validations/index.ts**

Substituir o schema `createBusinessSchema`:

```ts
export const createBusinessSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  description: z.string().max(2000, "Descrição muito longa").optional(),
  categoryId: z.string().cuid("Categoria inválida").optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  instagram: z.string().max(50).optional(),
  whatsapp: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2, "UF deve ter 2 caracteres").optional(),
  zipCode: z.string().max(9).optional(),
  hours: z.string().max(200).optional(),
  formattedAddress: z.string().max(300).optional(),
  latitude: z.coerce
    .number({ invalid_type_error: "Localização obrigatória" })
    .min(-90)
    .max(90),
  longitude: z.coerce
    .number({ invalid_type_error: "Localização obrigatória" })
    .min(-180)
    .max(180),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/slug.ts validations/index.ts
git commit -m "feat: slug utility and lat/lng required in business schema"
```

---

## Task 9: Server Action createBusinessAction

**Files:**
- Create: `lib/actions/business.ts`

- [ ] **Step 1: Criar arquivo**

```ts
// lib/actions/business.ts
"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createBusinessSchema } from "@/validations"
import { generateUniqueSlug } from "@/lib/slug"
import type { ActionResult } from "@/types"

export async function createBusinessAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()

  if (!session?.user?.id) {
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
    const firstError = result.error.errors[0]?.message ?? "Dados inválidos."
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
      ownerId: session.user.id,
    },
  })

  redirect("/dashboard?cadastro=sucesso")
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/business.ts
git commit -m "feat: createBusinessAction with Nominatim geocoding and slug generation"
```

---

## Task 10: BusinessForm client component

**Files:**
- Create: `components/businesses/BusinessForm.tsx`

- [ ] **Step 1: Criar componente**

```tsx
// components/businesses/BusinessForm.tsx
"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { createBusinessAction } from "@/lib/actions/business"
import { LocationPicker } from "./LocationPicker"
import type { Category } from "@prisma/client"
import type { ActionResult, LocationData } from "@/types"

interface Props {
  categories: Category[]
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "Enviando..." : "Cadastrar negócio"}
    </button>
  )
}

export function BusinessForm({ categories }: Props) {
  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    createBusinessAction,
    null
  )
  const [locationData, setLocationData] = useState<LocationData | null>(null)

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="latitude" value={locationData?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={locationData?.longitude ?? ""} />
      <input type="hidden" name="formattedAddress" value={locationData?.formattedAddress ?? ""} />

      {state && !state.success && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Seção 1: Dados básicos */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Dados básicos</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do negócio <span className="text-red-500">*</span>
            </label>
            <input name="name" required maxLength={100} placeholder="Ex.: Padaria do Zé" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
            <select name="categoryId" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Selecionar categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <textarea name="description" rows={4} maxLength={2000} placeholder="Conte sobre seu negócio..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none" />
          </div>
        </div>
      </section>

      {/* Seção 2: Contato */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Contato</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
            <input name="phone" type="tel" placeholder="(85) 99999-9999" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
            <input name="whatsapp" type="tel" placeholder="(85) 99999-9999" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
            <input name="instagram" placeholder="@seuperfil" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site</label>
            <input name="website" type="url" placeholder="https://exemplo.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        </div>
      </section>

      {/* Seção 3: Localização */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">
          Localização <span className="text-red-500">*</span>
        </h2>
        <p className="text-xs text-gray-400 mb-4">Digite o endereço, confirme o pin no mapa e clique em "Confirmar localização".</p>
        <div className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
              <input name="address" placeholder="Rua, número, bairro" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
              <input name="city" defaultValue="General Sampaio" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">UF</label>
              <input name="state" defaultValue="CE" maxLength={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 uppercase" />
            </div>
          </div>
          <LocationPicker
            onConfirm={setLocationData}
            onReset={() => setLocationData(null)}
            confirmed={!!locationData}
          />
          {!locationData && (
            <p className="text-xs text-amber-600">⚠ Confirme a localização no mapa para prosseguir.</p>
          )}
        </div>
      </section>

      {/* Seção 4: Horários */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Horários</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário de funcionamento</label>
          <input name="hours" placeholder="Ex.: Seg–Sex 8h–18h, Sáb 8h–12h" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
        </div>
      </section>

      <div className="pt-2">
        <SubmitButton disabled={!locationData} />
        <p className="text-xs text-gray-400 text-center mt-3">Seu negócio será revisado antes de aparecer publicamente.</p>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/businesses/BusinessForm.tsx
git commit -m "feat: BusinessForm with LocationPicker, useFormState, submit blocked without location"
```

---

## Task 11: Páginas /dashboard e /dashboard/new (em (main))

**Files:**
- Create: `app/(main)/dashboard/new/page.tsx`
- Create: `app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Criar app/(main)/dashboard/new/page.tsx**

```tsx
// app/(main)/dashboard/new/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BusinessForm } from "@/components/businesses/BusinessForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Cadastrar negócio" }

export default async function NewBusinessPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="container max-w-2xl px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors mb-8">
        <ArrowLeft size={16} />
        Voltar ao painel
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Cadastrar negócio</h1>
        <p className="text-gray-500 text-sm">Preencha as informações. Após o cadastro, nossa equipe irá revisar e aprovar.</p>
      </div>
      <BusinessForm categories={categories} />
    </div>
  )
}
```

- [ ] **Step 2: Criar app/(main)/dashboard/page.tsx**

```tsx
// app/(main)/dashboard/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import type { BusinessStatus } from "@prisma/client"

export const metadata = { title: "Meu painel" }

const statusConfig: Record<BusinessStatus, { label: string; color: string }> = {
  PENDING: { label: "Aguardando aprovação", color: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Publicado", color: "bg-green-50 text-green-700 border-green-200" },
  REJECTED: { label: "Reprovado", color: "bg-red-50 text-red-700 border-red-200" },
}

interface PageProps {
  searchParams: { cadastro?: string }
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, status: true, rejectionReason: true, createdAt: true, category: { select: { name: true } } },
  })

  return (
    <div className="container max-w-3xl px-6 py-10">
      {searchParams.cadastro === "sucesso" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          Negócio cadastrado! Nossa equipe irá revisar em breve.
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meu painel</h1>
          <p className="text-gray-500 text-sm mt-1">Olá, {session.user.name?.split(" ")[0] ?? "empreendedor"}!</p>
        </div>
        <Link href="/dashboard/new" className="flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-colors">
          <Plus size={16} />
          Novo negócio
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-4xl mb-4">🏪</p>
          <p className="font-semibold text-gray-700 mb-1">Nenhum negócio cadastrado</p>
          <p className="text-sm text-gray-400 mb-6">Cadastre seu empreendimento e apareça no mapa da cidade.</p>
          <Link href="/dashboard/new" className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800">
            <Plus size={15} />
            Cadastrar meu negócio
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {businesses.map((b) => {
            const cfg = statusConfig[b.status]
            return (
              <div key={b.id} className="border border-gray-100 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{b.name}</p>
                    {b.category && <p className="text-xs text-gray-400 mt-0.5">{b.category.name}</p>}
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} shrink-0`}>
                    {cfg.label}
                  </span>
                </div>

                {b.status === "REJECTED" && b.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
                    <span className="font-medium">Motivo: </span>{b.rejectionReason}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Cadastrado em {new Date(b.createdAt).toLocaleDateString("pt-BR")}</p>
                  {b.status === "APPROVED" && (
                    <Link href={`/businesses/${b.slug}`} className="flex items-center gap-1 text-xs text-blue-700 hover:underline">
                      Ver no mapa / página <ExternalLink size={11} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Atualizar middleware.ts para apontar para novos caminhos**

Verificar que o middleware ainda protege as rotas — no Next.js App Router, route groups não alteram a URL pública, então `/dashboard` e `/admin` continuam sendo os paths corretos:

```ts
// middleware.ts — deve continuar assim (sem mudança necessária):
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
```

- [ ] **Step 4: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/dashboard/"
git commit -m "feat: /dashboard and /dashboard/new pages in (main) route group"
```

---

## Task 12: Server Actions admin + Painel /admin/businesses

**Files:**
- Create: `lib/actions/admin.ts`
- Create: `app/(main)/admin/businesses/page.tsx`

- [ ] **Step 1: Criar lib/actions/admin.ts**

```ts
// lib/actions/admin.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/types"

function isAdminRole(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN"
}

export async function approveBusinessAction(businessId: string): Promise<ActionResult> {
  const session = await auth()

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
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

export async function rejectBusinessAction(businessId: string, reason: string): Promise<ActionResult> {
  const session = await auth()

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
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
```

- [ ] **Step 2: Criar app/(main)/admin/businesses/page.tsx**

```tsx
// app/(main)/admin/businesses/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { approveBusinessAction, rejectBusinessAction } from "@/lib/actions/admin"
import { CheckCircle2, XCircle, Clock, MapPin } from "lucide-react"
import type { BusinessStatus } from "@prisma/client"

export const metadata = { title: "Painel Admin — Negócios" }

const statusLabels: Record<BusinessStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
}

const statusColors: Record<BusinessStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
}

interface PageProps {
  searchParams: { status?: string }
}

export default async function AdminBusinessesPage({ searchParams }: PageProps) {
  const session = await auth()
  const role = session?.user?.role

  if (!role || (role !== "ADMIN" && role !== "SUPER_ADMIN")) redirect("/")

  const filterStatus = (searchParams.status as BusinessStatus) ?? "PENDING"

  const businesses = await prisma.business.findMany({
    where: { status: filterStatus, deletedAt: null },
    include: {
      owner: { select: { name: true, email: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="container max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Painel Admin — Negócios</h1>
        <p className="text-gray-500 text-sm">Revisar, aprovar e rejeitar cadastros.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["PENDING", "APPROVED", "REJECTED"] as BusinessStatus[]).map((s) => (
          <a
            key={s}
            href={`/admin/businesses?status=${s}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filterStatus === s ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            {statusLabels[s]}
          </a>
        ))}
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <Clock size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum negócio com status "{statusLabels[filterStatus]}".</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {businesses.map((b) => (
            <div key={b.id} className="border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-800">{b.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[b.status]}`}>{statusLabels[b.status]}</span>
                    {b.category && <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{b.category.name}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{b.owner.name} · {b.owner.email}</p>
                  {b.address && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={11} />
                      {b.address}{b.city ? `, ${b.city}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Cadastrado em {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {b.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{b.description}</p>
              )}

              {b.status === "PENDING" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                  <form
                    action={async () => {
                      "use server"
                      await approveBusinessAction(b.id)
                    }}
                  >
                    <button type="submit" className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors">
                      <CheckCircle2 size={15} />
                      Aprovar
                    </button>
                  </form>

                  <form
                    action={async (formData: FormData) => {
                      "use server"
                      const reason = formData.get("reason") as string
                      await rejectBusinessAction(b.id, reason)
                    }}
                    className="flex flex-1 gap-2"
                  >
                    <input
                      name="reason"
                      required
                      minLength={10}
                      placeholder="Motivo da rejeição (obrigatório)"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 min-w-0"
                    />
                    <button type="submit" className="flex items-center gap-2 bg-white border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors shrink-0">
                      <XCircle size={15} />
                      Rejeitar
                    </button>
                  </form>
                </div>
              )}

              {b.status === "REJECTED" && b.rejectionReason && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
                  <span className="font-medium">Motivo: </span>{b.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add lib/actions/admin.ts "app/(main)/admin/"
git commit -m "feat: admin Server Actions and /admin/businesses panel"
```

---

## Task 13: Instalar Leaflet + React-Leaflet

**Files:**
- `package.json` (via npm install)
- `app/globals.css` (CSS fix Leaflet)

- [ ] **Step 1: Instalar dependências**

```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

- [ ] **Step 2: Adicionar CSS do Leaflet ao globals.css**

Abrir `app/globals.css` e adicionar no topo:

```css
@import 'leaflet/dist/leaflet.css';
```

Nota: Leaflet precisa do CSS para renderizar corretamente os tiles e controles.

- [ ] **Step 3: Verificar que o build não quebra**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app/globals.css
git commit -m "feat: install react-leaflet and leaflet, add CSS"
```

---

## Task 14: Componentes de mapa — MapView, BusinessMapCard, MapOverlayHeader

**Files:**
- Create: `components/map/MapView.tsx`
- Create: `components/map/BusinessMapCard.tsx`
- Create: `components/map/MapOverlayHeader.tsx`

> Contexto: Leaflet NÃO funciona com SSR. MapView DEVE ser carregado com `dynamic(..., { ssr: false })`. O componente pai (homepage) faz o dynamic import.

- [ ] **Step 1: Criar components/map/MapView.tsx**

```tsx
// components/map/MapView.tsx
// ATENÇÃO: este arquivo deve ser importado apenas via dynamic() com ssr: false
"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import type { BusinessMapPin } from "@/types"

// Corrige ícone padrão quebrado do Leaflet com webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  alimentacao:  { emoji: "🍽️", color: "#f97316" },
  beleza:       { emoji: "💅", color: "#ec4899" },
  comercio:     { emoji: "🛍️", color: "#3b82f6" },
  servicos:     { emoji: "🔧", color: "#6b7280" },
  agro:         { emoji: "🌾", color: "#22c55e" },
  saude:        { emoji: "❤️", color: "#ef4444" },
  default:      { emoji: "📍", color: "#1d4ed8" },
}

function getCategoryConfig(slug?: string | null) {
  if (!slug) return CATEGORY_CONFIG.default
  return CATEGORY_CONFIG[slug] ?? CATEGORY_CONFIG.default
}

function createBusinessIcon(pin: BusinessMapPin): L.DivIcon {
  const cfg = getCategoryConfig(pin.category?.slug)
  const size = pin.featured ? 44 : 36
  const border = pin.featured ? "3px solid #eab308" : "2px solid white"
  const shadow = pin.featured ? "0 2px 8px rgba(0,0,0,0.35)" : "0 1px 4px rgba(0,0,0,0.2)"

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${cfg.color};
        border:${border};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:${shadow};
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:${pin.featured ? 18 : 15}px;line-height:1">
          ${cfg.emoji}
        </span>
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

interface Props {
  businesses: BusinessMapPin[]
  userLocation: { lat: number; lng: number } | null
  selectedId: string | null
  onSelectBusiness: (pin: BusinessMapPin | null) => void
  categoryFilter: string | null
  searchQuery: string
}

// General Sampaio, CE
const DEFAULT_CENTER: [number, number] = [-3.754, -39.453]
const DEFAULT_ZOOM = 14

export function MapView({ businesses, userLocation, selectedId, onSelectBusiness, categoryFilter, searchQuery }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  const filtered = businesses.filter((b) => {
    if (categoryFilter && b.category?.slug !== categoryFilter) return false
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remover markers antigos
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    // Adicionar markers filtrados
    filtered.forEach((pin) => {
      if (pin.latitude === null || pin.longitude === null) return

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: createBusinessIcon(pin),
      })

      marker.on("click", () => onSelectBusiness(pin))
      marker.addTo(map)
      markersRef.current.set(pin.id, marker)
    })
  }, [filtered, onSelectBusiness])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !userLocation) return

    const userIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup("Você está aqui")

    map.setView([userLocation.lat, userLocation.lng], 15)

    return () => { marker.remove() }
  }, [userLocation])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
```

- [ ] **Step 2: Criar components/map/BusinessMapCard.tsx**

```tsx
// components/map/BusinessMapCard.tsx
"use client"

import Link from "next/link"
import { X, Phone, MessageCircle, MapPin, Navigation, ExternalLink } from "lucide-react"
import type { BusinessMapPin } from "@/types"

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace(".", ",")} km`
}

interface Props {
  business: BusinessMapPin
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
}

export function BusinessMapCard({ business, userLocation, onClose }: Props) {
  const distance =
    userLocation
      ? haversineKm(userLocation.lat, userLocation.lng, business.latitude, business.longitude)
      : null

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`
    : null

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-8 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000] overflow-hidden">
      {/* Header do card */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex-1 min-w-0">
          {business.category && (
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {business.category.name}
            </span>
          )}
          <h3 className="font-bold text-gray-800 text-base mt-1 truncate">{business.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            {distance !== null && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Navigation size={11} className="text-blue-500" />
                {formatDistance(distance)}
              </span>
            )}
            {business.address && (
              <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
                <MapPin size={11} />
                {business.address}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-2 shrink-0"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>
        )}
        {business.phone && !whatsappUrl && (
          <a
            href={`tel:${business.phone}`}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Phone size={15} />
            Ligar
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <MapPin size={15} />
          Rota
        </a>
        <Link
          href={`/businesses/${business.slug}`}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors ml-auto"
        >
          Ver detalhes
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar components/map/MapOverlayHeader.tsx**

```tsx
// components/map/MapOverlayHeader.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Plus, User, X } from "lucide-react"
import type { Category } from "@prisma/client"

interface Props {
  slogan: string
  appName: string
  categories: Pick<Category, "id" | "name" | "slug">[]
  isAuthenticated: boolean
  categoryFilter: string | null
  onCategoryFilter: (slug: string | null) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function MapOverlayHeader({
  slogan,
  appName,
  categories,
  isAuthenticated,
  categoryFilter,
  onCategoryFilter,
  searchQuery,
  onSearchChange,
}: Props) {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
      {/* Gradiente superior para legibilidade */}
      <div className="h-48 bg-gradient-to-b from-black/40 to-transparent" />

      {/* Conteúdo — pointer-events-auto para ser clicável */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-4 pb-3 flex flex-col gap-3 pointer-events-auto">
        {/* Linha 1: marca + ações */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg leading-tight">{appName}</span>
            {slogan && (
              <p className="text-white/80 text-xs leading-tight">{slogan}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/new"
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus size={14} />
              Cadastrar
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="w-9 h-9 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors shadow-lg"
            >
              <User size={16} />
            </Link>
          </div>
        </div>

        {/* Linha 2: busca */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-lg">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Buscar negócios na cidade..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange("")} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Linha 3: filtros por categoria */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onCategoryFilter(null)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors shadow-sm ${
              !categoryFilter
                ? "bg-blue-600 text-white"
                : "bg-white/90 text-gray-700 hover:bg-white"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors shadow-sm ${
                categoryFilter === cat.slug
                  ? "bg-blue-600 text-white"
                  : "bg-white/90 text-gray-700 hover:bg-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/map/
git commit -m "feat: MapView (Leaflet), BusinessMapCard, MapOverlayHeader components"
```

---

## Task 15: Homepage map-first — redesign de app/page.tsx

**Files:**
- Modify: `app/page.tsx`

> A homepage é um Server Component que busca dados e passa para componentes client. O MapView é carregado com `dynamic(..., { ssr: false })` pois Leaflet não funciona em SSR.

- [ ] **Step 1: Reescrever app/page.tsx**

```tsx
// app/page.tsx
export const dynamic = "force-dynamic"

import dynamic from "next/dynamic"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { APP_CONFIG } from "@/config"
import type { BusinessMapPin } from "@/types"

// Carregado client-side apenas — Leaflet não suporta SSR
const MapCanvas = dynamic(
  () => import("@/components/map/MapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    ),
  }
)

export default async function HomePage() {
  const [session, businesses, categories] = await Promise.all([
    auth(),
    prisma.business.findMany({
      where: {
        status: "APPROVED",
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
        featured: true,
        phone: true,
        whatsapp: true,
        address: true,
        category: { select: { name: true, slug: true, icon: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  const pins = businesses as unknown as BusinessMapPin[]

  return (
    <div style={{ width: "100dvw", height: "100dvh", position: "relative", overflow: "hidden" }}>
      <MapCanvas
        businesses={pins}
        categories={categories}
        isAuthenticated={!!session?.user}
        appName={APP_CONFIG.name}
        slogan={process.env.NEXT_PUBLIC_SLOGAN ?? ""}
      />
    </div>
  )
}
```

- [ ] **Step 2: Criar components/map/MapCanvas.tsx (orquestrador client)**

```tsx
// components/map/MapCanvas.tsx
// Orquestrador client — gerencia estado do mapa, localização, seleção, filtros
"use client"

import { useState, useCallback } from "react"
import { MapPin } from "lucide-react"
import { MapView } from "./MapView"
import { BusinessMapCard } from "./BusinessMapCard"
import { MapOverlayHeader } from "./MapOverlayHeader"
import type { BusinessMapPin } from "@/types"
import type { Category } from "@prisma/client"

interface Props {
  businesses: BusinessMapPin[]
  categories: Pick<Category, "id" | "name" | "slug">[]
  isAuthenticated: boolean
  appName: string
  slogan: string
}

export default function MapCanvas({ businesses, categories, isAuthenticated, appName, slogan }: Props) {
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessMapPin | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSelectBusiness = useCallback((pin: BusinessMapPin | null) => {
    setSelectedBusiness(pin)
  }, [])

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationError(false)
      },
      () => setLocationError(true),
      { timeout: 10000 }
    )
  }

  return (
    <>
      {/* Mapa Leaflet — ocupa tudo */}
      <MapView
        businesses={businesses}
        userLocation={userLocation}
        selectedId={selectedBusiness?.id ?? null}
        onSelectBusiness={handleSelectBusiness}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
      />

      {/* Overlays sobre o mapa */}
      <MapOverlayHeader
        appName={appName}
        slogan={slogan}
        categories={categories}
        isAuthenticated={isAuthenticated}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Botão de localização — FAB inferior esquerdo */}
      <button
        onClick={requestLocation}
        title={locationError ? "Localização não disponível" : "Usar minha localização"}
        className={`absolute bottom-6 left-4 z-[500] flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg transition-colors ${
          userLocation
            ? "bg-blue-600 text-white"
            : locationError
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <MapPin size={16} className={userLocation ? "text-white" : "text-blue-600"} />
        {userLocation ? "Localização ativa" : "Usar minha localização"}
      </button>

      {/* Card do negócio selecionado */}
      {selectedBusiness && (
        <BusinessMapCard
          business={selectedBusiness}
          userLocation={userLocation}
          onClose={() => setSelectedBusiness(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Verificar tipos e build**

```bash
npx tsc --noEmit
npm run build 2>&1 | tail -30
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/map/MapCanvas.tsx
git commit -m "feat: map-first homepage with Leaflet, overlays, business pins and location"
```

---

## Task 16: Teste ponta a ponta do primeiro loop de valor

> Pré-requisito: banco de dados acessível e migration rodada (Task 1).

- [ ] **Step 1: Confirmar variáveis de ambiente em .env.local**

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAILS=seuemail@gmail.com
NEXT_PUBLIC_SLOGAN=Mapa vivo da economia local
```

- [ ] **Step 2: Rodar migration (se ainda pendente)**

```bash
npx prisma migrate dev --name add-super-admin-entrepreneur-profile-admin-action-hours
npx prisma generate
```

- [ ] **Step 3: Iniciar servidor**

```bash
npm run dev
```

- [ ] **Step 4: Verificar homepage**

Acessar `http://localhost:3000` — deve abrir o mapa de General Sampaio. Header com marca, busca e filtros visíveis sobre o mapa. Botão "Usar minha localização" visível.

- [ ] **Step 5: Login Google**

1. Clicar em "Entrar" no overlay
2. Redireciona para `http://localhost:3000/login`
3. Clicar "Entrar com Google"
4. Autenticar com e-mail que está em `ADMIN_EMAILS`
5. Redirecionar para `/dashboard`

- [ ] **Step 6: Verificar promoção SUPER_ADMIN**

```bash
npx prisma studio
```

Usuário deve ter `role = "SUPER_ADMIN"`.

- [ ] **Step 7: Cadastrar negócio**

1. Clicar "Novo negócio"
2. Preencher formulário com localização via Nominatim
3. Confirmar localização no mapa OSM
4. Submeter → redirecionar para `/dashboard?cadastro=sucesso`
5. Negócio aparece com badge "Aguardando aprovação"

- [ ] **Step 8: Verificar que negócio não aparece no mapa**

Voltar para `http://localhost:3000` — pin não deve aparecer (status PENDING).

- [ ] **Step 9: Aprovar como admin**

1. Acessar `http://localhost:3000/admin/businesses`
2. Negócio listado como PENDING
3. Clicar "Aprovar"

- [ ] **Step 10: Verificar pin no mapa**

Voltar para `http://localhost:3000` (ou recarregar) — pin do negócio deve aparecer no mapa. Clicar no pin → `BusinessMapCard` com nome, categoria, WhatsApp e "Ver detalhes".

- [ ] **Step 11: Verificar build de produção**

```bash
npm run build
```

Saída esperada: sem erros.

---

## Checklist final

- [ ] Schema migrado com SUPER_ADMIN, EntrepreneurProfile, AdminAction, hours, rejectionReason
- [ ] Geocodificação via Nominatim (sem API key)
- [ ] Login Google funcionando, promoção SUPER_ADMIN
- [ ] Header dinâmico (autenticado/não autenticado)
- [ ] Formulário de negócio com LocationPicker OSM, lat/lng obrigatórios
- [ ] `createBusinessAction` gera slug `padaria-do-ze`, `padaria-do-ze-2`...
- [ ] Negócio PENDING não aparece no mapa nem na lista
- [ ] Admin aprova → negócio aparece no mapa como pin
- [ ] Admin rejeita → `rejectionReason` salvo e exibido no dashboard
- [ ] Promoção a ENTREPRENEUR + criação de EntrepreneurProfile na aprovação
- [ ] Homepage map-first com Leaflet, pins por categoria, destaque visual
- [ ] BusinessMapCard com distância (quando localização disponível)
- [ ] Localização do usuário opcional, sem rastreamento em segundo plano
- [ ] `npm run build` sem erros
