// components/businesses/BusinessForm.tsx
"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { createBusinessAction } from "@/lib/actions/business"
import { LocationPicker } from "./LocationPicker"
import type { Category } from "@prisma/client"
import type { ActionResult, LocationData } from "@/types"

interface Props {
  categories: Category[]
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "Enviando..." : "Cadastrar negócio"}
    </button>
  )
}

export function BusinessForm({ categories }: Props) {
  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    createBusinessAction,
    null
  )
  const [locationData, setLocationData] = useState<LocationData | null>(null)

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="latitude" value={locationData?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={locationData?.longitude ?? ""} />
      <input type="hidden" name="formattedAddress" value={locationData?.formattedAddress ?? ""} />

      {state && !state.success && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Seção 1: Dados básicos */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Dados básicos</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do negócio <span className="text-red-500">*</span>
            </label>
            <input name="name" required maxLength={100} placeholder="Ex.: Padaria do Zé" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
            <select name="categoryId" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Selecionar categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <textarea name="description" rows={4} maxLength={2000} placeholder="Conte sobre seu negócio..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none" />
          </div>
        </div>
      </section>

      {/* Seção 2: Contato */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Contato</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
            <input name="phone" type="tel" placeholder="(85) 99999-9999" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
            <input name="whatsapp" type="tel" placeholder="(85) 99999-9999" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
            <input name="instagram" placeholder="@seuperfil" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site</label>
            <input name="website" type="url" placeholder="https://exemplo.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        </div>
      </section>

      {/* Seção 3: Localização */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">
          Localização <span className="text-red-500">*</span>
        </h2>
        <p className="text-xs text-gray-400 mb-4">Digite o endereço, confirme o pin no mapa e clique em &quot;Confirmar localização&quot;.</p>
        <div className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
              <input name="address" placeholder="Rua, número, bairro" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
              <input name="city" defaultValue="General Sampaio" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">UF</label>
              <input name="state" defaultValue="CE" maxLength={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 uppercase" />
            </div>
          </div>
          <LocationPicker
            onConfirm={setLocationData}
            onReset={() => setLocationData(null)}
            confirmed={!!locationData}
          />
          {!locationData && (
            <p className="text-xs text-amber-600">Confirme a localização no mapa para prosseguir.</p>
          )}
        </div>
      </section>

      {/* Seção 4: Horários */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Horários</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário de funcionamento</label>
          <input name="hours" placeholder="Ex.: Seg–Sex 8h–18h, Sáb 8h–12h" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
        </div>
      </section>

      <div className="pt-2">
        <SubmitButton disabled={!locationData} />
        <p className="text-xs text-gray-400 text-center mt-3">Seu negócio será revisado antes de aparecer publicamente.</p>
      </div>
    </form>
  )
}
