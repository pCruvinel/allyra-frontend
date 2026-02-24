import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface TabItem {
  value: string
  label: string
  icon?: React.ReactNode
}

interface ResponsiveTabsProps {
  /** Lista de tabs */
  tabs: TabItem[]
  /** Valor da tab ativa */
  value: string
  /** Callback ao mudar de tab */
  onValueChange: (value: string) => void
  /** Conteúdo de cada tab (usar TabsContent internamente ou passar como children) */
  children?: React.ReactNode
  /** Classe CSS adicional */
  className?: string
}

/**
 * ResponsiveTabs - Tabs responsivas
 *
 * Desktop: TabsList horizontal tradicional
 * Mobile: Select dropdown com a tab atual
 */
export function ResponsiveTabs({
  tabs,
  value,
  onValueChange,
  children,
  className,
}: ResponsiveTabsProps) {
  const isMobile = useIsMobile()

  // Mobile: Select dropdown
  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Selector mobile */}
        <Select
          value={value}
          onChange={onValueChange}
          options={tabs.map((tab) => ({ value: tab.value, label: tab.label }))}
        />

        {/* Conteúdo */}
        <Tabs value={value} onValueChange={onValueChange}>
          {children}
        </Tabs>
      </div>
    )
  }

  // Desktop: Tabs tradicionais
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}

// Re-export TabsContent para uso com ResponsiveTabs
export { TabsContent as ResponsiveTabsContent }
