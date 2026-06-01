// Configuração de cores e slugs por categoria — sem dependências client-only
export const CATEGORY_CONFIG: Record<string, { color: string; slug: string }> = {
  alimentacao: { color: "#f97316", slug: "alimentacao" },
  beleza:      { color: "#be185d", slug: "beleza" },
  comercio:    { color: "#3b82f6", slug: "comercio" },
  servicos:    { color: "#6b7280", slug: "servicos" },
  agro:        { color: "#22c55e", slug: "agro" },
  saude:       { color: "#ef4444", slug: "saude" },
  default:     { color: "#1d4ed8", slug: "default" },
}

export function getCategoryConfig(slug?: string | null) {
  if (!slug) return CATEGORY_CONFIG.default
  return CATEGORY_CONFIG[slug] ?? CATEGORY_CONFIG.default
}
