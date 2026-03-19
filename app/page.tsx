import Link from "next/link"
import { Search, MapPin, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { CategoryIcon } from "@/components/ui/CategoryIcon"

export default async function Home() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 px-6">
        <div className="container max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/40 text-blue-100 text-sm font-medium px-3 py-1 rounded-full mb-6">
            <MapPin size={14} />
            General Sampaio, CE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Descubra os negócios da sua cidade
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Encontre empreendedores locais, veja avaliações e apoie o comércio de General Sampaio.
          </p>

          {/* Busca */}
          <form action="/businesses" method="get" className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                name="q"
                type="text"
                placeholder="Buscar negócios, serviços..."
                className="flex-1 bg-transparent text-gray-800 placeholder:text-gray-400 outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shrink-0"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-14 px-6">
        <div className="container">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Explorar por categoria</h2>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/businesses?categoria=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-700 transition-colors">
                    <CategoryIcon name={cat.icon} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Categorias em breve.</p>
          )}
        </div>
      </section>

      {/* CTA cadastro */}
      <section className="py-14 px-6 bg-gray-50">
        <div className="container max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Tem um negócio em General Sampaio?
          </h2>
          <p className="text-gray-500 mb-6">
            Cadastre seu empreendimento gratuitamente e alcance mais clientes na sua cidade.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors"
          >
            Cadastrar meu negócio
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
