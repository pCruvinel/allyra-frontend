import * as React from 'react'
import { Input, InputProps } from './input'
import { formatCPF } from '@/lib/validators'

export interface CpfInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

const CpfInput = React.forwardRef<HTMLInputElement, CpfInputProps>(
  ({ onChange, value = '', ...props }, ref) => {
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

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={displayValue}
        onChange={handleChange}
        maxLength={14} // 000.000.000-00
        {...props}
      />
    )
  }
)

CpfInput.displayName = 'CpfInput'

export { CpfInput }
