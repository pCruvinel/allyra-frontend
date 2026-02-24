import { cn } from "@/lib/utils"

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

interface SkeletonTextProps {
  lines?: number
  className?: string
  lastLineWidth?: string
}

function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = "60%"
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 ? lastLineWidth : "100%"
          }}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  showAvatar?: boolean
  showDescription?: boolean
  className?: string
}

function SkeletonCard({
  showAvatar = true,
  showDescription = true,
  className
}: SkeletonCardProps) {
  return (
    <div className={cn("flex items-start space-x-4 p-4", className)}>
      {showAvatar && (
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      )}
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        {showDescription && (
          <>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </>
        )}
      </div>
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {showHeader && (
        <div className="flex gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              className="h-4 flex-1"
              style={{ maxWidth: i === 0 ? "40%" : undefined }}
            />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 p-4 border-b last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
              style={{
                maxWidth: colIndex === 0 ? "40%" : undefined,
                width: colIndex === columns - 1 ? "60%" : undefined
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface SkeletonListProps {
  items?: number
  showIcon?: boolean
  className?: string
}

function SkeletonList({
  items = 5,
  showIcon = true,
  className
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showIcon && <Skeleton className="h-8 w-8 rounded shrink-0" />}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface SkeletonCalendarProps {
  className?: string
}

function SkeletonCalendar({ className }: SkeletonCalendarProps) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border overflow-hidden", className)}>
      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 border-b border-border">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="py-3 flex justify-center border-r border-border last:border-r-0">
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
      {/* Grid de dias (5 semanas) */}
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[100px] p-2 border-r border-b border-border last:border-r-0"
          >
            <Skeleton className="h-5 w-5 rounded-full mb-2" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              {i % 3 === 0 && <Skeleton className="h-3 w-3/4" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonCalendar
}
