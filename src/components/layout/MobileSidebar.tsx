import { Link, useLocation } from '@tanstack/react-router'
import { Drawer } from 'vaul'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
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
  X,
  Code2,
  ChevronDown,
  Check,
  HeartPulse,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useModuleAccess } from '@/hooks/useModuleAccess'
import { useTheme } from '@/contexts/ThemeContext'
import { useMemo, useState } from 'react'

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

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation()
  const { logout, clinicas, currentClinica, selectClinica } = useAuth()
  const { visibleModules, currentPerfil, canAccess } = useModuleAccess()
  const { toggleTheme, isDark } = useTheme()
  const [clinicSelectorOpen, setClinicSelectorOpen] = useState(false)

  // Mostrar seletor apenas para admin_master/desenvolvedor com múltiplas clínicas
  const isGlobalAdmin = currentPerfil === 'admin_master' || currentPerfil === 'desenvolvedor'
  const showClinicSelector = isGlobalAdmin && clinicas.length > 1

  // Constrói a lista de navegação dinamicamente (mesmo código do Sidebar)
  const navItems = useMemo(() => {
    const items: Array<{ label: string; href: string; icon: LucideIcon; slug: string }> = [
      ...fixedNavItems,
    ]

    const addedSlugs = new Set<string>(['home'])

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

    const isAdmin = currentPerfil === 'admin_master' || currentPerfil === 'administrador_total'

    if (isAdmin) {
      if (currentPerfil === 'admin_master' && canAccess('saas') && !addedSlugs.has('saas')) {
        addedSlugs.add('saas')
        items.push(adminNavItems[0])
      }
      if (!addedSlugs.has('usuarios')) {
        addedSlugs.add('usuarios')
        items.push(adminNavItems[1])
      }
      if (!addedSlugs.has('auditoria')) {
        addedSlugs.add('auditoria')
        items.push(adminNavItems[2])
      }
    }

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

  const handleNavClick = () => {
    onOpenChange(false)
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="left"
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-background flex flex-col"
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <Drawer.Title>Menu de navegação</Drawer.Title>
          </VisuallyHidden>
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-muted">
            <span className="text-xl font-semibold tracking-tight text-primary">Allyra</span>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Clinic Selector (admin_master/desenvolvedor) */}
          {showClinicSelector && (
            <div className="px-3 py-3 border-b border-muted">
              <button
                onClick={() => setClinicSelectorOpen(!clinicSelectorOpen)}
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "bg-muted/50 hover:bg-muted border border-transparent hover:border-border",
                  clinicSelectorOpen && "bg-muted border-border"
                )}
              >
                <Building2 size={18} className="text-primary flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs text-muted-foreground">Clínica</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {currentClinica?.name || 'Selecione'}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    "text-muted-foreground transition-transform flex-shrink-0",
                    clinicSelectorOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Clinic List */}
              {clinicSelectorOpen && (
                <div className="mt-2 rounded-lg border border-border bg-background overflow-hidden">
                  {clinicas.map((clinica) => (
                    <button
                      key={clinica.id}
                      onClick={() => {
                        selectClinica(clinica.id)
                        setClinicSelectorOpen(false)
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors",
                        "hover:bg-muted",
                        currentClinica?.id === clinica.id && "bg-primary/10"
                      )}
                    >
                      <Building2 size={16} className={cn(
                        currentClinica?.id === clinica.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "flex-1 text-left truncate",
                        currentClinica?.id === clinica.id && "text-primary font-medium"
                      )}>
                        {clinica.name}
                      </span>
                      {currentClinica?.id === clinica.id && (
                        <Check size={16} className="text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href
                const isParentActive = item.slug === 'pacientes' && location.pathname.startsWith('/pacientes')
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
                        (isActive || isParentActive)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon size={20} className={(isActive || isParentActive) ? "text-primary" : "text-primary"} />
                      <span>{item.label}</span>
                    </Link>
                    {/* Submenu: Engajamento under Pacientes */}
                    {item.slug === 'pacientes' && (
                      <Link
                        to="/pacientes/engajamento"
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-3 ml-6 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors mt-0.5",
                          location.pathname === '/pacientes/engajamento'
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <HeartPulse size={16} className="flex-shrink-0" />
                        <span>Engajamento</span>
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Perfil info */}
          {currentPerfil && (
            <div className="px-4 py-2 border-t border-muted">
              <div className="text-xs text-muted-foreground text-center">
                Perfil: {currentPerfil.replace(/_/g, ' ')}
              </div>
            </div>
          )}

          {/* Theme Toggle & Logout */}
          <div className="p-3 space-y-1 border-t border-muted">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium hover:bg-muted transition-colors text-foreground"
            >
              {isDark ? (
                <Sun size={20} className="text-primary" />
              ) : (
                <Moon size={20} className="text-primary" />
              )}
              <span>{isDark ? "Modo claro" : "Modo escuro"}</span>
            </button>

            <button
              onClick={() => {
                logout()
                onOpenChange(false)
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium hover:bg-muted transition-colors text-foreground"
            >
              <LogOut size={20} className="text-primary" />
              <span>Sair</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
