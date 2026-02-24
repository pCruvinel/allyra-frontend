import { cn } from '@/lib/utils'

interface NavigationCardProps {
  icon: React.ReactNode
  title: string
  description?: string
  onClick: () => void
  className?: string
}

export function NavigationCard({
  icon,
  title,
  description,
  onClick,
  className,
}: NavigationCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start p-6 border border-border rounded-xl',
        'hover:shadow-md hover:border-primary/30 transition-all',
        'bg-card text-left group',
        className
      )}
    >
      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/90 transition-colors">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </button>
  )
}
