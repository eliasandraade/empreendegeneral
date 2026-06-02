"use client"

import Link from "next/link"
import { MapPin, ArrowRight } from "lucide-react"

interface LandingHeroProps {
  appName: string
  slogan: string
  description: string
  credit: string
}

export function LandingHero({ appName, slogan, description, credit }: LandingHeroProps) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-full text-center px-6"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
      }}
    >
      {/* Logo + nome */}
      <div className="flex items-center gap-3 mb-4 animate-fade-in">
        <MapPin className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-4xl md:text-5xl tracking-tight text-white">
          {appName}
        </h1>
      </div>

      {/* Slogan */}
      <p className="text-lg md:text-xl text-white/70 mb-3 animate-fade-in-delay-1">
        {slogan}
      </p>

      {/* Descrição */}
      <p className="text-sm md:text-base text-white/60 max-w-md mb-10 leading-relaxed animate-fade-in-delay-2">
        {description}
      </p>

      {/* Botão EXPLORAR */}
      <Link
        href="/mapa"
        className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-base md:text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 animate-fade-in-delay-3"
      >
        EXPLORAR
        <ArrowRight className="w-5 h-5" />
      </Link>

      {/* Rodapé */}
      <p className="absolute bottom-5 text-xs text-white/40 tracking-wide">
        {credit}
      </p>
    </div>
  )
}
