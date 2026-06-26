'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Usuario } from '@/app/types'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { data, error: err } = await supabase
      .from('usuario')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single<Usuario>()

    if (err || !data) {
      setError('Usuario o contraseña incorrectos')
      return
    }

    localStorage.setItem('user', JSON.stringify(data))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#101828] flex">
      <div className="w-[44%] bg-[#0D1421] flex flex-col justify-between p-16">
        <div>
          <div className="w-16 h-16 rounded-full bg-[#2696F2] flex items-center justify-center text-white font-bold text-xl mb-6">
            TdV
          </div>
          <p className="text-[#2696F2] text-xs font-bold tracking-widest mb-8">
            TEXTIL DEL VALLE S.A.
          </p>
          <h1 className="text-white text-5xl font-bold leading-tight">
            Sistema de<br />Ejecución de<br />Manufactura
          </h1>
          <p className="text-slate-400 mt-6 text-base">
            Control total sobre la producción textil.<br />
            Trazabilidad en tiempo real.
          </p>
        </div>
        <div className="flex gap-6">
          {[['10+', 'Módulos'], ['5', 'Subsistemas'], ['Real-time', 'Monitoreo']].map(([val, lbl]) => (
            <div key={lbl} className="bg-[#101828] rounded-lg p-4 flex-1">
              <p className="text-[#2696F2] font-bold text-lg">{val}</p>
              <p className="text-slate-400 text-xs">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="bg-[#1A2535] rounded-2xl p-10 w-[440px]">
          <h2 className="text-white text-2xl font-bold mb-2">Iniciar Sesión</h2>
          <p className="text-slate-400 text-sm mb-8">
            Ingresa tus credenciales para acceder al sistema
          </p>

          <label className="text-slate-300 text-sm font-medium">Usuario</label>
          <input
            className="w-full bg-[#0D1421] border border-slate-600 rounded-lg px-4 py-3 text-white mt-2 mb-5 outline-none focus:border-[#2696F2]"
            placeholder="nombredeusuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <label className="text-slate-300 text-sm font-medium">Contraseña</label>
          <input
            type="password"
            className="w-full bg-[#0D1421] border border-slate-600 rounded-lg px-4 py-3 text-white mt-2 mb-5 outline-none focus:border-[#2696F2]"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={handleLogin}
            className="w-full bg-[#2696F2] text-white font-semibold py-3 rounded-lg hover:bg-[#1a7fd4] transition"
          >
            Ingresar al Sistema
          </button>
        </div>
      </div>
    </div>
  )
}
