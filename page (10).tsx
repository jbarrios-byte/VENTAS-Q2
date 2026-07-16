"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const PLANS = [{ value: 64990, label: "$64.990" }, { value: 54990, label: "$54.990" }, { value: 44990, label: "$44.990" }]
const SALE_TYPES = [["portabilidad", "Portabilidad"], ["linea_nueva", "Linea nueva"], ["migracion", "Migracion"]]
const DELIVERY = [["esim", "eSIM"], ["recogida_punto", "Recogida en punto"], ["bodega_estandar", "Bodega estandar"]]

export default function NewSalePage() {
  const router = useRouter()
  const [form, setForm] = useState({ plan_value: 64990, sale_type: "portabilidad", delivery_type: "esim", client_document: "", client_name: "", order_number: "", sale_date: new Date().toISOString().split("T")[0] })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  function set(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })) }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("")
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError("Sesion expirada"); setSaving(false); return }
    const cedula = session.user.email!.replace("@salestracker.co", "")
    const { data: agent } = await supabase.from("agents").select("id").eq("cedula", cedula).single()
    if (!agent) { setError("Agente no encontrado"); setSaving(false); return }
    const { error: err } = await supabase.from("sales").insert({ ...form, agent_id: agent.id, status: "activa" })
    if (err) setError("Error al guardar.")
    else { setSuccess(true); setTimeout(() => router.push("/agent"), 1500) }
    setSaving(false)
  }
  if (success) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-14 h-14 bg-green-400/10 rounded-full flex items-center justify-center">
        <span className="text-green-400 text-3xl">OK</span>
      </div>
      <p className="text-white font-semibold text-lg">Venta registrada</p>
    </div>
  )
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Registrar nueva venta</h1>
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-5 border border-gray-800">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Valor del plan</label>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map(p => (
              <button key={p.value} type="button" onClick={() => set("plan_value", p.value)}
                className={"py-2.5 rounded-lg text-sm font-semibold border transition-colors " + (form.plan_value === p.value ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-800 border-gray-700 text-gray-300")}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Tipo de venta</label>
          <div className="grid grid-cols-3 gap-2">
            {SALE_TYPES.map(([v, l]) => (
              <button key={v} type="button" onClick={() => set("sale_type", v)}
                className={"py-2.5 rounded-lg text-sm font-medium border transition-colors " + (form.sale_type === v ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-800 border-gray-700 text-gray-300")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Tipo de entrega</label>
          <div className="grid grid-cols-3 gap-2">
            {DELIVERY.map(([v, l]) => (
              <button key={v} type="button" onClick={() => set("delivery_type", v)}
                className={"py-2.5 rounded-lg text-sm font-medium border transition-colors " + (form.delivery_type === v ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-800 border-gray-700 text-gray-300")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {[["client_document", "N documento del cliente", "1234567890"], ["client_name", "Nombre del cliente", "Maria Garcia"], ["order_number", "Numero de orden", "ORD-00123"]].map(([k, label, ph]) => (
          <div key={k}>
            <label className="block text-sm text-gray-400 mb-1">{label}</label>
            <input type="text" value={(form as Record<string, unknown>)[k] as string} onChange={e => set(k, e.target.value)} placeholder={ph} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
        ))}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fecha de venta</label>
          <input type="date" value={form.sale_date} onChange={e => set("sale_date", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          {saving ? "Guardando..." : "Registrar venta"}
        </button>
      </form>
    </div>
  )
}