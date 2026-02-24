import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  onBack?: () => void
  breadcrumb?: string[]
  className?: string
}

export function PageHeader({
  title,
  onBack,
  breadcrumb = [],
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('bg-background border-b border-border px-6 py-4', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {onBack && (
          <button onClick={onBack} className="hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <span>{title}</span>
        {breadcrumb.map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            <span className="text-muted-foreground">›</span>
            <span className={index === breadcrumb.length - 1 ? 'text-foreground' : ''}>
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
