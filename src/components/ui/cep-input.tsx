import * as React from 'react'
import { Input, InputProps } from './input'
import { formatCEP } from '@/lib/validators'

export interface CepInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

const CepInput = React.forwardRef<HTMLInputElement, CepInputProps>(
  ({ onChange, value = '', ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() =>
      value ? formatCEP(String(value)) : ''
    )

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCEP(String(value)))
      }
    }, [value])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCEP(e.target.value)
        setDisplayValue(formatted)

        const numbersOnly = formatted.replace(/\D/g, '')
        onChange?.(numbersOnly)
      },
      [onChange]
    )

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        placeholder="00000-000"
        value={displayValue}
        onChange={handleChange}
        maxLength={9} // 00000-000
        {...props}
      />
    )
  }
)

CepInput.displayName = 'CepInput'

export { CepInput }
