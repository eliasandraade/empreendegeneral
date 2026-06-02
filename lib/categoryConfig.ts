// Configuração de cores e slugs por categoria — sem dependências client-only
export const CATEGORY_CONFIG: Record<string, { color: string; slug: string }> = {
  "alimentos-e-bebidas":      { color: "#f97316", slug: "alimentos-e-bebidas" },
  "supermercado":             { color: "#3b82f6", slug: "supermercado" },
  "padaria":                  { color: "#f59e0b", slug: "padaria" },
  "acai-e-sorvetes":          { color: "#8b5cf6", slug: "acai-e-sorvetes" },
  "saude-e-beleza":           { color: "#be185d", slug: "saude-e-beleza" },
  "roupas-e-acessorios":      { color: "#ec4899", slug: "roupas-e-acessorios" },
  "cosmeticos-e-perfumaria":  { color: "#db2777", slug: "cosmeticos-e-perfumaria" },
  "materiais-de-construcao":  { color: "#22c55e", slug: "materiais-de-construcao" },
  "eletronicos":              { color: "#06b6d4", slug: "eletronicos" },
  "moveis-e-decoracao":       { color: "#a855f7", slug: "moveis-e-decoracao" },
  "artigos-para-casa":        { color: "#14b8a6", slug: "artigos-para-casa" },
  "otica":                    { color: "#0ea5e9", slug: "otica" },
  "farmacia":                 { color: "#ef4444", slug: "farmacia" },
  "pousada-e-hospedagem":     { color: "#6366f1", slug: "pousada-e-hospedagem" },
  "funeraria":                { color: "#475569", slug: "funeraria" },
  "grafica-e-papelaria":      { color: "#64748b", slug: "grafica-e-papelaria" },
  "internet-e-telecom":       { color: "#0284c7", slug: "internet-e-telecom" },
  "produtos-agricolas":       { color: "#65a30d", slug: "produtos-agricolas" },
  "transporte":               { color: "#ea580c", slug: "transporte" },
  "posto-de-combustivel":     { color: "#dc2626", slug: "posto-de-combustivel" },
  "academia":                 { color: "#7c3aed", slug: "academia" },
  "apostas-esportivas":       { color: "#16a34a", slug: "apostas-esportivas" },
  "decoracoes-e-eventos":     { color: "#d97706", slug: "decoracoes-e-eventos" },
  "higiene-e-limpeza":        { color: "#0891b2", slug: "higiene-e-limpeza" },
  "variedades":               { color: "#7c3aed", slug: "variedades" },
  "servicos":                 { color: "#78716c", slug: "servicos" },
  "outros":                   { color: "#1d4ed8", slug: "outros" },
  default:                    { color: "#1d4ed8", slug: "default" },
}

export function getCategoryConfig(slug?: string | null) {
  if (!slug) return CATEGORY_CONFIG.default
  return CATEGORY_CONFIG[slug] ?? CATEGORY_CONFIG.default
}
