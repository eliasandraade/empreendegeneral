// app/(auth)/layout.tsx — Wrapper mínimo para não herdar Header/Footer do (main)
export default function AuthRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
