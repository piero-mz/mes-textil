'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Usuario, Merma } from '@/app/types'
import { BarChart2, CheckCircle2, AlertTriangle, Package, ClipboardList, TrendingDown } from 'lucide-react'

type Stats = {
  totalOrdenes: number
  totalLotes: number
  aprobados: number
  rechazados: number
  totalAvances: number
  totalMerma: number
}

export default function ReportesPage() {
  const router = useRouter()
  const [user, setUser] = useState<Usuario | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalOrdenes: 0, totalLotes: 0, aprobados: 0,
    rechazados: 0, totalAvances: 0, totalMerma: 0,
  })

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u) as Usuario)
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const [
      { count: totalOrdenes },
      { count: totalLotes },
      { count: aprobados },
      { count: rechazados },
      { count: totalAvances },
      { data: mermas },
    ] = await Promise.all([
      supabase.from('orden_produccion').select('*', { count: 'exact', head: true }),
      supabase.from('lote').select('*', { count: 'exact', head: true }),
      supabase.from('control_calidad').select('*', { count: 'exact', head: true }).eq('resultado', 'APROBADO'),
      supabase.from('control_calidad').select('*', { count: 'exact', head: true }).eq('resultado', 'RECHAZADO'),
      supabase.from('avance_produccion').select('*', { count: 'exact', head: true }),
      supabase.from('merma').select('cantidad_kg'),
    ])
    const totalMerma = ((mermas as Pick<Merma, 'cantidad_kg'>[]) || []).reduce((acc, m) => acc + (m.cantidad_kg || 0), 0)
    setStats({
      totalOrdenes: totalOrdenes || 0,
      totalLotes: totalLotes || 0,
      aprobados: aprobados || 0,
      rechazados: rechazados || 0,
      totalAvances: totalAvances || 0,
      totalMerma: parseFloat(totalMerma.toFixed(2)),
    })
  }

  const cards = [
    { label: 'Total Órdenes',       value: stats.totalOrdenes, icon: ClipboardList, color: 'text-[#2696F2] border-[#2696F2]/30 bg-[#2696F2]/5' },
    { label: 'Total Lotes',          value: stats.totalLotes,   icon: Package,       color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
    { label: 'Controles Aprobados',  value: stats.aprobados,    icon: CheckCircle2,  color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
    { label: 'Controles Rechazados', value: stats.rechazados,   icon: AlertTriangle, color: 'text-red-400 border-red-400/30 bg-red-400/5' },
    { label: 'Registros de Avance',  value: stats.totalAvances, icon: BarChart2,     color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
    { label: 'Merma Total (kg)',      value: stats.totalMerma,   icon: TrendingDown,  color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
  ]

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0A1628] border-b border-[#1E2D42] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Reportes de Producción y Calidad</h1>
            <p className="text-[#4A7FA5] text-xs mt-0.5">CU-08 · CU-09</p>
          </div>
          <span className="text-[#4A7FA5] text-xs">
            {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </header>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {cards.map(c => {
              const Icon = c.icon
              return (
                <div key={c.label} className={`rounded-xl p-5 border ${c.color}`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[#4A7FA5] text-xs">{c.label}</p>
                    <Icon size={16} className="opacity-60" />
                  </div>
                  <p className="text-white text-3xl font-bold">{c.value}</p>
                </div>
              )
            })}
          </div>

          <div className="bg-[#0A1628] border border-[#1E2D42] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E2D42]">
              <p className="text-sm font-semibold">Resumen por Subsistema</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2D42] text-[#4A7FA5] text-xs">
                  <th className="text-left px-6 py-3">Subsistema</th>
                  <th className="text-left px-6 py-3">Casos de uso</th>
                  <th className="text-left px-6 py-3">Registros</th>
                  <th className="text-left px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ss: 'SS-01 Planificación',  cu: 'CU-02, CU-03', reg: `${stats.totalOrdenes} órdenes, ${stats.totalLotes} lotes` },
                  { ss: 'SS-02 Ejecución',      cu: 'CU-04, CU-05', reg: `${stats.totalAvances} avances, ${stats.totalMerma} kg merma` },
                  { ss: 'SS-03 Calidad',        cu: 'CU-06, CU-07', reg: `${stats.aprobados} aprobados, ${stats.rechazados} rechazados` },
                  { ss: 'SS-04 Reportes',       cu: 'CU-08, CU-09', reg: 'Dashboard + Reportes' },
                  { ss: 'SS-05 Administración', cu: 'CU-01, CU-10', reg: 'Login + Usuarios' },
                ].map((row, i) => (
                  <tr key={row.ss} className={`border-b border-[#1E2D42]/50 hover:bg-[#1E2D42]/20 transition ${i % 2 === 0 ? '' : 'bg-[#0D1E35]/30'}`}>
                    <td className="px-6 py-3 text-[#2696F2] font-medium">{row.ss}</td>
                    <td className="px-6 py-3 text-[#4A7FA5]">{row.cu}</td>
                    <td className="px-6 py-3 text-slate-300">{row.reg}</td>
                    <td className="px-6 py-3">
                      <span className="bg-emerald-400/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full">Operativo</span>
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
