import {
  UtensilsCrossed,
  ShoppingBasket,
  Scissors,
  Store,
  Shirt,
  Sparkles,
  Hammer,
  Package,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingBasket,
  Scissors,
  Store,
  Shirt,
  Sparkles,
  Hammer,
}

interface CategoryIconProps {
  name: string | null
  size?: number
}

export function CategoryIcon({ name, size = 22 }: CategoryIconProps) {
  const Icon = (name && iconMap[name]) ? iconMap[name] : Package
  return <Icon size={size} />
}
