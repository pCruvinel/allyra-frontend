import { FileText, MoreHorizontal, Download, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './radix-dropdown-menu'

export interface DocumentCardProps {
  id: string
  name: string
  code: string
  uploadedAt: string
  url?: string
  onView?: (id: string) => void
  onDownload?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export function DocumentCard({
  id,
  name,
  code,
  uploadedAt,
  onView,
  onDownload,
  onDelete,
  className,
}: DocumentCardProps) {
  const truncatedName = name.length > 30 ? `${name.substring(0, 30)}...` : name

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border border-border rounded-xl bg-card hover:border-primary/30 transition-colors',
        className
      )}
    >
      {/* PDF Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
        <FileText className="w-5 h-5 text-primary" />
      </div>

      {/* Document Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate" title={name}>
          {truncatedName}
        </p>
        <p className="text-xs text-muted-foreground">
          {code} - {uploadedAt}
        </p>
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 hover:bg-muted rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onView && (
            <DropdownMenuItem onClick={() => onView(id)}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
          )}
          {onDownload && (
            <DropdownMenuItem onClick={() => onDownload(id)}>
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Grid container para exibir múltiplos DocumentCards
export interface DocumentGridProps {
  children: React.ReactNode
  className?: string
}

export function DocumentGrid({ children, className }: DocumentGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </div>
  )
}
