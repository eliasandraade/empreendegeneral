# Public Redesign — Empreende General — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all public-facing pages and components to the Azul Noturno theme (dark, premium, map-first) without touching backend, auth, admin, or dashboard.

**Architecture:** Cirurgical component-by-component refactor. Each component is modified in-place — no new routes, no moved files. New files are limited to shared utilities (`lib/distance.ts`, `components/map/mapIcons.ts`, `components/businesses/BusinessCardDistance.tsx`, `components/map/MiniMap.tsx`). The `(main)` layout Header stays white in this iteration to avoid impacting admin/dashboard.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, Lucide React, Leaflet, Prisma (read-only), shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-06-01-public-redesign-design.md`

---

## File Map

### New files
| File | Responsabilidade |
|---|---|
| `lib/distance.ts` | `haversineKm` + `formatDistance` — shared distance util |
| `components/map/mapIcons.ts` | `CATEGORY_CONFIG`, SVG strings, icon cache, `createBusinessIcon()` |
| `components/businesses/BusinessCardDistance.tsx` | Client-only distance display para `/businesses` |
| `components/map/MiniMap.tsx` | Client-only mini Leaflet map para página de detalhe |

### Files modified
| File | O que muda |
|---|---|
| `tailwind.config.ts` | Adiciona `slide-up` keyframe + animation |
| `app/globals.css` | Adiciona `.scrollbar-hide` CSS + `@keyframes pin-pulse` |
| `components/ui/CategoryIcon.tsx` | Atualiza mapeamento de ícones para o novo config de categorias |
| `components/map/MapCanvas.tsx` | Adiciona estado `zoomLevel`, passa para `MapView` |
| `components/map/MapView.tsx` | Redesenha pins com `mapIcons.ts`, adiciona zoom listener + labels |
| `components/map/BusinessMapCard.tsx` | Redesenha para bottom sheet azul noturno |
| `components/map/MapOverlayHeader.tsx` | Redesenha overlay com nova UI |
| `components/businesses/BusinessCard.tsx` | Redesenha card horizontal dark |
| `app/(main)/businesses/page.tsx` | Redesenha página completa |
| `app/(main)/businesses/[slug]/page.tsx` | Redesenha página completa |

---

## Task 1: Tailwind config — animações e CSS base

**Objetivo:** Adicionar `slide-up` animation ao Tailwind e `.scrollbar-hide` + `@keyframes pin-pulse` ao globals.css.

**Arquivos afetados:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Riscos:**
- Conflito com `tailwindcss-animate` já instalado — improvável, pois adicionamos ao `extend`.
- `app/globals.css` pode não existir — verificar antes.

**Critérios de aceitação:**
- `animate-slide-up` aplicável em componentes sem erro de build.
- `.scrollbar-hide` funciona em Chrome e Safari.
- `pin-pulse` disponível via CSS global para uso no HTML inline do Leaflet.
- `npm run build` sem erros.

- [ ] **Ler o arquivo globals.css atual**

```bash
# No terminal do projeto
cat app/globals.css | head -30
```

- [ ] **Adicionar `slide-up` keyframe ao tailwind.config.ts**

Abrir `tailwind.config.ts`. Dentro de `extend.keyframes`, adicionar após o bloco `accordion-up`:

```ts
"slide-up": {
  from: { transform: "translateY(100%)", opacity: "0" },
  to: { transform: "translateY(0)", opacity: "1" },
},
"slide-up-subtle": {
  from: { transform: "translateY(16px)", opacity: "0" },
  to: { transform: "translateY(0)", opacity: "1" },
},
```

Dentro de `extend.animation`, adicionar após `accordion-up`:

```ts
"slide-up": "slide-up 0.25s ease-out",
"slide-up-subtle": "slide-up-subtle 0.2s ease-out",
```

- [ ] **Adicionar `.scrollbar-hide` e `pin-pulse` ao app/globals.css**

No final do arquivo, adicionar:

```css
/* Ocultar scrollbar mantendo funcionalidade de scroll */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Animação de halo pulsante para pins em destaque no mapa */
@keyframes pin-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.08); }
}
```

- [ ] **Verificar build**

```bash
npm run build
```

Esperado: saída sem erros de compilação TypeScript ou Tailwind.

- [ ] **Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat(ui): add slide-up animation and scrollbar-hide CSS"
```

---

## Task 2: Utilitário de distância compartilhado

**Objetivo:** Extrair `haversineKm` e `formatDistance` de `BusinessMapCard.tsx` para `lib/distance.ts`, preparando o reuso em `BusinessCardDistance` e no bottom sheet redesenhado.

**Arquivos afetados:**
- Create: `lib/distance.ts`

**Riscos:**
- Nenhum — arquivo novo, sem side effects. A extração do `BusinessMapCard` ocorre na Task 7.

**Critérios de aceitação:**
- `lib/distance.ts` exporta `haversineKm` e `formatDistance` com tipagem correta.
- `npm run lint` sem erros no novo arquivo.

- [ ] **Criar `lib/distance.ts`**

```ts
// lib/distance.ts

/**
 * Calcula distância entre dois pontos usando fórmula de Haversine.
 * Retorna distância em quilômetros.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Formata distância em km para exibição amigável.
 * < 1 km → "850 m"
 * ≥ 1 km → "1,2 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace(".", ",")} km`
}
```

- [ ] **Verificar lint**

```bash
npm run lint -- --max-warnings 0
```

Esperado: nenhum warning ou erro em `lib/distance.ts`.

- [ ] **Commit**

```bash
git add lib/distance.ts
git commit -m "feat(lib): add shared distance utility (haversineKm, formatDistance)"
```

---

## Task 3: Sistema de ícones e cores por categoria (`mapIcons.ts`)

**Objetivo:** Criar o arquivo central de configuração de categorias com cores, SVG strings e fábrica de `L.DivIcon` com cache — usado pelo mapa e pelos cards.

**Arquivos afetados:**
- Create: `components/map/mapIcons.ts`

**Riscos:**
- SVG paths hardcoded podem diferir da versão exata de `lucide-react` instalada — a etapa de verificação visual detecta isso.
- O cache `Map<>` tem escopo de módulo — não vaza entre tabs no browser, funciona corretamente.

**Critérios de aceitação:**
- `CATEGORY_CONFIG` exporta 7 categorias + default.
- `getCategoryConfig(slug)` retorna o config correto.
- `createBusinessIcon(pin, showLabel)` retorna `L.DivIcon` válido.
- Pins featured têm cor dourada, tamanho 52px, halo pulsante, badge `★`.
- Pins normais têm cor da categoria, tamanho 40px, glow sutil.
- Cache evita recriar ícones de mesma categoria+featured+showLabel=false.
- `npm run build` sem erro de TypeScript.

- [ ] **Criar `components/map/mapIcons.ts`**

```ts
// components/map/mapIcons.ts
// ATENÇÃO: importar apenas em componentes com ssr:false (Leaflet é client-only)
import L from "leaflet"
import type { BusinessMapPin } from "@/types"

// Paths SVG sourced from lucide.dev — verifique visualmente no browser após deploy
// Se algum ícone parecer errado, copie o SVG correto de https://lucide.dev/icons/<nome>
const SVG_PATHS: Record<string, string> = {
  alimentacao: [
    `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>`,
    `<path d="M7 2v20"/>`,
    `<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`,
  ].join(""),
  beleza: [
    `<circle cx="6" cy="6" r="3"/>`,
    `<circle cx="6" cy="18" r="3"/>`,
    `<line x1="20" x2="8.12" y1="4" y2="15.88"/>`,
    `<line x1="14.47" x2="20" y1="14.48" y2="20"/>`,
    `<line x1="8.12" x2="12" y1="8.12" y2="12"/>`,
  ].join(""),
  comercio: [
    `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>`,
    `<line x1="3" x2="21" y1="6" y2="6"/>`,
    `<path d="M16 10a4 4 0 0 1-8 0"/>`,
  ].join(""),
  servicos: [
    `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
  ].join(""),
  agro: [
    `<path d="M7 20h10"/>`,
    `<path d="M10 20c5.5-2.5.8-6.4 3-10"/>`,
    `<path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>`,
    `<path d="M14.1 6a7 7 0 0 1 1.5 9.9"/>`,
  ].join(""),
  saude: [
    `<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>`,
  ].join(""),
  default: [
    `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>`,
    `<circle cx="12" cy="10" r="3"/>`,
  ].join(""),
}

export const CATEGORY_CONFIG: Record<string, { color: string; slug: string }> = {
  alimentacao: { color: "#f97316", slug: "alimentacao" },
  beleza:      { color: "#be185d", slug: "beleza" },
  comercio:    { color: "#3b82f6", slug: "comercio" },
  servicos:    { color: "#6b7280", slug: "servicos" },
  agro:        { color: "#22c55e", slug: "agro" },
  saude:       { color: "#ef4444", slug: "saude" },
  default:     { color: "#1d4ed8", slug: "default" },
}

export const FEATURED_COLOR = "#eab308"
export const FEATURED_COLOR_DARK = "#ca8a04"

export function getCategoryConfig(slug?: string | null) {
  if (!slug) return CATEGORY_CONFIG.default
  return CATEGORY_CONFIG[slug] ?? CATEGORY_CONFIG.default
}

function makeSvg(paths: string, size: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" ` +
    `stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  )
}

// Ícones sem label são cacheados por categoria+featured
// Ícones com label não são cacheados (contêm pin.name único)
const iconCache = new Map<string, L.DivIcon>()

export function createBusinessIcon(pin: BusinessMapPin, showLabel = false): L.DivIcon {
  const categorySlug = pin.category?.slug ?? "default"
  const cacheKey = showLabel ? null : `${categorySlug}-${pin.featured}`

  if (cacheKey) {
    const cached = iconCache.get(cacheKey)
    if (cached) return cached
  }

  const featured = pin.featured
  const cfg = getCategoryConfig(categorySlug)
  const size = featured ? 52 : 40
  const svgPaths = SVG_PATHS[categorySlug] ?? SVG_PATHS.default
  const iconSvg = makeSvg(svgPaths, featured ? 20 : 16)

  const bg = featured
    ? `linear-gradient(135deg,${FEATURED_COLOR},${FEATURED_COLOR_DARK})`
    : `linear-gradient(135deg,${cfg.color}dd,${cfg.color})`
  const borderColor = featured ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.9)"
  const borderWidth = featured ? "3px" : "2.5px"
  const glowColor = featured ? "rgba(234,179,8,0.45)" : `${cfg.color}99`
  const arrowColor = featured ? FEATURED_COLOR_DARK : cfg.color

  const pulseRing = featured
    ? `<div style="position:absolute;inset:-5px;border-radius:50%;border:2px solid rgba(234,179,8,0.22);animation:pin-pulse 2.4s ease-in-out infinite;pointer-events:none;"></div>`
    : ""

  const starBadge = featured
    ? `<div style="position:absolute;bottom:1px;right:-1px;width:16px;height:16px;background:#fbbf24;border-radius:50%;border:1.5px solid white;display:flex;align-items:center;justify-content:center;font-size:9px;line-height:1;color:#000;">★</div>`
    : ""

  const labelHtml = showLabel
    ? `<div style="position:absolute;top:${size + 12}px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(12,27,46,0.92);border:1px solid rgba(147,197,253,0.2);border-radius:6px;padding:2px 8px;color:#f0f9ff;font-size:10px;font-weight:600;font-family:system-ui,sans-serif;pointer-events:none;">${pin.name}</div>`
    : ""

  const html = `
    <div style="position:relative;width:${size}px;height:${size + 8}px;">
      ${pulseRing}
      <div style="
        width:${size}px;height:${size}px;
        background:${bg};
        border:${borderWidth} solid ${borderColor};
        border-radius:50%;
        box-shadow:0 4px 12px ${glowColor};
        display:flex;align-items:center;justify-content:center;
        position:relative;
      ">${iconSvg}${starBadge}</div>
      <div style="
        position:absolute;bottom:0;left:50%;transform:translateX(-50%);
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:8px solid ${arrowColor};
      "></div>
      ${labelHtml}
    </div>
  `.trim()

  const icon = L.divIcon({
    html,
    className: "",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  })

  if (cacheKey) iconCache.set(cacheKey, icon)
  return icon
}
```

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros em `components/map/mapIcons.ts`.

- [ ] **Commit**

```bash
git add components/map/mapIcons.ts
git commit -m "feat(map): add category icon system with cache and Azul Noturno theme"
```

---

## Task 4: Atualizar `CategoryIcon.tsx` com novo mapeamento

**Objetivo:** Atualizar o componente React `CategoryIcon` para usar os ícones definidos no spec (Utensils, Scissors, ShoppingBag, Wrench, Sprout, Cross, MapPin). Usado nos cards e filtros de categoria.

**Arquivos afetados:**
- Modify: `components/ui/CategoryIcon.tsx`

**Riscos:**
- Os ícones `Utensils`, `Sprout`, `Cross` devem existir na versão de `lucide-react` instalada. Verificar com `npm list lucide-react`.

**Critérios de aceitação:**
- `CategoryIcon` renderiza o ícone Lucide correto para cada slug de categoria.
- Slug desconhecido fallback para `MapPin`.
- Sem `any` no TypeScript.

- [ ] **Verificar ícones disponíveis na versão instalada**

```bash
npm list lucide-react
node -e "const l = require('lucide-react'); console.log(Object.keys(l).filter(k => ['Utensils','Scissors','ShoppingBag','Wrench','Sprout','Cross','MapPin'].includes(k)))"
```

Esperado: todos os 7 nomes listados. Se `Cross` não aparecer, usar `Plus` como alternativa (mesma forma visual para saúde).

- [ ] **Substituir o conteúdo de `components/ui/CategoryIcon.tsx`**

```tsx
import {
  Utensils,
  Scissors,
  ShoppingBag,
  Wrench,
  Sprout,
  Cross,
  MapPin,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Mapeia slug de categoria → ícone Lucide
const ICON_MAP: Record<string, LucideIcon> = {
  alimentacao: Utensils,
  beleza:      Scissors,
  comercio:    ShoppingBag,
  servicos:    Wrench,
  agro:        Sprout,
  saude:       Cross,
  default:     MapPin,
}

interface CategoryIconProps {
  slug: string | null | undefined
  size?: number
  className?: string
}

export function CategoryIcon({ slug, size = 22, className }: CategoryIconProps) {
  const Icon = (slug && ICON_MAP[slug]) ? ICON_MAP[slug] : ICON_MAP.default
  return <Icon size={size} className={className} aria-hidden="true" />
}
```

- [ ] **Verificar se algum componente ainda usa a assinatura antiga (`name` prop)**

```bash
grep -r "CategoryIcon" components/ app/ --include="*.tsx" -l
```

Para cada arquivo listado, verificar se usa `name=` em vez de `slug=`. Se sim, atualizar a prop para `slug` nesse arquivo.

- [ ] **Verificar lint e TypeScript**

```bash
npm run lint && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add components/ui/CategoryIcon.tsx
git commit -m "feat(ui): update CategoryIcon with new spec icon mapping"
```

---

## Task 5: `MapCanvas` — estado de zoom

**Objetivo:** Adicionar `zoomLevel` como estado no `MapCanvas` e passar para `MapView`, para que `MapView` possa mostrar/ocultar labels dos pins conforme o zoom.

**Arquivos afetados:**
- Modify: `components/map/MapCanvas.tsx`

**Riscos:**
- A prop `zoomLevel` adicionada ao `MapView` vai causar erro de TypeScript até que Task 6 atualize a interface de `MapView`. Implementar Tasks 5 e 6 em sequência no mesmo deploy se possível.

**Critérios de aceitação:**
- `MapCanvas` tem `zoomLevel: number` em seu estado (inicial: `14`).
- `MapCanvas` passa `zoomLevel` para `MapView`.
- `npm run build` sem erros (após Task 6 que atualiza `MapView`).

- [ ] **Atualizar `components/map/MapCanvas.tsx`**

Adicionar import de `useState` se não presente (já está). Adicionar estado `zoomLevel`:

```tsx
const [zoomLevel, setZoomLevel] = useState<number>(14)
```

Adicionar `zoomLevel` e `onZoomChange` ao `<MapView>`:

```tsx
<MapView
  businesses={businesses}
  userLocation={userLocation}
  selectedId={selectedBusiness?.id ?? null}
  onSelectBusiness={handleSelectBusiness}
  categoryFilter={categoryFilter}
  searchQuery={searchQuery}
  zoomLevel={zoomLevel}
  onZoomChange={setZoomLevel}
/>
```

- [ ] **Commit parcial (build pode falhar até Task 6)**

```bash
git add components/map/MapCanvas.tsx
git commit -m "feat(map): add zoomLevel state to MapCanvas"
```

---

## Task 6: `MapView` — redesenho completo de pins e zoom behavior

**Objetivo:** Refatorar `MapView.tsx` para usar `mapIcons.ts` (novos pins circulares com glow), adicionar listener de zoom para mostrar labels ao se aproximar, e receber `zoomLevel` / `onZoomChange` do `MapCanvas`.

**Arquivos afetados:**
- Modify: `components/map/MapView.tsx`

**Riscos:**
- A animação `pin-pulse` referenciada no HTML inline dos pins requer que o CSS esteja no global — garantido pela Task 1.
- Recriar todos os markers ao mudar zoom pode ser lento com muitos pins — o cache de ícones da Task 3 mitiga isso.
- O listener `zoomend` deve ser removido no cleanup do `useEffect` para evitar memory leak.

**Critérios de aceitação:**
- Pins normais: círculo colorido por categoria, 40px, ícone SVG branco, seta.
- Pins destaque: círculo dourado 52px, halo pulsante, badge `★`, seta.
- Zoom < 15: sem labels de nome.
- Zoom ≥ 15: nome do negócio aparece abaixo do pin.
- Filtro e busca continuam funcionando.
- Sem erros no console do browser.
- `npm run build` sem erros.

- [ ] **Substituir o conteúdo de `components/map/MapView.tsx`**

```tsx
// components/map/MapView.tsx
// ATENÇÃO: este arquivo deve ser importado apenas via dynamic() com ssr: false
"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import { createBusinessIcon } from "@/components/map/mapIcons"
import type { BusinessMapPin } from "@/types"

// Corrige ícone padrão quebrado do Leaflet com webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface Props {
  businesses: BusinessMapPin[]
  userLocation: { lat: number; lng: number } | null
  selectedId: string | null
  onSelectBusiness: (pin: BusinessMapPin | null) => void
  categoryFilter: string | null
  searchQuery: string
  zoomLevel: number
  onZoomChange: (zoom: number) => void
}

const DEFAULT_CENTER: [number, number] = [-3.754, -39.453]
const DEFAULT_ZOOM = 14
const LABEL_ZOOM_THRESHOLD = 15

export function MapView({
  businesses,
  userLocation,
  selectedId,
  onSelectBusiness,
  categoryFilter,
  searchQuery,
  zoomLevel,
  onZoomChange,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  const filtered = businesses.filter((b) => {
    if (categoryFilter && b.category?.slug !== categoryFilter) return false
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredKey = JSON.stringify(filtered.map((b) => b.id)) + `-z${zoomLevel >= LABEL_ZOOM_THRESHOLD}`

  // Inicializar mapa
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

    const handleZoom = () => onZoomChange(map.getZoom())
    map.on("zoomend", handleZoom)

    mapRef.current = map

    return () => {
      map.off("zoomend", handleZoom)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recriar markers quando filtro, busca ou threshold de zoom mudam
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    const showLabel = zoomLevel >= LABEL_ZOOM_THRESHOLD

    filtered.forEach((pin) => {
      if (pin.latitude === null || pin.longitude === null) return

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: createBusinessIcon(pin, showLabel),
      })

      marker.on("click", () => onSelectBusiness(pin))
      marker.addTo(map)
      markersRef.current.set(pin.id, marker)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredKey, onSelectBusiness])

  // Localização do usuário
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

  void selectedId

  return <div ref={containerRef} className="w-full h-full" />
}
```

- [ ] **Verificar build e abrir o app no browser**

```bash
npm run build && npm run dev
```

Abrir `http://localhost:3000`. Verificar:
- Pins aparecem no mapa com cores por categoria
- Featured pins são dourados com badge `★`
- Halo pulsante visível nos destaques (sem ser neon)
- Fazer zoom in até 15+ — nomes devem aparecer
- Fazer zoom out — nomes somem
- Filtros e busca continuam filtrando pins

- [ ] **Commit**

```bash
git add components/map/MapView.tsx
git commit -m "feat(map): redesign pins with Azul Noturno theme and zoom label behavior"
```

---

## Task 7: `BusinessMapCard` — bottom sheet redesenho

**Objetivo:** Redesenhar o card de negócio que aparece ao clicar num pin — bottom sheet escuro full-width no mobile, painel lateral elegante no desktop. Usar `lib/distance.ts` para distância.

**Arquivos afetados:**
- Modify: `components/map/BusinessMapCard.tsx`

**Riscos:**
- A animação `animate-slide-up` requer Task 1 concluída.
- `fixed bottom-0` no mobile conflita com `absolute` do MapCanvas — verificar z-index.
- Desktop: `absolute bottom-6 right-4` precisa que o container pai seja `relative` — `MapCanvas` já usa `<>` fragmento, não `relative div`. Verificar se o posicionamento funciona.

**Critérios de aceitação:**
- Card aparece na parte inferior da tela no mobile (≤ 767px).
- Card aparece no canto inferior direito no desktop (≥ 768px), largura 340px, max-height 480px.
- Nome do negócio em `text-lg font-black`.
- WhatsApp é o botão dominante quando disponível.
- Endereço curto exibido abaixo dos metadados.
- Distância exibida quando localização disponível, oculta caso contrário.
- Animação slide-up ao aparecer.
- `X` fecha o card.
- Sem erros no console.

- [ ] **Substituir o conteúdo de `components/map/BusinessMapCard.tsx`**

```tsx
// components/map/BusinessMapCard.tsx
"use client"

import Link from "next/link"
import { X, MessageCircle, MapPin, Navigation, Phone, ExternalLink } from "lucide-react"
import { haversineKm, formatDistance } from "@/lib/distance"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import { getCategoryConfig } from "@/components/map/mapIcons"
import type { BusinessMapPin } from "@/types"

interface Props {
  business: BusinessMapPin
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
}

export function BusinessMapCard({ business, userLocation, onClose }: Props) {
  const distance =
    userLocation && business.latitude && business.longitude
      ? haversineKm(userLocation.lat, userLocation.lng, business.latitude, business.longitude)
      : null

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`
    : null

  const cfg = getCategoryConfig(business.category?.slug)

  return (
    <>
      {/* Backdrop mobile */}
      <div
        className="fixed inset-0 z-[999] md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={[
          // Mobile: bottom sheet full-width
          "fixed bottom-0 left-0 right-0 rounded-t-3xl",
          // Desktop: painel lateral
          "md:absolute md:bottom-6 md:right-4 md:left-auto md:w-[340px] md:max-w-[380px] md:rounded-2xl md:max-h-[480px] md:overflow-y-auto",
          // Visual
          "bg-[#0c1b2e]/[0.97] backdrop-blur-2xl",
          "border-t border-white/10 md:border md:border-white/10",
          "shadow-2xl z-[1000]",
          "animate-slide-up",
        ].join(" ")}
        role="dialog"
        aria-label={`Informações sobre ${business.name}`}
      >
        {/* Drag handle (mobile only) */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden" />

        <div className="p-4 pt-3">
          {/* Botão fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 rounded-xl p-1.5 transition-colors"
          >
            <X size={16} className="text-white/70" />
          </button>

          {/* Header: ícone + nome + metadados */}
          <div className="flex items-start gap-3 mb-4 pr-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color})` }}
              aria-hidden="true"
            >
              <CategoryIcon slug={business.category?.slug} size={22} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              {business.category && (
                <p
                  className="text-[10px] font-bold uppercase tracking-wide mb-0.5"
                  style={{ color: cfg.color }}
                >
                  {business.category.name}
                </p>
              )}
              <h3 className="text-lg font-black text-white leading-tight truncate">
                {business.name}
              </h3>

              {/* Distância */}
              {distance !== null && (
                <div className="flex items-center gap-1 mt-1">
                  <Navigation size={11} className="text-blue-400 shrink-0" aria-hidden="true" />
                  <span className="text-xs text-white/60">{formatDistance(distance)}</span>
                </div>
              )}

              {/* Endereço */}
              {business.address && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-white/40 shrink-0" aria-hidden="true" />
                  <span className="text-xs text-white/60 truncate">{business.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir WhatsApp de ${business.name}`}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold px-3 py-2.5 rounded-xl hover:from-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-900/30"
              >
                <MessageCircle size={15} aria-hidden="true" />
                WhatsApp
              </a>
            ) : business.phone ? (
              <a
                href={`tel:${business.phone}`}
                aria-label={`Ligar para ${business.name}`}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold px-3 py-2.5 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all"
              >
                <Phone size={15} aria-hidden="true" />
                Ligar
              </a>
            ) : null}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver rota para ${business.name} no Google Maps`}
              className="flex items-center gap-1.5 text-sm text-white/70 bg-white/[0.08] border border-white/[0.12] px-3 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors"
            >
              <MapPin size={15} aria-hidden="true" />
              Rota
            </a>

            <Link
              href={`/businesses/${business.slug}`}
              aria-label={`Ver perfil completo de ${business.name}`}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-300 bg-white/[0.08] border border-white/[0.12] px-3 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors ml-auto"
            >
              Ver
              <ExternalLink size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Testar no browser (mobile e desktop)**

```bash
npm run dev
```

Abrir `http://localhost:3000`. Clicar em um pin. Verificar:
- Mobile (DevTools 390px): sheet aparece na parte inferior com drag handle
- Desktop (1024px+): painel no canto inferior direito, 340px de largura
- WhatsApp dominante (verde)
- Nome grande e legível
- Endereço e distância (se localização ativa)
- Animação slide-up ao aparecer
- `X` fecha o card

- [ ] **Commit**

```bash
git add components/map/BusinessMapCard.tsx
git commit -m "feat(map): redesign BusinessMapCard as Azul Noturno bottom sheet"
```

---

## Task 8: `MapOverlayHeader` — redesenho do overlay

**Objetivo:** Redesenhar o header overlay do mapa com o gradiente escuro, CTA "+ Negócio", busca com protagonismo, e filtros de categoria com ícones Lucide.

**Arquivos afetados:**
- Modify: `components/map/MapOverlayHeader.tsx`

**Riscos:**
- `scrollbar-hide` CSS requer Task 1 concluída.
- A classe `CategoryIcon` usa `slug` agora — garantido pela Task 4.
- O `ring-2 ring-blue-400/30` no focus da busca requer que o input não tenha `outline: none` conflitante — adicionar `focus:outline-none` explícito.

**Critérios de aceitação:**
- Gradiente escuro nos primeiros 180px do topo.
- CTA "+ Negócio" visível e azul (gradiente).
- Botão perfil discreto (`bg-white/[0.05]`).
- Busca com placeholder correto e ring no foco.
- Filtros horizontais sem scrollbar visível, com ícone Lucide por categoria.
- Sem mudança de lógica — estado gerenciado pelo `MapCanvas`.

- [ ] **Substituir o conteúdo de `components/map/MapOverlayHeader.tsx`**

```tsx
// components/map/MapOverlayHeader.tsx
"use client"

import Link from "next/link"
import { Search, Plus, User, X } from "lucide-react"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
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
  return (
    <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
      {/* Gradiente escuro */}
      <div className="h-48 bg-gradient-to-b from-black/50 to-transparent" />

      <div className="absolute top-0 left-0 right-0 px-4 pt-4 pb-3 flex flex-col gap-3 pointer-events-auto">

        {/* Linha 1: brand + ações */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg leading-tight">{appName}</span>
            {slogan && (
              <p className="text-white/60 text-xs leading-tight">{slogan}</p>
            )}
          </div>

          {/* Espaço reservado para "Perto de você" (ícone Navigation) — não implementar agora */}

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/new"
              aria-label="Cadastrar novo negócio"
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl hover:from-blue-400 hover:to-blue-600 transition-all shadow-lg shadow-blue-900/40"
            >
              <Plus size={14} aria-hidden="true" />
              + Negócio
            </Link>

            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              aria-label={isAuthenticated ? "Ir para o painel" : "Fazer login"}
              className="w-9 h-9 bg-white/[0.05] border border-white/10 backdrop-blur-sm text-white rounded-xl flex items-center justify-center hover:bg-white/[0.12] transition-colors shadow-lg"
            >
              <User size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Linha 2: busca */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/[0.97] backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg focus-within:ring-2 focus-within:ring-blue-400/30 transition-all">
            <Search size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar negócio, categoria ou serviço..."
              aria-label="Buscar negócios"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                aria-label="Limpar busca"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Linha 3: filtros de categoria */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onCategoryFilter(null)}
            aria-label="Mostrar todos os negócios"
            aria-pressed={!categoryFilter}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors shadow-sm ${
              !categoryFilter
                ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                : "bg-white/90 text-gray-700 hover:bg-white"
            }`}
          >
            Todos
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
              aria-label={`Filtrar por ${cat.name}`}
              aria-pressed={categoryFilter === cat.slug}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shadow-sm ${
                categoryFilter === cat.slug
                  ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                  : "bg-white/90 text-gray-700 hover:bg-white"
              }`}
            >
              <CategoryIcon slug={cat.slug} size={12} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Testar no browser**

Abrir `http://localhost:3000`. Verificar:
- Gradiente escuro acima do mapa
- CTA "+ Negócio" azul e proeminente
- Botão perfil discreto
- Busca: digitar texto → pins filtram; limpar → todos voltam
- Filtros: clicar em categoria → pills mudam; ícone Lucide visível
- Sem scrollbar horizontal visível nos filtros

- [ ] **Commit**

```bash
git add components/map/MapOverlayHeader.tsx
git commit -m "feat(map): redesign MapOverlayHeader with Azul Noturno overlay"
```

---

## Task 9: `BusinessCardDistance` — distância client-side para /businesses

**Objetivo:** Criar componente `"use client"` que lê a geolocalização do browser e exibe a distância até um negócio. Usado dentro do `BusinessCard` (Server Component).

**Arquivos afetados:**
- Create: `components/businesses/BusinessCardDistance.tsx`

**Riscos:**
- Geolocalização pode ser negada pelo usuário — ocultar distância silenciosamente (sem erro visível).
- SSR: este componente tem `"use client"`, então renderiza apenas no browser — sem hydration mismatch desde que não renderize nada no servidor.
- Performance: cada card faz uma chamada `getCurrentPosition` — pode ser lento com muitos cards. Mitigação: usar `watchPosition` em um contexto global é overkill para agora; aceitar a latência inicial.

**Critérios de aceitação:**
- Renderiza `"• 850 m"` ou `"• 1,2 km"` quando geolocalização disponível.
- Renderiza `null` (nada) quando geolocalização negada ou indisponível.
- Sem flash de conteúdo (mount sem conteúdo, atualiza quando geo chega).
- Aceita `lat` e `lng` do negócio como props.

- [ ] **Criar `components/businesses/BusinessCardDistance.tsx`**

```tsx
"use client"

import { useEffect, useState } from "react"
import { haversineKm, formatDistance } from "@/lib/distance"

interface Props {
  lat: number
  lng: number
}

export function BusinessCardDistance({ lat, lng }: Props) {
  const [distance, setDistance] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, lat, lng)
        setDistance(formatDistance(km))
      },
      () => {
        // Permissão negada ou erro — ocultar silenciosamente
      },
      { timeout: 8000 }
    )
  }, [lat, lng])

  if (!distance) return null

  return <span className="text-white/50">• {distance}</span>
}
```

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add components/businesses/BusinessCardDistance.tsx
git commit -m "feat(businesses): add BusinessCardDistance client component"
```

---

## Task 10: `BusinessCard` — redesenho do card horizontal dark

**Objetivo:** Redesenhar o card horizontal na listagem de negócios: fundo dark, ícone da categoria, hover com profundidade, distância client-side, todo o card clicável.

**Arquivos afetados:**
- Modify: `components/businesses/BusinessCard.tsx`

**Riscos:**
- `BusinessCard` é Server Component — `BusinessCardDistance` (client) será um filho. Garantir que não haja estado client no componente pai.
- `featured` pode não estar no tipo atual de `BusinessWithRelations` — verificar em `types/index.ts`. O campo existe em `Business` do Prisma, então estará disponível.
- Hover com `hover:-translate-y-0.5` requer Tailwind JIT ativo — já está.

**Critérios de aceitação:**
- Card inteiro é `<Link>` clicável.
- Fundo `bg-white/[0.05] border border-white/10 rounded-2xl`.
- Hover: `hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg`.
- Ícone categoria: `52×52px` com gradiente e `CategoryIcon`.
- Badge `★ Destaque` dourado se `featured`.
- Nome, endereço, estrelas + contagem, distância (quando disponível).
- `ChevronRight` como reforço visual à direita.

- [ ] **Verificar o tipo de `business` no arquivo atual**

```bash
# Confirmar que featured existe no tipo
grep -n "featured" types/index.ts components/businesses/BusinessCard.tsx
```

- [ ] **Substituir o conteúdo de `components/businesses/BusinessCard.tsx`**

```tsx
import Link from "next/link"
import { MapPin, Star, ChevronRight } from "lucide-react"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import { BusinessCardDistance } from "@/components/businesses/BusinessCardDistance"
import { getCategoryConfig } from "@/components/map/mapIcons"
import type { Business, Category, BusinessImage } from "@prisma/client"

type BusinessWithRelations = Business & {
  category: Category | null
  images: BusinessImage[]
  _count: { reviews: number }
}

interface BusinessCardProps {
  business: BusinessWithRelations
}

export function BusinessCard({ business }: BusinessCardProps) {
  const cfg = getCategoryConfig(business.category?.slug ?? null)

  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group flex items-center gap-4 p-4 bg-white/[0.05] border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
      aria-label={`Ver detalhes de ${business.name}`}
    >
      {/* Ícone da categoria */}
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})` }}
        aria-hidden="true"
      >
        <CategoryIcon slug={business.category?.slug} size={24} className="text-white" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-white font-bold text-sm leading-tight truncate group-hover:text-blue-200 transition-colors">
            {business.name}
          </h3>
          {business.featured && (
            <span className="shrink-0 text-[10px] font-black text-black bg-[#eab308] px-2 py-0.5 rounded-full leading-tight">
              ★ Destaque
            </span>
          )}
        </div>

        {business.address && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin size={11} className="text-white/40 shrink-0" aria-hidden="true" />
            <span className="text-xs text-white/50 truncate">{business.address}</span>
            {/* Distância client-side — só aparece quando geolocalização disponível */}
            {business.latitude && business.longitude && (
              <BusinessCardDistance lat={business.latitude} lng={business.longitude} />
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          <Star size={12} className="text-yellow-400 fill-yellow-400" aria-hidden="true" />
          <span className="text-xs text-white/50">
            {business._count.reviews > 0
              ? `${business._count.reviews} avaliação${business._count.reviews > 1 ? "ões" : ""}`
              : "Sem avaliações"}
          </span>
        </div>
      </div>

      {/* Seta visual */}
      <ChevronRight size={16} className="text-white/30 shrink-0" aria-hidden="true" />
    </Link>
  )
}
```

- [ ] **Verificar TypeScript e lint**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add components/businesses/BusinessCard.tsx
git commit -m "feat(businesses): redesign BusinessCard with Azul Noturno horizontal dark style"
```

---

## Task 11: Página `/businesses` — redesenho completo

**Objetivo:** Redesenhar a página de listagem de negócios com fundo dark, nova search bar, filtros com ícones, lista vertical de cards, estados vazio e loading.

**Arquivos afetados:**
- Modify: `app/(main)/businesses/page.tsx`

**Riscos:**
- A query `?categoria=` e `?q=` continuam preservadas — sem mudança de lógica.
- O `searchParams` tipado como `{ q?: string; categoria?: string }` continua igual.
- O `<form method="get">` mantém o comportamento de URL — sem JS extra necessário.

**Critérios de aceitação:**
- Background `bg-[#0c1b2e] min-h-screen`.
- Header da página com título e subtítulo.
- Search bar com placeholder correto e filtros com ícones.
- Cards em lista vertical com `flex-col gap-3`.
- Contador de resultados visível.
- Estado vazio elegante com `SearchX` Lucide.
- Preserva `?q=` e `?categoria=` na URL.
- `npm run build` sem erros.

- [ ] **Substituir o conteúdo de `app/(main)/businesses/page.tsx`**

```tsx
// Página dinâmica — busca e filtros dependem de params em runtime
export const dynamic = "force-dynamic"

import Link from "next/link"
import { Search, SearchX, Map } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { BusinessCard } from "@/components/businesses/BusinessCard"
import { CategoryIcon } from "@/components/ui/CategoryIcon"

interface PageProps {
  searchParams: { q?: string; categoria?: string }
}

export const metadata = { title: "Negócios — Empreende General" }

export default async function BusinessesPage({ searchParams }: PageProps) {
  const { q, categoria } = searchParams

  const [businesses, categories] = await Promise.all([
    prisma.business.findMany({
      where: {
        status: "APPROVED",
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(categoria ? { category: { slug: categoria } } : {}),
      },
      include: {
        category: true,
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { reviews: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  const activeCategory = categories.find((c) => c.slug === categoria)

  return (
    <div className="min-h-screen bg-[#0c1b2e]">
      <div className="container py-8 px-4 max-w-2xl mx-auto">

        {/* Cabeçalho da página */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-white font-black text-2xl leading-tight">
              Negócios em<br />General Sampaio
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Descubra empreendedores locais
            </p>
          </div>
          <Link
            href="/"
            aria-label="Ver negócios no mapa"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 bg-white/[0.08] border border-white/10 px-3 py-2 rounded-xl hover:bg-white/[0.14] transition-colors shrink-0 mt-1"
          >
            <Map size={13} aria-hidden="true" />
            Ver no mapa
          </Link>
        </div>

        {/* Search */}
        <form method="get" className="mb-4">
          <div className="flex items-center gap-2 bg-white/[0.08] border border-white/[0.12] backdrop-blur-sm rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-400/30 transition-all">
            <Search size={16} className="text-white/40 shrink-0" aria-hidden="true" />
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Buscar negócio, categoria ou serviço..."
              aria-label="Buscar negócios"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
            />
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
          </div>
        </form>

        {/* Filtros de categoria */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <Link
            href={q ? `/businesses?q=${q}` : "/businesses"}
            aria-label="Mostrar todos os negócios"
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              !categoria
                ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                : "bg-white/[0.08] border border-white/10 text-white/70 hover:bg-white/[0.14]"
            }`}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/businesses?categoria=${cat.slug}${q ? `&q=${q}` : ""}`}
              aria-label={`Filtrar por ${cat.name}`}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                categoria === cat.slug
                  ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                  : "bg-white/[0.08] border border-white/10 text-white/70 hover:bg-white/[0.14]"
              }`}
            >
              <CategoryIcon slug={cat.slug} size={12} />
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Contador */}
        {businesses.length > 0 && (
          <p className="text-white/40 text-xs mb-4">
            {businesses.length} negócio{businesses.length !== 1 ? "s" : ""} encontrado{businesses.length !== 1 ? "s" : ""}
            {q ? ` para "${q}"` : ""}
            {activeCategory ? ` em ${activeCategory.name}` : ""}
          </p>
        )}

        {/* Lista de cards */}
        {businesses.length > 0 ? (
          <div className="flex flex-col gap-3">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <SearchX size={40} className="text-white/20 mb-4" aria-hidden="true" />
            <p className="text-white/60 font-semibold mb-1">Nenhum negócio encontrado</p>
            <p className="text-white/35 text-sm mb-5">
              {q
                ? `Sem resultados para "${q}". Tente outro termo.`
                : "Ainda não há negócios nessa categoria."}
            </p>
            <Link
              href="/businesses"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
            >
              Ver todos os negócios
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Testar no browser em 390px e 1024px**

```bash
npm run dev
```

Abrir `http://localhost:3000/businesses`. Verificar:
- Fundo escuro full-page
- Cards em lista vertical com hover funcionando
- Filtros horizontais com ícones e sem scrollbar visível
- Busca funciona (submit via form)
- Estado vazio com ícone `SearchX` quando sem resultados

- [ ] **Commit**

```bash
git add app/\(main\)/businesses/page.tsx
git commit -m "feat(businesses): redesign /businesses page with Azul Noturno theme"
```

---

## Task 12: `MiniMap` — mapa embutido para página de detalhe

**Objetivo:** Criar componente Leaflet client-only que exibe um mini mapa estático com o pin do negócio e botão "Abrir rota".

**Arquivos afetados:**
- Create: `components/map/MiniMap.tsx`

**Riscos:**
- Deve ser importado via `dynamic({ ssr: false })` na página de detalhe — nunca importado diretamente.
- O mapa deve ter `dragging: false, zoomControl: false, scrollWheelZoom: false` para ser não-interativo.
- A altura fixa `h-[200px]` deve ser definida no container pai, não dentro do componente.

**Critérios de aceitação:**
- Renderiza mapa OpenStreetMap com pin do negócio.
- Zoom fixo 15, sem interação.
- Botão "Abrir rota" abre Google Maps em nova aba.
- Sem erros de Leaflet no console.
- Funciona com `dynamic({ ssr: false })`.

- [ ] **Criar `components/map/MiniMap.tsx`**

```tsx
// components/map/MiniMap.tsx
// ATENÇÃO: importar apenas via dynamic() com ssr: false
"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface Props {
  lat: number
  lng: number
  name: string
}

export function MiniMap({ lat, lng, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const icon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.6)"></div>`,
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(name)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, name])

  return <div ref={containerRef} className="w-full h-full" />
}
```

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add components/map/MiniMap.tsx
git commit -m "feat(map): add MiniMap component for business detail page"
```

---

## Task 13: Página `/businesses/[slug]` — redesenho completo

**Objetivo:** Redesenhar a página de detalhe do negócio: hero imersivo, barra de ações sticky, seções em ordem (Sobre → Informações → Mini mapa → Galeria → Avaliações).

**Arquivos afetados:**
- Modify: `app/(main)/businesses/[slug]/page.tsx`

**Riscos:**
- `MiniMap` deve ser importado via `dynamic({ ssr: false })` — o `useEffect` do Leaflet falha no SSR.
- A barra sticky usa `sticky top-0` — pode conflitar com o Header do layout que também é sticky. Testar visualmente.
- O hero com `next/image` requer que o domínio da Cloudinary esteja em `next.config.js` em `images.domains` ou `images.remotePatterns` — verificar antes de implementar.
- `business.latitude` e `business.longitude` podem ser `null` — o MiniMap só é exibido se ambos existirem.

**Critérios de aceitação:**
- Hero com imagem real (se existir) e overlay escuro forte.
- Hero sem imagem: gradiente da categoria como fallback.
- Ícone de categoria flutuante sobre o hero.
- Nome `text-2xl font-black`.
- Barra sticky com WhatsApp dominante.
- Seções: Sobre, Informações, MiniMap (se lat/lng existirem), Galeria, Avaliações.
- Estado vazio de avaliações com ícone `Star`.
- `generateMetadata` intacto.
- `npm run build` sem erros.

- [ ] **Verificar domínio Cloudinary em next.config.js**

```bash
cat next.config.js || cat next.config.mjs || cat next.config.ts
```

Procurar por `images.domains` ou `images.remotePatterns`. Se Cloudinary não estiver configurado, o `next/image` vai falhar. Se não estiver, adicionar:

```js
// Em next.config.js — dentro do objeto config
images: {
  remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com" },
  ],
},
```

- [ ] **Substituir o conteúdo de `app/(main)/businesses/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import dynamicImport from "next/dynamic"
import {
  MapPin,
  Phone,
  Globe,
  Instagram,
  MessageCircle,
  Star,
  ArrowLeft,
  Clock,
  ExternalLink,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import { getCategoryConfig } from "@/components/map/mapIcons"

const MiniMap = dynamicImport(
  () => import("@/components/map/MiniMap").then((m) => ({ default: m.MiniMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white/[0.05] animate-pulse rounded-2xl" />
    ),
  }
)

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, status: "APPROVED" },
  })
  if (!business) return {}
  return {
    title: `${business.name} — Empreende General`,
    description: business.description ?? undefined,
  }
}

export default async function BusinessPage({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, status: "APPROVED" },
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      reviews: {
        where: { deletedAt: null },
        include: { user: true, reply: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!business) notFound()

  const avgRating =
    business.reviews.length > 0
      ? business.reviews.reduce((acc, r) => acc + r.rating, 0) / business.reviews.length
      : null

  const primaryImage = business.images.find((i) => i.isPrimary) ?? business.images[0]
  const cfg = getCategoryConfig(business.category?.slug ?? null)

  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`
    : null
  const mapsUrl =
    business.latitude && business.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : null

  return (
    <div className="min-h-screen bg-[#0c1b2e]">

      {/* Hero */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt ?? business.name}
              fill
              className="object-cover"
              priority
            />
            {/* Overlay escuro forte para legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#0c1b2e]" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${cfg.color}cc 0%, ${cfg.color}66 50%, #0c1b2e 100%)`,
            }}
          />
        )}

        {/* Botão voltar */}
        <Link
          href="/businesses"
          aria-label="Voltar para listagem de negócios"
          className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-black/50 transition-colors z-10"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Negócios
        </Link>

        {/* Badge categoria */}
        {business.category && (
          <div
            className="absolute bottom-14 left-4 text-xs font-bold px-3 py-1 rounded-full border border-white/20 text-white z-10"
            style={{ background: `${cfg.color}cc` }}
          >
            {business.category.name}
          </div>
        )}
      </div>

      {/* Identidade — ícone flutuante + nome */}
      <div className="px-4 -mt-7 mb-4 relative z-10">
        <div className="flex items-end gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white/20 shrink-0 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color})` }}
            aria-hidden="true"
          >
            <CategoryIcon slug={business.category?.slug} size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-white font-black text-2xl leading-tight">{business.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {avgRating !== null && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      aria-hidden="true"
                      className={s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-white/20 fill-white/20"}
                    />
                  ))}
                  <span className="text-white/50 text-xs ml-1">
                    {avgRating.toFixed(1)} · {business._count.reviews} avaliação{business._count.reviews !== 1 ? "ões" : ""}
                  </span>
                </div>
              )}
              {business.featured && (
                <span className="text-[10px] font-black text-black bg-[#eab308] px-2 py-0.5 rounded-full">
                  ★ Destaque
                </span>
              )}
            </div>
            {business.address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={11} className="text-white/40 shrink-0" aria-hidden="true" />
                <span className="text-xs text-white/50">{business.address}{business.city ? `, ${business.city}` : ""}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de ações sticky */}
      <div className="sticky top-0 z-40 bg-[#0c1b2e]/[0.95] backdrop-blur-md border-b border-white/[0.08] px-4 py-3 flex items-center gap-2">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir WhatsApp de ${business.name}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold py-2.5 px-4 rounded-xl hover:from-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-900/30"
          >
            <MessageCircle size={15} aria-hidden="true" />
            WhatsApp
          </a>
        ) : business.phone ? (
          <a
            href={`tel:${business.phone}`}
            aria-label={`Ligar para ${business.name}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all"
          >
            <Phone size={15} aria-hidden="true" />
            Ligar
          </a>
        ) : null}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver rota no Google Maps"
            className="flex items-center gap-1.5 text-sm text-white/70 bg-white/[0.08] border border-white/[0.12] px-4 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors"
          >
            <MapPin size={15} aria-hidden="true" />
            Rota
          </a>
        )}

        {business.instagram && (
          <a
            href={`https://instagram.com/${business.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram de ${business.name}`}
            className="flex items-center gap-1.5 text-sm text-white/70 bg-white/[0.08] border border-white/[0.12] px-4 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors"
          >
            <Instagram size={15} aria-hidden="true" />
          </a>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-8">

        {/* Sobre */}
        {business.description && (
          <section aria-label="Sobre o negócio">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Sobre</h2>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
              {business.description}
            </p>
          </section>
        )}

        {/* Informações */}
        {(business.address || business.phone || business.website || business.hours) && (
          <section aria-label="Informações de contato">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Informações</h2>
            <div className="grid grid-cols-2 gap-3">
              {business.address && (
                <div className="bg-white/[0.05] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={13} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white/40 text-xs">Endereço</span>
                  </div>
                  <p className="text-white/80 text-xs font-medium leading-snug">
                    {business.address}{business.city ? `, ${business.city}` : ""}
                  </p>
                </div>
              )}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="bg-white/[0.05] rounded-xl p-3 hover:bg-white/[0.08] transition-colors"
                  aria-label={`Ligar para ${business.phone}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Phone size={13} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white/40 text-xs">Telefone</span>
                  </div>
                  <p className="text-white/80 text-xs font-medium">{business.phone}</p>
                </a>
              )}
              {(business as unknown as { hours?: string }).hours && (
                <div className="bg-white/[0.05] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={13} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white/40 text-xs">Horário</span>
                  </div>
                  <p className="text-white/80 text-xs font-medium">
                    {(business as unknown as { hours?: string }).hours}
                  </p>
                </div>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/[0.05] rounded-xl p-3 hover:bg-white/[0.08] transition-colors"
                  aria-label="Visitar site do negócio"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={13} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white/40 text-xs">Site</span>
                  </div>
                  <p className="text-white/80 text-xs font-medium flex items-center gap-1">
                    Visitar site <ExternalLink size={10} aria-hidden="true" />
                  </p>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Mini mapa */}
        {business.latitude && business.longitude && (
          <section aria-label="Localização no mapa">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Localização</h2>
            <div className="relative h-[200px] rounded-2xl overflow-hidden border border-white/[0.08]">
              <MiniMap lat={business.latitude} lng={business.longitude} name={business.name} />
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir rota no Google Maps"
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#0c1b2e]/[0.92] border border-white/15 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#0c1b2e] transition-colors z-[500]"
                >
                  <MapPin size={12} aria-hidden="true" />
                  Abrir rota
                </a>
              )}
            </div>
          </section>
        )}

        {/* Galeria */}
        {business.images.length > 1 && (
          <section aria-label="Fotos do negócio">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Fotos</h2>
            <div className="grid grid-cols-2 gap-2">
              {business.images.slice(1, 5).map((img, i) => (
                <div
                  key={img.id}
                  className={`relative rounded-xl overflow-hidden bg-white/[0.05] ${i === 0 ? "col-span-2 h-40" : "h-28"}`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? business.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Avaliações */}
        <section aria-label="Avaliações de clientes">
          <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
            Avaliações ({business._count.reviews})
          </h2>

          {business.reviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {business.reviews.map((review) => (
                <div key={review.id} className="bg-white/[0.05] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm"
                        aria-hidden="true"
                      >
                        {review.user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span className="text-sm font-semibold text-white/80">
                        {review.user.name ?? "Usuário"}
                      </span>
                    </div>
                    <div className="flex" aria-label={`Nota ${review.rating} de 5`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          aria-hidden="true"
                          className={s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20 fill-white/20"}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-white/70 leading-relaxed">{review.comment}</p>
                  )}
                  {review.reply && (
                    <div className="mt-3 border-l-2 border-blue-400/40 pl-3 bg-white/[0.05] rounded-r-xl py-2">
                      <p className="text-xs font-bold text-blue-400 mb-1">Resposta do estabelecimento</p>
                      <p className="text-sm text-white/60">{review.reply.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <Star size={32} className="text-white/15 mb-3" aria-hidden="true" />
              <p className="text-white/50 text-sm font-medium">Nenhuma avaliação ainda</p>
              <p className="text-white/30 text-xs mt-1">Seja o primeiro a avaliar este negócio.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Verificar TypeScript — campo `hours`**

O campo `hours` pode não existir no schema Prisma atual. Verificar:

```bash
grep -n "hours" prisma/schema.prisma
```

Se `hours` não existir no schema, remover o bloco `hours` da seção Informações. Não criar o campo — o spec proíbe alterar schema.

- [ ] **Verificar build completo**

```bash
npm run build
```

Esperado: zero erros TypeScript e zero erros de build.

- [ ] **Testar no browser em 390px, 768px e 1440px**

Abrir `http://localhost:3000/businesses/[slug-existente]`. Verificar:
- Hero com imagem ou gradiente de fallback
- Ícone flutuante sobre o hero
- Nome grande e legível
- Barra sticky funciona ao rolar
- Mini mapa renderiza (após delay do SSR false)
- Botão "Abrir rota" abre Google Maps
- Avaliações com estado vazio elegante quando sem avaliações
- Responsivo em todas as larguras

- [ ] **Commit final**

```bash
git add app/\(main\)/businesses/\[slug\]/page.tsx
git commit -m "feat(businesses): redesign /businesses/[slug] with hero, mini map and Azul Noturno theme"
```

---

## Verificação Final (Definition of Done)

Após todas as 13 tasks concluídas, executar a checklist completa:

- [ ] `npm run lint` — zero erros ou warnings
- [ ] `npm run build` — zero erros TypeScript e de compilação
- [ ] Abrir `http://localhost:3000` — pins no mapa com nova estética, overlay correto
- [ ] Fazer zoom in (≥ 15) — labels dos negócios aparecem
- [ ] Clicar num pin — bottom sheet abre com animação slide-up
- [ ] Fechar bottom sheet — funciona no mobile e desktop
- [ ] Abrir `/businesses` — lista dark, filtros, busca funcional
- [ ] Abrir `/businesses/[slug]` — hero, mini mapa, avaliações
- [ ] Testar em 390px, 768px, 1024px, 1440px — sem quebra de layout
- [ ] Abrir DevTools Console — zero erros JavaScript
- [ ] Abrir DevTools Network — zero erros 404 ou falhas de asset
- [ ] Acessibilidade: navegar por teclado em `/businesses` — foco visível em todos os cards

---

## Dependências entre Tasks

```
Task 1 (Tailwind/CSS)     ──→ Task 7 (slide-up animation)
Task 1 (Tailwind/CSS)     ──→ Task 8 (scrollbar-hide)
Task 1 (Tailwind/CSS)     ──→ Task 11 (scrollbar-hide)

Task 2 (distance util)    ──→ Task 7 (BusinessMapCard usa haversineKm)
Task 2 (distance util)    ──→ Task 9 (BusinessCardDistance usa haversineKm)

Task 3 (mapIcons)         ──→ Task 6 (MapView usa createBusinessIcon)
Task 3 (mapIcons)         ──→ Task 7 (BusinessMapCard usa getCategoryConfig)
Task 3 (mapIcons)         ──→ Task 10 (BusinessCard usa getCategoryConfig)

Task 4 (CategoryIcon)     ──→ Task 8 (MapOverlayHeader usa CategoryIcon)
Task 4 (CategoryIcon)     ──→ Task 10 (BusinessCard usa CategoryIcon)
Task 4 (CategoryIcon)     ──→ Task 11 (/businesses usa CategoryIcon nos filtros)
Task 4 (CategoryIcon)     ──→ Task 13 (/businesses/[slug] usa CategoryIcon)

Task 5 (MapCanvas zoom)   ──→ Task 6 (MapView recebe zoomLevel/onZoomChange)

Task 9 (BusinessCardDistance) ──→ Task 10 (BusinessCard inclui BusinessCardDistance)
Task 10 (BusinessCard)    ──→ Task 11 (/businesses usa BusinessCard)

Task 12 (MiniMap)         ──→ Task 13 (/businesses/[slug] usa MiniMap)
```

### Ordem mínima segura de execução (sem paralelismo)

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13
```

### Tasks que podem ser paralelizadas

- **Tasks 1, 2, 3, 4** são independentes entre si — podem ser executadas em paralelo.
- **Tasks 5 e 3** são independentes — podem ser paralelas.
- **Tasks 7, 8** só dependem de 1, 2, 3, 4 — podem ser paralelas entre si após essas.
- **Task 12** pode ser desenvolvida em paralelo com Tasks 9, 10, 11 (não há dependência direta).
