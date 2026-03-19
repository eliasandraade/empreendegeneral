import Link from "next/link"
import Image from "next/image"
import { Star, MapPin } from "lucide-react"
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
  const primaryImage = business.images[0]

  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group flex flex-col rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md hover:border-blue-100 transition-all"
    >
      {/* Imagem */}
      <div className="relative h-44 bg-gray-100 shrink-0">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? business.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-50">
            <span className="text-4xl">🏪</span>
          </div>
        )}
        {/* Badge de categoria */}
        {business.category && (
          <span className="absolute top-3 left-3 bg-white/90 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
            {business.category.name}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors leading-tight">
          {business.name}
        </h3>

        {business.address && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={12} />
            <span className="truncate">{business.address}</span>
          </div>
        )}

        {business.description && (
          <p className="text-sm text-gray-500 line-clamp-2 flex-1">
            {business.description}
          </p>
        )}

        {/* Rodapé do card */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span>
            {business._count.reviews > 0
              ? `${business._count.reviews} avaliação${business._count.reviews > 1 ? "ões" : ""}`
              : "Sem avaliações ainda"}
          </span>
        </div>
      </div>
    </Link>
  )
}
