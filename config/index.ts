// Constantes e configurações globais do produto

export const APP_CONFIG = {
  name: "Empreende General",
  slogan: process.env.NEXT_PUBLIC_SLOGAN ?? "Conectando empreendedores e a comunidade",
  description:
    "Plataforma digital para descoberta e valorização dos pequenos empreendedores de General Sampaio/CE.",
  city: "General Sampaio",
  state: "CE",
  credit: "Uma iniciativa Andrade Systems",
  url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
} as const

// Configurações de paginação
export const PAGINATION = {
  defaultLimit: 12,
  maxLimit: 50,
} as const

// Coordenadas centrais da cidade (fallback para o mapa)
export const MAP_CONFIG = {
  defaultCenter: {
    lat: -3.9231, // General Sampaio/CE
    lng: -39.4582,
  },
  defaultZoom: 14,
} as const

// Status de negócio legíveis
export const BUSINESS_STATUS_LABELS = {
  PENDING: "Aguardando aprovação",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
} as const

// Papéis de usuário legíveis
export const USER_ROLE_LABELS = {
  USER: "Usuário",
  ENTREPRENEUR: "Empreendedor",
  ADMIN: "Administrador",
} as const
