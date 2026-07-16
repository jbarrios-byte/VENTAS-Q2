"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { computeAllKPIs, GOALS } from "@/lib/kpis"
import { Agent, Sale, EsimRecord, AgentKPIs } from "@/types"

const ST_COLOR: Record<string, string> = {
  activa: "bg-green-400/10 text-green-400",
  rechazo: "bg-red-400/10 text-red-400",
  reparto_logistico: "bg-blue-400/10 text-blue-400",
  cancelada: "bg-gray-600/30 text-gray-400",
}
const ST_LABEL: Record<string, string> = {
  activa: "Activa", rechazo: "Rechazo", reparto_logistico: "Reparto logistico", cancelada: "Cancelada",
}
const Q_COLOR: Record<number, string> = {
  1: "text-green-400 bg-green-400/10 border-green-400/30",
  2: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  3: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  4: "text-red-400 bg-red-400/10 border-red-400/30",
}

export default function AgentDashboard() {
  const [me, setMe] = useState<Agent | null>(null)
  const [myKPI, setMyKPI] = useState<AgentKPIs | null>(null)
  const [recentSales, setRecent] = useState<Sale[]>([])
  const [totalAgents, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const cedula = session.user.email!.replace("@salestracker.co", "")
      const [{ data: ag }, { data: agents }, { data: sales }, { data: esim }] = await Promise.all([
        supabase.from("agents").select("*").eq("cedula", cedula).single(),
        supabase.from("agents").select("*").eq("role", "agent"),
        supabase.from("sales").select("*"),
        supabase.from("esim_records").select("*"),
      ])
      if (!ag || !agents || !sales || !esim) return
      setMe(ag)
      setTotal(agents.length)
      const kpis = computeAllKPIs(agents, sales, esim)
      setMyKPI(kpis.find(k => k.agent.id === ag.id) || null)
      setRecent(sales.filter((s: Sale) => s.agent_id === ag.id).sort((a: Sale, b: Sale) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />
  const q = myKPI?.quartile || 4
  const pct = Math.min(100, myKPI?.monthly_goal_pct || 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hola, {me?.full_name.split(" ")[0]}</h1>
          <p className="text-gray-400 text-sm">Tu resumen de hoy</p>
        </div>
        <span className={"px-3 py-1.5 rounded-full text-sm font-bold border " + Q_COLOR[q]}>Q{q}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { l: "Ventas activas", v: myKPI?.active_sales || 0, s: "Meta: " + GOALS.INDIVIDUAL_MONTHLY },
          { l: "eSIM activas", v: myKPI?.esim_count || 0, s: "Contadas en total" },
          { l: "SPH", v: myKPI?.sph || 0, s: "Ventas por hora" },
          { l: "Ratio", v: myKPI?.ratio || 0, s: "Ventas / dia" },
          { l: "Posicion", v: "#" + (myKPI?.rank || "-"), s: "de " + totalAgents + " agentes" },
        ].map(c => (
          <div key={c.l} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">{c.l}</p>
            <p className="text-2xl font-bold text-white">{c.v}</p>
            <p className="text-gray-500 text-xs mt-1">{c.s}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Meta mensual ({GOALS.INDIVIDUAL_MONTHLY} ventas activas)</span>
          <span className="text-white font-semibold">{myKPI?.monthly_goal_pct || 0}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={"h-full rounded-full " + (pct >= 100 ? "bg-green-400" : pct >= 60 ? "bg-blue-500" : "bg-yellow-400")} style={{ width: pct + "%" }} />
        </div>
      </div>
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <h2 className="text-white font-semibold mb-4">Ultimas ventas</h2>
        {recentSales.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin ventas aun.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  {["Cliente", "Orden", "Plan", "Tipo", "Estado", "Fecha"].map(h => (
                    <th key={h} className="text-left pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentSales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-800/50">
                    <td className="py-2.5 pr-4 text-white">{s.client_name}</td>
                    <td className="py-2.5 pr-4 text-gray-400">{s.order_number}</td>
                    <td className="py-2.5 pr-4 text-blue-400">${s.plan_value.toLocaleString("es-CO")}</td>
                    <td className="py-2.5 pr-4 text-gray-300 capitalize">{s.sale_type.replace("_", " ")}</td>
                    <td className="py-2.5 pr-4">
                      <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + ST_COLOR[s.status]}>{ST_LABEL[s.status]}</span>
                    </td>
                    <td className="py-2.5 text-gray-400">{s.sale_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" /></div>
}