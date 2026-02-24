/**
 * GoalsExecutionWidget - Widget para registro de metas durante atendimento
 * Exibe metas do paciente e permite registrar progresso por tipo de input
 */

import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  Circle,
  MinusCircle,
  AlertCircle,
  ArrowLeft,
  Users,
  Target,
  Save,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ViewToggle } from '@/components/ui/view-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { usePatients } from '@/hooks/usePatients'
import { useGoals } from '@/hooks/useGoals'
import { useTherapeuticPlans } from '@/hooks/useTherapeuticPlans'
import { toast } from 'sonner'
import type { TherapeuticGoal } from '@/types/goals'

type ViewMode = 'grid' | 'list'
type GoalStatus = 'pending' | 'achieved' | 'partial' | 'not-achieved'

interface GoalValue {
  goalId: string
  value: string
}

interface GoalsExecutionWidgetProps {
  searchQuery?: string
}

export function GoalsExecutionWidget({ searchQuery = '' }: GoalsExecutionWidgetProps) {
  const { patients, isLoading: patientsLoading } = usePatients()
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [goalValues, setGoalValues] = useState<GoalValue[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const attendanceDate = new Date().toLocaleDateString('pt-BR')

  // Busca planos do paciente selecionado
  const { plans, isLoading: plansLoading } = useTherapeuticPlans({
    autoFetch: !!selectedPatientId,
    pacienteId: selectedPatientId || undefined,
  })

  // Plano ativo (primeiro plano ativo encontrado)
  const activePlan = useMemo(() => {
    return plans.find(p => p.status === 'ativo')
  }, [plans])

  // Busca metas do plano ativo
  const { goals, isLoading: goalsLoading } = useGoals({
    autoFetch: !!activePlan?.id,
    planoId: activePlan?.id,
  })

  const currentPatient = patients.find(p => p.id === selectedPatientId)
  const activePatients = patients.filter(p => p.status !== 'inactive')

  // Filtrar pacientes pela busca
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return activePatients
    const query = searchQuery.toLowerCase()
    return activePatients.filter((p) => p.name.toLowerCase().includes(query))
  }, [activePatients, searchQuery])

  // Helpers
  const getGoalValue = (goalId: string): string => {
    return goalValues.find(g => g.goalId === goalId)?.value || ''
  }

  const updateGoalValue = (goalId: string, value: string) => {
    setGoalValues(prev => {
      const existing = prev.find(g => g.goalId === goalId)
      if (existing) {
        return prev.map(g => g.goalId === goalId ? { ...g, value } : g)
      }
      return [...prev, { goalId, value }]
    })
  }

  const getCompletionStatus = (goal: TherapeuticGoal): GoalStatus => {
    const value = getGoalValue(goal.id)
    if (!value) return 'pending'

    const tipoInput = goal.tipo_input || 'numerico'

    if (tipoInput === 'numerico') {
      const current = parseFloat(value)
      const expected = parseFloat(goal.meta_esperada || '0')
      return current >= expected ? 'achieved' : 'partial'
    }

    if (tipoInput === 'booleano') {
      return value === 'Sim' ? 'achieved' : 'not-achieved'
    }

    if (tipoInput === 'escala') {
      const current = parseFloat(value)
      const expected = parseFloat(goal.meta_esperada || '0')
      if (current >= expected) return 'achieved'
      if (current >= expected * 0.7) return 'partial'
      return 'not-achieved'
    }

    return 'pending'
  }

  const filledGoals = goals.filter(g => getGoalValue(g.id)).length
  const totalGoals = goals.length
  const completionPercentage = totalGoals > 0 ? Math.round((filledGoals / totalGoals) * 100) : 0

  const handleSaveDraft = async () => {
    setIsSaving(true)
    // TODO: Implementar salvamento de rascunho
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success('Rascunho salvo!')
    setIsSaving(false)
  }

  const handleFinish = async () => {
    if (filledGoals < totalGoals) {
      toast.error('Preencha todas as metas antes de finalizar')
      return
    }

    setIsSaving(true)
    // TODO: Implementar salvamento final via API (registro_progresso)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Atendimento finalizado com sucesso!')
    setIsSaving(false)

    // Reset
    setSelectedPatientId(null)
    setGoalValues([])
    setObservacoes('')
  }

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Atendimento</h2>
              <p className="text-sm text-muted-foreground">
                Selecione um paciente para iniciar o registro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ViewToggle
              value={viewMode}
              onChange={(mode) => setViewMode(mode as ViewMode)}
              storageKey="metas-attendance-view"
            />

            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
              <Users size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Pacientes */}
        {filteredPatients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            description={
              searchQuery
                ? `Não encontramos pacientes para "${searchQuery}". Tente outro termo de busca.`
                : 'Cadastre pacientes para iniciar atendimentos.'
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map(patient => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatientId(patient.id)}
                className="bg-card rounded-xl border border-border p-5 text-left hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground">
                    {patient.name}
                  </h3>
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Ativo
                  </span>
                </div>

                {/* Info adicional */}
                <div className="space-y-1 text-sm mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Metas ativas:</span>
                    <span className="font-medium text-primary">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próximo atendimento:</span>
                    <span className="font-medium text-foreground">—</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm font-medium text-primary">
                    Iniciar atendimento →
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-foreground uppercase">
                    Nome do Paciente
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-foreground uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-foreground uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(patient => (
                  <tr key={patient.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {patient.name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Ativo
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedPatientId(patient.id)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Iniciar atendimento →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // View: Formulário de Atendimento
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => {
          setSelectedPatientId(null)
          setGoalValues([])
          setObservacoes('')
        }}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Voltar para pacientes</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-xl bg-card border border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Atendimento em Andamento
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentPatient?.name} - {attendanceDate}
          </p>
        </div>

        <div className="px-4 py-2 rounded-lg border border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">Progresso: </span>
          <span className="font-semibold text-primary">
            {filledGoals}/{totalGoals} ({completionPercentage}%)
          </span>
        </div>
      </div>

      {/* Warning if incomplete */}
      {filledGoals < totalGoals && totalGoals > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Você ainda tem {totalGoals - filledGoals} meta{totalGoals - filledGoals !== 1 ? 's' : ''} para preencher
          </p>
        </div>
      )}

      {/* Goals List */}
      {plansLoading || goalsLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !activePlan ? (
        <EmptyState
          icon={Target}
          title="Nenhum plano ativo"
          description="Este paciente não possui um plano terapêutico ativo. Crie um plano na aba Planos."
        />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta cadastrada"
          description="Adicione metas ao plano terapêutico deste paciente."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-5">Registro de Metas</h3>

          <div className="space-y-6">
            {goals.map(goal => {
              const status = getCompletionStatus(goal)
              const tipoInput = goal.tipo_input || 'numerico'
              const value = getGoalValue(goal.id)

              return (
                <div key={goal.id} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div className="pt-1">
                      {status === 'pending' && <Circle size={20} className="text-muted-foreground" />}
                      {status === 'achieved' && <CheckCircle2 size={20} className="text-primary" />}
                      {status === 'partial' && <MinusCircle size={20} className="text-amber-500" />}
                      {status === 'not-achieved' && <MinusCircle size={20} className="text-destructive" />}
                    </div>

                    <div className="flex-1">
                      {/* Goal Info */}
                      <div className="mb-3">
                        <h4 className="font-semibold text-foreground mb-1">
                          {goal.titulo || goal.descricao}
                        </h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Meta: <span className="text-foreground">{goal.meta_esperada}</span>
                            {goal.unidade && <span className="text-muted-foreground"> {goal.unidade}</span>}
                          </span>
                        </div>
                      </div>

                      {/* Input por tipo */}
                      <div className="max-w-md">
                        {tipoInput === 'numerico' && (
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Resultado de hoje
                            </label>
                            <Input
                              type="number"
                              value={value}
                              onChange={(e) => updateGoalValue(goal.id, e.target.value)}
                              placeholder={`Meta: ${goal.meta_esperada}`}
                            />
                          </div>
                        )}

                        {tipoInput === 'booleano' && (
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Resultado de hoje
                            </label>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant={value === 'Sim' ? 'default' : 'outline'}
                                onClick={() => updateGoalValue(goal.id, 'Sim')}
                                className="flex-1"
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                variant={value === 'Não' ? 'destructive' : 'outline'}
                                onClick={() => updateGoalValue(goal.id, 'Não')}
                                className="flex-1"
                              >
                                Não
                              </Button>
                            </div>
                          </div>
                        )}

                        {tipoInput === 'escala' && (
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Nível (1 = Total, 5 = Independente)
                            </label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(n => (
                                <Button
                                  key={n}
                                  type="button"
                                  variant={value === String(n) ? 'default' : 'outline'}
                                  onClick={() => updateGoalValue(goal.id, String(n))}
                                  className="flex-1 h-12 text-lg font-bold"
                                >
                                  {n}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex-1"
            >
              <Save size={16} className="mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              onClick={handleFinish}
              disabled={isSaving || filledGoals < totalGoals}
              className="flex-1"
            >
              <CheckCheck size={16} className="mr-2" />
              Finalizar Atendimento
            </Button>
          </div>
        </div>
      )}

      {/* Observações */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-2">Observações do Atendimento</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione observações sobre a sessão, comportamentos ou progressos notáveis
        </p>
        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: O paciente demonstrou boa participação..."
          rows={4}
        />
      </div>
    </div>
  )
}
