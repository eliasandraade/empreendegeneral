import { APP_CONFIG } from "@/config"

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container flex flex-col md:flex-row items-center justify-between py-6 gap-2 text-sm text-gray-400">
        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
          <span className="font-semibold text-gray-600">{APP_CONFIG.name}</span>
          <span className="hidden md:block">·</span>
          <span>{APP_CONFIG.slogan}</span>
        </div>
        <span className="text-xs">{APP_CONFIG.credit}</span>
      </div>
    </footer>
  )
}
