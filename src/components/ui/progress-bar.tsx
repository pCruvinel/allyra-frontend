import { cn } from '@/lib/utils'

interface ProgressBarProps {
  total: number
  received: number
  toReceive: number
  className?: string
  showLabels?: boolean
  receivedLabel?: string
  toReceiveLabel?: string
}

export function ProgressBar({
  total,
  received,
  toReceive,
  className,
  showLabels = true,
  receivedLabel = 'Recebido',
  toReceiveLabel = 'A receber',
}: ProgressBarProps) {
  const receivedPercentage = total > 0 ? (received / total) * 100 : 0
  const toReceivePercentage = total > 0 ? (toReceive / total) * 100 : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Barra de progresso */}
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${receivedPercentage}%` }}
        />
        <div
          className="h-full bg-pink-400 transition-all duration-300"
          style={{ width: `${toReceivePercentage}%` }}
        />
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-primary font-medium">{receivedLabel}</span>
            <p className="text-foreground font-semibold">{formatCurrency(received)}</p>
          </div>
          <div className="text-right">
            <span className="text-pink-500 font-medium">{toReceiveLabel}</span>
            <p className="text-foreground font-semibold">{formatCurrency(toReceive)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface FinancialSummaryCardProps {
  title: string
  total: number
  received: number
  toReceive: number
  receivedLabel?: string
  toReceiveLabel?: string
  className?: string
}

export function FinancialSummaryCard({
  title,
  total,
  received,
  toReceive,
  receivedLabel = 'Recebido',
  toReceiveLabel = 'A receber',
  className,
}: FinancialSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-muted-foreground">Valor total</p>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(total)}</p>
      </div>

      <ProgressBar
        total={total}
        received={received}
        toReceive={toReceive}
        receivedLabel={receivedLabel}
        toReceiveLabel={toReceiveLabel}
      />
    </div>
  )
}
