import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import dynamicImport from "next/dynamic"
import {
  MapPin,
  Phone,
  Globe,
  Instagram,
  MessageCircle,
  Star,
  ArrowLeft,
  Clock,
  ExternalLink,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import { getCategoryConfig } from "@/lib/categoryConfig"

const MiniMap = dynamicImport(
  () => import("@/components/map/MiniMap").then((m) => ({ default: m.MiniMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white/[0.05] animate-pulse rounded-2xl" />
    ),
  }
)

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, status: "APPROVED" },
  })
  if (!business) return {}
  return {
    title: `${business.name} — Empreende General`,
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

  const avgRating =
    business.reviews.length > 0
      ? business.reviews.reduce((acc, r) => acc + r.rating, 0) / business.reviews.length
      : null

  const primaryImage = business.images.find((i) => i.isPrimary) ?? business.images[0]
  const cfg = getCategoryConfig(business.category?.slug ?? null)

  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`
    : null
  const instagramUrl = business.instagram
    ? `https://instagram.com/${business.instagram.replace("@", "")}`
    : null
  const mapsUrl =
    business.latitude && business.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : null

  const addressDisplay = business.address
    ? business.city
      ? `${business.address}, ${business.city}`
      : business.address
    : null

  return (
    <div className="min-h-screen bg-[#0c1b2e]">

      {/* Hero */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt ?? business.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#0c1b2e]" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${cfg.color}cc 0%, ${cfg.color}66 50%, #0c1b2e 100%)`,
            }}
          />
        )}

        <Link
          href="/businesses"
          aria-label="Voltar para listagem de negócios"
          className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-black/50 transition-colors z-10"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Negócios
        </Link>

        {business.category && (
          <div
            className="absolute bottom-14 left-4 text-xs font-bold px-3 py-1 rounded-full border border-white/20 text-white z-10"
            style={{ background: `${cfg.color}cc` }}
          >
            {business.category.name}
          </div>
        )}
      </div>

      {/* Identidade */}
      <div className="px-4 -mt-7 mb-4 relative z-10">
        <div className="flex items-end gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white/20 shrink-0 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color})` }}
            aria-hidden="true"
          >
            <CategoryIcon slug={business.category?.slug} size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-white font-black text-2xl leading-tight">{business.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {avgRating !== null && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      aria-hidden="true"
                      className={s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-white/20 fill-white/20"}
                    />
                  ))}
                  <span className="text-white/50 text-xs ml-1">
                    {avgRating.toFixed(1)} · {business._count.reviews} avaliação{business._count.reviews !== 1 ? "ões" : ""}
                  </span>
                </div>
              )}
              {business.featured && (
                <span className="text-[10px] font-black text-black bg-[#eab308] px-2 py-0.5 rounded-full">
                  ★ Destaque
                </span>
              )}
            </div>
            {addressDisplay && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={11} className="text-white/40 shrink-0" aria-hidden="true" />
                <span className="text-xs text-white/50">{addressDisplay}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de ações sticky */}
      <div className="sticky top-0 z-40 bg-[#0c1b2e]/[0.95] backdrop-blur-md border-b border-white/[0.08] px-4 py-3 flex items-center gap-2">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir WhatsApp de ${business.name}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold py-2.5 px-4 rounded-xl hover:from-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-900/30"
          >
            <MessageCircle size={15} aria-hidden="true" />
            WhatsApp
          </a>
        ) : business.phone ? (
          <a
            href={`tel:${business.phone}`}
            aria-label={`Ligar para ${business.name}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all"
          >
            <Phone size={15} aria-hidden="true" />
            Ligar
          </a>
        ) : null}

        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Perfil do Instagram de ${business.name}`}
            className="flex items-center gap-1.5 text-sm text-white/70 bg-white/[0.08] border border-white/[0.12] px-4 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors"
          >
            <Instagram size={15} aria-hidden="true" />
          </a>
        )}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver rota no Google Maps"
            className="flex items-center gap-1.5 text-sm text-white/70 bg-white/[0.08] border border-white/[0.12] px-4 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors"
          >
            <MapPin size={15} aria-hidden="true" />
            Rota
          </a>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-8">

        {/* Sobre */}
        {business.description && (
          <section aria-label="Sobre o negócio">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Sobre</h2>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
              {business.description}
            </p>
          </section>
        )}

        {/* Informações */}
        {(addressDisplay || business.phone || business.website || business.hours) && (
          <section aria-label="Informações de contato">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Informações</h2>
            <div className="grid grid-cols-2 gap-3">
              {addressDisplay && (
                <div className="bg-white/[0.05] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={13} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white/40 text-xs">Endereço</span>
                  </div>
                  <p className="text-white/80 text-xs font-medium leading-snug">
                    {addressDisplay}
                  </p>
                </div>
              )}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="bg-white/[0.05] rounded-xl p-3 hover:bg-white/[0.08] transition-colors"
                  aria-label={`Ligar para ${business.phone}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Phone size={13} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white/40 text-xs">Telefone</span>
                  </div>
                  <p className="text-white/80 text-xs font-medium">{business.phone}</p>
                </a>
              )}
              {business.hours && (
                <div className="bg-white/[0.05] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={13} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white/40 text-xs">Horário</span>
                  </div>
                  <p className="text-white/80 text-xs font-medium leading-snug whitespace-pre-line">
                    {business.hours}
                  </p>
                </div>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/[0.05] rounded-xl p-3 hover:bg-white/[0.08] transition-colors"
                  aria-label="Visitar site do negócio"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={13} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white/40 text-xs">Site</span>
                  </div>
                  <p className="text-white/80 text-xs font-medium flex items-center gap-1">
                    Visitar site <ExternalLink size={10} aria-hidden="true" />
                  </p>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Mini mapa */}
        {business.latitude && business.longitude && (
          <section aria-label="Localização no mapa">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Localização</h2>
            <div className="relative h-[200px] rounded-2xl overflow-hidden border border-white/[0.08]">
              <MiniMap lat={business.latitude} lng={business.longitude} name={business.name} />
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir rota no Google Maps"
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#0c1b2e]/[0.92] border border-white/15 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#0c1b2e] transition-colors z-[500]"
                >
                  <MapPin size={12} aria-hidden="true" />
                  Abrir rota
                </a>
              )}
            </div>
          </section>
        )}

        {/* Galeria */}
        {business.images.length > 1 && (
          <section aria-label="Fotos do negócio">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Fotos</h2>
            <div className="grid grid-cols-2 gap-2">
              {business.images.slice(1, 5).map((img, i) => (
                <div
                  key={img.id}
                  className={`relative rounded-xl overflow-hidden bg-white/[0.05] ${i === 0 ? "col-span-2 h-40" : "h-28"}`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? business.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Avaliações */}
        <section aria-label="Avaliações de clientes">
          <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
            Avaliações ({business._count.reviews})
          </h2>

          {business.reviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {business.reviews.map((review) => (
                <div key={review.id} className="bg-white/[0.05] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm"
                        aria-hidden="true"
                      >
                        {review.user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span className="text-sm font-semibold text-white/80">
                        {review.user.name ?? "Usuário"}
                      </span>
                    </div>
                    <div className="flex" aria-label={`Nota ${review.rating} de 5`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          aria-hidden="true"
                          className={s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20 fill-white/20"}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-white/70 leading-relaxed">{review.comment}</p>
                  )}
                  {review.reply && (
                    <div className="mt-3 border-l-2 border-blue-400/40 pl-3 bg-white/[0.05] rounded-r-xl py-2">
                      <p className="text-xs font-bold text-blue-400 mb-1">Resposta do estabelecimento</p>
                      <p className="text-sm text-white/60">{review.reply.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <Star size={32} className="text-white/15 mb-3" aria-hidden="true" />
              <p className="text-white/50 text-sm font-medium">Nenhuma avaliação ainda</p>
              <p className="text-white/30 text-xs mt-1">Seja o primeiro a avaliar este negócio.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
