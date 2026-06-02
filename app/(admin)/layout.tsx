// app/(admin)/layout.tsx — Wrapper mínimo para não herdar Header/Footer do (main)
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
