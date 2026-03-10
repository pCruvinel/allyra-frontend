import * as React from 'react'
import { Input, InputProps } from './input'
import { formatCNPJ } from '@/lib/validators'

export interface CnpjInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

const CnpjInput = React.forwardRef<HTMLInputElement, CnpjInputProps>(
  ({ onChange, value = '', ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() =>
      value ? formatCNPJ(String(value)) : ''
    )

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCNPJ(String(value)))
      }
    }, [value])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCNPJ(e.target.value)
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
        placeholder="00.000.000/0000-00"
        value={displayValue}
        onChange={handleChange}
        maxLength={18} // 00.000.000/0000-00
        {...props}
      />
    )
  }
)

CnpjInput.displayName = 'CnpjInput'

export { CnpjInput }
