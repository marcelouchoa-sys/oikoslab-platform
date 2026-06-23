'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, GitBranch, Code2, Database,
  TrendingUp, BarChart2, BookOpen, Users, Settings,
  ChevronLeft, ChevronRight, FlaskConical,
} from 'lucide-react'

export type LabSection =
  | 'visao-geral' | 'canvas' | 'modelos' | 'dados'
  | 'cenarios' | 'resultados' | 'notas' | 'equipe' | 'configuracoes'

const NAV: { id: LabSection; label: string; Icon: React.ElementType }[] = [
  { id: 'visao-geral',   label: 'Visão Geral',      Icon: LayoutDashboard },
  { id: 'canvas',        label: 'Canvas Econômico',  Icon: GitBranch },
  { id: 'modelos',       label: 'Modelos',           Icon: Code2 },
  { id: 'dados',         label: 'Dados',             Icon: Database },
  { id: 'cenarios',      label: 'Cenários',          Icon: TrendingUp },
  { id: 'resultados',    label: 'Resultados',        Icon: BarChart2 },
  { id: 'notas',         label: 'Notas',             Icon: BookOpen },
  { id: 'equipe',        label: 'Equipe',            Icon: Users },
  { id: 'configuracoes', label: 'Configurações',     Icon: Settings },
]

interface ProjectSidebarProps {
  active: LabSection
  onChange: (s: LabSection) => void
  projectId: string
}

export function ProjectSidebar({ active, onChange }: ProjectSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`relative h-screen bg-[#0B0F19] border-r border-white/10 flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-white/10">
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
          <FlaskConical size={14} className="text-purple-300" />
        </div>
        {!collapsed && (
          <span className="text-[11px] font-bold tracking-widest text-white/60 uppercase select-none">
            OikosLab
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              active === id
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}
      </nav>

      {/* Back */}
      <div className="p-2 border-t border-white/10">
        <Link
          href="/projetos"
          title={collapsed ? 'Meus Projetos' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all"
        >
          <ChevronLeft size={14} className="flex-shrink-0" />
          {!collapsed && <span>Meus Projetos</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition z-20"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  )
}
