// components/businesses/LocationPicker.tsx
"use client"

import { useState } from "react"
import { MapPin, Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import type { LocationData } from "@/types"

interface Props {
  onConfirm: (data: LocationData) => void
  onReset: () => void
  confirmed: boolean
}

type State = "idle" | "searching" | "preview" | "confirmed" | "error"

export function LocationPicker({ onConfirm, onReset, confirmed }: Props) {
  const [address, setAddress] = useState("")
  const [state, setState] = useState<State>(confirmed ? "confirmed" : "idle")
  const [result, setResult] = useState<LocationData | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSearch() {
    if (address.trim().length < 3) return
    setState("searching")
    setErrorMsg("")

    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        if (data.error === "address_not_found") {
          setErrorMsg("Endereço não encontrado. Tente ser mais específico.")
        } else {
          setErrorMsg("Erro ao buscar endereço. Tente novamente.")
        }
        setState("error")
        return
      }

      setResult(data as LocationData)
      setState("preview")
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua internet.")
      setState("error")
    }
  }

  function handleConfirm() {
    if (!result) return
    onConfirm(result)
    setState("confirmed")
  }

  function handleReset() {
    setAddress("")
    setState("idle")
    setResult(null)
    setErrorMsg("")
    onReset()
  }

  const mapSrc = result
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${result.longitude - 0.01},${result.latitude - 0.01},${result.longitude + 0.01},${result.latitude + 0.01}&layer=mapnik&marker=${result.latitude},${result.longitude}`
    : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-blue-400 transition-colors">
          <MapPin size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            placeholder="Ex.: Rua das Flores 123, General Sampaio, CE"
            disabled={state === "confirmed"}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={state === "searching" || state === "confirmed" || address.trim().length < 3}
          className="flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {state === "searching" ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Buscar
        </button>
      </div>

      {state === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      {state === "preview" && mapSrc && result && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl overflow-hidden border border-gray-200 h-48">
            <iframe src={mapSrc} width="100%" height="100%" className="border-0" loading="lazy" title="Localização no mapa" />
          </div>
          <p className="text-sm text-gray-600 flex items-start gap-2">
            <MapPin size={14} className="text-blue-600 mt-0.5 shrink-0" />
            {result.formattedAddress}
          </p>
          <p className="text-xs text-gray-400">Não é o endereço certo? Corrija o campo e busque novamente.</p>
          <button
            type="button"
            onClick={handleConfirm}
            className="self-start flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 size={15} />
            Confirmar localização
          </button>
        </div>
      )}

      {state === "confirmed" && result && (
        <div className="flex items-start justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Localização confirmada</p>
              <p className="text-xs text-green-600 mt-0.5">{result.formattedAddress}</p>
            </div>
          </div>
          <button type="button" onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0 ml-3">
            Corrigir
          </button>
        </div>
      )}
    </div>
  )
}
