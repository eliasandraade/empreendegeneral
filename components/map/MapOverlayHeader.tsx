// components/map/MapOverlayHeader.tsx
"use client"

import Link from "next/link"
import { Search, Plus, User, X } from "lucide-react"
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
      <div className="h-48 bg-gradient-to-b from-black/40 to-transparent" />

      <div className="absolute top-0 left-0 right-0 px-4 pt-4 pb-3 flex flex-col gap-3 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg leading-tight">{appName}</span>
            {slogan && (
              <p className="text-white/80 text-xs leading-tight">{slogan}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/new"
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus size={14} />
              Cadastrar
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="w-9 h-9 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors shadow-lg"
            >
              <User size={16} />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-lg">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar negócios na cidade..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange("")} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => onCategoryFilter(null)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors shadow-sm ${
              !categoryFilter
                ? "bg-blue-600 text-white"
                : "bg-white/90 text-gray-700 hover:bg-white"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors shadow-sm ${
                categoryFilter === cat.slug
                  ? "bg-blue-600 text-white"
                  : "bg-white/90 text-gray-700 hover:bg-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
