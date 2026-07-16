"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { computeAllKPIs, GOALS } from "@/lib/kpis"
import { Sale, EsimRecord, AgentKPIs } from "@/types"
export default function SupervisorDashboard() {
  const [kpis, setKpis] = useState<AgentKPIs[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      const [{ data: agents }, { data: sales }, { data: esim }] = await Promise.all([
        supabase.from("agents").select("*").eq("role", "agent"),
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("esim_records").select("*"),
      ])
      if (!agents || !sales || !esim) return
      setSales(sales); setKpis(computeAllKPIs(agents, sales, esim)); setLoading(false)
    }
    load()
  }, [])
  if (loading) return <Spinner />
  const todayStr = new Date().toISOString().split("T")[0]
  const todayActive = sales.filter(s => s.sale_date === todayStr && s.status === "activa").length
  const pct = Math.min(100, Math.round((todayActive / GOALS.GROUP_DAILY) * 100))
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel Supervisor</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Agentes", v: kpis.length, s: "en el equipo" },
          { l: "Ventas hoy", v: sales.filter(s => s.sale_date === todayStr).length, s: "Meta: " + GOALS.GROUP_DAILY },
          { l: "Total activas", v: sales.filter(s => s.status === "activa").length, s: "ventas activas" },
          { l: "Cumplimiento", v: pct + "%", s: "meta grupal hoy" },
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
          <span className="text-gray-400">Meta grupal diaria ({GOALS.GROUP_DAILY} ventas)</span>
          <span className="text-white font-semibold">{todayActive} / {GOALS.GROUP_DAILY}</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className={"h-full rounded-full " + (pct >= 100 ? "bg-green-400" : pct >= 60 ? "bg-blue-500" : "bg-yellow-400")} style={{ width: pct + "%" }} />
        </div>
      </div>
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <h2 className="text-white font-semibold mb-4">Top agentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                {["#", "Agente", "Activas", "eSIM", "SPH", "Ratio", "Q", "Meta mes"].map(h => <th key={h} className="text-left pb-2 pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {kpis.map(k => (
                <tr key={k.agent.id} className="hover:bg-gray-800/40">
                  <td className="py-2.5 pr-4 text-gray-500">#{k.rank}</td>
                  <td className="py-2.5 pr-4 text-white font-medium">{k.agent.full_name}</td>
                  <td className="py-2.5 pr-4 text-green-400 font-semibold">{k.active_sales}</td>
                  <td className="py-2.5 pr-4 text-blue-400">{k.esim_count}</td>
                  <td className="py-2.5 pr-4 text-gray-300">{k.sph}</td>
                  <td className="py-2.5 pr-4 text-gray-300">{k.ratio}</td>
                  <td className="py-2.5 pr-4">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-bold border " + (k.quartile === 1 ? "bg-green-400/10 text-green-400 border-green-400/30" : k.quartile === 2 ? "bg-blue-400/10 text-blue-400 border-blue-400/30" : k.quartile === 3 ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/30" : "bg-red-400/10 text-red-400 border-red-400/30")}>Q{k.quartile}</span>
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs">{k.monthly_goal_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
function Spinner() { return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" /></div> }