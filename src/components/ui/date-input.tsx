import { forwardRef } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormField } from '@/components/ui/form-field'

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /** Valor da data (YYYY-MM-DD) */
  value?: string
  /** Callback quando a data muda */
  onChange?: (value: string) => void
  /** Label do campo (se fornecido, usa FormField wrapper) */
  label?: string
  /** Se o campo é obrigatório */
  required?: boolean
  /** Data mínima permitida (YYYY-MM-DD) */
  min?: string
  /** Data máxima permitida (YYYY-MM-DD) */
  max?: string
  /** Mensagem de erro */
  error?: string
  /** Classes CSS adicionais */
  className?: string
  /** Se true, mostra ícone de calendário */
  showIcon?: boolean
}

/**
 * DateInput - Input de data estilizado com ícone opcional
 *
 * @example
 * // Input simples
 * <DateInput
 *   value={date}
 *   onChange={setDate}
 *   min={today}
 * />
 *
 * // Com label (usa FormField wrapper)
 * <DateInput
 *   label="Data de Nascimento"
 *   value={birthDate}
 *   onChange={setBirthDate}
 *   required
 *   max={today}
 * />
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value,
      onChange,
      label,
      required,
      min,
      max,
      error,
      className,
      showIcon = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    const inputContent = (
      <div className="relative">
        {showIcon && (
          <Calendar
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
              disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'
            )}
          />
        )}
        <input
          ref={ref}
          type="date"
          value={value ?? ''}
          onChange={handleChange}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            'w-full py-2 text-sm bg-background border border-border rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            showIcon ? 'pl-10 pr-3' : 'px-3',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
      </div>
    )

    // Se tem label, usar FormField wrapper
    if (label) {
      return (
        <FormField label={label} required={required} error={error}>
          {inputContent}
        </FormField>
      )
    }

    return inputContent
  }
)

DateInput.displayName = 'DateInput'
