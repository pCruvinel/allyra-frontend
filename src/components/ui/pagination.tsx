import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 50]

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (items: number) => void
  className?: string
  /** Tamanho dos botões: 'sm' (32px - padrão) ou 'md' (40px) */
  size?: 'sm' | 'md'
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
  size = 'md',
}: PaginationProps) {
  // Tamanhos dos botões baseado no size prop
  const buttonSize = size === 'md' ? 'w-10 h-10' : 'w-8 h-8'
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  const textSize = size === 'md' ? 'text-xs' : 'text-[10px]'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemsPerPageChange = (value: number) => {
    onItemsPerPageChange?.(value)
    setIsDropdownOpen(false)
  }

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className={cn('flex items-center justify-between px-2 py-2', className)}>
      {/* Items per page selector */}
      <div className="flex items-center bg-background">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => onItemsPerPageChange && setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              "flex items-center px-3 bg-muted rounded-l-lg",
              size === 'md' ? 'h-10' : 'h-8',
              onItemsPerPageChange && "cursor-pointer hover:bg-muted/80"
            )}
          >
            <span className={cn(textSize, "text-foreground")}>
              <span className="font-bold">{itemsPerPage}</span> por página
            </span>
            {onItemsPerPageChange && (
              <ChevronDown className={cn(
                "w-[18px] h-[18px] ml-1 text-primary transition-transform",
                isDropdownOpen && "rotate-180"
              )} />
            )}
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && onItemsPerPageChange && (
            <div className="absolute bottom-full left-0 mb-1 bg-background border border-border rounded-lg shadow-lg z-10 min-w-[120px] overflow-hidden">
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleItemsPerPageChange(option)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left hover:bg-muted transition-colors",
                    textSize,
                    itemsPerPage === option && "bg-primary/10 text-primary font-bold"
                  )}
                >
                  {option} por página
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={cn(
          "flex items-center px-3 bg-muted rounded-r-lg",
          size === 'md' ? 'h-10' : 'h-8'
        )}>
          <span className={cn(textSize, "text-foreground")}>
            <span className="font-bold">{startItem}-{endItem}</span> de {totalItems}
          </span>
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "flex items-center justify-center border-2 border-primary bg-background rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors",
            buttonSize
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft className={cn(iconSize, "text-foreground")} />
        </button>

        {getVisiblePages().map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'flex items-center justify-center border-2 rounded-lg transition-colors font-medium',
                buttonSize,
                textSize,
                currentPage === page
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted bg-background text-foreground hover:bg-muted hover:border-primary/50'
              )}
              aria-label={`Página ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={cn(
            "flex items-center justify-center border-2 border-primary bg-background rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors",
            buttonSize
          )}
          aria-label="Próxima página"
        >
          <ChevronRight className={cn(iconSize, "text-foreground")} />
        </button>
      </div>
    </div>
  )
}
