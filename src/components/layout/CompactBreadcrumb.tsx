import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface CompactBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Compact, reusable breadcrumb component.
 * Suppresses rendering when there's only a single item (avoids redundancy).
 */
export function CompactBreadcrumb({ items, className }: CompactBreadcrumbProps) {
  // Don't render if there is only one item — it's redundant
  if (items.length <= 1) return null

  return (
    <nav className={cn('flex items-center', className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const textClass = index === 0
          ? 'text-xs font-semibold text-foreground'
          : 'text-xs text-muted-foreground'

        return (
          <div key={index} className="flex items-center">
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className={cn(textClass, 'hover:text-primary transition-colors')}
              >
                {item.label}
              </Link>
            ) : (
              <span className={textClass}>{item.label}</span>
            )}
            {!isLast && (
              <ChevronRight size={14} className="mx-1 text-muted-foreground" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
