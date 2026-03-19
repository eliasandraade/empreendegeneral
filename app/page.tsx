export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold text-blue-700 mb-3">
          Empreende General
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          {process.env.NEXT_PUBLIC_SLOGAN ?? "Conectando empreendedores e a comunidade"}
        </p>
        <div className="inline-block rounded-full bg-blue-50 text-blue-600 text-sm font-medium px-4 py-2">
          Em breve
        </div>
      </div>
      <footer className="absolute bottom-6 text-xs text-gray-400">
        Uma iniciativa Andrade Systems
      </footer>
    </main>
  )
}
