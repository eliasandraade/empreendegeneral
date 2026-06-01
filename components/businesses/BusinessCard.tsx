import Link from "next/link"
import { MapPin, Star, ChevronRight } from "lucide-react"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import { BusinessCardDistance } from "@/components/businesses/BusinessCardDistance"
import { getCategoryConfig } from "@/components/map/mapIcons"
import type { Business, Category, BusinessImage } from "@prisma/client"

type BusinessWithRelations = Business & {
  category: Category | null
  images: BusinessImage[]
  _count: { reviews: number }
}

interface BusinessCardProps {
  business: BusinessWithRelations
}

export function BusinessCard({ business }: BusinessCardProps) {
  const cfg = getCategoryConfig(business.category?.slug ?? null)

  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group flex items-center gap-4 p-4 bg-white/[0.05] border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
      aria-label={`Ver detalhes de ${business.name}`}
    >
      {/* Ícone da categoria */}
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})` }}
        aria-hidden="true"
      >
        <CategoryIcon slug={business.category?.slug} size={24} className="text-white" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-white font-bold text-sm leading-tight truncate group-hover:text-blue-200 transition-colors">
            {business.name}
          </h3>
          {business.featured && (
            <span className="shrink-0 text-[10px] font-black text-black bg-[#eab308] px-2 py-0.5 rounded-full leading-tight">
              ★ Destaque
            </span>
          )}
        </div>

        {business.address && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin size={11} className="text-white/40 shrink-0" aria-hidden="true" />
            <span className="text-xs text-white/50 truncate">{business.address}</span>
            {business.latitude && business.longitude && (
              <BusinessCardDistance lat={business.latitude} lng={business.longitude} />
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          <Star size={12} className="text-yellow-400 fill-yellow-400" aria-hidden="true" />
          <span className="text-xs text-white/50">
            {business._count.reviews > 0
              ? `${business._count.reviews} avaliação${business._count.reviews > 1 ? "ões" : ""}`
              : "Sem avaliações"}
          </span>
        </div>
      </div>

      {/* Seta visual */}
      <ChevronRight size={16} className="text-white/30 shrink-0" aria-hidden="true" />
    </Link>
  )
}
