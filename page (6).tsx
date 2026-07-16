"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Agent } from "@/types"
import Link from "next/link"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [agent, setAgent] = useState<Agent | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/login"); return }
      const cedula = session.user.email!.replace("@salestracker.co", "")
      const { data } = await supabase.from("agents").select("*").eq("cedula", cedula).single()
      if (data) setAgent(data)
    }
    checkAuth()
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isSup = agent?.role === "supervisor"
  const navLinks = isSup
    ? [
        { href: "/supervisor", label: "Dashboard" },
        { href: "/supervisor/agents", label: "Agentes" },
        { href: "/supervisor/ranking", label: "Ranking" },
        { href: "/supervisor/tickets", label: "Tickets" },
      ]
    : [
        { href: "/agent", label: "Mi Panel" },
        { href: "/agent/new-sale", label: "Nueva Venta" },
        { href: "/agent/my-sales", label: "Mis Ventas" },
        { href: "/agent/esim", label: "eSIM" },
        { href: "/agent/tickets", label: "Tickets" },
        { href: "/agent/ranking", label: "Ranking" },
      ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-blue-400 text-lg">Sales Tracker</span>
            <nav className="hidden md:flex gap-1">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className={"px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " + (pathname === l.href ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800")}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {agent && (
              <span className="text-sm text-gray-400 hidden md:block">
                {agent.full_name}
                <span className={"ml-2 px-2 py-0.5 rounded-full text-xs font-medium " + (isSup ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400")}>
                  {isSup ? "Supervisor" : "Agente"}
                </span>
              </span>
            )}
            <button onClick={logout} className="text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  )
}