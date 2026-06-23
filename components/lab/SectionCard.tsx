import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
  className?: string
  noPad?: boolean
}

export function SectionCard({ title, description, children, action, className = '', noPad }: SectionCardProps) {
  return (
    <div className={`bg-[#111827] border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className={noPad ? '' : 'p-6'}>{children}</div>
    </div>
  )
}
