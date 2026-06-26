'use client'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Package, CheckCircle,
  Search, BarChart2, Settings, LogOut
} from 'lucide-react'
import { Usuario } from '@/app/types'

const navItems = [
  { label: 'Dashboard',       href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Órdenes',         href: '/ordenes',      icon: ClipboardList   },
  { label: 'Lotes',           href: '/lotes',        icon: Package         },
  { label: 'Control Calidad', href: '/calidad',      icon: CheckCircle     },
  { label: 'Trazabilidad',    href: '/trazabilidad', icon: Search          },
  { label: 'Reportes',        href: '/reportes',     icon: BarChart2       },
  { label: 'Administración',  href: '/admin',        icon: Settings        },
]

export default function Sidebar({ user }: { user: Usuario | null }) {
  const router   = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  return (
    <aside className="w-56 bg-[#0A1628] flex flex-col border-r border-[#1E2D42]">
      <div className="px-5 py-5 border-b border-[#1E2D42]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2696F2] flex items-center justify-center">
            <span className="text-white text-xs font-bold">TdV</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-none">MES</p>
            <p className="text-[#4A7FA5] text-[10px] leading-none mt-0.5">Textil del Valle</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <button key={href} onClick={() => router.push(href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${active
                  ? 'bg-[#2696F2]/15 text-[#2696F2]'
                  : 'text-[#4A7FA5] hover:text-white hover:bg-[#1E2D42]'}`}>
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              <span className={active ? 'font-semibold' : ''}>{label}</span>
              {active && <div className="ml-auto w-1 h-4 rounded-full bg-[#2696F2]" />}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-[#1E2D42] space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[#2696F2]/20 flex items-center justify-center">
            <span className="text-[#2696F2] text-xs font-bold">
              {user?.nombre?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.nombre}</p>
            <p className="text-[#4A7FA5] text-[10px] truncate">{user?.rol}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#4A7FA5] hover:text-red-400 hover:bg-red-400/5 text-sm transition-all">
          <LogOut size={15} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
