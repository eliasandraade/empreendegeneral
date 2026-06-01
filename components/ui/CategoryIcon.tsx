import {
  Utensils,
  Scissors,
  ShoppingBag,
  Wrench,
  Sprout,
  Cross,
  MapPin,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Mapeia slug de categoria → ícone Lucide
const ICON_MAP: Record<string, LucideIcon> = {
  alimentacao: Utensils,
  beleza:      Scissors,
  comercio:    ShoppingBag,
  servicos:    Wrench,
  agro:        Sprout,
  saude:       Cross,
  default:     MapPin,
}

interface CategoryIconProps {
  slug: string | null | undefined
  size?: number
  className?: string
}

export function CategoryIcon({ slug, size = 22, className }: CategoryIconProps) {
  const Icon = (slug && ICON_MAP[slug]) ? ICON_MAP[slug] : ICON_MAP.default
  return <Icon size={size} className={className} aria-hidden="true" />
}
