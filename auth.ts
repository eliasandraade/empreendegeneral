// Configuração central do Auth.js v5 (NextAuth)
// Exporta handlers, auth, signIn e signOut para uso em toda a aplicação

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"
import type { Adapter } from "next-auth/adapters"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Cast necessário por conflito de versões de @auth/core entre next-auth e @auth/prisma-adapter
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Injeta role e id do usuário no token JWT
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
