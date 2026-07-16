"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Sale, SaleStatus } from "@/types"
const ST_COLOR: Record<string, string> = { activa: "bg-green-400/10 text-green-400 border-green-400/30", rechazo: "bg-red-400/10 text-red-400 border-red-400/30", reparto_logistico: "bg-blue-400/10 text-blue-400 border-blue-400/30", cancelada: "bg-gray-600/30 text-gray-400 border-gray-600/30" }
const ST_LABEL: Record<string, string> = { activa: "Activa", rechazo: "Rechazo", reparto_logistico: "Reparto logistico", cancelada: "Cancelada" }
const ALL: SaleStatus[] = ["activa", "rechazo", "reparto_logistico", "cancelada"]
export default function MySalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filter, setFilter] = useState<SaleStatus | "all">("all")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  useEffect(() => { loadSales() }, [])
  async function loadSales() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const cedula = session.user.email!.replace("@salestracker.co", "")
    const { data: agent } = await supabase.from("agents").select("id").eq("cedula", cedula).single()
    if (!agent) return
    const { data } = await supabase.from("sales").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false })
    setSales(data || []); setLoading(false)
  }
  async function changeStatus(id: string, status: SaleStatus) {
    setUpdating(id)
    await supabase.from("sales").update({ status }).eq("id", id)
    setSales(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    setUpdating(null)
  }
  const filtered = filter === "all" ? sales : sales.filter(s => s.status === filter)
  if (loading) return <Spinner />
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Mis ventas</h1>
      <div className="flex gap-2 flex-wrap">
        {(["all", ...ALL] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " + (filter === s ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400")}>
            {s === "all" ? "Todas" : ST_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ALL.map(s => (
          <div key={s} className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-500">{ST_LABEL[s]}</p>
            <p className="text-xl font-bold text-white">{sales.filter(x => x.status === s).length}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-gray-500">
                {["Cliente", "Doc.", "Orden", "Plan", "Tipo", "Estado", "Fecha"].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-white">{s.client_name}</td>
                  <td className="px-4 py-3 text-gray-400">{s.client_document}</td>
                  <td className="px-4 py-3 text-gray-400">{s.order_number}</td>
                  <td className="px-4 py-3 text-blue-400">${s.plan_value.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{s.sale_type.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <select value={s.status} disabled={updating === s.id} onChange={e => changeStatus(s.id, e.target.value as SaleStatus)}
                      className={"text-xs px-2 py-1 rounded-full border bg-transparent cursor-pointer " + ST_COLOR[s.status]}>
                      {ALL.map(st => <option key={st} value={st} className="bg-gray-900 text-white">{ST_LABEL[st]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{s.sale_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Sin ventas.</p>}
        </div>
      </div>
    </div>
  )
}
function Spinner() { return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" /></div> }