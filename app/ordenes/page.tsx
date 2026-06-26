'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Usuario, OrdenProduccion } from '@/app/types'
import { Plus, X } from 'lucide-react'

const estadoColor: Record<string, string> = {
  'Pendiente':       'text-slate-400 bg-slate-400/10',
  'En proceso':      'text-blue-400 bg-blue-400/10',
  'Control calidad': 'text-amber-400 bg-amber-400/10',
  'Completado':      'text-emerald-400 bg-emerald-400/10',
}

type OrdenForm = {
  codigo: string
  producto: string
  cantidad_m: string
  fecha_inicio: string
  estado: string
}

export default function OrdenesPage() {
  const router = useRouter()
  const [user, setUser] = useState<Usuario | null>(null)
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([])
  const [form, setForm] = useState<OrdenForm>({ codigo: '', producto: '', cantidad_m: '', fecha_inicio: '', estado: 'Pendiente' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u) as Usuario)
    fetchOrdenes()
  }, [])

  const fetchOrdenes = async () => {
    const { data } = await supabase.from('orden_produccion').select('*').order('created_at', { ascending: false })
    setOrdenes((data as OrdenProduccion[]) || [])
  }

  const handleSubmit = async () => {
    if (!form.codigo || !form.producto) return
    setLoading(true)
    await supabase.from('orden_produccion').insert([{
      codigo: form.codigo,
      producto: form.producto,
      cantidad_m: parseFloat(form.cantidad_m),
      fecha_inicio: form.fecha_inicio,
      estado: form.estado,
      responsable: user?.id,
    }])
    setForm({ codigo: '', producto: '', cantidad_m: '', fecha_inicio: '', estado: 'Pendiente' })
    setShowForm(false)
    setLoading(false)
    fetchOrdenes()
  }

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0A1628] border-b border-[#1E2D42] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Órdenes de Producción</h1>
            <p className="text-[#4A7FA5] text-xs mt-0.5">CU-02 — Gestión de órdenes</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#2696F2] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1a7fd4] transition">
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Cancelar' : 'Nueva Orden'}
          </button>
        </header>

        <div className="p-6 space-y-5">
          {showForm && (
            <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-6">
              <p className="text-sm font-semibold mb-4">Registrar Nueva Orden</p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { label: 'Código', key: 'codigo', ph: 'OP-2024-042' },
                  { label: 'Producto / Material', key: 'producto', ph: 'Tela Denim 14oz' },
                  { label: 'Cantidad (metros)', key: 'cantidad_m', ph: '1200' },
                  { label: 'Fecha de inicio', key: 'fecha_inicio', ph: '', type: 'date' },
                ] as { label: string; key: keyof OrdenForm; ph: string; type?: string }[]).map(f => (
                  <div key={f.key}>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">{f.label}</label>
                    <input type={f.type || 'text'} placeholder={f.ph}
                      value={form[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full bg-[#070D1A] border border-[#1E2D42] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#2696F2] transition" />
                  </div>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="mt-4 bg-[#2696F2] text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-[#1a7fd4] transition disabled:opacity-50">
                {loading ? 'Guardando...' : 'Registrar Orden'}
              </button>
            </div>
          )}

          <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2D42] text-[#4A7FA5] text-xs">
                  <th className="text-left px-6 py-3">Orden</th>
                  <th className="text-left px-6 py-3">Producto</th>
                  <th className="text-left px-6 py-3">Cantidad (m)</th>
                  <th className="text-left px-6 py-3">Fecha inicio</th>
                  <th className="text-left px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-[#4A7FA5] py-10">Sin órdenes registradas</td></tr>
                ) : ordenes.map((o, i) => (
                  <tr key={o.id} className={`border-b border-[#1E2D42]/50 hover:bg-[#1E2D42]/20 transition ${i % 2 === 0 ? '' : 'bg-[#0D1E35]/30'}`}>
                    <td className="px-6 py-3 text-[#2696F2] font-medium">{o.codigo}</td>
                    <td className="px-6 py-3 text-slate-300">{o.producto}</td>
                    <td className="px-6 py-3 text-slate-300">{o.cantidad_m}</td>
                    <td className="px-6 py-3 text-slate-400">{o.fecha_inicio || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoColor[o.estado] || estadoColor['Pendiente']}`}>
                        {o.estado}
                      </span>
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
