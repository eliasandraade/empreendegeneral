// app/(main)/admin/businesses/page.tsx
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { approveBusinessAction, rejectBusinessAction } from "@/lib/actions/admin"
import { CheckCircle2, XCircle, Clock, MapPin } from "lucide-react"
import type { BusinessStatus } from "@prisma/client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Painel Admin — Negócios" }

const statusLabels: Record<BusinessStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
}

const statusColors: Record<BusinessStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
}

interface PageProps {
  searchParams: { status?: string }
}

export default async function AdminBusinessesPage({ searchParams }: PageProps) {
  const session = await getServerSession()
  const role = session?.role

  if (!role || (role !== "ADMIN" && role !== "SUPER_ADMIN")) redirect("/")

  const filterStatus = (searchParams.status as BusinessStatus) ?? "PENDING"

  const businesses = await prisma.business.findMany({
    where: { status: filterStatus, deletedAt: null },
    include: {
      owner: { select: { name: true, email: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="container max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Painel Admin — Negócios</h1>
        <p className="text-gray-500 text-sm">Revisar, aprovar e rejeitar cadastros.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["PENDING", "APPROVED", "REJECTED"] as BusinessStatus[]).map((s) => (
          <a
            key={s}
            href={`/admin/businesses?status=${s}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filterStatus === s ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            {statusLabels[s]}
          </a>
        ))}
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <Clock size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum negócio com status &quot;{statusLabels[filterStatus]}&quot;.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {businesses.map((b) => (
            <div key={b.id} className="border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-800">{b.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[b.status]}`}>{statusLabels[b.status]}</span>
                    {b.category && <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{b.category.name}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{b.owner.name} · {b.owner.email}</p>
                  {b.address && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={11} />
                      {b.address}{b.city ? `, ${b.city}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Cadastrado em {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {b.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{b.description}</p>
              )}

              {b.status === "PENDING" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                  <form
                    action={async () => {
                      "use server"
                      await approveBusinessAction(b.id)
                    }}
                  >
                    <button type="submit" className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors">
                      <CheckCircle2 size={15} />
                      Aprovar
                    </button>
                  </form>

                  <form
                    action={async (formData: FormData) => {
                      "use server"
                      const reason = formData.get("reason") as string
                      await rejectBusinessAction(b.id, reason)
                    }}
                    className="flex flex-1 gap-2"
                  >
                    <input
                      name="reason"
                      required
                      minLength={10}
                      placeholder="Motivo da rejeição (obrigatório)"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 min-w-0"
                    />
                    <button type="submit" className="flex items-center gap-2 bg-white border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors shrink-0">
                      <XCircle size={15} />
                      Rejeitar
                    </button>
                  </form>
                </div>
              )}

              {b.status === "REJECTED" && b.rejectionReason && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
                  <span className="font-medium">Motivo: </span>{b.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
