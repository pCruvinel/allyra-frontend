import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ReadOnlyFieldProps {
  label: string
  value: string | number
  className?: string
}

export function ReadOnlyField({ label, value, className }: ReadOnlyFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        value={value}
        readOnly
        className="bg-muted cursor-not-allowed"
      />
    </div>
  )
}
