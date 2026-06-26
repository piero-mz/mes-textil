'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Usuario, OrdenProduccion, AvanceProduccion, Merma, ControlCalidad } from '@/app/types'
import {
  TrendingUp, Package, AlertTriangle, CheckCircle2,
  Activity, ClipboardList, LucideIcon
} from 'lucide-react'

const ESTACIONES = ['Tejido', 'Teñido', 'Acabado', 'Control', 'Despacho']

type KpiCard = {
  label: string
  value: number | string
  sub: string
  icon: LucideIcon
  color: string
}

type Alert = { msg: string; type: 'warning' | 'error' | 'success' }

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<Usuario | null>(null)
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([])
  const [kpis, setKpis] = useState({ ordenes: 0, lotes: 0, merma: 0, eficiencia: 0 })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [barData, setBarData] = useState<{ label: string; val: number }[]>(
    ESTACIONES.map(e => ({ label: e, val: 0 }))
  )

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u) as Usuario)
    fetchData()
  }, [])

  const fetchData = async () => {
    const [
      { data: ords },
      { count: totalOrdenes },
      { count: totalLotes },
      { data: avances },
      { data: mermaData },
      { data: controles },
    ] = await Promise.all([
      supabase.from('orden_produccion').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('orden_produccion').select('*', { count: 'exact', head: true }),
      supabase.from('lote').select('*', { count: 'exact', head: true }),
      supabase.from('avance_produccion').select('estacion, metros_prod'),
      supabase.from('merma').select('cantidad_kg, porcentaje'),
      supabase.from('control_calidad').select('resultado, lote(codigo)').order('fecha', { ascending: false }).limit(5),
    ])

    setOrdenes((ords as OrdenProduccion[]) || [])

    const totals: Record<string, number> = {}
    ;((avances as Pick<AvanceProduccion, 'estacion' | 'metros_prod'>[]) || []).forEach(a => {
      totals[a.estacion] = (totals[a.estacion] || 0) + (a.metros_prod || 0)
    })
    const max = Math.max(...Object.values(totals), 1)
    setBarData(ESTACIONES.map(e => ({
      label: e,
      val: Math.round(((totals[e] || 0) / max) * 100)
    })))

    const totalMerma = ((mermaData as Pick<Merma, 'cantidad_kg'>[]) || [])
      .reduce((acc, m) => acc + (m.cantidad_kg || 0), 0)

    const { data: lotesData } = await supabase.from('lote').select('avance_pct')
    const eficiencia = lotesData && lotesData.length > 0
      ? Math.round(lotesData.reduce((acc, l) => acc + (l.avance_pct || 0), 0) / lotesData.length)
      : 0

    setKpis({
      ordenes: totalOrdenes || 0,
      lotes: totalLotes || 0,
      merma: parseFloat(totalMerma.toFixed(1)),
      eficiencia,
    })

    const alertasGeneradas: Alert[] = []
    ;((controles as any[]) || []).forEach(c => {
      if (c.resultado === 'RECHAZADO')
        alertasGeneradas.push({ msg: `Lote ${c.lote?.codigo} rechazado en control de calidad`, type: 'error' })
      else if (c.resultado === 'OBSERVADO')
        alertasGeneradas.push({ msg: `Lote ${c.lote?.codigo} requiere revisión`, type: 'warning' })
      else if (c.resultado === 'APROBADO')
        alertasGeneradas.push({ msg: `Lote ${c.lote?.codigo} aprobado en control de calidad`, type: 'success' })
    })
    ;((mermaData as Pick<Merma, 'porcentaje'>[]) || []).forEach(m => {
      if (m.porcentaje > 5)
        alertasGeneradas.push({ msg: `Merma elevada: ${m.porcentaje}% — supera límite del 5%`, type: 'warning' })
    })
    setAlerts(alertasGeneradas.slice(0, 5))
  }

  const kpiCards: KpiCard[] = [
    { label: 'Órdenes Activas',   value: kpis.ordenes,          sub: 'Total en sistema',    icon: ClipboardList, color: 'text-[#2696F2] border-[#2696F2]/30 bg-[#2696F2]/5' },
    { label: 'Eficiencia Global', value: `${kpis.eficiencia}%`, sub: 'Promedio de lotes',   icon: TrendingUp,    color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
    { label: 'Merma Total (kg)',  value: `${kpis.merma} kg`,    sub: 'Acumulado total',     icon: AlertTriangle, color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
    { label: 'Lotes Activos',     value: kpis.lotes,            sub: 'Total en sistema',    icon: Package,       color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
  ]

  const alertStyle: Record<Alert['type'], string> = {
    warning: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
    error:   'border-red-500/30 bg-red-500/5 text-red-400',
    success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  }

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0A1628] border-b border-[#1E2D42] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Dashboard de Producción</h1>
            <p className="text-[#4A7FA5] text-xs mt-0.5">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">Sistema operativo</span>
          </div>
        </header>

        <div className="p-6 space-y-5 overflow-auto">
          <div className="grid grid-cols-4 gap-4">
            {kpiCards.map(k => {
              const Icon = k.icon
              return (
                <div key={k.label} className={`rounded-xl p-5 border ${k.color}`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[#4A7FA5] text-xs">{k.label}</p>
                    <Icon size={16} className="opacity-60" />
                  </div>
                  <p className="text-white text-3xl font-bold">{k.value}</p>
                  <p className="text-xs mt-2 opacity-70">{k.sub}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5">
              <p className="text-sm font-semibold mb-1">Producción por Estación</p>
              <p className="text-[#4A7FA5] text-xs mb-5">Metros producidos — datos en tiempo real</p>
              <div className="flex items-end gap-5 h-36">
                {barData.map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[#2696F2] text-xs font-semibold">{b.val > 0 ? `${b.val}%` : '—'}</span>
                    <div className="w-full rounded-t-md bg-[#1E2D42] relative" style={{ height: '120px' }}>
                      <div className="absolute bottom-0 w-full bg-[#2696F2] rounded-t-md transition-all duration-700"
                        style={{ height: `${b.val}%`, opacity: b.val > 0 ? 1 : 0.2 }} />
                    </div>
                    <span className="text-[#4A7FA5] text-xs">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5">
              <p className="text-sm font-semibold mb-4">Últimas Órdenes</p>
              {ordenes.length === 0 ? (
                <p className="text-[#4A7FA5] text-sm">Sin órdenes aún</p>
              ) : (
                <div className="space-y-2">
                  {ordenes.map(o => (
                    <div key={o.id}
                      className="bg-[#0D1E35] border border-[#1E2D42] rounded-lg px-3 py-2.5 cursor-pointer hover:border-[#2696F2]/40 transition"
                      onClick={() => router.push('/ordenes')}>
                      <p className="text-[#2696F2] text-xs font-semibold">{o.codigo}</p>
                      <p className="text-[#4A7FA5] text-xs mt-0.5">{o.producto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl p-5">
              <p className="text-sm font-semibold mb-4">Alertas del Sistema</p>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className={`border rounded-lg px-4 py-3 text-xs flex items-center gap-2 ${alertStyle[a.type]}`}>
                    {a.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {a.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
