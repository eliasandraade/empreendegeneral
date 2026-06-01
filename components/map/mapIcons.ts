// components/map/mapIcons.ts
// ATENÇÃO: importar apenas em componentes com ssr:false (Leaflet é client-only)
import L from "leaflet"
import type { BusinessMapPin } from "@/types"

// Paths SVG sourced from lucide.dev — verifique visualmente no browser após deploy
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
