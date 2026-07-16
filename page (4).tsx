"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [cedula, setCedula] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const email = cedula.trim() + "@salestracker.co"
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.session) {
      setError(authError ? authError.message : "Cedula o contrasena incorrecta")
      setLoading(false)
      return
    }
    const { data: ag } = await supabase.from("agents").select("role").eq("cedula", cedula.trim()).single()
    router.push(ag?.role === "supervisor" ? "/supervisor" : "/agent")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Sales Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">Ingresa con tu numero de cedula</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Numero de cedula</label>
            <input
              type="text"
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              placeholder="Ej: 1090378908"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && (
            <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  )
}