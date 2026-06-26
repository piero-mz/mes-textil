'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Usuario, Lote, ControlCalidad } from '@/app/types'

const puntosControl = ['Tejido', 'Teñido', 'Acabado', 'Despacho']

type CalidadForm = { lote_id: string; punto_control: string; resultado: string; defectos: string; acciones: string }

export default function CalidadPage() {
  const router = useRouter()
  const [user, setUser] = useState<Usuario | null>(null)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [controles, setControles] = useState<ControlCalidad[]>([])
  const [form, setForm] = useState<CalidadForm>({ lote_id: '', punto_control: 'Tejido', resultado: 'APROBADO', defectos: '', acciones: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u) as Usuario)
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: l } = await supabase.from('lote').select('id, codigo')
    const { data: c } = await supabase.from('control_calidad').select('*, lote(codigo)').order('fecha', { ascending: false })
    setLotes((l as Lote[]) || [])
    setControles((c as ControlCalidad[]) || [])
  }

  const handleSubmit = async () => {
    if (!form.lote_id) return
    setLoading(true)
    await supabase.from('control_calidad').insert([{
      lote_id: parseInt(form.lote_id),
      punto_control: form.punto_control,
      resultado: form.resultado,
      defectos: form.defectos,
      acciones: form.acciones,
      coordinador: user?.id,
    }])
    setForm({ lote_id: '', punto_control: 'Tejido', resultado: 'APROBADO', defectos: '', acciones: '' })
    setLoading(false)
    fetchData()
  }

  const inputClass = "w-full bg-[#070D1A] border border-[#1E2D42] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#2696F2] transition"

  const resultadoBadge: Record<string, string> = {
    'APROBADO':  'bg-emerald-400/10 text-emerald-400 border-emerald-400',
    'RECHAZADO': 'bg-red-400/10 text-red-400 border-red-400',
    'OBSERVADO': 'bg-amber-400/10 text-amber-400 border-amber-400',
  }

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0A1628] border-b border-[#1E2D42] px-8 py-4">
          <h1 className="text-lg font-semibold">Control de Calidad</h1>
          <p className="text-[#4A7FA5] text-xs mt-0.5">CU-06 — Coordinador de Calidad</p>
        </header>

        <div className="p-6 grid grid-cols-2 gap-5">
          <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold">Registrar Control</p>
            <div>
              <label className="text-[#4A7FA5] text-xs mb-1 block">Lote</label>
              <select value={form.lote_id} onChange={e => setForm({ ...form, lote_id: e.target.value })} className={inputClass}>
                <option value="">Seleccionar lote...</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[#4A7FA5] text-xs mb-1 block">Punto de control</label>
              <select value={form.punto_control} onChange={e => setForm({ ...form, punto_control: e.target.value })} className={inputClass}>
                {puntosControl.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[#4A7FA5] text-xs mb-2 block">Resultado</label>
              <div className="flex gap-2">
                {(['APROBADO', 'RECHAZADO', 'OBSERVADO'] as const).map(r => (
                  <button key={r} onClick={() => setForm({ ...form, resultado: r })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition
                      ${form.resultado === r ? resultadoBadge[r] : 'border-[#1E2D42] text-[#4A7FA5] hover:bg-[#1E2D42]'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {([
              { label: 'Defectos encontrados', key: 'defectos', ph: 'Describir defectos...' },
              { label: 'Acciones correctivas', key: 'acciones', ph: 'Acciones a tomar...' },
            ] as { label: string; key: keyof CalidadForm; ph: string }[]).map(f => (
              <div key={f.key}>
                <label className="text-[#4A7FA5] text-xs mb-1 block">{f.label}</label>
                <textarea placeholder={f.ph} rows={2}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className={inputClass + ' resize-none'} />
              </div>
            ))}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-[#2696F2] text-white text-sm font-semibold py-3 rounded-lg hover:bg-[#1a7fd4] transition disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Control de Calidad'}
            </button>
          </div>

          <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5">
            <p className="text-sm font-semibold mb-4">Historial de Controles</p>
            <div className="space-y-3">
              {controles.length === 0 ? (
                <p className="text-[#4A7FA5] text-sm">Sin controles registrados</p>
              ) : controles.map(c => (
                <div key={c.id} className="bg-[#0D1E35] border border-[#1E2D42] rounded-lg p-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[#2696F2] text-sm font-medium">{(c.lote as any)?.codigo}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${resultadoBadge[c.resultado]}`}>
                      {c.resultado}
                    </span>
                  </div>
                  <p className="text-[#4A7FA5] text-xs">{c.punto_control} — {c.fecha ? new Date(c.fecha).toLocaleDateString('es-PE') : '—'}</p>
                  {c.defectos && <p className="text-slate-500 text-xs mt-1">{c.defectos}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
