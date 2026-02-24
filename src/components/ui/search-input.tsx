import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function SearchInput({
  placeholder = 'Pesquise',
  value,
  onChange,
  className,
}: SearchInputProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg',
        className
      )}
    >
      <Search className="w-5 h-5 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="flex-1 text-sm bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
