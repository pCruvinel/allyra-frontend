import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────

export interface TabItem {
  /** Unique value for tab identification */
  value: string
  /** Display label */
  label: string
  /** Optional icon (Lucide or any ReactNode) */
  icon?: React.ReactNode
  /** Conditionally show/hide (defaults to true) */
  visible?: boolean
}

export interface ActionItem {
  /** Display label */
  label: string
  /** Optional icon */
  icon?: React.ReactNode
  /** Click handler */
  onClick: () => void
  /** Visual variant */
  variant?: 'outline' | 'primary'
  /** Short label for mobile screens */
  mobileLabel?: string
  /** Hide this action on small screens (defaults to false) */
  hideOnMobile?: boolean
}

export interface StandardFilterBarProps {
  /** Tab items rendered on the left side */
  tabs?: TabItem[]
  /** Currently active tab value */
  activeTab?: string
  /** Tab change handler */
  onTabChange?: (value: string) => void
  /** Custom content slot between tabs and actions (e.g. a Select) */
  centerSlot?: React.ReactNode
  /** Show a vertical divider between tabs and center slot */
  showDivider?: boolean
  /** Secondary action buttons (outline style by default) */
  actions?: ActionItem[]
  /** Primary CTA button — always rightmost */
  primaryAction?: ActionItem
  /** Extra CSS class for the outer container */
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────

/**
 * StandardFilterBar — Unified page-level toolbar.
 *
 * Combines navigational tabs (left), an optional custom center slot,
 * and action buttons (right) inside a card-like container.
 *
 * Design reference: `/agenda` page filter bar.
 */
export function StandardFilterBar({
  tabs,
  activeTab,
  onTabChange,
  centerSlot,
  showDivider = false,
  actions,
  primaryAction,
  className,
}: StandardFilterBarProps) {
  const visibleTabs = tabs?.filter((tab) => tab.visible !== false)

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border border-border bg-card p-1.5',
        className,
      )}
    >
      {/* Left: Tabs + Center Slot */}
      <div className="flex gap-2">
        {visibleTabs?.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange?.(tab.value)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        {/* Optional divider between tabs and center slot */}
        {showDivider && centerSlot && (
          <div className="hidden w-px self-stretch bg-border sm:block" />
        )}

        {/* Center slot — arbitrary content (Select, SearchInput, etc.) */}
        {centerSlot}
      </div>

      {/* Right: Actions */}
      {(actions?.length || primaryAction) && (
        <div className="flex items-center gap-2">
          {actions?.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                'items-center justify-center whitespace-nowrap font-medium transition-colors',
                'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
                'h-8 px-3 text-xs gap-1.5 rounded-full',
                action.hideOnMobile !== false ? 'hidden sm:flex' : 'flex',
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 text-xs gap-1.5 rounded-full"
            >
              {primaryAction.icon}
              {primaryAction.mobileLabel ? (
                <>
                  <span className="hidden sm:inline">{primaryAction.label}</span>
                  <span className="sm:hidden">{primaryAction.mobileLabel}</span>
                </>
              ) : (
                primaryAction.label
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
