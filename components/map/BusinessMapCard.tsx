// components/map/BusinessMapCard.tsx
"use client"

import Link from "next/link"
import { X, MessageCircle, MapPin, Navigation, Phone, ExternalLink } from "lucide-react"
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

      <div
        className={[
          "fixed bottom-0 left-0 right-0 rounded-t-3xl",
          "md:absolute md:bottom-6 md:right-4 md:left-auto md:w-[340px] md:max-w-[380px] md:rounded-2xl md:max-h-[480px] md:overflow-y-auto",
          "bg-[#0c1b2e]/[0.97] backdrop-blur-2xl",
          "border-t border-white/10 md:border md:border-white/10",
          "shadow-2xl z-[1000]",
          "animate-slide-up",
        ].join(" ")}
        role="dialog"
        aria-label={`Informações sobre ${business.name}`}
      >
        {/* Drag handle (mobile only) */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden" />

        <div className="p-4 pt-3">
          {/* Botão fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 rounded-xl p-1.5 transition-colors"
          >
            <X size={16} className="text-white/70" />
          </button>

          {/* Header: ícone + nome + metadados */}
          <div className="flex items-start gap-3 mb-4 pr-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color})` }}
              aria-hidden="true"
            >
              <CategoryIcon slug={business.category?.slug} size={22} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              {business.category && (
                <p
                  className="text-[10px] font-bold uppercase tracking-wide mb-0.5"
                  style={{ color: cfg.color }}
                >
                  {business.category.name}
                </p>
              )}
              <h3 className="text-lg font-black text-white leading-tight truncate">
                {business.name}
              </h3>

              {distance !== null && (
                <div className="flex items-center gap-1 mt-1">
                  <Navigation size={11} className="text-blue-400 shrink-0" aria-hidden="true" />
                  <span className="text-xs text-white/60">{formatDistance(distance)}</span>
                </div>
              )}

              {business.address && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-white/40 shrink-0" aria-hidden="true" />
                  <span className="text-xs text-white/60 truncate">{business.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir WhatsApp de ${business.name}`}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold px-3 py-2.5 rounded-xl hover:from-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-900/30"
              >
                <MessageCircle size={15} aria-hidden="true" />
                WhatsApp
              </a>
            ) : business.phone ? (
              <a
                href={`tel:${business.phone}`}
                aria-label={`Ligar para ${business.name}`}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold px-3 py-2.5 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all"
              >
                <Phone size={15} aria-hidden="true" />
                Ligar
              </a>
            ) : null}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver rota para ${business.name} no Google Maps`}
              className="flex items-center gap-1.5 text-sm text-white/70 bg-white/[0.08] border border-white/[0.12] px-3 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors"
            >
              <MapPin size={15} aria-hidden="true" />
              Rota
            </a>

            <Link
              href={`/businesses/${business.slug}`}
              aria-label={`Ver perfil completo de ${business.name}`}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-300 bg-white/[0.08] border border-white/[0.12] px-3 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors ml-auto"
            >
              Ver
              <ExternalLink size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
