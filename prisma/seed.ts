// Seed inicial — categorias de negócios de General Sampaio/CE

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const categories = [
  {
    name: "Alimentação",
    slug: "alimentacao",
    icon: "UtensilsCrossed",
    description: "Restaurantes, lanchonetes, padarias e delivery",
  },
  {
    name: "Mercados",
    slug: "mercados",
    icon: "ShoppingBasket",
    description: "Supermercados, mercearias e mercadinhos",
  },
  {
    name: "Salões",
    slug: "saloes",
    icon: "Scissors",
    description: "Barbearias, salões de beleza e cabeleireiros",
  },
  {
    name: "Comércio em Geral",
    slug: "comercio-em-geral",
    icon: "Store",
    description: "Lojas, comércios e serviços diversos",
  },
  {
    name: "Moda e Vestuário",
    slug: "moda-e-vestuario",
    icon: "Shirt",
    description: "Roupas, calçados e acessórios",
  },
  {
    name: "Beleza e Estética",
    slug: "beleza-e-estetica",
    icon: "Sparkles",
    description: "Clínicas de estética, manicures e depilação",
  },
  {
    name: "Construção e Agro",
    slug: "construcao-e-agro",
    icon: "Hammer",
    description: "Materiais de construção, ferragens e agropecuária",
  },
]

async function main() {
  console.log("Criando categorias...")

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log(`${categories.length} categorias criadas com sucesso!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
