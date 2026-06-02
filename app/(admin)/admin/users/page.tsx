// app/(admin)/admin/users/page.tsx — Gestão de usuários
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Users } from "lucide-react"
import type { UserRole } from "@prisma/client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Admin — Usuários" }

const ROLE_STYLE: Record<UserRole, string> = {
  USER:        "bg-white/[0.06] border-white/[0.10] text-white/40",
  ENTREPRENEUR:"bg-blue-500/10 border-blue-500/20 text-blue-400",
  ADMIN:       "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  SUPER_ADMIN: "bg-purple-500/10 border-purple-500/20 text-purple-400",
}

const ROLE_LABELS: Record<UserRole, string> = {
  USER:        "Usuário",
  ENTREPRENEUR:"Empreendedor",
  ADMIN:       "Admin",
  SUPER_ADMIN: "Super Admin",
}

export default async function AdminUsersPage() {
  const session = await getServerSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) redirect("/login")

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: { select: { businesses: true } },
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <p className="text-sm text-white/40 mt-1">{users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}</p>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/[0.06] rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <Users size={20} className="text-white/20" />
          </div>
          <p className="text-sm text-white/30">Nenhum usuário cadastrado ainda.</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[11px] font-medium text-white/30 uppercase tracking-widest px-6 py-4">Usuário</th>
                <th className="text-left text-[11px] font-medium text-white/30 uppercase tracking-widest px-6 py-4 hidden md:table-cell">Role</th>
                <th className="text-left text-[11px] font-medium text-white/30 uppercase tracking-widest px-6 py-4 hidden lg:table-cell">Negócios</th>
                <th className="text-left text-[11px] font-medium text-white/30 uppercase tracking-widest px-6 py-4 hidden lg:table-cell">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`${i !== users.length - 1 ? "border-b border-white/[0.04]" : ""} hover:bg-white/[0.02] transition-colors`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-sm font-bold text-white/50 shrink-0 overflow-hidden">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          (u.name?.charAt(0) ?? u.email?.charAt(0) ?? "?").toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{u.name ?? "—"}</p>
                        <p className="text-xs text-white/30 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${ROLE_STYLE[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm text-white/40">{u._count.businesses}</span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-xs text-white/30">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
