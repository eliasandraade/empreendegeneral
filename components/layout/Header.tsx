// components/layout/Header.tsx
import Link from "next/link"
import { getServerSession } from "@/lib/session"
import { APP_CONFIG } from "@/config"
import { UserMenu } from "./UserMenu"
import { MobileMenuButton } from "./MobileMenuButton"

const navLinks = [
  { href: "/businesses", label: "Negócios" },
]

export async function Header() {
  const user = await getServerSession()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-700">{APP_CONFIG.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-gray-600 hover:text-blue-700 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              role={user.role}
            />
          ) : (
            <>
              <Link href="/dashboard/new" className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors">
                Cadastrar negócio
              </Link>
              <Link href="/login" className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                Entrar
              </Link>
            </>
          )}
        </div>

        <MobileMenuButton
          user={user ? { name: user.name, email: user.email, role: user.role } : null}
          navLinks={navLinks}
        />
      </div>
    </header>
  )
}
