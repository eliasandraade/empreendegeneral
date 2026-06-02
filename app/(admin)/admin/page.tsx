// app/(admin)/admin/page.tsx — Dashboard com métricas
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Store, Clock, CheckCircle2, Users, TrendingUp, XCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const metadata = { title: "Admin — Dashboard" }

export default async function AdminDashboardPage() {
  const session = await getServerSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) redirect("/login")

  const [
    totalBusinesses,
    pendingBusinesses,
    approvedBusinesses,
    rejectedBusinesses,
    totalUsers,
    recentBusinesses,
    categoryCounts,
  ] = await Promise.all([
    prisma.business.count({ where: { deletedAt: null } }),
    prisma.business.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.business.count({ where: { status: "APPROVED", deletedAt: null } }),
    prisma.business.count({ where: { status: "REJECTED", deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.business.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: { select: { name: true } }, owner: { select: { name: true } } },
    }),
    prisma.business.groupBy({
      by: ["categoryId"],
      where: { status: "APPROVED", deletedAt: null },
      _count: true,
      orderBy: { _count: { categoryId: "desc" } },
      take: 5,
    }),
  ])

  const categoryIds = categoryCounts.map((c) => c.categoryId).filter(Boolean) as string[]
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const cards = [
    { label: "Total de negócios", value: totalBusinesses, icon: Store, color: "blue", href: "/admin/businesses" },
    { label: "Pendentes", value: pendingBusinesses, icon: Clock, color: "amber", href: "/admin/businesses?status=PENDING" },
    { label: "Aprovados", value: approvedBusinesses, icon: CheckCircle2, color: "green", href: "/admin/businesses?status=APPROVED" },
    { label: "Rejeitados", value: rejectedBusinesses, icon: XCircle, color: "red", href: "/admin/businesses?status=REJECTED" },
    { label: "Usuários", value: totalUsers, icon: Users, color: "indigo", href: "/admin/users" },
  ]

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   text: "text-blue-400",   icon: "text-blue-400" },
    amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  text: "text-amber-400",  icon: "text-amber-400" },
    green:  { bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-400",  icon: "text-green-400" },
    red:    { bg: "bg-red-500/10",    border: "border-red-500/20",    text: "text-red-400",    icon: "text-red-400" },
    indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400", icon: "text-indigo-400" },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">Visão geral da plataforma</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {cards.map(({ label, value, icon: Icon, color, href }) => {
          const c = colorMap[color]
          return (
            <Link key={label} href={href}
              className={`${c.bg} border ${c.border} rounded-2xl p-5 flex flex-col gap-3 hover:brightness-110 transition-all group`}
            >
              <div className="flex items-center justify-between">
                <Icon size={18} className={c.icon} />
                <TrendingUp size={12} className="text-white/10 group-hover:text-white/20 transition-colors" />
              </div>
              <div>
                <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
                <p className="text-xs text-white/40 mt-0.5">{label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cadastros recentes */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Cadastros recentes</h2>
            <Link href="/admin/businesses" className="text-xs text-blue-400 hover:text-blue-300">Ver todos →</Link>
          </div>
          {recentBusinesses.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-6">Nenhum cadastro ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentBusinesses.map((b) => (
                <div key={b.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-white/40">
                    {b.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate font-medium">{b.name}</p>
                    <p className="text-xs text-white/30">{b.category?.name ?? "Sem categoria"} · {b.owner.name}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    b.status === "APPROVED" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                    b.status === "PENDING"  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                              "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                    {b.status === "APPROVED" ? "Aprovado" : b.status === "PENDING" ? "Pendente" : "Rejeitado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por categoria */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Aprovados por categoria</h2>
          {categoryCounts.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-6">Nenhum negócio aprovado ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {categoryCounts.map((c) => (
                <div key={c.categoryId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60">{c.categoryId ? catMap[c.categoryId] ?? "—" : "Sem categoria"}</span>
                      <span className="text-xs font-bold text-white/80">{c._count}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500/60 rounded-full"
                        style={{ width: `${Math.round((c._count / (approvedBusinesses || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
