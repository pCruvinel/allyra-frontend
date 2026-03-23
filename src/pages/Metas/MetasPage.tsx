/**
 * MetasPage - Página principal do módulo de Metas Terapêuticas (M10)
 * Gerenciamento de planos terapêuticos, metas e progresso
 *
 * Suporta dois modos:
 * - Integrado: Usa pacientes e agendamentos do sistema principal
 * - Stand-alone (Avulso): Gestão manual de pacientes e atendimentos
 */

import { useState, useMemo } from 'react'
import { Plus, ArrowLeft, Users, Target, FileText, Share2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ViewToggle } from '@/components/ui/view-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePatients } from '@/hooks/usePatients'
import { useTherapeuticPlans } from '@/hooks/useTherapeuticPlans'
import { useGoals } from '@/hooks/useGoals'
import { PatientSelector } from './components/PatientSelector'
import { PlansList } from './components/PlansList'
import { GoalsList } from './components/GoalsList'
import { NewPlanModal } from './components/modals/NewPlanModal'
import { NewGoalModal } from './components/modals/NewGoalModal'
import { RegisterProgressModal } from './components/modals/RegisterProgressModal'
import { ShareModal } from './components/modals/ShareModal'
import { ReportModal } from './components/modals/ReportModal'
import { GoalsExecutionWidget } from './components/GoalsExecutionWidget'
import { DevolutivaTab } from './components/DevolutivaTab'
import { MetasNavbar } from './components/MetasNavbar'
import { AttendanceRegistry, StandaloneOnboarding } from './components/standalone'
import { MetasModeProvider, useMetasMode } from './contexts/MetasModeContext'
import type { TherapeuticPlan, TherapeuticGoal, PlanStatus } from '@/types/goals'
import { useAuth } from '@/contexts/AuthContext'

// Tipo do formulário do modal (deve corresponder ao NewPlanModal)
interface PlanFormData {
  nome: string
  data_inicio: string
  data_fim: string
  status: PlanStatus
  observacoes?: string
}

type ViewMode = 'grid' | 'list'
type TabView = 'registro' | 'planos' | 'atendimento' | 'devolutiva'

// Componente interno que usa o contexto de modo
function MetasPageContent() {
  const { isStandaloneMode } = useMetasMode()
  // Contexto de autenticação
  const { user } = useAuth()

  // Estado de navegação por tabs
  const [activeTab, setActiveTab] = useState<TabView>('planos')

  // Estado de busca
  const [searchQuery, setSearchQuery] = useState('')

  // Estado local
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<TherapeuticPlan | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<TherapeuticGoal | null>(null)

  // Modais
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false)
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TherapeuticPlan | null>(null)
  const [editingGoal, setEditingGoal] = useState<TherapeuticGoal | null>(null)

  // Hooks de dados
  const { patients, isLoading: patientsLoading } = usePatients()

  const {
    plans,
    isLoading: plansLoading,
    createPlan,
    updatePlan,
    deletePlan,
  } = useTherapeuticPlans({
    autoFetch: !!selectedPatientId,
    pacienteId: selectedPatientId || undefined
  })

  const {
    goals,
    isLoading: goalsLoading,
    createGoal,
    updateGoal,
    deleteGoal,
  } = useGoals({
    autoFetch: !!selectedPlan?.id,
    planoId: selectedPlan?.id,
  })

  // Paciente selecionado
  const currentPatient = useMemo(() =>
    patients.find(p => p.id === selectedPatientId),
    [patients, selectedPatientId]
  )

  // Handlers de navegação
  const handleBackToPatients = () => {
    setSelectedPatientId(null)
    setSelectedPlan(null)
    setSelectedGoal(null)
  }

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId)
    setSelectedPlan(null)
  }

  const handleSelectPlan = (plan: TherapeuticPlan) => {
    setSelectedPlan(plan)
  }

  // Handlers de Planos
  const handleNewPlan = () => {
    setEditingPlan(null)
    setIsNewPlanModalOpen(true)
  }

  const handleEditPlan = (plan: TherapeuticPlan) => {
    setEditingPlan(plan)
    setIsNewPlanModalOpen(true)
  }

  const handleDeletePlan = async (planId: string) => {
    await deletePlan(planId)
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null)
    }
  }

  const handleSavePlan = async (data: PlanFormData) => {
    if (editingPlan) {
      // Ao editar, passa apenas os campos que mudaram
      await updatePlan(editingPlan.id, {
        nome: data.nome,
        data_inicio: data.data_inicio,
        data_fim_prevista: data.data_fim,
        status: data.status,
      })
    } else {
      // Ao criar, adiciona campos obrigatórios
      await createPlan({
        paciente_id: selectedPatientId!,
        nome: data.nome,
        tipo_plano: 'geral',
        profissional_responsavel_id: user?.id || '',
        data_inicio: data.data_inicio,
        data_fim_prevista: data.data_fim,
      })
    }
    setIsNewPlanModalOpen(false)
    setEditingPlan(null)
  }

  // Handlers de Metas
  const handleNewGoal = () => {
    setEditingGoal(null)
    setIsNewGoalModalOpen(true)
  }

  const handleEditGoal = (goal: TherapeuticGoal) => {
    setEditingGoal(goal)
    setIsNewGoalModalOpen(true)
  }

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId)
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(null)
    }
  }

  const handleSaveGoal = async (data: Parameters<typeof createGoal>[0]) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data)
    } else {
      await createGoal(data)
    }
    setIsNewGoalModalOpen(false)
    setEditingGoal(null)
  }

  // Handler de Progresso
  const handleRegisterProgress = (goal: TherapeuticGoal) => {
    setSelectedGoal(goal)
    setIsProgressModalOpen(true)
  }

  // Handler de Compartilhamento
  const handleSharePlan = (plan: TherapeuticPlan) => {
    setSelectedPlan(plan)
    setIsShareModalOpen(true)
  }

  // Handler de Relatório
  const handleViewReport = (plan: TherapeuticPlan) => {
    setSelectedPlan(plan)
    setIsReportModalOpen(true)
  }

  // Conteúdo da aba Planos (antigo conteúdo principal)
  const renderPlanosContent = () => {
    // Loading state
    if (patientsLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      )
    }

    // View: Lista de Pacientes (quando nenhum selecionado)
    if (!selectedPatientId) {
      return (
        <div className="space-y-6">
          {/* Header compacto */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Planos Terapêuticos</h2>
                <p className="text-sm text-muted-foreground">
                  Selecione um paciente para gerenciar seus planos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ViewToggle
                value={viewMode}
                onChange={(mode) => setViewMode(mode as ViewMode)}
                storageKey="metas-patient-view"
              />

              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
                <Users size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {patients.length} paciente{patients.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Seletor de Pacientes */}
          {patients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum paciente cadastrado"
              description="Cadastre pacientes para criar planos terapêuticos."
            />
          ) : (
            <PatientSelector
              patients={patients}
              viewMode={viewMode}
              onSelectPatient={handleSelectPatient}
            />
          )}
        </div>
      )
    }

    // View: Planos do Paciente
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={handleBackToPatients}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Voltar para pacientes</span>
        </button>

        {/* Header do Paciente */}
        <div className="flex items-center justify-between p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {currentPatient?.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-muted-foreground">Planos e metas</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-sm font-medium text-primary">{plans.length} plano{plans.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedPlan && handleViewReport(selectedPlan)}
              disabled={!selectedPlan}
            >
              <BarChart3 size={16} className="mr-1.5" />
              Relatório
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedPlan && handleSharePlan(selectedPlan)}
              disabled={!selectedPlan}
            >
              <Share2 size={16} className="mr-1.5" />
              Compartilhar
            </Button>

            <Button onClick={handleNewPlan} size="sm">
              <Plus size={16} className="mr-1.5" />
              Novo Plano
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        {plansLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum plano cadastrado"
            description={`Clique em "Novo Plano" para criar o primeiro plano terapêutico para ${currentPatient?.name}`}
            action={{
              label: 'Novo Plano',
              onClick: handleNewPlan,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Planos */}
            <div className="lg:col-span-1">
              <PlansList
                plans={plans}
                selectedPlanId={selectedPlan?.id}
                onSelectPlan={handleSelectPlan}
                onEditPlan={handleEditPlan}
                onDeletePlan={handleDeletePlan}
                onSharePlan={handleSharePlan}
              />
            </div>

            {/* Lista de Metas do Plano Selecionado */}
            <div className="lg:col-span-2">
              {selectedPlan ? (
                <GoalsList
                  plan={selectedPlan}
                  goals={goals}
                  isLoading={goalsLoading}
                  onNewGoal={handleNewGoal}
                  onEditGoal={handleEditGoal}
                  onDeleteGoal={handleDeleteGoal}
                  onRegisterProgress={handleRegisterProgress}
                />
              ) : (
                <div className="flex items-center justify-center h-80 rounded-xl border border-border bg-card">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                      <Target className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Nenhum plano selecionado</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Selecione um plano ao lado para visualizar suas metas
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modais */}
        <NewPlanModal
          isOpen={isNewPlanModalOpen}
          onClose={() => {
            setIsNewPlanModalOpen(false)
            setEditingPlan(null)
          }}
          onSave={handleSavePlan}
          patientId={selectedPatientId}
          patientName={currentPatient?.name || ''}
          editingPlan={editingPlan}
        />

        <NewGoalModal
          isOpen={isNewGoalModalOpen}
          onClose={() => {
            setIsNewGoalModalOpen(false)
            setEditingGoal(null)
          }}
          onSave={handleSaveGoal}
          planId={selectedPlan?.id || ''}
          editingGoal={editingGoal}
        />

        {selectedGoal && (
          <RegisterProgressModal
            isOpen={isProgressModalOpen}
            onClose={() => {
              setIsProgressModalOpen(false)
              setSelectedGoal(null)
            }}
            goal={selectedGoal}
          />
        )}

        {selectedPlan && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            planId={selectedPlan.id}
            planName={selectedPlan.nome}
            patientName={currentPatient?.name || ''}
          />
        )}

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          plan={selectedPlan}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header: Título */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Metas Terapêuticas
          </h1>
          <p className="text-sm text-muted-foreground">
            {isStandaloneMode
              ? 'Modo avulso: Registre atendimentos manualmente'
              : 'Modo integrado: Usando dados do sistema principal'}
          </p>
        </div>
      </div>

      {/* SearchBar do modulo e acesso ao tutorial */}
      <MetasNavbar
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabView)} className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 p-1 rounded-xl">
          {/* Abas do modo stand-alone (apenas visíveis nesse modo) */}
          {isStandaloneMode && (
            <TabsTrigger value="registro" className="rounded-lg data-[state=active]:bg-card gap-2">
              Registro de Atendimento
              <Badge variant="secondary" className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                NOVO
              </Badge>
            </TabsTrigger>
          )}

          {/* Abas sempre visíveis */}
          <TabsTrigger value="planos" className="rounded-lg data-[state=active]:bg-card">
            Planos Terapêuticos
          </TabsTrigger>
          <TabsTrigger value="atendimento" className="rounded-lg data-[state=active]:bg-card">
            Atendimento
          </TabsTrigger>
          <TabsTrigger value="devolutiva" className="rounded-lg data-[state=active]:bg-card">
            Devolutiva
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das Tabs */}
        {isStandaloneMode && (
          <TabsContent value="registro" className="mt-6">
            <AttendanceRegistry searchQuery={searchQuery} />
          </TabsContent>
        )}

        <TabsContent value="planos" className="mt-6">
          {renderPlanosContent()}
        </TabsContent>

        <TabsContent value="atendimento" className="mt-6">
          <GoalsExecutionWidget searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="devolutiva" className="mt-6">
          <DevolutivaTab searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>

      {/* Onboarding do modo stand-alone */}
      <StandaloneOnboarding onNavigate={(tab) => setActiveTab(tab as TabView)} />
    </div>
  )
}

// Componente exportado que envolve com o Provider
export function MetasPage() {
  return (
    <MetasModeProvider>
      <MetasPageContent />
    </MetasModeProvider>
  )
}
