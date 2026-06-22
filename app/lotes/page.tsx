'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Plus, X } from 'lucide-react'

const etapas = ['Tejido', 'Teñido', 'Acabado', 'Control', 'Despacho']

export default function LotesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [lotes, setLotes] = useState<any[]>([])
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [form, setForm] = useState({ codigo: '', orden_id: '', etapa_actual: 'Tejido' })
  const [avanceForm, setAvanceForm] = useState({ lote_id: '', estacion: 'Tejido', metros_prod: '', observacion: '' })
  const [mermaForm, setMermaForm] = useState({ lote_id: '', estacion: 'Tejido', cantidad_kg: '', porcentaje: '' })
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'avance' | 'merma'>('avance')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u))
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: l } = await supabase.from('lote').select('*, orden_produccion(codigo, producto)').order('created_at', { ascending: false })
    const { data: o } = await supabase.from('orden_produccion').select('id, codigo, producto')
    setLotes(l || [])
    setOrdenes(o || [])
  }

  const handleCrearLote = async () => {
    if (!form.codigo || !form.orden_id) return
    setLoading(true)
    await supabase.from('lote').insert([{ ...form, orden_id: parseInt(form.orden_id) }])
    setForm({ codigo: '', orden_id: '', etapa_actual: 'Tejido' })
    setShowForm(false)
    setLoading(false)
    fetchData()
  }

  const handleAvance = async () => {
    if (!avanceForm.lote_id || !avanceForm.metros_prod) return
    setLoading(true)
    await supabase.from('avance_produccion').insert([{
      lote_id: parseInt(avanceForm.lote_id),
      estacion: avanceForm.estacion,
      metros_prod: parseFloat(avanceForm.metros_prod),
      observacion: avanceForm.observacion,
      operario: user?.id
    }])
    const lote = lotes.find(l => l.id === parseInt(avanceForm.lote_id))
    if (lote?.orden_id) {
      const { data: orden } = await supabase.from('orden_produccion').select('cantidad_m').eq('id', lote.orden_id).single()
      if (orden?.cantidad_m) {
        const pct = Math.min(100, Math.round((parseFloat(avanceForm.metros_prod) / orden.cantidad_m) * 100))
        await supabase.from('lote').update({ avance_pct: pct, etapa_actual: avanceForm.estacion }).eq('id', avanceForm.lote_id)
      }
    }
    setAvanceForm({ lote_id: '', estacion: 'Tejido', metros_prod: '', observacion: '' })
    setLoading(false)
    fetchData()
  }

  const handleMerma = async () => {
    if (!mermaForm.lote_id || !mermaForm.cantidad_kg) return
    setLoading(true)
    await supabase.from('merma').insert([{
      lote_id: parseInt(mermaForm.lote_id),
      estacion: mermaForm.estacion,
      cantidad_kg: parseFloat(mermaForm.cantidad_kg),
      porcentaje: parseFloat(mermaForm.porcentaje || '0'),
      operario: user?.id
    }])
    setMermaForm({ lote_id: '', estacion: 'Tejido', cantidad_kg: '', porcentaje: '' })
    setLoading(false)
    fetchData()
  }

  const inputClass = "w-full bg-[#070D1A] border border-[#1E2D42] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#2696F2] transition"
  const selectClass = "w-full bg-[#070D1A] border border-[#1E2D42] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#2696F2] transition"

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0A1628] border-b border-[#1E2D42] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Gestión de Lotes</h1>
            <p className="text-[#4A7FA5] text-xs mt-0.5">CU-03 · CU-04 · CU-05</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#2696F2] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1a7fd4] transition">
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Cancelar' : 'Nuevo Lote'}
          </button>
        </header>

        <div className="p-6 space-y-5">
          {showForm && (
            <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-6">
              <p className="text-sm font-semibold mb-4">Asignar Lote a Orden — CU-03</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[#4A7FA5] text-xs mb-1 block">Código de lote</label>
                  <input placeholder="LT-2024-088" value={form.codigo}
                    onChange={e => setForm({ ...form, codigo: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className="text-[#4A7FA5] text-xs mb-1 block">Orden de producción</label>
                  <select value={form.orden_id} onChange={e => setForm({ ...form, orden_id: e.target.value })}
                    className={selectClass}>
                    <option value="">Seleccionar...</option>
                    {ordenes.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.producto}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[#4A7FA5] text-xs mb-1 block">Etapa inicial</label>
                  <select value={form.etapa_actual} onChange={e => setForm({ ...form, etapa_actual: e.target.value })}
                    className={selectClass}>
                    {etapas.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleCrearLote} disabled={loading}
                className="mt-4 bg-[#2696F2] text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-[#1a7fd4] transition disabled:opacity-50">
                {loading ? 'Guardando...' : 'Crear Lote'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            {/* Lista lotes */}
            <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5">
              <p className="text-sm font-semibold mb-4">Lotes Activos</p>
              <div className="space-y-3">
                {lotes.length === 0 ? (
                  <p className="text-[#4A7FA5] text-sm">Sin lotes registrados</p>
                ) : lotes.map(l => (
                  <div key={l.id} className="bg-[#0D1E35] border border-[#1E2D42] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[#2696F2] font-semibold text-sm">{l.codigo}</p>
                      <span className="text-xs text-[#4A7FA5] bg-[#1E2D42] px-2 py-0.5 rounded-full">{l.etapa_actual}</span>
                    </div>
                    <p className="text-[#4A7FA5] text-xs mb-3">{l.orden_produccion?.codigo} — {l.orden_produccion?.producto}</p>
                    <div className="w-full bg-[#1E2D42] rounded-full h-1.5">
                      <div className="bg-[#2696F2] h-1.5 rounded-full transition-all" style={{ width: `${l.avance_pct || 0}%` }} />
                    </div>
                    <p className="text-[#2696F2] text-xs mt-1">{l.avance_pct || 0}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel registro */}
            <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5">
              <div className="flex gap-1 mb-5 bg-[#070D1A] rounded-lg p-1">
                <button onClick={() => setTab('avance')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition ${tab === 'avance' ? 'bg-[#2696F2] text-white' : 'text-[#4A7FA5] hover:text-white'}`}>
                  Avance — CU-04
                </button>
                <button onClick={() => setTab('merma')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition ${tab === 'merma' ? 'bg-amber-500 text-white' : 'text-[#4A7FA5] hover:text-white'}`}>
                  Merma — CU-05
                </button>
              </div>

              {tab === 'avance' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">Lote</label>
                    <select value={avanceForm.lote_id} onChange={e => setAvanceForm({ ...avanceForm, lote_id: e.target.value })}
                      className={selectClass}>
                      <option value="">Seleccionar lote...</option>
                      {lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">Estación</label>
                    <select value={avanceForm.estacion} onChange={e => setAvanceForm({ ...avanceForm, estacion: e.target.value })}
                      className={selectClass}>
                      {etapas.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">Metros producidos</label>
                    <input placeholder="280" value={avanceForm.metros_prod}
                      onChange={e => setAvanceForm({ ...avanceForm, metros_prod: e.target.value })}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">Observaciones</label>
                    <input placeholder="Sin incidencias..." value={avanceForm.observacion}
                      onChange={e => setAvanceForm({ ...avanceForm, observacion: e.target.value })}
                      className={inputClass} />
                  </div>
                  <button onClick={handleAvance} disabled={loading}
                    className="w-full bg-[#2696F2] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#1a7fd4] transition disabled:opacity-50">
                    {loading ? 'Guardando...' : 'Guardar Avance'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">Lote</label>
                    <select value={mermaForm.lote_id} onChange={e => setMermaForm({ ...mermaForm, lote_id: e.target.value })}
                      className={selectClass}>
                      <option value="">Seleccionar lote...</option>
                      {lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">Estación</label>
                    <select value={mermaForm.estacion} onChange={e => setMermaForm({ ...mermaForm, estacion: e.target.value })}
                      className={selectClass}>
                      {etapas.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">Cantidad (kg)</label>
                    <input placeholder="12.5" value={mermaForm.cantidad_kg}
                      onChange={e => setMermaForm({ ...mermaForm, cantidad_kg: e.target.value })}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[#4A7FA5] text-xs mb-1 block">Porcentaje (%)</label>
                    <input placeholder="2.3" value={mermaForm.porcentaje}
                      onChange={e => setMermaForm({ ...mermaForm, porcentaje: e.target.value })}
                      className={inputClass} />
                  </div>
                  <button onClick={handleMerma} disabled={loading}
                    className="w-full bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-amber-600 transition disabled:opacity-50">
                    {loading ? 'Guardando...' : 'Registrar Merma'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}