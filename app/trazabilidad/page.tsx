'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Search, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'

export default function TrazabilidadPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [busqueda, setBusqueda] = useState('')
  const [lote, setLote] = useState<any>(null)
  const [avances, setAvances] = useState<any[]>([])
  const [controles, setControles] = useState<any[]>([])
  const [mermas, setMermas] = useState<any[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u))
  }, [])

  const handleBuscar = async () => {
    if (!busqueda.trim()) return
    setNotFound(false)
    setLote(null)

    const { data: l } = await supabase
      .from('lote')
      .select('*, orden_produccion(codigo, producto, cantidad_m, estado)')
      .eq('codigo', busqueda.trim())
      .single()

    if (!l) { setNotFound(true); return }
    setLote(l)

    const [{ data: av }, { data: cc }, { data: mr }] = await Promise.all([
      supabase.from('avance_produccion').select('*').eq('lote_id', l.id),
      supabase.from('control_calidad').select('*').eq('lote_id', l.id).order('fecha'),
      supabase.from('merma').select('*').eq('lote_id', l.id).order('fecha'),
    ])
    setAvances(av || [])
    setControles(cc || [])
    setMermas(mr || [])
  }

  const timeline = [
    ...avances.map(a => ({
      titulo: `Avance en ${a.estacion}`,
      detalle: `${a.metros_prod} metros producidos${a.observacion ? ' — ' + a.observacion : ''}`,
      fecha: a.hora_inicio || a.created_at,
      tipo: 'avance',
      icon: <TrendingUp size={14} />,
      color: 'border-[#2696F2] text-[#2696F2]',
      bg: 'bg-[#2696F2]/10',
    })),
    ...controles.map(c => ({
      titulo: `Control de calidad — ${c.punto_control}`,
      detalle: c.resultado + (c.defectos ? `: ${c.defectos}` : ''),
      fecha: c.fecha,
      tipo: 'calidad',
      icon: c.resultado === 'APROBADO' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />,
      color: c.resultado === 'APROBADO' ? 'border-emerald-400 text-emerald-400' : 'border-red-400 text-red-400',
      bg: c.resultado === 'APROBADO' ? 'bg-emerald-400/10' : 'bg-red-400/10',
    })),
    ...mermas.map(m => ({
      titulo: `Merma registrada — ${m.estacion}`,
      detalle: `${m.cantidad_kg} kg — ${m.porcentaje}%`,
      fecha: m.fecha,
      tipo: 'merma',
      icon: <AlertTriangle size={14} />,
      color: 'border-amber-400 text-amber-400',
      bg: 'bg-amber-400/10',
    })),
  ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0A1628] border-b border-[#1E2D42] px-8 py-4">
          <h1 className="text-lg font-semibold">Trazabilidad de Lote</h1>
          <p className="text-[#4A7FA5] text-xs mt-0.5">CU-07 — Supervisor / Gerente</p>
        </header>

        <div className="p-6 space-y-5">
          {/* Buscador */}
          <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-4 flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-[#070D1A] border border-[#2696F2]/40 rounded-lg px-4">
              <Search size={15} className="text-[#4A7FA5]" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                placeholder="Código de lote — ej: LT-2024-088"
                className="flex-1 bg-transparent py-3 text-white text-sm outline-none"
              />
            </div>
            <button onClick={handleBuscar}
              className="bg-[#2696F2] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#1a7fd4] transition text-sm">
              Buscar
            </button>
          </div>

          {notFound && (
            <div className="bg-red-400/5 border border-red-400/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={15} />
              No se encontró ningún lote con el código "{busqueda}"
            </div>
          )}

          {lote && (
            <>
              {/* Info */}
              <div className="bg-[#0A1628] border border-[#2696F2]/20 rounded-xl p-5 grid grid-cols-5 gap-4">
                {[
                  { lbl: 'Lote', val: lote.codigo },
                  { lbl: 'Orden', val: lote.orden_produccion?.codigo },
                  { lbl: 'Producto', val: lote.orden_produccion?.producto },
                  { lbl: 'Cantidad', val: `${lote.orden_produccion?.cantidad_m} m` },
                  { lbl: 'Etapa actual', val: lote.etapa_actual },
                ].map(d => (
                  <div key={d.lbl}>
                    <p className="text-[#4A7FA5] text-xs mb-1">{d.lbl}</p>
                    <p className="text-white text-sm font-semibold">{d.val || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Progreso */}
              <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#4A7FA5]">Avance total</span>
                  <span className="text-[#2696F2] font-semibold">{lote.avance_pct || 0}%</span>
                </div>
                <div className="w-full bg-[#1E2D42] rounded-full h-2">
                  <div className="bg-[#2696F2] h-2 rounded-full transition-all" style={{ width: `${lote.avance_pct || 0}%` }} />
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5">
                <p className="text-sm font-semibold mb-5">Historial completo</p>
                {timeline.length === 0 ? (
                  <p className="text-[#4A7FA5] text-sm">Sin eventos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {timeline.map((ev, i) => (
                      <div key={i} className={`flex gap-4 p-3 rounded-lg border-l-2 ${ev.color} ${ev.bg}`}>
                        <div className={`mt-0.5 ${ev.color}`}>{ev.icon}</div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{ev.titulo}</p>
                          <p className="text-[#4A7FA5] text-xs mt-0.5">{ev.detalle}</p>
                          <p className="text-slate-600 text-xs mt-1">
                            {ev.fecha ? new Date(ev.fecha).toLocaleString('es-PE') : '—'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full h-fit ${ev.bg} ${ev.color}`}>
                          {ev.tipo}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}