/**
 * Card de tipo de relatório
 */

import {
  Calendar,
  DollarSign,
  Percent,
  TrendingUp,
  Heart,
  Users,
  Package,
  Home,
  FileText,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RelatorioConfig } from '@/types/relatorio'

const iconMap: Record<string, LucideIcon> = {
  Calendar,
  DollarSign,
  Percent,
  TrendingUp,
  Heart,
  Users,
  Package,
  Home,
  FileText,
}

interface ReportTypeCardProps {
  config: RelatorioConfig
  selected: boolean
  onClick: () => void
}

export function ReportTypeCard({ config, selected, onClick }: ReportTypeCardProps) {
  const Icon = iconMap[config.icone] || FileText

  return (
    <button
      type="button"
      onClick={onClick}
      title={config.descricao}
      className={cn(
        'group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200',
        'hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02] hover:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'active:scale-[0.98]',
        selected
          ? 'border-primary bg-primary/10 shadow-md'
          : 'border-border bg-card'
      )}
    >
      <div
        className={cn(
          'p-3 rounded-xl mb-2 transition-all duration-200',
          'group-hover:scale-110',
          selected
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
        )}
      >
        <Icon size={24} />
      </div>
      <span
        className={cn(
          'text-sm font-medium text-center transition-colors',
          selected ? 'text-primary' : 'text-foreground'
        )}
      >
        {config.titulo}
      </span>
    </button>
  )
}
