# First Value Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o primeiro loop completo de valor: Login Google → Cadastro de Negócio → Aprovação Admin → Publicação.

**Architecture:** Auth.js v5 com PrismaAdapter lida com sessão; um signIn callback verifica ADMIN_EMAILS e promove SUPER_ADMIN. Cadastro de negócio usa Server Action com Zod + geocodificação server-side via /api/geocode. Painel admin usa Server Actions para aprovar/rejeitar, promovendo o usuário a ENTREPRENEUR na primeira aprovação.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Prisma/PostgreSQL, Auth.js v5, Zod, Tailwind CSS, shadcn/ui, Google Geocoding API (server-side).

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `prisma/schema.prisma` | Modify | Adicionar SUPER_ADMIN, EntrepreneurProfile, AdminAction, rejectionReason |
| `auth.ts` | Modify | Callback signIn para promoção via ADMIN_EMAILS |
| `services/maps.ts` | Modify | Trocar NEXT_PUBLIC_ por GOOGLE_MAPS_API_KEY |
| `lib/slug.ts` | Create | Utilitário de geração de slug único |
| `lib/actions/business.ts` | Create | createBusinessAction (Server Action) |
| `lib/actions/admin.ts` | Create | approveBusinessAction + rejectBusinessAction |
| `validations/index.ts` | Modify | lat/lng obrigatórios em createBusinessSchema |
| `app/api/geocode/route.ts` | Create | Route handler GET /api/geocode |
| `app/login/page.tsx` | Create | Página de login com Google |
| `components/layout/UserMenu.tsx` | Create | Dropdown de usuário autenticado (client) |
| `components/layout/Header.tsx` | Modify | Tornar Server Component + integrar UserMenu |
| `components/businesses/LocationPicker.tsx` | Create | Seletor de localização com mapa (client) |
| `components/businesses/BusinessForm.tsx` | Create | Formulário completo de cadastro (client) |
| `app/dashboard/new/page.tsx` | Create | Página de cadastro de negócio |
| `app/dashboard/page.tsx` | Create | Dashboard do empreendedor |
| `app/admin/businesses/page.tsx` | Create | Painel admin — lista de negócios |

---

## Task 1: Schema Prisma — novos modelos e campos

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Atualizar enum UserRole**

Em `prisma/schema.prisma`, substituir o enum:

```prisma
enum UserRole {
  USER
  ENTREPRENEUR
  ADMIN
  SUPER_ADMIN
}
```

- [ ] **Step 2: Adicionar rejectionReason e hours em Business**

No model `Business`, após `featured Boolean @default(false)`, adicionar:

```prisma
rejectionReason String? @db.Text
hours           String? // horário de funcionamento em texto livre
```

- [ ] **Step 3: Adicionar model EntrepreneurProfile**

Após o model `Business`, adicionar:

```prisma
model EntrepreneurProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio       String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 4: Adicionar model AdminAction**

Após `EntrepreneurProfile`, adicionar:

```prisma
model AdminAction {
  id        String   @id @default(cuid())
  adminId   String
  admin     User     @relation(fields: [adminId], references: [id])
  action    String   // "APPROVE_BUSINESS" | "REJECT_BUSINESS"
  targetId  String   // ID do negócio alvo
  reason    String?  @db.Text
  createdAt DateTime @default(now())
}
```

- [ ] **Step 5: Adicionar relações em User**

No model `User`, após `reports Report[]`, adicionar:

```prisma
entrepreneurProfile EntrepreneurProfile?
adminActions        AdminAction[]
```

- [ ] **Step 6: Gerar e rodar migration**

```bash
npx prisma migrate dev --name add-super-admin-entrepreneur-profile-admin-action-hours
```

Saída esperada: `Your database is now in sync with your schema.`

- [ ] **Step 7: Regenerar Prisma Client**

```bash
npx prisma generate
```

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add SUPER_ADMIN role, EntrepreneurProfile, AdminAction, rejectionReason"
```

---

## Task 2: Corrigir services/maps.ts para chave server-side

**Files:**
- Modify: `services/maps.ts`

- [ ] **Step 1: Trocar variável de ambiente**

Substituir a linha:

```ts
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

por:

```ts
const apiKey = process.env.GOOGLE_MAPS_API_KEY
```

- [ ] **Step 2: Verificar que nenhum import de maps.ts está em componente client**

```bash
grep -r "services/maps" app/ components/ --include="*.tsx" --include="*.ts"
```

Saída esperada: nenhum resultado em arquivo com `"use client"`. Se houver, mover a chamada para um Server Component ou Route Handler.

- [ ] **Step 3: Commit**

```bash
git add services/maps.ts
git commit -m "fix: use server-side GOOGLE_MAPS_API_KEY instead of NEXT_PUBLIC_ prefix"
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

O `auth.ts` completo fica:

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

- [ ] **Step 2: Verificar tipos — ADMIN_EMAILS deve estar no .env.local**

Adicionar ao `.env.local` (se não existir):

```env
ADMIN_EMAILS=seuemail@gmail.com
```

- [ ] **Step 3: Verificar build sem erros de tipo**

```bash
npx tsc --noEmit
```

Saída esperada: nenhum erro.

- [ ] **Step 4: Commit**

```bash
git add auth.ts
git commit -m "feat: promote SUPER_ADMIN on first login via ADMIN_EMAILS env var"
```

---

## Task 4: Página de login /login

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: Criar página de login**

```tsx
// app/login/page.tsx
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

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: login page with Google OAuth"
```

---

## Task 5: Header — Server Component + UserMenu

**Files:**
- Create: `components/layout/UserMenu.tsx`
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Criar UserMenu client component**

```tsx
// components/layout/UserMenu.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react"

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
          <Image
            src={image}
            alt={name ?? "Usuário"}
            width={28}
            height={28}
            className="rounded-full"
          />
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
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard size={15} className="text-gray-400" />
            Meu painel
          </Link>
          {isAdmin && (
            <Link
              href="/admin/businesses"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard size={15} className="text-blue-600" />
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

- [ ] **Step 2: Reescrever Header como Server Component**

Substituir todo o conteúdo de `components/layout/Header.tsx`:

```tsx
// components/layout/Header.tsx
import Link from "next/link"
import { auth } from "@/auth"
import { APP_CONFIG } from "@/config"
import { UserMenu } from "./UserMenu"
import { MobileMenuButton } from "./MobileMenuButton"

export async function Header() {
  const session = await auth()
  const user = session?.user

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/businesses", label: "Negócios" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-700">{APP_CONFIG.name}</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-blue-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTAs desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              role={user.role}
            />
          ) : (
            <>
              <Link
                href="/dashboard/new"
                className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                Cadastrar negócio
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Entrar
              </Link>
            </>
          )}
        </div>

        {/* Mobile: MobileMenuButton */}
        <MobileMenuButton user={user ?? null} navLinks={navLinks} />
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Criar MobileMenuButton client component**

Criar `components/layout/MobileMenuButton.tsx`:

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
      <button
        className="md:hidden p-2 text-gray-600"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-t border-gray-100 bg-white shadow-md">
          <nav className="container flex flex-col py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-blue-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-100" />
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>
                  Meu painel
                </Link>
                {isAdmin && (
                  <Link href="/admin/businesses" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>
                    Painel admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-left text-sm font-medium text-red-600"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/dashboard/new" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>
                  Cadastrar negócio
                </Link>
                <Link href="/login" className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg text-center" onClick={() => setOpen(false)}>
                  Entrar
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/
git commit -m "feat: header as Server Component with UserMenu and MobileMenuButton"
```

---

## Task 6: Route Handler GET /api/geocode

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

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "geocoding_unavailable" }, { status: 503 })
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

- [ ] **Step 2: Testar manualmente**

Com o servidor rodando (`npm run dev`), acessar:

```
http://localhost:3000/api/geocode?address=General+Sampaio+CE
```

Saída esperada (com GOOGLE_MAPS_API_KEY configurada):
```json
{ "latitude": -3.76, "longitude": -39.45, "formattedAddress": "General Sampaio - CE, Brasil" }
```

Saída esperada (sem chave configurada):
```json
{ "error": "geocoding_unavailable" }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/geocode/route.ts
git commit -m "feat: GET /api/geocode route handler for server-side geocoding"
```

---

## Task 7: Componente LocationPicker

**Files:**
- Modify: `types/index.ts`
- Create: `components/businesses/LocationPicker.tsx`

- [ ] **Step 1: Adicionar LocationData a types/index.ts**

Adicionar ao final de `types/index.ts`:

```ts
export type LocationData = {
  latitude: number
  longitude: number
  formattedAddress: string
}
```

- [ ] **Step 2: Criar componente**

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

type State = "idle" | "searching" | "preview" | "confirmed" | "error" | "unavailable"

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
        if (data.error === "geocoding_unavailable") {
          setState("unavailable")
          return
        }
        if (data.error === "address_not_found") {
          setErrorMsg("Endereço não encontrado. Tente ser mais específico.")
          setState("error")
          return
        }
        setErrorMsg("Erro ao buscar endereço. Tente novamente.")
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
      {/* Input de endereço */}
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
          {state === "searching" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Search size={15} />
          )}
          Buscar
        </button>
      </div>

      {/* Estado: erro */}
      {state === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Estado: indisponível */}
      {state === "unavailable" && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="shrink-0" />
          Localização temporariamente indisponível. Tente novamente mais tarde.
        </div>
      )}

      {/* Estado: preview do mapa */}
      {state === "preview" && mapSrc && result && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl overflow-hidden border border-gray-200 h-48">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              className="border-0"
              loading="lazy"
              title="Localização no mapa"
            />
          </div>
          <p className="text-sm text-gray-600 flex items-start gap-2">
            <MapPin size={14} className="text-blue-600 mt-0.5 shrink-0" />
            {result.formattedAddress}
          </p>
          <p className="text-xs text-gray-400">
            Não é o endereço certo? Corrija o campo acima e busque novamente.
          </p>
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

      {/* Estado: confirmado */}
      {state === "confirmed" && result && (
        <div className="flex items-start justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Localização confirmada</p>
              <p className="text-xs text-green-600 mt-0.5">{result.formattedAddress}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0 ml-3"
          >
            Corrigir
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/businesses/LocationPicker.tsx
git commit -m "feat: LocationPicker client component with OpenStreetMap preview"
```

---

## Task 8: Slug utility + validação atualizada

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

Nota: `latitude` e `longitude` são agora **obrigatórios** (sem `.optional()`). Usamos `z.coerce.number()` para converter os valores de string vindos do FormData.

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/slug.ts validations/index.ts
git commit -m "feat: slug utility and make lat/lng required in business schema"
```

---

## Task 9: Server Action createBusinessAction

**Files:**
- Create: `lib/actions/business.ts`

- [ ] **Step 1: Criar diretório e arquivo**

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
git commit -m "feat: createBusinessAction server action with Zod validation and slug generation"
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

  function handleLocationConfirm(data: LocationData) {
    setLocationData(data)
  }

  function handleLocationReset() {
    setLocationData(null)
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {/* Hidden inputs de localização */}
      <input type="hidden" name="latitude" value={locationData?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={locationData?.longitude ?? ""} />
      <input type="hidden" name="formattedAddress" value={locationData?.formattedAddress ?? ""} />

      {/* Erro global */}
      {state && !state.success && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Seção 1: Dados básicos */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
          Dados básicos
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do negócio <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Ex.: Padaria do Zé"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Categoria
            </label>
            <select
              name="categoryId"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">Selecionar categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descrição
            </label>
            <textarea
              name="description"
              rows={4}
              maxLength={2000}
              placeholder="Conte um pouco sobre seu negócio, produtos ou serviços..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Seção 2: Contato */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
          Contato
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
            <input
              name="phone"
              type="tel"
              placeholder="(85) 99999-9999"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
            <input
              name="whatsapp"
              type="tel"
              placeholder="(85) 99999-9999"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
            <input
              name="instagram"
              placeholder="@seuperfil"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site</label>
            <input
              name="website"
              type="url"
              placeholder="https://exemplo.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </section>

      {/* Seção 3: Localização */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">
          Localização <span className="text-red-500">*</span>
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Digite o endereço, confirme o pin no mapa e clique em "Confirmar localização".
        </p>
        <div className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
              <input
                name="address"
                placeholder="Rua, número, bairro"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
              <input
                name="city"
                defaultValue="General Sampaio"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">UF</label>
              <input
                name="state"
                defaultValue="CE"
                maxLength={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 uppercase"
              />
            </div>
          </div>
          <LocationPicker
            onConfirm={handleLocationConfirm}
            onReset={handleLocationReset}
            confirmed={!!locationData}
          />
          {!locationData && (
            <p className="text-xs text-amber-600">
              ⚠ Confirme a localização no mapa para prosseguir.
            </p>
          )}
        </div>
      </section>

      {/* Seção 4: Horários */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
          Horários
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Horário de funcionamento
          </label>
          <input
            name="hours"
            placeholder="Ex.: Seg–Sex 8h–18h, Sáb 8h–12h"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
      </section>

      {/* Submit */}
      <div className="pt-2">
        <SubmitButton disabled={!locationData} />
        <p className="text-xs text-gray-400 text-center mt-3">
          Seu negócio será revisado antes de aparecer publicamente.
        </p>
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
git commit -m "feat: BusinessForm client component with LocationPicker integration"
```

---

## Task 11: Página /dashboard/new

**Files:**
- Create: `app/dashboard/new/page.tsx`

- [ ] **Step 1: Criar página**

```tsx
// app/dashboard/new/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BusinessForm } from "@/components/businesses/BusinessForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Cadastrar negócio — Empreende General" }

export default async function NewBusinessPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, icon: true, description: true, createdAt: true, updatedAt: true },
  })

  return (
    <div className="container max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Voltar ao painel
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Cadastrar negócio</h1>
        <p className="text-gray-500 text-sm">
          Preencha as informações do seu empreendimento. Após o cadastro, nossa equipe irá revisar e aprovar.
        </p>
      </div>

      <BusinessForm categories={categories} />
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/new/page.tsx
git commit -m "feat: /dashboard/new page for business registration"
```

---

## Task 12: Página /dashboard (empreendedor)

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Criar página**

```tsx
// app/dashboard/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import type { BusinessStatus } from "@prisma/client"

export const metadata = { title: "Meu painel — Empreende General" }

const statusConfig: Record<BusinessStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Aguardando aprovação",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock size={13} />,
  },
  APPROVED: {
    label: "Publicado",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 size={13} />,
  },
  REJECTED: {
    label: "Reprovado",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle size={13} />,
  },
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
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      rejectionReason: true,
      createdAt: true,
      category: { select: { name: true } },
    },
  })

  return (
    <div className="container max-w-3xl px-6 py-10">
      {/* Toast de sucesso */}
      {searchParams.cadastro === "sucesso" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          Negócio cadastrado com sucesso! Nossa equipe irá revisar em breve.
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meu painel</h1>
          <p className="text-gray-500 text-sm mt-1">
            Olá, {session.user.name?.split(" ")[0] ?? "empreendedor"}!
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
        >
          <Plus size={16} />
          Novo negócio
        </Link>
      </div>

      {/* Lista de negócios */}
      {businesses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-4xl mb-4">🏪</p>
          <p className="font-semibold text-gray-700 mb-1">Nenhum negócio cadastrado</p>
          <p className="text-sm text-gray-400 mb-6">
            Cadastre seu empreendimento e comece a aparecer para a cidade.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800"
          >
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
                    {b.category && (
                      <p className="text-xs text-gray-400 mt-0.5">{b.category.name}</p>
                    )}
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} shrink-0`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                {/* Motivo de rejeição */}
                {b.status === "REJECTED" && b.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
                    <span className="font-medium">Motivo: </span>
                    {b.rejectionReason}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Cadastrado em {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  {b.status === "APPROVED" && (
                    <Link
                      href={`/businesses/${b.slug}`}
                      className="flex items-center gap-1 text-xs text-blue-700 hover:underline"
                    >
                      Ver página pública
                      <ExternalLink size={11} />
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

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: /dashboard page listing user businesses with status badges"
```

---

## Task 13: Server Actions approveBusinessAction + rejectBusinessAction

**Files:**
- Create: `lib/actions/admin.ts`

- [ ] **Step 1: Criar arquivo**

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

export async function approveBusinessAction(
  businessId: string
): Promise<ActionResult> {
  const session = await auth()

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return { success: false, error: "Acesso negado." }
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: { select: { id: true, role: true } } },
  })

  if (!business) {
    return { success: false, error: "Negócio não encontrado." }
  }

  await prisma.$transaction(async (tx) => {
    // Aprovar o negócio
    await tx.business.update({
      where: { id: businessId },
      data: { status: "APPROVED" },
    })

    // Promover owner para ENTREPRENEUR se ainda for USER
    if (business.owner.role === "USER") {
      await tx.user.update({
        where: { id: business.owner.id },
        data: { role: "ENTREPRENEUR" },
      })
      await tx.entrepreneurProfile.upsert({
        where: { userId: business.owner.id },
        create: { userId: business.owner.id },
        update: {},
      })
    }

    // Log da ação
    await tx.adminAction.create({
      data: {
        adminId: session.user.id,
        action: "APPROVE_BUSINESS",
        targetId: businessId,
      },
    })
  })

  revalidatePath("/admin/businesses")
  revalidatePath("/businesses")
  revalidatePath("/")
  revalidatePath(`/businesses/${business.slug}`)

  return { success: true, data: undefined }
}

export async function rejectBusinessAction(
  businessId: string,
  reason: string
): Promise<ActionResult> {
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

  if (!business) {
    return { success: false, error: "Negócio não encontrado." }
  }

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: businessId },
      data: { status: "REJECTED", rejectionReason: reason.trim() },
    })
    await tx.adminAction.create({
      data: {
        adminId: session.user.id,
        action: "REJECT_BUSINESS",
        targetId: businessId,
        reason: reason.trim(),
      },
    })
  })

  revalidatePath("/admin/businesses")

  return { success: true, data: undefined }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/admin.ts
git commit -m "feat: approveBusinessAction and rejectBusinessAction with ENTREPRENEUR promotion"
```

---

## Task 14: Painel admin /admin/businesses

**Files:**
- Create: `app/admin/businesses/page.tsx`

- [ ] **Step 1: Criar página**

```tsx
// app/admin/businesses/page.tsx
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
  if (!role || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    redirect("/")
  }

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

      {/* Filtros de status */}
      <div className="flex gap-2 mb-6">
        {(["PENDING", "APPROVED", "REJECTED"] as BusinessStatus[]).map((s) => (
          <a
            key={s}
            href={`/admin/businesses?status=${s}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filterStatus === s
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
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
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[b.status]}`}>
                      {statusLabels[b.status]}
                    </span>
                    {b.category && (
                      <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        {b.category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {b.owner.name} · {b.owner.email}
                  </p>
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

              {/* Ações (apenas em PENDING) */}
              {b.status === "PENDING" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                  {/* Aprovar */}
                  <form
                    action={async () => {
                      "use server"
                      await approveBusinessAction(b.id)
                    }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 size={15} />
                      Aprovar
                    </button>
                  </form>

                  {/* Rejeitar */}
                  <RejectForm businessId={b.id} />
                </div>
              )}

              {/* Motivo de rejeição */}
              {b.status === "REJECTED" && b.rejectionReason && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
                  <span className="font-medium">Motivo: </span>
                  {b.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Sub-componente inline para o form de rejeição (client)
function RejectForm({ businessId }: { businessId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server"
        const reason = formData.get("reason") as string
        await rejectBusinessAction(businessId, reason)
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
      <button
        type="submit"
        className="flex items-center gap-2 bg-white border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors shrink-0"
      >
        <XCircle size={15} />
        Rejeitar
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Verificar build completo**

```bash
npm run build
```

Saída esperada: build completo sem erros de TypeScript ou linting.

- [ ] **Step 3: Commit final do sprint**

```bash
git add app/admin/businesses/page.tsx
git commit -m "feat: admin panel /admin/businesses with approve and reject actions"
```

---

## Task 15: Teste ponta a ponta do fluxo

- [ ] **Step 1: Iniciar servidor de desenvolvimento**

```bash
npm run dev
```

- [ ] **Step 2: Verificar variáveis de ambiente**

Confirmar que `.env.local` contém:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_MAPS_API_KEY=...
ADMIN_EMAILS=seuemail@gmail.com
```

- [ ] **Step 3: Testar login**

1. Acessar `http://localhost:3000/login`
2. Clicar "Entrar com Google"
3. Autenticar com o e-mail que está em `ADMIN_EMAILS`
4. Verificar redirecionamento para `/dashboard`
5. Verificar que o Header mostra o avatar e nome do usuário

- [ ] **Step 4: Verificar promoção a SUPER_ADMIN**

No banco (via Prisma Studio ou query):

```bash
npx prisma studio
```

Verificar que o usuário tem `role = "SUPER_ADMIN"`.

- [ ] **Step 5: Cadastrar um negócio**

1. Clicar "Novo negócio" no dashboard
2. Preencher nome, categoria, descrição
3. Preencher contato (telefone, WhatsApp)
4. Na seção de localização: digitar "Rua Principal, General Sampaio, CE" e clicar "Buscar endereço"
5. Confirmar localização no mapa
6. Clicar "Cadastrar negócio"
7. Verificar redirecionamento para `/dashboard?cadastro=sucesso`
8. Verificar toast de sucesso e negócio listado com status "Aguardando aprovação"

- [ ] **Step 6: Verificar que negócio NÃO aparece publicamente**

Acessar `http://localhost:3000/businesses` — negócio não deve aparecer (status PENDING).

- [ ] **Step 7: Aprovar o negócio como admin**

1. Acessar `http://localhost:3000/admin/businesses`
2. Verificar negócio listado como PENDING
3. Clicar "Aprovar"
4. Verificar que negócio some da lista PENDING

- [ ] **Step 8: Verificar publicação**

1. Acessar `http://localhost:3000/businesses`
2. Negócio deve aparecer na listagem
3. Clicar no negócio — página individual deve carregar corretamente

- [ ] **Step 9: Testar rejeição (com segundo usuário ou negócio novo)**

1. Cadastrar outro negócio de teste
2. No painel admin, preencher o campo de motivo e clicar "Rejeitar"
3. Verificar negócio aparece em `/admin/businesses?status=REJECTED`
4. Logar com outro usuário (o dono do negócio rejeitado) e verificar que o motivo aparece no `/dashboard`

---

## Checklist de verificação final

- [ ] `npm run build` sem erros
- [ ] `npx tsc --noEmit` sem erros
- [ ] Login Google funcionando
- [ ] Promoção SUPER_ADMIN via ADMIN_EMAILS
- [ ] Header mostra estado de autenticação
- [ ] Formulário bloqueia submit sem localização confirmada
- [ ] Negócio criado com `status: "PENDING"`
- [ ] Negócio PENDING não aparece em `/businesses`
- [ ] Painel admin acessível apenas por ADMIN/SUPER_ADMIN
- [ ] Aprovação promove usuário para ENTREPRENEUR e cria EntrepreneurProfile
- [ ] Rejeição salva `rejectionReason` e mostra no dashboard do empreendedor
- [ ] Log em `AdminAction` para aprovações e rejeições
