// Página dinâmica — busca e filtros dependem de params em runtime
export const dynamic = "force-dynamic"

import Link from "next/link"
import { Search } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { BusinessCard } from "@/components/businesses/BusinessCard"

interface PageProps {
  searchParams: { q?: string; categoria?: string }
}

export const metadata = { title: "Negócios" }

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
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="container py-10 px-6">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Negócios</h1>
        <p className="text-gray-500 text-sm">
          Encontre empreendedores locais de General Sampaio
        </p>
      </div>

      {/* Busca */}
      <form method="get" className="flex gap-2 mb-6 max-w-xl">
        <div className="flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Buscar negócios..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
          />
          {/* Preserva o filtro de categoria ao buscar */}
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
        </div>
        <button
          type="submit"
          className="bg-blue-700 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-blue-800 transition-colors shrink-0"
        >
          Buscar
        </button>
      </form>

      {/* Filtros por categoria */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/businesses"
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            !categoria
              ? "bg-blue-700 text-white border-blue-700"
              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
          }`}
        >
          Todos
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/businesses?categoria=${cat.slug}${q ? `&q=${q}` : ""}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              categoria === cat.slug
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Resultados */}
      {businesses.length > 0 ? (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {businesses.length} negócio{businesses.length !== 1 ? "s" : ""} encontrado{businesses.length !== 1 ? "s" : ""}
            {q ? ` para "${q}"` : ""}
            {categoria ? ` em ${categories.find((c) => c.slug === categoria)?.name}` : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-semibold text-gray-700 mb-1">Nenhum negócio encontrado</p>
          <p className="text-sm text-gray-400">
            {q
              ? `Nenhum resultado para "${q}". Tente outro termo.`
              : "Ainda não há negócios cadastrados nessa categoria."}
          </p>
          <Link
            href="/businesses"
            className="inline-block mt-4 text-sm text-blue-700 hover:underline"
          >
            Ver todos os negócios
          </Link>
        </div>
      )}
    </div>
  )
}
