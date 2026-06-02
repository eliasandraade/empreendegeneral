"use client"

import Link from "next/link"
import { X, MessageCircle, MapPin, Navigation, Phone, Clock, ExternalLink } from "lucide-react"
import { haversineKm, formatDistance } from "@/lib/distance"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import { getCategoryConfig } from "@/components/map/mapIcons"
import type { BusinessMapPin } from "@/types"

interface Props {
  business: BusinessMapPin
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
}

export function BusinessMapCard({ business, userLocation, onClose }: Props) {
  const distance =
    userLocation && business.latitude && business.longitude
      ? haversineKm(userLocation.lat, userLocation.lng, business.latitude, business.longitude)
      : null

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`
    : null

  const cfg = getCategoryConfig(business.category?.slug)

  return (
    <>
      {/* Backdrop mobile */}
      <div
        className="fixed inset-0 z-[999] md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={[
          // mobile: bottom sheet
          "fixed bottom-0 left-0 right-0 rounded-t-3xl",
          // desktop: floating card bottom-right
          "md:absolute md:bottom-5 md:right-4 md:left-auto md:w-80 md:rounded-2xl",
          "bg-[#0c1b2e]/[0.98] backdrop-blur-2xl",
          "border-t border-white/[0.1] md:border md:border-white/[0.1]",
          "shadow-2xl shadow-black/60 z-[1000]",
          "animate-slide-up",
        ].join(" ")}
        role="dialog"
        aria-label={`Informações sobre ${business.name}`}
      >
        {/* Handle mobile */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden" />

        <div className="p-4">
          {/* Fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 w-8 h-8 bg-white/[0.08] hover:bg-white/[0.16] rounded-xl flex items-center justify-center transition-colors"
          >
            <X size={15} className="text-white/60" />
          </button>

          {/* Header: ícone + categoria + nome */}
          <div className="flex items-start gap-3 mb-4 pr-8">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})` }}
              aria-hidden="true"
            >
              <CategoryIcon slug={business.category?.slug} size={20} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              {business.category && (
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: cfg.color }}>
                  {business.category.name}
                </p>
              )}
              <h3 className="text-base font-black text-white leading-tight">
                {business.name}
              </h3>
              {distance !== null && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Navigation size={10} className="text-blue-400 shrink-0" />
                  <span className="text-xs text-white/50">{formatDistance(distance)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detalhes */}
          <div className="flex flex-col gap-2 mb-4">
            {business.address && (
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-white/30 shrink-0 mt-0.5" />
                <span className="text-xs text-white/55 leading-relaxed">{business.address}</span>
              </div>
            )}

            {business.hours && (
              <div className="flex items-start gap-2">
                <Clock size={13} className="text-white/30 shrink-0 mt-0.5" />
                <span className="text-xs text-white/55 leading-relaxed">{business.hours}</span>
              </div>
            )}

            {(business.phone || business.whatsapp) && (
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-white/30 shrink-0" />
                <span className="text-xs text-white/55">{business.phone ?? business.whatsapp}</span>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp de ${business.name}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            ) : business.phone ? (
              <a
                href={`tel:${business.phone}`}
                aria-label={`Ligar para ${business.name}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <Phone size={14} />
                Ligar
              </a>
            ) : null}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Rota para ${business.name}`}
              className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.07] border border-white/[0.1] px-3 py-2.5 rounded-xl hover:bg-white/[0.12] transition-colors"
            >
              <MapPin size={13} />
              Rota
            </a>

            <Link
              href={`/businesses/${business.slug}`}
              aria-label={`Perfil de ${business.name}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-white/[0.07] border border-white/[0.1] px-3 py-2.5 rounded-xl hover:bg-white/[0.12] transition-colors"
            >
              Ver
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
