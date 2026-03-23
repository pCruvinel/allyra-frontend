import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Receipt,
  DollarSign,
  Settings,
  LogOut,
  Building2,
  UserCog,
  History,
  Target,
  ClipboardList,
  Sun,
  Moon,
  Code2,
  HeartPulse,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuth } from '@/contexts/AuthContext'
import { useModuleAccess } from '@/hooks/useModuleAccess'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery'
import { useMemo, useState } from 'react'
import { ClinicSelector } from './ClinicSelector'

// Mapeamento de ícones por slug do módulo
const moduleIcons: Record<string, LucideIcon> = {
  agenda_recepcao: Calendar,
  pacientes: Users,
  escalas_rh: ClipboardList,
  metas_terapeuticas: Target,
  financeiro: DollarSign,
  faturamento: Receipt,
  relatorios: FileText,
  configuracoes: Settings,
  saas: Building2,
}

// Ordem dos módulos no sidebar (menor = mais acima)
// NOTA: Prontuário removido - acesso via Pacientes conforme PRD
const moduleOrder: Record<string, number> = {
  home: 0,
  agenda_recepcao: 1,
  pacientes: 2,
  escalas_rh: 3,
  relatorios: 4,
  faturamento: 5,
  financeiro: 6,
  metas_terapeuticas: 7,
  saas: 90,
  usuarios: 91,
  auditoria: 92,
  configuracoes: 99,
  api_docs: 100,
}

// Itens fixos do menu (sempre visíveis)
const fixedNavItems = [
  { label: 'Início', href: '/', icon: LayoutDashboard, slug: 'home' },
]

// Itens administrativos (apenas para admin)
const adminNavItems = [
  { label: 'Clientes', href: '/clientes', icon: Building2, slug: 'saas' },
  { label: 'Usuários', href: '/usuarios', icon: UserCog, slug: 'usuarios' },
  { label: 'Auditoria', href: '/auditoria', icon: History, slug: 'auditoria' },
]

// Itens de desenvolvedor (admin_master ou desenvolvedor)
const devNavItems = [
  { label: 'API Docs', href: '/api-docs', icon: Code2, slug: 'api_docs' },
]

export function Sidebar() {
  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer early return
  // para não violar as regras de hooks do React
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const location = useLocation()
  const { isCollapsed } = useSidebar()
  const { logout, user } = useAuth()
  const { visibleModules, currentPerfil, canAccess } = useModuleAccess()
  const { toggleTheme, isDark } = useTheme()

  // Submenu Pacientes: auto-expand when on a pacientes sub-route
  const isPacientesRoute = location.pathname.startsWith('/pacientes')
  const [isPacientesOpen, setIsPacientesOpen] = useState(isPacientesRoute)

  // Debug: log perfil do usuário
  logger.debug('Sidebar', 'Debug:', {
    user: user?.email,
    currentPerfil,
    isCollapsed,
    effectiveCollapsed: isTablet || isCollapsed
  })

  // Constrói a lista de navegação dinamicamente
  // Esse useMemo precisa estar ANTES do early return também
  const navItems = useMemo(() => {
    const items: Array<{ label: string; href: string; icon: LucideIcon; slug: string }> = [
      ...fixedNavItems,
    ]

    // Set para rastrear slugs já adicionados (evitar duplicatas)
    const addedSlugs = new Set<string>(['home'])

    // Adiciona módulos visíveis baseado no perfil e disponibilidade
    // Exclui configuracoes aqui, será adicionado no final
    visibleModules
      .filter((m) => m.slug !== 'configuracoes')
      .forEach((module) => {
        if (addedSlugs.has(module.slug)) return
        addedSlugs.add(module.slug)

        const Icon = moduleIcons[module.slug] || FileText
        items.push({
          label: module.name,
          href: module.route,
          icon: Icon,
          slug: module.slug,
        })
      })

    // Adiciona itens administrativos se o usuário tiver acesso
    const isAdmin = currentPerfil === 'admin_master' || currentPerfil === 'administrador_total'

    if (isAdmin) {
      // Clientes (SaaS) - apenas admin_master
      if (currentPerfil === 'admin_master' && canAccess('saas') && !addedSlugs.has('saas')) {
        addedSlugs.add('saas')
        items.push(adminNavItems[0])
      }
      // Usuários e Auditoria - admins
      if (!addedSlugs.has('usuarios')) {
        addedSlugs.add('usuarios')
        items.push(adminNavItems[1])
      }
      if (!addedSlugs.has('auditoria')) {
        addedSlugs.add('auditoria')
        items.push(adminNavItems[2])
      }
    }

    // Configurações - apenas se tiver acesso
    if (canAccess('configuracoes') && !addedSlugs.has('configuracoes')) {
      addedSlugs.add('configuracoes')
      items.push({
        label: 'Configurações',
        href: '/configuracoes',
        icon: Settings,
        slug: 'configuracoes',
      })
    }

    // API Docs - apenas se VITE_SHOW_API_DOCS=true E (admin_master ou desenvolvedor)
    const showApiDocs = import.meta.env.VITE_SHOW_API_DOCS === 'true'
    const isDev = currentPerfil === 'admin_master' || currentPerfil === 'desenvolvedor'
    if (showApiDocs && isDev && !addedSlugs.has('api_docs')) {
      addedSlugs.add('api_docs')
      items.push(devNavItems[0])
    }

    // Ordena os itens conforme moduleOrder
    return items.sort((a, b) => {
      const orderA = moduleOrder[a.slug] ?? 50
      const orderB = moduleOrder[b.slug] ?? 50
      return orderA - orderB
    })
  }, [visibleModules, currentPerfil, canAccess])

  // Em mobile, sidebar é controlada pelo MobileSidebar
  // Este componente só renderiza em tablet/desktop
  if (isMobile) {
    return null
  }

  // Em tablet, força collapsed
  const effectiveCollapsed = isTablet || isCollapsed

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 flex flex-col h-screen bg-background border-r border-muted transition-all duration-300 z-30",
        effectiveCollapsed ? "w-20" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-muted",
        effectiveCollapsed ? "justify-center px-2" : "px-6"
      )}>
        {effectiveCollapsed ? (
          <span className="text-xl font-bold text-primary">A</span>
        ) : (
          <span className="text-xl font-semibold tracking-tight text-primary">Allyra</span>
        )}
      </div>

      {/* Clinic Selector (admin_master/desenvolvedor) */}
      <ClinicSelector collapsed={effectiveCollapsed} />

      {/* Navigation */}
      <nav className={cn(
        "flex-1 pt-4 pb-8 overflow-y-auto",
        effectiveCollapsed ? "px-2" : "px-4"
      )}>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            const isParentActive = item.slug === 'pacientes' && location.pathname.startsWith('/pacientes')
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  title={effectiveCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                    effectiveCollapsed && "justify-center",
                    (isActive || isParentActive)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className={cn(
                    "flex-shrink-0",
                    (isActive || isParentActive) ? "text-primary" : "text-primary"
                  )}>
                    <Icon size={20} />
                  </span>
                  {!effectiveCollapsed && <span>{item.label}</span>}
                  {/* Chevron toggle for Pacientes submenu */}
                  {item.slug === 'pacientes' && !effectiveCollapsed && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsPacientesOpen((prev) => !prev)
                      }}
                      className="ml-auto p-0.5 rounded hover:bg-muted/50 transition-colors"
                    >
                      <ChevronDown
                        size={14}
                        className={cn(
                          'transition-transform duration-200',
                          isPacientesOpen ? 'rotate-180' : 'rotate-0'
                        )}
                      />
                    </button>
                  )}
                </Link>
                {/* Submenu: Engajamento under Pacientes */}
                {item.slug === 'pacientes' && !effectiveCollapsed && (
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200 ease-in-out',
                      isPacientesOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <Link
                      to="/pacientes/engajamento"
                      className={cn(
                        "flex items-center gap-3 ml-6 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors mt-0.5",
                        location.pathname === '/pacientes/engajamento'
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <HeartPulse size={16} className="flex-shrink-0" />
                      <span>Engajamento</span>
                    </Link>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Perfil info (quando expandido) */}
      {!effectiveCollapsed && currentPerfil && (
        <div className="px-4 pb-2">
          <div className="text-xs text-muted-foreground text-center py-2 border-t border-muted">
            Perfil: {currentPerfil.replace(/_/g, ' ')}
          </div>
        </div>
      )}

      {/* Theme Toggle & Logout */}
      <div className={cn(
        "pb-6 space-y-1",
        effectiveCollapsed ? "px-2" : "px-4"
      )}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={effectiveCollapsed ? (isDark ? "Modo claro" : "Modo escuro") : undefined}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-muted transition-colors text-foreground",
            effectiveCollapsed && "justify-center"
          )}
        >
          {isDark ? (
            <Sun size={20} className="text-primary flex-shrink-0" />
          ) : (
            <Moon size={20} className="text-primary flex-shrink-0" />
          )}
          {!effectiveCollapsed && <span>{isDark ? "Modo claro" : "Modo escuro"}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            logout()
          }}
          type="button"
          title={effectiveCollapsed ? "Sair" : undefined}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-muted transition-colors text-foreground",
            effectiveCollapsed && "justify-center"
          )}
        >
          <LogOut size={20} className="text-primary flex-shrink-0" />
          {!effectiveCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
