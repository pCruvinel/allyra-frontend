import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  collapseSidebar: () => void
  expandSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

interface SidebarProviderProps {
  children: ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const collapseSidebar = useCallback(() => {
    setIsCollapsed(true)
  }, [])

  const expandSidebar = useCallback(() => {
    setIsCollapsed(false)
  }, [])

  const value: SidebarContextType = {
    isCollapsed,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
