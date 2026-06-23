export interface ActivityItem {
  time: string
  action: string
  type: 'save' | 'calc' | 'create' | 'open'
}

const typeIcon: Record<ActivityItem['type'], string> = {
  save: '💾', calc: '⚡', create: '✨', open: '📂',
}

const DEFAULT: ActivityItem[] = [
  { time: 'Agora', action: 'Projeto aberto', type: 'open' },
]

export function ActivityFeed({ items = DEFAULT }: { items?: ActivityItem[] }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
          <span className="text-sm w-5 text-center flex-shrink-0">{typeIcon[item.type]}</span>
          <p className="flex-1 text-xs text-gray-400">{item.action}</p>
          <p className="text-xs text-gray-600 flex-shrink-0">{item.time}</p>
        </div>
      ))}
      <p className="text-xs text-gray-600 text-center pt-4">Histórico completo em breve</p>
    </div>
  )
}
