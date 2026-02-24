import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimpleDropdownMenuItem {
  icon?: React.ReactNode
  label: string
  onClick?: () => void
}

interface SimpleDropdownMenuProps {
  items: SimpleDropdownMenuItem[]
  trigger?: React.ReactNode
  className?: string
}

export function SimpleDropdownMenu({ items, trigger, className }: SimpleDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    openUpward: false,
  })
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const calculatePosition = useCallback(() => {
    if (!menuRef.current) return

    const buttonRect = menuRef.current.getBoundingClientRect()
    const dropdownHeight = items.length * 40 + 16 // Approximate height: 40px per item + padding
    const dropdownWidth = 200 // min-w-[200px]
    const spaceBelow = window.innerHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top

    // Open upward if not enough space below and more space above
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    // Calculate position for portal
    const top = openUpward
      ? buttonRect.top - dropdownHeight - 4 + window.scrollY
      : buttonRect.bottom + 4 + window.scrollY
    const left = Math.max(8, buttonRect.right - dropdownWidth + window.scrollX)

    setPosition({ top, left, openUpward })
  }, [items.length])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    function handleScroll() {
      if (isOpen) {
        calculatePosition()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('scroll', handleScroll, true)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, calculatePosition])

  const handleToggle = () => {
    if (!isOpen) {
      calculatePosition()
    }
    setIsOpen(!isOpen)
  }

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed bg-card border border-border rounded-xl shadow-xl py-1.5 min-w-[200px] animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick?.()
            setIsOpen(false)
          }}
          className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-muted/80 text-sm text-foreground text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
        >
          {item.icon && (
            <span className="text-muted-foreground">{item.icon}</span>
          )}
          {item.label}
        </button>
      ))}
    </div>
  )

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        onClick={handleToggle}
        className="p-1 hover:bg-muted rounded transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger || <MoreVertical className="w-6 h-6 text-primary" />}
      </button>

      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  )
}
