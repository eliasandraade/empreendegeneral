// components/layout/MobileMenuButton.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut as firebaseSignOut } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/firebase"

interface Props {
  navLinks: { href: string; label: string }[]
  user: { name?: string | null; email?: string | null; role: string } | null
}

export function MobileMenuButton({ navLinks, user }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

  async function handleSignOut() {
    await firebaseSignOut(getFirebaseAuth())
    await fetch("/api/auth/session", { method: "DELETE" })
    setOpen(false)
    router.push("/")
    router.refresh()
  }

  return (
    <>
      <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(!open)} aria-label="Menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-t border-gray-100 bg-white shadow-md z-40">
          <nav className="container flex flex-col py-4 gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-gray-600 hover:text-blue-700" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-100" />
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>Meu painel</Link>
                {isAdmin && (
                  <Link href="/admin/businesses" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>Painel admin</Link>
                )}
                <button onClick={handleSignOut} className="text-left text-sm font-medium text-red-600">Sair</button>
              </>
            ) : (
              <>
                <Link href="/dashboard/new" className="text-sm font-medium text-blue-700" onClick={() => setOpen(false)}>Cadastrar negócio</Link>
                <Link href="/login" className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg text-center" onClick={() => setOpen(false)}>Entrar</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
