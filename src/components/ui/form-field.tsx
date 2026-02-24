import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
