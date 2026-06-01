import {
  Utensils,
  Scissors,
  ShoppingBag,
  Shirt,
  Store,
  Hammer,
  MapPin,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Mapeia slug real do banco → ícone Lucide
const ICON_MAP: Record<string, LucideIcon> = {
  alimentacao:         Utensils,
  mercados:            Store,
  saloes:              Scissors,
  "comercio-em-geral": ShoppingBag,
  "moda-e-vestuario":  Shirt,
  "beleza-e-estetica": Scissors,
  "construcao-e-agro": Hammer,
  default:             MapPin,
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
