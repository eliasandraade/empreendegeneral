// app/(main)/dashboard/new/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BusinessForm } from "@/components/businesses/BusinessForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Cadastrar negócio" }

export default async function NewBusinessPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="container max-w-2xl px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors mb-8">
        <ArrowLeft size={16} />
        Voltar ao painel
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Cadastrar negócio</h1>
        <p className="text-gray-500 text-sm">Preencha as informações. Após o cadastro, nossa equipe irá revisar e aprovar.</p>
      </div>
      <BusinessForm categories={categories} />
    </div>
  )
}
