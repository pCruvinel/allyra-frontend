import * as React from 'react'
import { Input, InputProps } from './input'
import { formatCurrency, parseCurrencyToNumber } from '@/lib/validators'

export interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  /** Valor numérico (ex: 1234.56) */
  value?: number
  /** Emite valor numérico limpo (ex: 1234.56) */
  onChange?: (value: number) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ onChange, value, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => {
      if (value === undefined || value === 0) return ''
      // Converte valor decimal para centavos string para formatar
      const cents = Math.round(value * 100).toString()
      return formatCurrency(cents)
    })

    React.useEffect(() => {
      if (value !== undefined && value > 0) {
        const cents = Math.round(value * 100).toString()
        setDisplayValue(formatCurrency(cents))
      } else if (value === 0 || value === undefined) {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const formatted = formatCurrency(raw)
        setDisplayValue(formatted)

        const numericValue = parseCurrencyToNumber(raw)
        onChange?.(numericValue)
      },
      [onChange]
    )

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }
