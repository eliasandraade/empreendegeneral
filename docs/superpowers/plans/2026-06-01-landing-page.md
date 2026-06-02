# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma landing page de entrada em `/` com logo tipográfica, slogan, descrição e botão "EXPLORAR!" que leva ao mapa em `/mapa`.

**Architecture:** A rota raiz `/` vira uma landing page server component que renderiza `LandingHero` (client component para animação). O mapa é movido para `/mapa/page.tsx` com conteúdo idêntico ao atual `app/page.tsx`. Nenhum layout compartilhado envolve essas duas rotas — ambas ficam fora do grupo `(main)` que tem Header/Footer.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, lucide-react

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `app/mapa/page.tsx` | Criar | Mapa interativo (conteúdo movido de `app/page.tsx`) |
| `app/page.tsx` | Modificar | Landing page — server component, sem DB calls |
| `components/landing/LandingHero.tsx` | Criar | Hero section com logo, slogan, descrição, botão e animação |

---

### Task 1: Criar rota do mapa em `/mapa`

**Files:**
- Create: `app/mapa/page.tsx`

- [ ] **Step 1: Criar o arquivo `app/mapa/page.tsx`**

Copiar o conteúdo atual de `app/page.tsx` integralmente para o novo arquivo:

```tsx
// app/mapa/page.tsx
export const dynamic = "force-dynamic"

import dynamicImport from "next/dynamic"
import { getServerSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { APP_CONFIG } from "@/config"
import type { BusinessMapPin } from "@/types"

const MapCanvas = dynamicImport(
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

export default async function MapaPage() {
  const [session, businesses, categories] = await Promise.all([
    getServerSession(),
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
        hours: true,
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
        isAuthenticated={!!session}
        appName={APP_CONFIG.name}
        slogan={process.env.NEXT_PUBLIC_SLOGAN ?? ""}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros relacionados ao novo arquivo.

- [ ] **Step 3: Commit**

```bash
git add app/mapa/page.tsx
git commit -m "feat(mapa): move map to /mapa route"
```

---

### Task 2: Criar componente `LandingHero`

**Files:**
- Create: `components/landing/LandingHero.tsx`

- [ ] **Step 1: Criar o diretório e o arquivo**

```bash
mkdir -p components/landing
```

Criar `components/landing/LandingHero.tsx`:

```tsx
"use client"

import Link from "next/link"
import { MapPin, ArrowRight } from "lucide-react"

interface LandingHeroProps {
  appName: string
  slogan: string
  description: string
  credit: string
}

export function LandingHero({ appName, slogan, description, credit }: LandingHeroProps) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-full text-center px-6"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
      }}
    >
      {/* Logo + nome */}
      <div className="flex items-center gap-3 mb-4 animate-fade-in">
        <MapPin className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-4xl md:text-5xl tracking-tight text-white">
          <span className="font-light">Empreende </span>
          <span className="font-bold">General</span>
        </h1>
      </div>

      {/* Slogan */}
      <p className="text-lg md:text-xl text-white/70 mb-3 animate-fade-in-delay-1">
        {slogan}
      </p>

      {/* Descrição */}
      <p className="text-sm md:text-base text-white/60 max-w-md mb-10 leading-relaxed animate-fade-in-delay-2">
        {description}
      </p>

      {/* Botão EXPLORAR */}
      <Link
        href="/mapa"
        className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-base md:text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 animate-fade-in-delay-3"
      >
        EXPLORAR
        <ArrowRight className="w-5 h-5" />
      </Link>

      {/* Rodapé */}
      <p className="absolute bottom-5 text-xs text-white/40 tracking-wide">
        {credit}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Adicionar keyframes de animação em `app/globals.css`**

Abrir `app/globals.css` e adicionar ao final:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out both;
}
.animate-fade-in-delay-1 {
  animation: fadeIn 0.6s ease-out 0.15s both;
}
.animate-fade-in-delay-2 {
  animation: fadeIn 0.6s ease-out 0.3s both;
}
.animate-fade-in-delay-3 {
  animation: fadeIn 0.6s ease-out 0.45s both;
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add components/landing/LandingHero.tsx app/globals.css
git commit -m "feat(landing): add LandingHero component with fade-in animation"
```

---

### Task 3: Substituir `app/page.tsx` pela landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Substituir o conteúdo de `app/page.tsx`**

Substituir o conteúdo completo por:

```tsx
// app/page.tsx
import { LandingHero } from "@/components/landing/LandingHero"
import { APP_CONFIG } from "@/config"

export default function HomePage() {
  return (
    <div style={{ width: "100dvw", height: "100dvh", overflow: "hidden" }}>
      <LandingHero
        appName={APP_CONFIG.name}
        slogan={APP_CONFIG.slogan}
        description={APP_CONFIG.description}
        credit={APP_CONFIG.credit}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Rodar o servidor de desenvolvimento e verificar visualmente**

```bash
npm run dev
```

Abrir `http://localhost:3000`:
- Deve exibir fundo gradiente azul
- Logo com ícone MapPin + "Empreende General"
- Slogan e descrição abaixo
- Botão "EXPLORAR →" branco
- Rodapé com crédito

Clicar no botão "EXPLORAR":
- Deve navegar para `http://localhost:3000/mapa`
- Mapa deve carregar normalmente com os pins dos negócios

- [ ] **Step 4: Commit final**

```bash
git add app/page.tsx
git commit -m "feat(landing): replace home with landing page, map moved to /mapa"
```
