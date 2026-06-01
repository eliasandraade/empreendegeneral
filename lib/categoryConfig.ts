// Configuração de cores e slugs por categoria — sem dependências client-only
export const CATEGORY_CONFIG: Record<string, { color: string; slug: string }> = {
  alimentacao:      { color: "#f97316", slug: "alimentacao" },
  mercados:         { color: "#3b82f6", slug: "mercados" },
  saloes:           { color: "#be185d", slug: "saloes" },
  "comercio-em-geral":  { color: "#8b5cf6", slug: "comercio-em-geral" },
  "moda-e-vestuario":   { color: "#ec4899", slug: "moda-e-vestuario" },
  "beleza-e-estetica":  { color: "#db2777", slug: "beleza-e-estetica" },
  "construcao-e-agro":  { color: "#22c55e", slug: "construcao-e-agro" },
  default:          { color: "#1d4ed8", slug: "default" },
}

export function getCategoryConfig(slug?: string | null) {
  if (!slug) return CATEGORY_CONFIG.default
  return CATEGORY_CONFIG[slug] ?? CATEGORY_CONFIG.default
}
