// app/(admin)/admin/businesses/page.tsx — Moderação de negócios (dark)
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { approveBusinessAction, rejectBusinessAction } from "@/lib/actions/admin"
import { CheckCircle2, XCircle, MapPin, Store } from "lucide-react"
import type { BusinessStatus } from "@prisma/client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Admin — Negócios" }

const STATUS_LABELS: Record<BusinessStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
}

const STATUS_STYLE: Record<BusinessStatus, string> = {
  PENDING:  "bg-amber-500/10 border-amber-500/20 text-amber-400",
  APPROVED: "bg-green-500/10 border-green-500/20 text-green-400",
  REJECTED: "bg-red-500/10 border-red-500/20 text-red-400",
}

const TAB_ACTIVE   = "bg-white/[0.08] text-white border-white/[0.10]"
const TAB_INACTIVE = "text-white/40 border-white/[0.05] hover:text-white/70 hover:border-white/[0.10]"

interface PageProps {
  searchParams: { status?: string }
}

export default async function AdminBusinessesPage({ searchParams }: PageProps) {
  const session = await getServerSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) redirect("/login")

  const filterStatus = (searchParams.status as BusinessStatus) ?? "PENDING"

  const [businesses, counts] = await Promise.all([
    prisma.business.findMany({
      where: { status: filterStatus, deletedAt: null },
      include: {
        owner: { select: { name: true, email: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.business.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    }),
  ])

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Negócios</h1>
        <p className="text-sm text-white/40 mt-1">Revisar, aprovar e rejeitar cadastros</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["PENDING", "APPROVED", "REJECTED"] as BusinessStatus[]).map((s) => (
          <a key={s} href={`/admin/businesses?status=${s}`}
            className={`flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl border transition-all ${filterStatus === s ? TAB_ACTIVE : TAB_INACTIVE}`}
          >
            {STATUS_LABELS[s]}
            {countMap[s] ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                s === "PENDING" ? "bg-amber-500/20 text-amber-400" :
                s === "APPROVED" ? "bg-green-500/20 text-green-400" :
                "bg-red-500/20 text-red-400"
              }`}>{countMap[s]}</span>
            ) : null}
          </a>
        ))}
      </div>

      {/* Lista */}
      {businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/[0.06] rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <Store size={20} className="text-white/20" />
          </div>
          <p className="text-sm text-white/30">Nenhum negócio com status &quot;{STATUS_LABELS[filterStatus]}&quot;</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {businesses.map((b) => (
            <div key={b.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.12] transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h2 className="font-semibold text-white">{b.name}</h2>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLE[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                    {b.category && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                        {b.category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40">{b.owner.name} · {b.owner.email}</p>
                  {b.address && (
                    <p className="text-xs text-white/30 flex items-center gap-1 mt-1">
                      <MapPin size={10} />
                      {b.address}{b.city ? `, ${b.city}` : ""}
                    </p>
                  )}
                  <p className="text-[10px] text-white/20 mt-1">
                    Cadastrado em {new Date(b.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {b.description && (
                <p className="text-sm text-white/40 mb-4 line-clamp-2 leading-relaxed">{b.description}</p>
              )}

              {b.status === "PENDING" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-white/[0.06]">
                  <form action={async () => {
                    "use server"
                    await approveBusinessAction(b.id)
                  }}>
                    <button type="submit"
                      className="flex items-center gap-2 bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/25 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                    >
                      <CheckCircle2 size={14} />
                      Aprovar
                    </button>
                  </form>

                  <form action={async (formData: FormData) => {
                    "use server"
                    const reason = formData.get("reason") as string
                    await rejectBusinessAction(b.id, reason)
                  }} className="flex flex-1 gap-2">
                    <input
                      name="reason"
                      required
                      minLength={10}
                      placeholder="Motivo da rejeição"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/40 min-w-0 transition-all"
                    />
                    <button type="submit"
                      className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shrink-0"
                    >
                      <XCircle size={14} />
                      Rejeitar
                    </button>
                  </form>
                </div>
              )}

              {b.status === "REJECTED" && b.rejectionReason && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-400">
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
