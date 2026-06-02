// app/page.tsx
import { LandingHero } from "@/components/landing/LandingHero"
import { APP_CONFIG } from "@/config"

export default function HomePage() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <LandingHero
        appName={APP_CONFIG.name}
        slogan={APP_CONFIG.slogan}
        description={APP_CONFIG.description}
        credit={APP_CONFIG.credit}
      />
    </div>
  )
}
