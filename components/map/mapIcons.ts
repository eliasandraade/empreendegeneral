// components/map/mapIcons.ts
// ATENÇÃO: importar apenas em componentes com ssr:false (Leaflet é client-only)
import L from "leaflet"
import type { BusinessMapPin } from "@/types"
import { getCategoryConfig as _getCategoryConfig, CATEGORY_CONFIG as _CATEGORY_CONFIG } from "@/lib/categoryConfig"

// Paths SVG com slugs reais do banco de dados
const SVG_PATHS: Record<string, string> = {
  // Utensils — alimentação
  alimentacao: [
    `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>`,
    `<path d="M7 2v20"/>`,
    `<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`,
  ].join(""),
  // Store — mercados
  mercados: [
    `<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>`,
    `<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>`,
    `<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>`,
    `<path d="M2 7h20"/>`,
  ].join(""),
  // Scissors — salões
  saloes: [
    `<circle cx="6" cy="6" r="3"/>`,
    `<circle cx="6" cy="18" r="3"/>`,
    `<line x1="20" x2="8.12" y1="4" y2="15.88"/>`,
    `<line x1="14.47" x2="20" y1="14.48" y2="20"/>`,
    `<line x1="8.12" x2="12" y1="8.12" y2="12"/>`,
  ].join(""),
  // ShoppingBag — comércio em geral
  "comercio-em-geral": [
    `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>`,
    `<line x1="3" x2="21" y1="6" y2="6"/>`,
    `<path d="M16 10a4 4 0 0 1-8 0"/>`,
  ].join(""),
  // Shirt — moda e vestuário
  "moda-e-vestuario": [
    `<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>`,
  ].join(""),
  // Scissors — beleza e estética
  "beleza-e-estetica": [
    `<circle cx="6" cy="6" r="3"/>`,
    `<circle cx="6" cy="18" r="3"/>`,
    `<line x1="20" x2="8.12" y1="4" y2="15.88"/>`,
    `<line x1="14.47" x2="20" y1="14.48" y2="20"/>`,
    `<line x1="8.12" x2="12" y1="8.12" y2="12"/>`,
  ].join(""),
  // Hammer — construção e agro
  "construcao-e-agro": [
    `<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/>`,
    `<path d="m18 15 4-4"/>`,
    `<path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>`,
  ].join(""),
  // MapPin — default
  default: [
    `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>`,
    `<circle cx="12" cy="10" r="3"/>`,
  ].join(""),
}

export const CATEGORY_CONFIG = _CATEGORY_CONFIG
export const getCategoryConfig = _getCategoryConfig

export const FEATURED_COLOR = "#eab308"
export const FEATURED_COLOR_DARK = "#ca8a04"

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
