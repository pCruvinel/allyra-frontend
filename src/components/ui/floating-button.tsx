import { cn } from '@/lib/utils'

interface FloatingButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const positionClasses = {
  'bottom-right': 'bottom-8 right-8',
  'bottom-left': 'bottom-8 left-8',
  'top-right': 'top-8 right-8',
  'top-left': 'top-8 left-8',
}

export function FloatingButton({
  icon,
  onClick,
  className,
  position = 'bottom-right',
}: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors',
        positionClasses[position],
        className
      )}
    >
      {icon}
    </button>
  )
}
