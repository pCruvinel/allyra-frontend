import { User, Settings, LogOut, HelpCircle, FileText } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@/components/ui/avatar'

export function ProfileDropdown() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNavigate = (path: string) => {
    setIsOpen(false)
    navigate({ to: path })
  }

  const handleLogout = () => {
    setIsOpen(false)
    logout()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.avatar} alt={user?.name || ''} />
          <AvatarFallback className="bg-violet-100 text-primary text-sm">
            {user?.name ? getInitials(user.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground text-sm">
          {user?.name || 'Usuário'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-background rounded-xl border border-border shadow-xl z-50">
          {/* Header do Perfil */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.avatar} alt={user?.name || ''} />
                <AvatarFallback className="bg-violet-100 text-primary text-lg">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-[15px] truncate">
                  {user?.name || 'Usuário'}
                </h3>
                <p className="text-muted-foreground text-[13px] truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Meu Perfil */}
            <button
              onClick={() => handleNavigate('/meu-perfil')}
              className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <User size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground text-sm mb-0.5">
                  Meu Perfil
                </div>
                <div className="text-muted-foreground text-xs">
                  Ver e editar informações
                </div>
              </div>
            </button>

            {/* Configurações - acessível a todos os usuários */}
            <button
              onClick={() => handleNavigate('/preferencias')}
              className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Settings size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground text-sm mb-0.5">
                  Configurações
                </div>
                <div className="text-muted-foreground text-xs">
                  Preferências do sistema
                </div>
              </div>
            </button>

            {/* Documentação */}
            <button
              onClick={() => handleNavigate('/documentacao')}
              className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground text-sm mb-0.5">
                  Documentação
                </div>
                <div className="text-muted-foreground text-xs">
                  Guias e tutoriais
                </div>
              </div>
            </button>

            {/* Ajuda e Suporte */}
            <button
              onClick={() => handleNavigate('/ajuda')}
              className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <HelpCircle size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground text-sm mb-0.5">
                  Ajuda e Suporte
                </div>
                <div className="text-muted-foreground text-xs">
                  Central de ajuda
                </div>
              </div>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-border py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
                <LogOut size={18} className="text-red-500" />
              </div>
              <div className="font-medium text-red-500 text-sm">
                Sair da conta
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
