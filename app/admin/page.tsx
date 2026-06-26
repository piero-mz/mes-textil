'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Usuario } from '@/app/types'
import { Plus, X, UserCheck, UserX } from 'lucide-react'

const roles = [
  'Gerente de Producción', 'Jefe de Producción', 'Supervisor',
  'Operario de Planta', 'Coord. de Calidad', 'Jefe de Sistemas',
]

const rolColor: Record<string, string> = {
  'Jefe de Sistemas':      'bg-purple-400/10 text-purple-400',
  'Gerente de Producción': 'bg-[#2696F2]/10 text-[#2696F2]',
  'Jefe de Producción':    'bg-[#2696F2]/10 text-[#2696F2]',
  'Supervisor':            'bg-emerald-400/10 text-emerald-400',
  'Coord. de Calidad':     'bg-amber-400/10 text-amber-400',
  'Operario de Planta':    'bg-slate-400/10 text-slate-400',
}

type UsuarioForm = { username: string; nombre: string; email: string; password: string; rol: string }

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<Usuario | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState<UsuarioForm>({ username: '', nombre: '', email: '', password: '', rol: 'Operario de Planta' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u) as Usuario)
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    const { data } = await supabase.from('usuario').select('*').order('created_at', { ascending: false })
    setUsuarios((data as Usuario[]) || [])
  }

  const handleCrear = async () => {
    if (!form.username || !form.nombre || !form.email || !form.password) return
    setLoading(true)
    await supabase.from('usuario').insert([form])
    setForm({ username: '', nombre: '', email: '', password: '', rol: 'Operario de Planta' })
    setShowForm(false)
    setLoading(false)
    fetchUsuarios()
  }

  const handleToggle = async (id: number, activo: boolean) => {
    await supabase.from('usuario').update({ activo: !activo }).eq('id', id)
    fetchUsuarios()
  }

  const inputClass = "w-full bg-[#070D1A] border border-[#1E2D42] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#2696F2] transition"

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0A1628] border-b border-[#1E2D42] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Gestión de Usuarios y Roles</h1>
            <p className="text-[#4A7FA5] text-xs mt-0.5">CU-10 — Jefe de Sistemas</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#2696F2] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1a7fd4] transition">
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </header>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-6 gap-3">
            {roles.map(r => (
              <div key={r} className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{usuarios.filter(u => u.rol === r).length}</p>
                <p className="text-[#4A7FA5] text-xs mt-1 leading-tight">{r}</p>
              </div>
            ))}
          </div>

          {showForm && (
            <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-6">
              <p className="text-sm font-semibold mb-4">Registrar Nuevo Usuario</p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { label: 'Username', key: 'username', ph: 'jlopez' },
                  { label: 'Nombre completo', key: 'nombre', ph: 'Juan López Díaz' },
                  { label: 'Email', key: 'email', ph: 'jlopez@textil.com' },
                  { label: 'Contraseña', key: 'password', ph: '••••••••', type: 'password' },
                ] as { label: string; key: keyof UsuarioForm; ph: string; type?: string }[]).map(f => (
                  <div key={f.key}>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">{f.label}</label>
                    <input type={f.type || 'text'} placeholder={f.ph}
                      value={form[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className={inputClass} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-[#4A7FA5] text-xs mb-1 block">Rol</label>
                  <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} className={inputClass}>
                    {roles.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleCrear} disabled={loading}
                className="mt-4 bg-[#2696F2] text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-[#1a7fd4] transition disabled:opacity-50">
                {loading ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </div>
          )}

          <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2D42] text-[#4A7FA5] text-xs">
                  <th className="text-left px-6 py-3">Usuario</th>
                  <th className="text-left px-6 py-3">Nombre</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-6 py-3">Rol</th>
                  <th className="text-left px-6 py-3">Estado</th>
                  <th className="text-left px-6 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={u.id} className={`border-b border-[#1E2D42]/50 hover:bg-[#1E2D42]/20 transition ${i % 2 === 0 ? '' : 'bg-[#0D1E35]/30'}`}>
                    <td className="px-6 py-3 text-[#2696F2] font-medium">{u.username}</td>
                    <td className="px-6 py-3 text-slate-300">{u.nombre}</td>
                    <td className="px-6 py-3 text-[#4A7FA5]">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${rolColor[u.rol] || 'bg-slate-400/10 text-slate-400'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${u.activo ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleToggle(u.id, u.activo)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition
                          ${u.activo
                            ? 'border-red-400/30 text-red-400 hover:bg-red-400/5'
                            : 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/5'}`}>
                        {u.activo ? <UserX size={12} /> : <UserCheck size={12} />}
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
