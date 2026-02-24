import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type TrendType = 'up' | 'down' | 'stable'

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  className?: string
  isLoading?: boolean
  /** Optional subtitle below the label */
  subtitle?: string
  /** Trend direction indicator */
  trend?: TrendType
  /** Trend value to display (e.g., "+12%", "-5") */
  trendValue?: string
}

const TrendIcon = ({ trend }: { trend: TrendType }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />
    case 'stable':
      return <Minus className="h-4 w-4 text-muted-foreground" />
  }
}

const trendColors: Record<TrendType, string> = {
  up: 'text-green-500',
  down: 'text-red-500',
  stable: 'text-muted-foreground',
}

export function StatCard({
  icon,
  value,
  label,
  className,
  isLoading,
  subtitle,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex-1 min-w-[170px] h-[180px] bg-card border border-border rounded-xl p-4 flex flex-col justify-end gap-2 transition-colors hover:border-primary/50',
        className
      )}
    >
      <div className="flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            {icon}
          </div>
          {trend && !isLoading && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trendColors[trend])}>
              <TrendIcon trend={trend} />
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </>
          ) : (
            <>
              <div className="text-[32px] font-semibold leading-[120%] text-primary font-display">
                {value}
              </div>
              <div className="text-sm leading-[140%] text-foreground">
                {label}
              </div>
              {subtitle && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {subtitle}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
