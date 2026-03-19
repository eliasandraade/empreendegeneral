// Tipos globais do projeto Empreende General

import type { User, Business, Category, Review, BusinessImage, UserRole, BusinessStatus } from "@prisma/client"

// Extensão da sessão do Auth.js para incluir id e role
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
  interface User {
    role: UserRole
  }
}

// Negócio com relações carregadas (uso comum nas listagens)
export type BusinessWithRelations = Business & {
  category: Category | null
  images: BusinessImage[]
  owner: Pick<User, "id" | "name" | "image">
  _count: {
    reviews: number
    favorites: number
  }
}

// Avaliação com usuário
export type ReviewWithUser = Review & {
  user: Pick<User, "id" | "name" | "image">
}

// Resposta padrão de Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Parâmetros de paginação
export type PaginationParams = {
  page: number
  limit: number
}

// Parâmetros de busca de negócios
export type BusinessSearchParams = {
  q?: string
  categorySlug?: string
  city?: string
  page?: number
}

export type { UserRole, BusinessStatus }
