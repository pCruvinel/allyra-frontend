import { cn } from '@/lib/utils'

interface FormRowProps {
  cols?: 2 | 3 | 4
  className?: string
  children: React.ReactNode
}

const colsMap = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

export function FormRow({ cols = 2, className, children }: FormRowProps) {
  return (
    <div className={cn('grid gap-4', colsMap[cols], className)}>
      {children}
    </div>
  )
}
