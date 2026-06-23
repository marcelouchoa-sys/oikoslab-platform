import type { ReactNode } from 'react'

const colors = {
  blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  green:  'text-green-400 bg-green-500/10 border-green-500/20',
  cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
}

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string | number
  description?: string
  color?: keyof typeof colors
  onClick?: () => void
}

export function MetricCard({ icon, label, value, description, color = 'blue', onClick }: MetricCardProps) {
  const c = colors[color]
  return (
    <div
      onClick={onClick}
      className={`bg-[#111827] border border-white/10 rounded-2xl p-5 flex items-start gap-4 transition-colors ${onClick ? 'cursor-pointer hover:border-white/20' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${c}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
        <p className="text-xs font-medium text-gray-400">{label}</p>
        {description && <p className="text-xs text-gray-600 mt-1 truncate">{description}</p>}
      </div>
    </div>
  )
}
