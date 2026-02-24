import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileSidebar } from './MobileSidebar'
import { Navbar } from './Navbar'
import { GlobalModals } from '@/components/modals'
import { useSidebar } from '@/contexts/SidebarContext'
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumb?: { label: string; href?: string }[]
  actionButton?: {
    label: string
    icon?: React.ReactNode
    onClick?: () => void
  }
}

export function MainLayout({ children, title, breadcrumb, actionButton }: MainLayoutProps) {
  const { isCollapsed } = useSidebar()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Em tablet, sidebar é sempre collapsed (64px)
  // Em desktop, segue o estado do contexto
  const sidebarWidth = isMobile ? 0 : isTablet ? 20 : isCollapsed ? 20 : 244

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop/Tablet Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar (Drawer) */}
      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col flex-1 overflow-hidden transition-all duration-300",
          !isMobile && `ml-${sidebarWidth}`
        )}
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth === 244 ? '244px' : sidebarWidth === 20 ? '80px' : 0
        }}
      >
        {/* Navbar */}
        <Navbar
          title={title}
          breadcrumb={breadcrumb}
          actionButton={actionButton}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className={cn(
          "flex-1 overflow-auto bg-muted/30",
          isMobile ? "p-4" : "p-6"
        )}>
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalModals />
    </div>
  )
}
