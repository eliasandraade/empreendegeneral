// app/(main)/dashboard/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, CheckCircle2, ExternalLink } from "lucide-react"
import type { BusinessStatus } from "@prisma/client"

export const metadata = { title: "Meu painel" }

const statusConfig: Record<BusinessStatus, { label: string; color: string }> = {
  PENDING: { label: "Aguardando aprovação", color: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Publicado", color: "bg-green-50 text-green-700 border-green-200" },
  REJECTED: { label: "Reprovado", color: "bg-red-50 text-red-700 border-red-200" },
}

interface PageProps {
  searchParams: { cadastro?: string }
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      rejectionReason: true,
      createdAt: true,
      category: { select: { name: true } },
    },
  })

  return (
    <div className="container max-w-3xl px-6 py-10">
      {searchParams.cadastro === "sucesso" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          Negócio cadastrado! Nossa equipe irá revisar em breve.
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meu painel</h1>
          <p className="text-gray-500 text-sm mt-1">Olá, {session.user.name?.split(" ")[0] ?? "empreendedor"}!</p>
        </div>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
        >
          <Plus size={16} />
          Novo negócio
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-4xl mb-4">🏪</p>
          <p className="font-semibold text-gray-700 mb-1">Nenhum negócio cadastrado</p>
          <p className="text-sm text-gray-400 mb-6">Cadastre seu empreendimento e apareça no mapa da cidade.</p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800"
          >
            <Plus size={15} />
            Cadastrar meu negócio
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {businesses.map((b) => {
            const cfg = statusConfig[b.status]
            return (
              <div key={b.id} className="border border-gray-100 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{b.name}</p>
                    {b.category && <p className="text-xs text-gray-400 mt-0.5">{b.category.name}</p>}
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} shrink-0`}>
                    {cfg.label}
                  </span>
                </div>

                {b.status === "REJECTED" && b.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
                    <span className="font-medium">Motivo: </span>{b.rejectionReason}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Cadastrado em {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  {b.status === "APPROVED" && (
                    <Link href={`/businesses/${b.slug}`} className="flex items-center gap-1 text-xs text-blue-700 hover:underline">
                      Ver no mapa / página <ExternalLink size={11} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
