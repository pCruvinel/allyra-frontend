/**
 * StatusIndicator Component
 * Indicador visual de status para metas e progresso
 * Baseado no padrão do módulo de metas (mod_metas)
 */

import { cn } from '@/lib/utils'
import { Circle, CheckCircle2, MinusCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

export type IndicatorStatus =
  | 'pending'
  | 'achieved'
  | 'partial'
  | 'not-achieved'
  | 'registered'
  | 'warning'
  | 'info'
  // Plan status types
  | 'ativo'
  | 'concluido'
  | 'cancelado'

interface StatusIndicatorProps {
  status: IndicatorStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const statusConfig: Record<
  IndicatorStatus,
  {
    icon: typeof Circle
    label: string
    colorClass: string
    bgClass: string
  }
> = {
  pending: {
    icon: Circle,
    label: 'Pendente',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
  },
  achieved: {
    icon: CheckCircle2,
    label: 'Atingido',
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
  },
  partial: {
    icon: MinusCircle,
    label: 'Parcial',
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  'not-achieved': {
    icon: XCircle,
    label: 'Não Atingido',
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
  },
  registered: {
    icon: Clock,
    label: 'Registrado',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
  },
  warning: {
    icon: AlertCircle,
    label: 'Atenção',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
  },
  info: {
    icon: Circle,
    label: 'Info',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  // Plan status mappings
  ativo: {
    icon: CheckCircle2,
    label: 'Ativo',
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
  },
  concluido: {
    icon: CheckCircle2,
    label: 'Concluído',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
  },
  cancelado: {
    icon: XCircle,
    label: 'Cancelado',
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
  },
}

const sizeConfig = {
  sm: {
    icon: 'h-3.5 w-3.5',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-2.5 py-1.5',
    gap: 'gap-2',
  },
}

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const sizes = sizeConfig[size]
  const Icon = config.icon

  if (showLabel) {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          sizes.padding,
          sizes.gap,
          sizes.text,
          config.bgClass,
          config.colorClass,
          className
        )}
      >
        <Icon className={sizes.icon} />
        <span>{config.label}</span>
      </div>
    )
  }

  return (
    <Icon
      className={cn(sizes.icon, config.colorClass, className)}
      aria-label={config.label}
    />
  )
}

/**
 * Componente para exibir múltiplos indicadores em uma barra
 */
interface StatusBarProps {
  achieved: number
  partial: number
  notAchieved: number
  pending: number
  total?: number
  showCounts?: boolean
  className?: string
}

export function StatusBar({
  achieved,
  partial,
  notAchieved,
  pending,
  total: totalProp,
  showCounts = false,
  className,
}: StatusBarProps) {
  const total = totalProp || achieved + partial + notAchieved + pending

  if (total === 0) {
    return (
      <div className={cn('h-2 rounded-full bg-muted', className)} />
    )
  }

  const achievedPercent = (achieved / total) * 100
  const partialPercent = (partial / total) * 100
  const notAchievedPercent = (notAchieved / total) * 100

  return (
    <div className={cn('space-y-1', className)}>
      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
        {achievedPercent > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${achievedPercent}%` }}
          />
        )}
        {partialPercent > 0 && (
          <div
            className="bg-yellow-500 transition-all"
            style={{ width: `${partialPercent}%` }}
          />
        )}
        {notAchievedPercent > 0 && (
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${notAchievedPercent}%` }}
          />
        )}
      </div>
      {showCounts && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {achieved}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            {partial}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {notAchieved}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            {pending}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Mapeia status da API para status do indicador
 */
export function mapProgressStatusToIndicator(
  status: string | undefined
): IndicatorStatus {
  switch (status) {
    case 'atingido':
    case 'achieved':
      return 'achieved'
    case 'parcial':
    case 'partial':
      return 'partial'
    case 'nao_atingido':
    case 'not_achieved':
    case 'not-achieved':
      return 'not-achieved'
    case 'registrado':
    case 'registered':
      return 'registered'
    case 'pendente':
    case 'pending':
    default:
      return 'pending'
  }
}
