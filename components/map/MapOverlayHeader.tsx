// components/map/MapOverlayHeader.tsx
"use client"

import Link from "next/link"
import { Search, Plus, User, X } from "lucide-react"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import type { Category } from "@prisma/client"

interface Props {
  slogan: string
  appName: string
  categories: Pick<Category, "id" | "name" | "slug">[]
  isAuthenticated: boolean
  categoryFilter: string | null
  onCategoryFilter: (slug: string | null) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function MapOverlayHeader({
  slogan,
  appName,
  categories,
  isAuthenticated,
  categoryFilter,
  onCategoryFilter,
  searchQuery,
  onSearchChange,
}: Props) {
  return (
    <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
      {/* Gradiente escuro */}
      <div className="h-48 bg-gradient-to-b from-black/50 to-transparent" />

      <div className="absolute top-0 left-0 right-0 px-4 pt-4 pb-3 flex flex-col gap-3 pointer-events-auto">

        {/* Linha 1: brand + ações */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg leading-tight">{appName}</span>
            {slogan && (
              <p className="text-white/60 text-xs leading-tight">{slogan}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/new"
              aria-label="Cadastrar novo negócio"
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl hover:from-blue-400 hover:to-blue-600 transition-all shadow-lg shadow-blue-900/40"
            >
              <Plus size={14} aria-hidden="true" />
              + Negócio
            </Link>

            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              aria-label={isAuthenticated ? "Ir para o painel" : "Fazer login"}
              className="w-9 h-9 bg-white/[0.05] border border-white/10 backdrop-blur-sm text-white rounded-xl flex items-center justify-center hover:bg-white/[0.12] transition-colors shadow-lg"
            >
              <User size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Linha 2: busca */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/[0.97] backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg focus-within:ring-2 focus-within:ring-blue-400/30 transition-all">
            <Search size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar negócio, categoria ou serviço..."
              aria-label="Buscar negócios"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                aria-label="Limpar busca"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Linha 3: filtros de categoria */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onCategoryFilter(null)}
            aria-label="Mostrar todos os negócios"
            aria-pressed={!categoryFilter}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors shadow-sm ${
              !categoryFilter
                ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                : "bg-white/90 text-gray-700 hover:bg-white"
            }`}
          >
            Todos
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
              aria-label={`Filtrar por ${cat.name}`}
              aria-pressed={categoryFilter === cat.slug}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shadow-sm ${
                categoryFilter === cat.slug
                  ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                  : "bg-white/90 text-gray-700 hover:bg-white"
              }`}
            >
              <CategoryIcon slug={cat.slug} size={12} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
