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
      <div className="pointer-events-auto px-3 pt-3 flex flex-col gap-2">

        {/* Barra principal: logo + busca + ações */}
        <div className="flex items-center gap-2 bg-[#0c1b2e]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl px-3 py-2 shadow-2xl shadow-black/40">

          {/* Brand */}
          <span className="text-white font-extrabold text-sm tracking-tight whitespace-nowrap shrink-0 pr-2 border-r border-white/10">
            {appName}
          </span>

          {/* Campo de busca */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Search size={14} className="text-white/35 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar negócio ou serviço..."
              aria-label="Buscar negócios"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                aria-label="Limpar busca"
                className="text-white/40 hover:text-white/70 transition-colors shrink-0"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Divisor */}
          <div className="w-px h-5 bg-white/10 shrink-0" />

          {/* Ações */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/dashboard/new"
              aria-label="Cadastrar novo negócio"
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors"
            >
              <Plus size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Negócio</span>
            </Link>

            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              aria-label={isAuthenticated ? "Painel" : "Login"}
              className="w-8 h-8 bg-white/[0.07] border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.14] rounded-xl flex items-center justify-center transition-colors"
            >
              <User size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Chips de categoria */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => onCategoryFilter(null)}
            aria-pressed={!categoryFilter}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all shadow-lg ${
              !categoryFilter
                ? "bg-blue-600 text-white shadow-blue-900/40"
                : "bg-[#0c1b2e]/90 backdrop-blur-sm border border-white/[0.12] text-white/70 hover:text-white hover:bg-[#0c1b2e]"
            }`}
          >
            Todos
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
              aria-pressed={categoryFilter === cat.slug}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-lg whitespace-nowrap ${
                categoryFilter === cat.slug
                  ? "bg-blue-600 text-white shadow-blue-900/40"
                  : "bg-[#0c1b2e]/90 backdrop-blur-sm border border-white/[0.12] text-white/70 hover:text-white hover:bg-[#0c1b2e]"
              }`}
            >
              <CategoryIcon slug={cat.slug} size={11} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
