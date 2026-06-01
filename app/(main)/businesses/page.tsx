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

        {/* Busca */}
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

        {/* Contador de resultados */}
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
