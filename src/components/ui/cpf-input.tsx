import * as React from 'react'
import { Input, InputProps } from './input'
import { formatCPF, isValidCPF } from '@/lib/validators'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CpfInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
  /** Show real-time validation icon (defaults to true) */
  showValidation?: boolean
}

const CpfInput = React.forwardRef<HTMLInputElement, CpfInputProps>(
  ({ onChange, value = '', showValidation = true, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() =>
      value ? formatCPF(String(value)) : ''
    )

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCPF(String(value)))
      }
    }, [value])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCPF(e.target.value)
        setDisplayValue(formatted)

        // Envia apenas dígitos para o form
        const numbersOnly = formatted.replace(/\D/g, '')
        onChange?.(numbersOnly)
      },
      [onChange]
    )

    // Derive validation state from digits only
    const digitsOnly = displayValue.replace(/\D/g, '')
    const isComplete = digitsOnly.length === 11
    const isValid = isComplete && isValidCPF(digitsOnly)
    const isInvalid = isComplete && !isValid

    return (
      <div className="relative">
        <Input
          ref={ref}
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={displayValue}
          onChange={handleChange}
          maxLength={14} // 000.000.000-00
          className={cn(
            showValidation && isValid && 'border-green-500 focus-visible:ring-green-500/30',
            showValidation && isInvalid && 'border-red-500 focus-visible:ring-red-500/30',
            'pr-9',
            className,
          )}
          {...props}
        />
        {showValidation && isComplete && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </span>
        )}
      </div>
    )
  }
)

CpfInput.displayName = 'CpfInput'

export { CpfInput }

