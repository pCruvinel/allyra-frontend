import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  label,
  required,
  className,
  disabled,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const selectRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Calcular posição do dropdown quando abrir
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4, // 4px de margem
        left: rect.left,
        width: rect.width,
      })
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      // Atualizar posição ao redimensionar/scroll
      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition, true)
      return () => {
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition, true)
      }
    }
  }, [isOpen, updateDropdownPosition])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        // Verificar se o clique foi no dropdown (que está no portal)
        const target = e.target as HTMLElement
        if (!target.closest('[data-select-dropdown]')) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div ref={selectRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-sm bg-background border border-border rounded-lg transition-colors',
            'hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'border-primary/50 ring-1 ring-primary/30'
          )}
        >
          <span className={cn(selectedOption ? 'text-foreground' : 'text-muted-foreground')}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown via Portal para evitar corte por overflow:hidden do modal */}
        {isOpen && createPortal(
          <div
            data-select-dropdown
            className="fixed z-[9999] bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted transition-colors',
                  value === option.value && 'bg-primary/10 text-primary font-medium'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
