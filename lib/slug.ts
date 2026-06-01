// lib/slug.ts
import { prisma } from "@/lib/prisma"

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name)

  const exists = await prisma.business.findUnique({
    where: { slug: base },
    select: { id: true },
  })
  if (!exists) return base

  let counter = 2
  while (true) {
    const candidate = `${base}-${counter}`
    const taken = await prisma.business.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!taken) return candidate
    counter++
  }
}
