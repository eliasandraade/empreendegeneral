// app/page.tsx
export const dynamic = "force-dynamic"

import dynamicImport from "next/dynamic"
import { getServerSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { APP_CONFIG } from "@/config"
import type { BusinessMapPin } from "@/types"

const MapCanvas = dynamicImport(
  () => import("@/components/map/MapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    ),
  }
)

export default async function HomePage() {
  const [session, businesses, categories] = await Promise.all([
    getServerSession(),
    prisma.business.findMany({
      where: {
        status: "APPROVED",
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
        featured: true,
        phone: true,
        whatsapp: true,
        address: true,
        category: { select: { name: true, slug: true, icon: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  const pins = businesses as unknown as BusinessMapPin[]

  return (
    <div style={{ width: "100dvw", height: "100dvh", position: "relative", overflow: "hidden" }}>
      <MapCanvas
        businesses={pins}
        categories={categories}
        isAuthenticated={!!session}
        appName={APP_CONFIG.name}
        slogan={process.env.NEXT_PUBLIC_SLOGAN ?? ""}
      />
    </div>
  )
}
