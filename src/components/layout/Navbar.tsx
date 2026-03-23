import { useState } from 'react'
import { Menu, Bell, FilePlus, Calendar, ChevronDown, UserPlus, CalendarPlus } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuth } from '@/contexts/AuthContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useNotifications } from '@/hooks/useNotifications'
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/radix-dropdown-menu'
import { NotificationsDrawer } from './NotificationsDrawer'
import { NotificationsDropdown } from './NotificationsDropdown'
import { ProfileDropdown } from './ProfileDropdown'
import { UserMenuDrawer } from './UserMenuDrawer'
import { useModal } from '@/contexts/ModalContext'
import { cn } from '@/lib/utils'
import { CompactBreadcrumb } from './CompactBreadcrumb'

interface NavbarProps {
  title: string
  breadcrumb?: { label: string; href?: string }[]
  actionButton?: {
    label: string
    icon?: React.ReactNode
    onClick?: () => void
  }
  onMobileMenuClick?: () => void
}

export function Navbar({ title, breadcrumb = [], actionButton, onMobileMenuClick }: NavbarProps) {
  const { toggleSidebar } = useSidebar()
  const { user } = useAuth()
  const { openModal } = useModal()
  const isMobile = useIsMobile()

  // Estados para drawers mobile
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false)
  const [userMenuDrawerOpen, setUserMenuDrawerOpen] = useState(false)

  // Hook de notificações apenas para badge mobile
  const { unreadCount } = useNotifications({ autoFetch: true })

  // Em mobile, o botão de menu abre o MobileSidebar
  const handleMenuClick = () => {
    if (isMobile && onMobileMenuClick) {
      onMobileMenuClick()
    } else {
      toggleSidebar()
    }
  }

  // Handlers para abrir drawers em mobile
  const handleNotificationsClick = () => {
    if (isMobile) {
      setNotificationsDrawerOpen(true)
    }
  }

  const handleUserMenuClick = () => {
    if (isMobile) {
      setUserMenuDrawerOpen(true)
    }
  }

  return (
    <>
      {/* Top Bar */}
      <header className={cn(
        "flex items-center justify-between bg-background border-b border-border/60",
        isMobile ? "h-[52px] px-4" : "h-16 px-5"
      )}>
        {/* Left: Menu & Action (or Logo on mobile) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleMenuClick}
            className="p-1.5 text-primary hover:bg-muted rounded-lg transition-colors"
            aria-label={isMobile ? "Abrir menu" : "Alternar sidebar"}
          >
            <Menu size={isMobile ? 22 : 24} strokeWidth={2} />
          </button>

          {/* Logo em mobile */}
          {isMobile && (
            <span className="text-lg font-semibold text-primary">Allyra</span>
          )}

          {/* Botão Cadastrar com Dropdown - oculto em mobile */}
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-primary/90">
                  <FilePlus size={16} />
                  <span>Cadastrar</span>
                  <ChevronDown size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => openModal('patient')}
                  className="cursor-pointer"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Paciente
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openModal('appointment')}
                  className="cursor-pointer"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Novo Agendamento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right: Notifications & User */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications - Drawer em mobile, Dropdown em desktop */}
          {isMobile ? (
            <button
              onClick={handleNotificationsClick}
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Bell size={20} className="text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 flex items-center justify-center bg-primary text-white text-[10px] font-semibold rounded-full px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ) : (
            <NotificationsDropdown />
          )}

          {/* User Menu - Drawer em mobile, Dropdown em desktop */}
          {isMobile ? (
            <button
              onClick={handleUserMenuClick}
              className="flex items-center gap-2 hover:bg-muted rounded-lg px-1 py-1 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name || ''} />
                <AvatarFallback className="text-xs bg-violet-100 text-primary">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <ProfileDropdown />
          )}
        </div>
      </header>

      {/* Breadcrumb Bar */}
      <div className={cn(
        "flex items-center justify-between bg-background border-b border-border/60",
        isMobile ? "h-9 px-4" : "h-10 px-5"
      )}>
        <div className="flex items-center gap-2 overflow-hidden md:gap-3">
          <h1 className={cn(
            "font-semibold text-foreground truncate",
            isMobile ? "text-sm" : "text-[15px]"
          )}>{title}</h1>
          {/* Breadcrumb — hidden on mobile, suppressed when only 1 item */}
          {!isMobile && <CompactBreadcrumb items={breadcrumb} />}
        </div>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={cn(
              "flex items-center gap-1 font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-colors shrink-0",
              isMobile ? "px-2.5 py-1 text-[10px]" : "px-3 py-1 text-[11px]"
            )}
          >
            <span>{actionButton.label}</span>
            {actionButton.icon || <Calendar size={isMobile ? 14 : 18} />}
          </button>
        )}
      </div>

      {/* Mobile Drawers */}
      <NotificationsDrawer
        open={notificationsDrawerOpen}
        onOpenChange={setNotificationsDrawerOpen}
      />
      <UserMenuDrawer
        open={userMenuDrawerOpen}
        onOpenChange={setUserMenuDrawerOpen}
      />
    </>
  )
}
