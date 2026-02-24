import { Drawer } from 'vaul'
import { useNavigate } from '@tanstack/react-router'
import { User, Settings, LogOut, X, Sun, Moon } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useModuleAccess } from '@/hooks/useModuleAccess'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@/components/ui/avatar'

interface UserMenuDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserMenuDrawer({ open, onOpenChange }: UserMenuDrawerProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { currentPerfil } = useModuleAccess()
  const { toggleTheme, isDark } = useTheme()

  // Apenas admin_master e administrador_total podem acessar configurações
  const isAdmin = currentPerfil === 'admin_master' || currentPerfil === 'administrador_total'

  const handleNavigate = (to: string) => {
    onOpenChange(false)
    navigate({ to })
  }

  const handleLogout = () => {
    onOpenChange(false)
    logout()
  }

  const handleToggleTheme = () => {
    toggleTheme()
  }

  // Formata o tipo de perfil para exibição
  const formatPerfilTipo = (perfil?: string): string => {
    if (!perfil) return ''
    const labels: Record<string, string> = {
      admin_master: 'Admin Master',
      desenvolvedor: 'Desenvolvedor',
      administrador_total: 'Administrador',
      socio_profissional: 'Sócio Profissional',
      profissional: 'Profissional',
      secretaria: 'Secretária',
      administrativo: 'Administrativo',
      financeiro: 'Financeiro',
      faturamento: 'Faturamento',
    }
    return labels[perfil] || perfil.replace(/_/g, ' ')
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-background flex flex-col"
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <Drawer.Title>Menu do usuário</Drawer.Title>
          </VisuallyHidden>
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-muted">
            <span className="text-lg font-semibold text-foreground">Minha Conta</span>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-5 border-b border-muted">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar} alt={user?.name || ''} />
                <AvatarFallback className="text-xl">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground truncate">
                  {user?.name || 'Usuário'}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email || ''}
                </p>
                {currentPerfil && (
                  <p className="text-xs text-primary mt-1">
                    {formatPerfilTipo(currentPerfil)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 py-3 px-3">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleNavigate('/meu-perfil')}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  <User size={22} className="text-primary" />
                  <span>Meu Perfil</span>
                </button>
              </li>

              {isAdmin && (
                <li>
                  <button
                    onClick={() => handleNavigate('/configuracoes')}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground"
                  >
                    <Settings size={22} className="text-primary" />
                    <span>Configurações</span>
                  </button>
                </li>
              )}

              <li>
                <button
                  onClick={handleToggleTheme}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  {isDark ? (
                    <Sun size={22} className="text-primary" />
                  ) : (
                    <Moon size={22} className="text-primary" />
                  )}
                  <span>{isDark ? 'Modo claro' : 'Modo escuro'}</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-muted">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center justify-center gap-2 w-full py-3.5 rounded-lg text-sm font-medium transition-colors",
                "text-red-600 bg-red-50 hover:bg-red-100",
                "dark:bg-red-950/30 dark:hover:bg-red-950/50"
              )}
            >
              <LogOut size={20} />
              <span>Sair da conta</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
