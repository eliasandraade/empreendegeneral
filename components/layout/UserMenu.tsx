// components/layout/UserMenu.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { signOut as firebaseSignOut } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react"

interface UserMenuProps {
  name: string | null | undefined
  email: string | null | undefined
  image: string | null | undefined
  role: string
}

export function UserMenu({ name, email, image, role }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  async function handleSignOut() {
    await firebaseSignOut(getFirebaseAuth())
    await fetch("/api/auth/session", { method: "DELETE" })
    router.push("/")
    router.refresh()
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const initials = name?.slice(0, 1).toUpperCase() ?? "?"
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors"
      >
        {image ? (
          <Image src={image} alt={name ?? "Usuário"} width={28} height={28} className="rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden md:block">
          {name ?? email}
        </span>
        <ChevronDown size={14} className="text-gray-400 hidden md:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
            <LayoutDashboard size={15} className="text-gray-400" />
            Meu painel
          </Link>
          {isAdmin && (
            <Link href="/admin/businesses" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
              <ShieldCheck size={15} className="text-blue-600" />
              Painel admin
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
