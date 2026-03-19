// Schemas Zod centralizados — validação de inputs do sistema

import { z } from "zod"

// ─── Negócio ─────────────────────────────────────────────

export const createBusinessSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  description: z.string().max(2000, "Descrição muito longa").optional(),
  categoryId: z.string().cuid("Categoria inválida").optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  instagram: z.string().max(50).optional(),
  whatsapp: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2, "UF deve ter 2 caracteres").optional(),
  zipCode: z.string().max(9).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>

// ─── Avaliação ───────────────────────────────────────────

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Nota mínima: 1").max(5, "Nota máxima: 5"),
  comment: z.string().max(1000, "Comentário muito longo").optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

// ─── Resposta de avaliação ────────────────────────────────

export const createReviewReplySchema = z.object({
  content: z
    .string()
    .min(1, "Resposta não pode ser vazia")
    .max(500, "Resposta muito longa"),
})

export type CreateReviewReplyInput = z.infer<typeof createReviewReplySchema>

// ─── Lead ────────────────────────────────────────────────

export const createLeadSchema = z.object({
  name: z.string().min(2, "Nome inválido").max(100),
  email: z.string().email("E-mail inválido"),
  phone: z.string().max(20).optional(),
  message: z.string().max(1000).optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

// ─── Denúncia ────────────────────────────────────────────

export const createReportSchema = z.object({
  reason: z.enum([
    "INAPPROPRIATE_CONTENT",
    "WRONG_INFORMATION",
    "SPAM",
    "DUPLICATE",
    "OTHER",
  ]),
  notes: z.string().max(500).optional(),
  businessId: z.string().cuid().optional(),
  reviewId: z.string().cuid().optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>

// ─── Artigo ──────────────────────────────────────────────

export const createArticleSchema = z.object({
  title: z.string().min(3, "Título muito curto").max(200),
  content: z.string().min(10, "Conteúdo muito curto"),
  excerpt: z.string().max(300).optional(),
  published: z.boolean().default(false),
})

export type CreateArticleInput = z.infer<typeof createArticleSchema>
