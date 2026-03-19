"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { APP_CONFIG } from "@/config"

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/businesses", label: "Negócios" },
  { href: "/map", label: "Mapa" },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-700">{APP_CONFIG.name}</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-blue-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTAs desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/dashboard/new"
            className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
          >
            Cadastrar negócio
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Entrar
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="container flex flex-col py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-blue-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-100" />
            <Link
              href="/dashboard/new"
              className="text-sm font-medium text-blue-700"
              onClick={() => setOpen(false)}
            >
              Cadastrar negócio
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg text-center"
              onClick={() => setOpen(false)}
            >
              Entrar
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
