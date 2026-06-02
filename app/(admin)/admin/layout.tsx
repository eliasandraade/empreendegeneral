// app/(admin)/admin/layout.tsx — Layout escuro para o painel admin
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Store, Users, Star, LogOut } from "lucide-react"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "Negócios", icon: Store },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/featured", label: "Destaques", icon: Star },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#080c18] text-white flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/[0.06] flex flex-col py-6 px-4 fixed top-0 left-0 h-full z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Store size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Empreende</p>
            <p className="text-[10px] text-white/30 mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-all group"
            >
              <Icon size={16} className="group-hover:text-blue-400 transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
              {session.name?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{session.name ?? "Admin"}</p>
              <p className="text-[10px] text-white/30 truncate">{session.role}</p>
            </div>
          </div>
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut size={14} />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
