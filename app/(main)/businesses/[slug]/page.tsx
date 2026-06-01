import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, Globe, Instagram, MessageCircle, Star, ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, status: "APPROVED" },
  })
  if (!business) return {}
  return {
    title: business.name,
    description: business.description ?? undefined,
  }
}

export default async function BusinessPage({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, status: "APPROVED" },
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      reviews: {
        where: { deletedAt: null },
        include: { user: true, reply: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!business) notFound()

  // Média de avaliações
  const avgRating =
    business.reviews.length > 0
      ? business.reviews.reduce((acc, r) => acc + r.rating, 0) / business.reviews.length
      : null

  const primaryImage = business.images.find((i) => i.isPrimary) ?? business.images[0]

  return (
    <div className="container max-w-4xl px-6 py-10">
      {/* Voltar */}
      <Link
        href="/businesses"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para negócios
      </Link>

      {/* Imagem principal */}
      {primaryImage ? (
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6 bg-gray-100">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? business.name}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="h-48 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 text-5xl">
          🏪
        </div>
      )}

      {/* Galeria secundária */}
      {business.images.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {business.images.slice(1).map((img) => (
            <div key={img.id} className="relative w-24 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
              <Image src={img.url} alt={img.alt ?? business.name} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Cabeçalho */}
          <div>
            {business.category && (
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                {business.category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-800 mt-2 mb-2">{business.name}</h1>

            {/* Avaliação média */}
            {avgRating !== null && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= Math.round(avgRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-200 fill-gray-200"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {avgRating.toFixed(1)} · {business._count.reviews} avaliação{business._count.reviews !== 1 ? "ões" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Descrição */}
          {business.description && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-2">Sobre</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {business.description}
              </p>
            </div>
          )}

          {/* Avaliações */}
          <div>
            <h2 className="font-semibold text-gray-700 mb-4">
              Avaliações ({business._count.reviews})
            </h2>

            {business.reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {business.reviews.map((review) => (
                  <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {review.user.name?.[0] ?? "?"}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {review.user.name ?? "Usuário"}
                        </span>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={
                              star <= review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200 fill-gray-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    )}
                    {/* Resposta do empreendedor */}
                    {review.reply && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3 border-l-2 border-blue-200">
                        <p className="text-xs font-medium text-blue-700 mb-1">Resposta do empreendedor</p>
                        <p className="text-sm text-gray-600">{review.reply.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Nenhuma avaliação ainda. Seja o primeiro a avaliar!
              </p>
            )}
          </div>
        </div>

        {/* Sidebar de contato */}
        <div className="flex flex-col gap-4">
          <div className="border border-gray-100 rounded-xl p-5 flex flex-col gap-3">
            <h2 className="font-semibold text-gray-700 text-sm">Informações</h2>

            {business.address && (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin size={15} className="text-blue-600 mt-0.5 shrink-0" />
                <span>{business.address}{business.city ? `, ${business.city}` : ""}</span>
              </div>
            )}

            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-700 transition-colors"
              >
                <Phone size={15} className="text-blue-600 shrink-0" />
                {business.phone}
              </a>
            )}

            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-green-600 hover:text-green-700 transition-colors"
              >
                <MessageCircle size={15} className="shrink-0" />
                WhatsApp
              </a>
            )}

            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-700 transition-colors"
              >
                <Instagram size={15} className="text-blue-600 shrink-0" />
                {business.instagram}
              </a>
            )}

            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-700 transition-colors"
              >
                <Globe size={15} className="text-blue-600 shrink-0" />
                Site
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
