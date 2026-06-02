/**
 * Seed — Empreende General
 * Importa 121 empreendimentos reais de General Sampaio/CE
 *
 * Idempotente: pode rodar N vezes sem gerar duplicatas (upsert por slug).
 * Fonte dos dados: prisma/data/empresas_general_sampaio.json
 */

import { PrismaClient, BusinessStatus, UserRole } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // Descarta placeholders óbvios
  if (
    trimmed === "85" ||
    trimmed.toLowerCase().includes("não sabe") ||
    trimmed === "00 00000-0000"
  )
    return null

  const digits = trimmed.replace(/\D/g, "")
  if (digits.length < 10 || digits.length > 11) return null
  if (/^0+$/.test(digits)) return null

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
}

function parseName(fantasia: string | null, empresarial: string): string {
  return ((fantasia ?? empresarial) || empresarial).trim().replace(/\s+/g, " ")
}

function buildHours(dias: string[], horario: string): string {
  return `${dias.join(", ")} | ${horario.trim()}`
}

// ─── Categorias canônicas ──────────────────────────────────

const CANONICAL_CATEGORIES = [
  { name: "Alimentos e Bebidas",     slug: "alimentos-e-bebidas",     icon: "utensils",        description: "Restaurantes, lanchonetes, bares e comidas em geral" },
  { name: "Roupas e Acessórios",     slug: "roupas-e-acessorios",     icon: "shirt",           description: "Moda, calçados, bijuterias e acessórios" },
  { name: "Serviços",                slug: "servicos",                 icon: "wrench",          description: "Manutenção, reparos, consultoria e serviços em geral" },
  { name: "Higiene e Limpeza",       slug: "higiene-e-limpeza",       icon: "sparkles",        description: "Produtos de limpeza e higiene pessoal" },
  { name: "Cosméticos e Perfumaria", slug: "cosmeticos-e-perfumaria", icon: "flower-2",        description: "Cosméticos, perfumes e produtos de beleza" },
  { name: "Materiais de Construção", slug: "materiais-de-construcao", icon: "hard-hat",        description: "Ferragens, materiais e lojas de construção" },
  { name: "Eletrônicos",             slug: "eletronicos",             icon: "smartphone",      description: "Celulares, acessórios, informática e eletrônicos" },
  { name: "Móveis e Decoração",      slug: "moveis-e-decoracao",      icon: "sofa",            description: "Móveis, decoração e artigos para o lar" },
  { name: "Ótica",                   slug: "otica",                   icon: "glasses",         description: "Óculos e serviços ópticos" },
  { name: "Farmácia",                slug: "farmacia",                icon: "pill",            description: "Farmácias e produtos farmacêuticos" },
  { name: "Supermercado",            slug: "supermercado",            icon: "shopping-cart",   description: "Supermercados e mercearias" },
  { name: "Saúde e Beleza",          slug: "saude-e-beleza",          icon: "scissors",        description: "Salões, barbearias, estética e cuidados pessoais" },
  { name: "Pousada e Hospedagem",    slug: "pousada-e-hospedagem",    icon: "bed",             description: "Pousadas e hospedagens" },
  { name: "Funerária",               slug: "funeraria",               icon: "cross",           description: "Serviços funerários" },
  { name: "Gráfica e Papelaria",     slug: "grafica-e-papelaria",     icon: "printer",         description: "Gráficas, papelarias e personalizados" },
  { name: "Internet e Telecom",      slug: "internet-e-telecom",      icon: "wifi",            description: "Provedores de internet e telecomunicações" },
  { name: "Padaria",                 slug: "padaria",                 icon: "cake-slice",      description: "Padarias e confeitarias" },
  { name: "Açaí e Sorvetes",         slug: "acai-e-sorvetes",         icon: "ice-cream-bowl",  description: "Açaiterias e sorveterias" },
  { name: "Produtos Agrícolas",      slug: "produtos-agricolas",      icon: "tractor",         description: "Agropecuárias e insumos agrícolas" },
  { name: "Transporte",              slug: "transporte",              icon: "car",             description: "Cooperativas e serviços de transporte" },
  { name: "Posto de Combustível",    slug: "posto-de-combustivel",    icon: "fuel",            description: "Postos de gasolina e abastecimento" },
  { name: "Academia",                slug: "academia",                icon: "dumbbell",        description: "Academias e espaços esportivos" },
  { name: "Apostas Esportivas",      slug: "apostas-esportivas",      icon: "trophy",          description: "Casas de apostas e bets" },
  { name: "Decorações e Eventos",    slug: "decoracoes-e-eventos",    icon: "party-popper",    description: "Decoração e organização de eventos" },
  { name: "Artigos para Casa",       slug: "artigos-para-casa",       icon: "home",            description: "Utilidades domésticas e artigos para casa" },
  { name: "Variedades",              slug: "variedades",              icon: "package",         description: "Lojas de variedades e mix de produtos" },
  { name: "Outros",                  slug: "outros",                  icon: "more-horizontal", description: "Outras categorias" },
] as const

// Mapeamento: string bruta (lowercase) → slug canônico
const CATEGORY_MAP: Record<string, string> = {
  "alimentos e bebidas":                              "alimentos-e-bebidas",
  "bar":                                              "alimentos-e-bebidas",
  "açaí e gelatos":                                   "acai-e-sorvetes",
  "açaiteria e sorveteria":                           "acai-e-sorvetes",
  "padaria e mercadinho":                             "padaria",
  "mercadinho":                                       "alimentos-e-bebidas",
  "supermercado":                                     "supermercado",
  "roupas e acessórios":                              "roupas-e-acessorios",
  "artigos esportivos":                               "roupas-e-acessorios",
  "calçados":                                         "roupas-e-acessorios",
  "armarinho costura":                                "roupas-e-acessorios",
  "makes e acessórios":                               "cosmeticos-e-perfumaria",
  "acessorios":                                       "roupas-e-acessorios",
  "serviços (ex: manutenção, reparos, consultoria)":  "servicos",
  "reparação de motos em geral":                      "servicos",
  "peças e acessórios para motos e carros":           "servicos",
  "gestão e manutenção de cemitérios":                "funeraria",
  "transporte":                                       "transporte",
  "internet":                                         "internet-e-telecom",
  "serviços de internet":                             "internet-e-telecom",
  "cotrece":                                          "transporte",
  "produtos de higiene e limpeza":                    "higiene-e-limpeza",
  "cosméticos e perfumaria":                          "cosmeticos-e-perfumaria",
  "materiais de construção":                          "materiais-de-construcao",
  "equipamentos eletrônicos":                         "eletronicos",
  "lan house e acessórios de celular":                "eletronicos",
  "lan house e acessórios":                           "eletronicos",
  "móveis e decoração":                               "moveis-e-decoracao",
  "artigos decorativos e presentes":                  "moveis-e-decoracao",
  "artigos decorativos e casa":                       "artigos-para-casa",
  "artigos cozinha e casa":                           "artigos-para-casa",
  "artigos de casa":                                  "artigos-para-casa",
  "artigos pra casa e roupas de cama":                "artigos-para-casa",
  "artigos casa mesa e banho":                        "artigos-para-casa",
  "utensílios para casa":                             "artigos-para-casa",
  "produtos de cozinha":                              "artigos-para-casa",
  "ótica":                                            "otica",
  "farmácia":                                         "farmacia",
  "medicamentos":                                     "farmacia",
  "cabeleireiro":                                     "saude-e-beleza",
  "barbearia":                                        "saude-e-beleza",
  "salão de beleza":                                  "saude-e-beleza",
  "pousada":                                          "pousada-e-hospedagem",
  "funerária":                                        "funeraria",
  "gráfica":                                          "grafica-e-papelaria",
  "academia esportiva":                               "academia",
  "abastecimento de automóveis":                      "posto-de-combustivel",
  "apostas esportivas":                               "apostas-esportivas",
  "decorações e eventos":                             "decoracoes-e-eventos",
  "produtos agrícolas":                               "produtos-agricolas",
  "variedades":                                       "variedades",
  "freelancer":                                       "servicos",
}

function resolveCategory(categorias: string[]): string {
  for (const cat of categorias) {
    const mapped = CATEGORY_MAP[cat.toLowerCase().trim()]
    if (mapped) return mapped
  }
  return "outros"
}

// ─── Tipos do JSON ────────────────────────────────────────

interface EmpresaRaw {
  nome_empresarial: string
  nome_fantasia: string | null
  endereco: string
  telefone: string
  horario_funcionamento: string
  dias_funcionamento: string[]
  categorias: string[]
  possivel_duplicado: boolean
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seed — Empreende General\n")

  // Carregar JSON
  const jsonPath = path.join(__dirname, "data", "empresas_general_sampaio.json")
  const raw = fs.readFileSync(jsonPath, "utf-8")
  const jsonData = JSON.parse(raw) as { empresas: EmpresaRaw[] }
  const empresas = jsonData.empresas

  console.log(`📂 JSON carregado: ${empresas.length} registros`)

  // 1. Usuário sistema
  const systemUser = await prisma.user.upsert({
    where:  { email: "seed@empreende.general.br" },
    update: {},
    create: {
      email:     "seed@empreende.general.br",
      name:      "Sistema — Importação Municipal",
      role:      UserRole.ADMIN,
      consentAt: new Date(),
    },
  })
  console.log(`✅ Usuário sistema: ${systemUser.id}`)

  // 2. Categorias canônicas
  const categoryIdMap: Record<string, string> = {}
  for (const cat of CANONICAL_CATEGORIES) {
    const created = await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, description: cat.description },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description },
    })
    categoryIdMap[cat.slug] = created.id
  }
  console.log(`✅ ${CANONICAL_CATEGORIES.length} categorias sincronizadas`)

  // 3. Processar negócios
  const slugTracker: Record<string, number> = {}
  let inserted = 0
  let updated  = 0
  let skippedCount = 0
  const errors: string[] = []

  // Processar em lotes de 10 dentro de transações
  const BATCH = 10
  for (let i = 0; i < empresas.length; i += BATCH) {
    const batch = empresas.slice(i, i + BATCH)

    await prisma.$transaction(async (tx) => {
      for (const emp of batch) {
        try {
          const name = parseName(emp.nome_fantasia, emp.nome_empresarial)
          if (!name) { skippedCount++; return }

          // Gerar slug único por sessão (sem consultar o banco a cada registro)
          const baseSlug = slugify(name) || "negocio"
          slugTracker[baseSlug] = (slugTracker[baseSlug] ?? 0) + 1
          const slug =
            slugTracker[baseSlug] === 1
              ? baseSlug
              : `${baseSlug}-${slugTracker[baseSlug]}`

          const phone      = normalizePhone(emp.telefone)
          const hours      = buildHours(emp.dias_funcionamento, emp.horario_funcionamento)
          const catSlug    = resolveCategory(emp.categorias)
          const categoryId = categoryIdMap[catSlug] ?? categoryIdMap["outros"]

          const rawAddress = emp.endereco?.trim() ?? ""
          const invalidAddress =
            !rawAddress ||
            rawAddress.toLowerCase().includes("não sabe") ||
            rawAddress === "Resposta da"
          const address = invalidAddress
            ? "General Sampaio, CE"
            : `${rawAddress}, General Sampaio, CE`

          const existing = await tx.business.findUnique({ where: { slug } })

          await tx.business.upsert({
            where:  { slug },
            update: {
              name,
              phone:      phone ?? undefined,
              address,
              hours,
              categoryId,
              city:  "General Sampaio",
              state: "CE",
              status: BusinessStatus.APPROVED,
            },
            create: {
              name,
              slug,
              phone:      phone ?? undefined,
              address,
              hours,
              categoryId,
              city:     "General Sampaio",
              state:    "CE",
              status:   BusinessStatus.APPROVED,
              featured: false,
              ownerId:  systemUser.id,
            },
          })

          if (existing) updated++
          else inserted++
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`[${emp.nome_empresarial}] ${msg}`)
          skippedCount++
        }
      }
    })

    process.stdout.write(
      `\r   Progresso: ${Math.min(i + BATCH, empresas.length)}/${empresas.length}`
    )
  }

  // 4. Relatório
  console.log("\n\n📊 Relatório Final")
  console.log("─".repeat(35))
  console.log(`   Total no JSON  : ${empresas.length}`)
  console.log(`   ✅ Inseridos   : ${inserted}`)
  console.log(`   🔄 Atualizados : ${updated}`)
  console.log(`   ⚠️  Ignorados   : ${skippedCount}`)
  if (errors.length > 0) {
    console.log("\n❌ Erros:")
    errors.forEach((e) => console.log(`   - ${e}`))
  }
  console.log("\n🎉 Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
