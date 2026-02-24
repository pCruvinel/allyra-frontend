/**
 * ProgressCard Component
 * Card com barra de progresso, valor atual/meta, trend indicator
 * Baseado no padrão do módulo de metas (mod_metas)
 */

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { Progress } from './progress'

export type TrendDirection = 'up' | 'down' | 'stable'

interface ProgressCardProps {
  title: string
  current: number
  target: number
  unit?: string
  trend?: TrendDirection
  trendValue?: string
  subtitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'detailed'
}

const trendConfig: Record<TrendDirection, { icon: typeof TrendingUp; colorClass: string }> = {
  up: {
    icon: TrendingUp,
    colorClass: 'text-green-600 dark:text-green-400',
  },
  down: {
    icon: TrendingDown,
    colorClass: 'text-red-600 dark:text-red-400',
  },
  stable: {
    icon: Minus,
    colorClass: 'text-muted-foreground',
  },
}

export function ProgressCard({
  title,
  current,
  target,
  unit = '',
  trend,
  trendValue,
  subtitle,
  className,
  size = 'md',
  variant = 'default',
}: ProgressCardProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const TrendIcon = trend ? trendConfig[trend].icon : null

  // Determina a cor da barra baseado no progresso
  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 70) return 'bg-primary'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium truncate">{title}</span>
          <span className="text-muted-foreground">
            {current}/{target}{unit && ` ${unit}`}
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-1.5"
          indicatorClassName={getProgressColor()}
        />
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'rounded-xl border bg-card p-4 transition-colors hover:border-primary/50',
          className
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">{title}</h4>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {trend && TrendIcon && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm',
                trendConfig[trend].colorClass
              )}
            >
              <TrendIcon className="h-4 w-4" />
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{current}</span>
              <span className="text-muted-foreground">/ {target}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {percentage.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={percentage}
            className="h-2"
            indicatorClassName={getProgressColor()}
          />
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-colors hover:border-primary/50',
        size === 'sm' && 'p-3',
        size === 'lg' && 'p-5',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm truncate">{title}</span>
        </div>
        {trend && TrendIcon && (
          <div
            className={cn(
              'flex items-center gap-0.5',
              trendConfig[trend].colorClass
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {trendValue && <span className="text-xs">{trendValue}</span>}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className={cn('font-bold', size === 'lg' ? 'text-2xl' : 'text-xl')}>
          {current}
        </span>
        <span className="text-muted-foreground text-sm">
          / {target}{unit && ` ${unit}`}
        </span>
      </div>

      <Progress
        value={percentage}
        className={cn('h-1.5', size === 'lg' && 'h-2')}
        indicatorClassName={getProgressColor()}
      />

      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  )
}

/**
 * Grid de cards de progresso
 */
interface ProgressGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function ProgressGrid({ children, columns = 3, className }: ProgressGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  )
}

/**
 * Stat card simples (sem barra de progresso)
 */
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: TrendDirection
  trendValue?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-colors hover:border-primary/50',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold">{value}</span>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {trend && TrendIcon && (
          <div
            className={cn(
              'flex items-center gap-0.5',
              trendConfig[trend].colorClass
            )}
          >
            <TrendIcon className="h-4 w-4" />
            {trendValue && <span className="text-sm">{trendValue}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
