// app/(admin)/admin/featured/page.tsx — Gerenciar destaques
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { toggleFeaturedAction } from "@/lib/actions/admin"
import { Star, MapPin } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Admin — Destaques" }

export default async function AdminFeaturedPage() {
  const session = await getServerSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) redirect("/login")

  const businesses = await prisma.business.findMany({
    where: { status: "APPROVED", deletedAt: null },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    select: {
      id: true, name: true, address: true, city: true, featured: true,
      category: { select: { name: true } },
    },
  })

  const featuredCount = businesses.filter((b) => b.featured).length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Destaques</h1>
        <p className="text-sm text-white/40 mt-1">
          {featuredCount} negócio{featuredCount !== 1 ? "s" : ""} em destaque · aparece{featuredCount !== 1 ? "m" : ""} no mapa com ícone especial
        </p>
      </div>

      {businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/[0.06] rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <Star size={20} className="text-white/20" />
          </div>
          <p className="text-sm text-white/30">Nenhum negócio aprovado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {businesses.map((b) => (
            <div key={b.id}
              className={`relative border rounded-2xl p-5 transition-all ${
                b.featured
                  ? "bg-amber-500/[0.07] border-amber-500/25"
                  : "bg-white/[0.03] border-white/[0.07] hover:border-white/[0.12]"
              }`}
            >
              {b.featured && (
                <div className="absolute top-4 right-4">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                </div>
              )}
              <p className="font-semibold text-white pr-6 mb-1">{b.name}</p>
              {b.category && (
                <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {b.category.name}
                </span>
              )}
              {b.address && (
                <p className="text-xs text-white/30 flex items-center gap-1 mt-2">
                  <MapPin size={10} />
                  {b.address}{b.city ? `, ${b.city}` : ""}
                </p>
              )}
              <form action={async () => {
                "use server"
                await toggleFeaturedAction(b.id, !b.featured)
              }} className="mt-4">
                <button type="submit"
                  className={`w-full text-xs font-semibold py-2 rounded-xl border transition-all ${
                    b.featured
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                      : "bg-white/[0.05] border-white/[0.10] text-white/50 hover:text-white hover:border-white/20"
                  }`}
                >
                  {b.featured ? "Remover destaque" : "Adicionar destaque"}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
