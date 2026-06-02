// Utilitários de ícone/cor para marcadores Google Maps — sem dependências Leaflet
import type { BusinessMapPin } from "@/types"
import { getCategoryConfig } from "@/lib/categoryConfig"

export { getCategoryConfig }

export const FEATURED_COLOR = "#eab308"
export const FEATURED_COLOR_DARK = "#ca8a04"

// SVG paths por slug canônico (seed v2)
const SVG_PATHS: Record<string, string> = {
  "alimentos-e-bebidas": [
    `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>`,
    `<path d="M7 2v20"/>`,
    `<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`,
  ].join(""),
  "supermercado": [
    `<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>`,
    `<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>`,
    `<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>`,
    `<path d="M2 7h20"/>`,
  ].join(""),
  "padaria": [
    `<path d="M9.5 11.5 3 14l9 9"/>`,
    `<path d="M13.5 9.5l6.5-6.5"/>`,
    `<path d="m16 16-2-2"/>`,
  ].join(""),
  "acai-e-sorvetes": [
    `<path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11"/>`,
    `<path d="M17 7A5 5 0 0 0 7 7"/>`,
    `<path d="M11 3a3 3 0 0 0 0 4h2a3 3 0 0 0 0-4"/>`,
  ].join(""),
  "saude-e-beleza": [
    `<circle cx="6" cy="6" r="3"/>`,
    `<circle cx="6" cy="18" r="3"/>`,
    `<line x1="20" x2="8.12" y1="4" y2="15.88"/>`,
    `<line x1="14.47" x2="20" y1="14.48" y2="20"/>`,
    `<line x1="8.12" x2="12" y1="8.12" y2="12"/>`,
  ].join(""),
  "roupas-e-acessorios": [
    `<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>`,
  ].join(""),
  "cosmeticos-e-perfumaria": [
    `<path d="M12 22c4.97 0 9-2.69 9-6s-4.03-6-9-6-9 2.69-9 6 4.03 6 9 6z"/>`,
    `<path d="M12 10v-3"/>`,
    `<path d="m9 3 3-1 3 1"/>`,
  ].join(""),
  "materiais-de-construcao": [
    `<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/>`,
    `<path d="m18 15 4-4"/>`,
    `<path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>`,
  ].join(""),
  "eletronicos": [
    `<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>`,
    `<path d="M12 18h.01"/>`,
  ].join(""),
  "farmacia": [
    `<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>`,
    `<path d="m8.5 8.5 7 7"/>`,
  ].join(""),
  "posto-de-combustivel": [
    `<path d="M3 22V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v15"/>`,
    `<path d="M17 12h1a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1 1 1 0 0 0 1-1V9.83a2 2 0 0 0-.59-1.42L19 6"/>`,
    `<path d="M3 22h14"/>`,
    `<path d="M7 14v-4"/>`,
  ].join(""),
  "transporte": [
    `<path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>`,
    `<rect width="13" height="8" x="9" y="11" rx="2"/>`,
    `<circle cx="11" cy="19" r="2"/>`,
    `<circle cx="20" cy="19" r="2"/>`,
  ].join(""),
  "academia": [
    `<path d="M6.5 6.5h11"/>`,
    `<path d="M6.5 17.5h11"/>`,
    `<path d="M3 12h18"/>`,
    `<path d="M3 10v4"/>`,
    `<path d="M21 10v4"/>`,
    `<path d="M6 8v8"/>`,
    `<path d="M18 8v8"/>`,
  ].join(""),
  "servicos": [
    `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
  ].join(""),
  default: [
    `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>`,
    `<circle cx="12" cy="10" r="3"/>`,
  ].join(""),
}

function makeSvg(paths: string, size: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" ` +
    `stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  )
}

export interface PinStyle {
  html: string
  width: number
  height: number
  anchorX: number
  anchorY: number
}

export function buildPinHtml(pin: BusinessMapPin, showLabel = false): PinStyle {
  const categorySlug = pin.category?.slug ?? "default"
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

  return { html, width: size, height: size + 8, anchorX: size / 2, anchorY: size + 8 }
}
