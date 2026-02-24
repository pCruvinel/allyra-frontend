import * as React from 'react'
import { Input, InputProps } from './input'

/**
 * Formata telefone brasileiro
 * - Celular: (11) 99999-9999 (11 dígitos)
 * - Fixo: (11) 3333-9999 (10 dígitos)
 */
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11)

  if (numbers.length === 0) return ''
  if (numbers.length <= 2) return `(${numbers}`
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
}

export interface PhoneInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, value = '', ...props }, ref) => {
    // Estado interno para o valor formatado
    const [displayValue, setDisplayValue] = React.useState(() =>
      value ? formatPhone(String(value)) : ''
    )

    // Atualiza displayValue quando value externo muda
    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatPhone(String(value)))
      }
    }, [value])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value)
        setDisplayValue(formatted)

        // Envia apenas números para o form
        const numbersOnly = formatted.replace(/\D/g, '')
        onChange?.(numbersOnly)
      },
      [onChange]
    )

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        placeholder="(00) 00000-0000"
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    )
  }
)

PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }
