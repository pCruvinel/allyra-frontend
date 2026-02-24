import { useEffect, lazy, Suspense } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { useModuleAccess } from '@/hooks/useModuleAccess'

// =====================================================
// LAZY LOADING - Code Splitting para reduzir bundle
// =====================================================

// Auth Pages (carregam imediatamente - críticas)
import { LoginPage } from '@/pages/Login'
import { AuthCallbackPage, ResetPasswordPage } from '@/pages/Auth'

// Dashboard (carrega imediatamente - página inicial)
import { DashboardLayout } from '@/pages/Dashboard'

// Lazy loaded pages - carregam sob demanda
const NotificacoesPage = lazy(() => import('@/pages/Notificacoes').then(m => ({ default: m.NotificacoesPage })))
const AgendaPage = lazy(() => import('@/pages/Agenda').then(m => ({ default: m.AgendaPage })))
const PacientesPage = lazy(() => import('@/pages/Pacientes').then(m => ({ default: m.PacientesPage })))
const PacienteDetalhePage = lazy(() => import('@/pages/Pacientes/PacienteDetalhe').then(m => ({ default: m.PacienteDetalhePage })))
const ConfiguracoesPage = lazy(() => import('@/pages/Configuracoes').then(m => ({ default: m.ConfiguracoesPage })))
const FinanceiroPage = lazy(() => import('@/pages/Financeiro').then(m => ({ default: m.FinanceiroPage })))
const ContasAReceberPage = lazy(() => import('@/pages/Financeiro/ContasAReceber').then(m => ({ default: m.ContasAReceberPage })))
const DetalhesFaturaPage = lazy(() => import('@/pages/Financeiro/ContasAReceber/DetalhesFatura').then(m => ({ default: m.DetalhesFaturaPage })))
const CobrancaPage = lazy(() => import('@/pages/Financeiro/Cobranca').then(m => ({ default: m.CobrancaPage })))
const RepassePage = lazy(() => import('@/pages/Financeiro/Repasse').then(m => ({ default: m.RepassePage })))
const NFsEmitidasPage = lazy(() => import('@/pages/Financeiro/NFsEmitidas').then(m => ({ default: m.NFsEmitidasPage })))
const FaturamentoPage = lazy(() => import('@/pages/Faturamento').then(m => ({ default: m.FaturamentoPage })))
const PreFaturamentoPage = lazy(() => import('@/pages/Faturamento/PreFaturamento').then(m => ({ default: m.PreFaturamentoPage })))
const FaturamentosEmitidosPage = lazy(() => import('@/pages/Faturamento/FaturamentosEmitidos').then(m => ({ default: m.FaturamentosEmitidosPage })))
const ClientesPage = lazy(() => import('@/pages/Clientes').then(m => ({ default: m.ClientesPage })))
const ClienteDetalhePage = lazy(() => import('@/pages/Clientes/ClienteDetalhe').then(m => ({ default: m.ClienteDetalhePage })))
const UsuariosPage = lazy(() => import('@/pages/Usuarios').then(m => ({ default: m.UsuariosPage })))
const AuditoriaPage = lazy(() => import('@/pages/Auditoria').then(m => ({ default: m.AuditoriaPage })))
const MeuPerfilPage = lazy(() => import('@/pages/MeuPerfil').then(m => ({ default: m.MeuPerfilPage })))
const ApiDocsPage = lazy(() => import('@/pages/ApiDocs').then(m => ({ default: m.ApiDocsPage })))
const MetasPage = lazy(() => import('@/pages/Metas').then(m => ({ default: m.MetasPage })))
const PortalPacientePage = lazy(() => import('@/pages/PortalPaciente').then(m => ({ default: m.PortalPacientePage })))
const OrcamentosPage = lazy(() => import('@/pages/Orcamentos').then(m => ({ default: m.OrcamentosPage })))
const OrcamentoDetalhePage = lazy(() => import('@/pages/Orcamentos/OrcamentoDetalhePage').then(m => ({ default: m.OrcamentoDetalhePage })))
const PreferenciasPage = lazy(() => import('@/pages/Preferencias').then(m => ({ default: m.PreferenciasPage })))
const DocumentacaoPage = lazy(() => import('@/pages/Documentacao').then(m => ({ default: m.DocumentacaoPage })))
const AjudaSuportePage = lazy(() => import('@/pages/AjudaSuporte').then(m => ({ default: m.AjudaSuportePage })))
const RelatoriosPage = lazy(() => import('@/pages/Relatorios').then(m => ({ default: m.RelatoriosPage })))
const ReportPreviewPage = lazy(() => import('@/pages/Relatorios/ReportPreviewPage').then(m => ({ default: m.ReportPreviewPage })))

// Página para módulos em desenvolvimento
import { ModuleInProgressPage } from '@/pages/ModuleInProgress'

// Loading Fallback Component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

// Wrapper para páginas lazy com Suspense
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

// Public Route Component (redirect to home if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) {
    return null
  }

  return <>{children}</>
}

// Admin Route Component (redirect to home if not admin)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { currentPerfil, isLoading } = useModuleAccess()
  const navigate = useNavigate()

  const isAdmin = currentPerfil === 'admin_master' || currentPerfil === 'administrador_total' || currentPerfil === 'desenvolvedor'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' })
      return
    }
    // Só redireciona se não estiver carregando e não for admin
    if (!isLoading && currentPerfil && !isAdmin) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, isLoading, currentPerfil, isAdmin, navigate])

  if (!isAuthenticated) {
    return null
  }

  // Enquanto carrega, mostra loader
  if (isLoading) {
    return <PageLoader />
  }

  // Se não for admin, não renderiza
  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}

// Dev Route Component (admin_master ou desenvolvedor)
function DevRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { currentPerfil, isLoading } = useModuleAccess()
  const navigate = useNavigate()

  const isDev = currentPerfil === 'admin_master' || currentPerfil === 'desenvolvedor'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' })
      return
    }
    if (!isLoading && currentPerfil && !isDev) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, isLoading, currentPerfil, isDev, navigate])

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!isDev) {
    return null
  }

  return <>{children}</>
}

// Root Route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// Login Route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => (
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  ),
})

// Auth Callback Route (OAuth redirect)
const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
})

// Reset Password Route (link do email)
const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/reset-password',
  component: ResetPasswordPage,
})

// Home Route (protected)
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
})

// Agenda Route (protected)
const agendaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agenda',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Agenda"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Agenda' }]}
      >
        <LazyPage><AgendaPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Pacientes Route (protected)
const pacientesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pacientes',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Pacientes"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Pacientes' }]}
      >
        <LazyPage><PacientesPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Paciente Detalhe Route (protected)
const pacienteDetalheRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pacientes/$patientId',
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || undefined,
  }),
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Pacientes"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Pacientes', href: '/pacientes' },
          { label: 'Detalhes do paciente' },
        ]}
      >
        <LazyPage><PacienteDetalhePage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Faturamento Route (protected)
const faturamentoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faturamento',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Faturamento"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Faturamento' }]}
      >
        <LazyPage><FaturamentoPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Pré-faturamento Route (protected)
const preFaturamentoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faturamento/pre-faturamento',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Pré-faturamento"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Faturamento', href: '/faturamento' },
          { label: 'Pré-faturamento' },
        ]}
      >
        <LazyPage><PreFaturamentoPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Faturamentos Emitidos Route (protected)
const faturamentosEmitidosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faturamento/emitidos',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Faturamentos Emitidos"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Faturamento', href: '/faturamento' },
          { label: 'Faturamentos emitidos' },
        ]}
      >
        <LazyPage><FaturamentosEmitidosPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Financeiro Route (protected)
const financeiroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financeiro',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Financeiro"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Financeiro' }]}
      >
        <LazyPage><FinanceiroPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Contas a Receber Route (protected)
const contasAReceberRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financeiro/contas-a-receber',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Contas a Receber"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Financeiro', href: '/financeiro' },
          { label: 'Contas a receber' },
        ]}
      >
        <LazyPage><ContasAReceberPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Detalhes da Fatura Route (protected)
const detalhesFaturaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financeiro/contas-a-receber/$faturaId',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Detalhes da Fatura"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Financeiro', href: '/financeiro' },
          { label: 'Contas a receber', href: '/financeiro/contas-a-receber' },
          { label: 'Detalhes da fatura' },
        ]}
      >
        <LazyPage><DetalhesFaturaPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Cobrança Route (protected)
const cobrancaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financeiro/cobranca',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Cobrança"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Financeiro', href: '/financeiro' },
          { label: 'Cobrança' },
        ]}
      >
        <LazyPage><CobrancaPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Repasse Route (protected)
const repasseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financeiro/repasse',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Repasse"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Financeiro', href: '/financeiro' },
          { label: 'Repasse' },
        ]}
      >
        <LazyPage><RepassePage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// NFs Emitidas Route (protected)
const nfsEmitidasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financeiro/nfs-emitidas',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="NFs Emitidas"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Financeiro', href: '/financeiro' },
          { label: 'NFs Emitidas' },
        ]}
      >
        <LazyPage><NFsEmitidasPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Configurações Route (admin only)
const configuracoesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/configuracoes',
  component: () => (
    <AdminRoute>
      <MainLayout
        title="Configurações"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Configurações' }]}
      >
        <LazyPage><ConfiguracoesPage /></LazyPage>
      </MainLayout>
    </AdminRoute>
  ),
})

// Notificações Route (protected)
const notificacoesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notificacoes',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Notificações"
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Notificações' }]}
      >
        <LazyPage><NotificacoesPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Clientes Route (protected)
const clientesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clientes',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Clientes"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Clientes' }]}
      >
        <LazyPage><ClientesPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Cliente Detalhe Route (protected)
const clienteDetalheRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clientes/$clienteId',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Detalhes do Cliente"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Clientes', href: '/clientes' },
          { label: 'Detalhes do cliente' },
        ]}
      >
        <LazyPage><ClienteDetalhePage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Usuários Route (admin only)
const usuariosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/usuarios',
  component: () => (
    <AdminRoute>
      <MainLayout
        title="Usuários"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Usuários' }]}
      >
        <LazyPage><UsuariosPage /></LazyPage>
      </MainLayout>
    </AdminRoute>
  ),
})

// Auditoria Route (protected)
const auditoriaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auditoria',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Auditoria"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Auditoria' }]}
      >
        <LazyPage><AuditoriaPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Meu Perfil Route (protected)
const meuPerfilRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meu-perfil',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Meu Perfil"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Meu Perfil' }]}
      >
        <LazyPage><MeuPerfilPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// API Docs Route (dev only - admin_master ou desenvolvedor)
const apiDocsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-docs',
  component: () => (
    <DevRoute>
      <MainLayout
        title="API Docs"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'API Docs' }]}
      >
        <LazyPage><ApiDocsPage /></LazyPage>
      </MainLayout>
    </DevRoute>
  ),
})

// =====================================================
// MÓDULOS EM DESENVOLVIMENTO
// Rotas para módulos que ainda não estão 100% implementados
// =====================================================

// M10 - Metas Terapêuticas (implementado)
const metasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/metas',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Metas Terapêuticas"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Metas Terapêuticas' }]}
      >
        <LazyPage><MetasPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Portal do Paciente - Rota pública (acesso via token)
const portalTokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portal/$token',
  component: () => (
    <LazyPage><PortalPacientePage /></LazyPage>
  ),
})

// M5 - Portal do Paciente (não implementado)
const portalPacienteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portal-paciente',
  component: () => (
    <ProtectedRoute>
      <ModuleInProgressPage
        moduleName="Portal do Paciente"
        moduleSlug="portal_paciente"
        description="O Portal do Paciente permitirá que pacientes acessem seus agendamentos, histórico médico e documentos de forma segura."
      />
    </ProtectedRoute>
  ),
})

// M6 - Integrações (parcialmente implementado)
const integracoesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/integracoes',
  component: () => (
    <ProtectedRoute>
      <ModuleInProgressPage
        moduleName="Integrações"
        moduleSlug="integracoes"
        description="O módulo de Integrações permitirá configurar envio automático de lembretes por WhatsApp, SMS e email, além de integração com sistemas contábeis."
      />
    </ProtectedRoute>
  ),
})

// M7 - Relatórios (implementado)
const relatoriosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/relatorios',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Relatórios"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Relatórios' }]}
      >
        <LazyPage><RelatoriosPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// M7 - Relatórios Preview
const relatoriosPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/relatorios/preview',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Visualizar Relatório"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Relatórios', href: '/relatorios' },
          { label: 'Visualizar' },
        ]}
      >
        <LazyPage><ReportPreviewPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// M2 - Prontuário: Removido do sidebar conforme PRD
// "Acesso via Agenda ou Menu Paciente" - não tem rota dedicada
// Acesso é feito via: /pacientes/:patientId (Tab Prontuário)

// Preferências do Usuário Route (protected) - acessível a todos os usuários
const preferenciasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/preferencias',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Configurações"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Configurações' }]}
      >
        <LazyPage><PreferenciasPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Documentação Route (protected)
const documentacaoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documentacao',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Documentação"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Documentação' }]}
      >
        <LazyPage><DocumentacaoPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Ajuda e Suporte Route (protected)
const ajudaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ajuda',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Ajuda e Suporte"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Ajuda e Suporte' }]}
      >
        <LazyPage><AjudaSuportePage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Orçamentos Route (protected)
const orcamentosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orcamentos',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Orçamentos"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Orçamentos' }]}
      >
        <LazyPage><OrcamentosPage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Orçamento Detalhe Route (protected)
const orcamentoDetalheRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orcamentos/$orcamentoId',
  component: () => (
    <ProtectedRoute>
      <MainLayout
        title="Detalhes do Orçamento"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Orçamentos', href: '/orcamentos' },
          { label: 'Detalhes do orçamento' },
        ]}
      >
        <LazyPage><OrcamentoDetalhePage /></LazyPage>
      </MainLayout>
    </ProtectedRoute>
  ),
})

// Route Tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  authCallbackRoute,
  resetPasswordRoute,
  homeRoute,
  agendaRoute,
  pacientesRoute,
  pacienteDetalheRoute,
  faturamentoRoute,
  preFaturamentoRoute,
  faturamentosEmitidosRoute,
  financeiroRoute,
  contasAReceberRoute,
  detalhesFaturaRoute,
  cobrancaRoute,
  repasseRoute,
  nfsEmitidasRoute,
  clientesRoute,
  clienteDetalheRoute,
  usuariosRoute,
  auditoriaRoute,
  meuPerfilRoute,
  configuracoesRoute,
  notificacoesRoute,
  apiDocsRoute,
  // Módulos implementados
  metasRoute,
  portalTokenRoute,
  relatoriosRoute,
  relatoriosPreviewRoute,
  // Módulos em desenvolvimento
  portalPacienteRoute,
  integracoesRoute,
  // prontuarioRoute removido - acesso via /pacientes/:patientId
  // Orçamentos
  orcamentosRoute,
  orcamentoDetalheRoute,
  // Páginas auxiliares
  preferenciasRoute,
  documentacaoRoute,
  ajudaRoute,
])

// Router
export const router = createRouter({ routeTree })

// Type Registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
