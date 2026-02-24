import { cn } from '@/lib/utils'

interface StatItem {
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: {
    value: string
    isPositive: boolean
  }
}

interface StatsGridProps {
  stats: StatItem[]
  cols?: 2 | 3 | 4
  className?: string
}

const colsMap = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

export function StatsGrid({ stats, cols = 3, className }: StatsGridProps) {
  return (
    <div className={cn('grid gap-4', colsMap[cols], className)}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
            {stat.icon}
          </div>
          <p className="text-2xl font-bold text-primary">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          {stat.trend && (
            <p
              className={cn(
                'text-xs mt-1',
                stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {stat.trend.isPositive ? '↑' : '↓'} {stat.trend.value}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
