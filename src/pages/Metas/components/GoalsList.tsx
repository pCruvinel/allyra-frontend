/**
 * GoalsList - Lista de metas de um plano terapêutico
 * Padrões UI: cards com borda sutil, progress bars, action buttons
 */

import { useState } from 'react'
import { Plus, Edit2, Trash2, Target, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { ProgressCard } from '@/components/ui/progress-card'
import { cn } from '@/lib/utils'
import type { TherapeuticPlan, TherapeuticGoal, GoalInputType } from '@/types/goals'

interface GoalsListProps {
  plan: TherapeuticPlan
  goals: TherapeuticGoal[]
  isLoading?: boolean
  onNewGoal: () => void
  onEditGoal: (goal: TherapeuticGoal) => void
  onDeleteGoal: (goalId: string) => void
  onRegisterProgress: (goal: TherapeuticGoal) => void
}

const inputTypeLabels: Record<GoalInputType, string> = {
  numerico: 'Numérico',
  booleano: 'Sim/Não',
  escala: 'Escala',
  protocolo: 'Protocolo',
}

const inputTypeColors: Record<GoalInputType, string> = {
  numerico: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  booleano: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  escala: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  protocolo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

export function GoalsList({
  plan,
  goals,
  isLoading,
  onNewGoal,
  onEditGoal,
  onDeleteGoal,
  onRegisterProgress,
}: GoalsListProps) {
  const [goalToDelete, setGoalToDelete] = useState<TherapeuticGoal | null>(null)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="p-5 border-b border-border/50">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-5 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  // Calcula progresso atual baseado nos registros
  const getGoalProgress = (goal: TherapeuticGoal) => {
    const target = parseFloat(goal.meta_esperada || '0')
    if (!target || isNaN(target)) return { current: 0, target: 0 }
    const current = goal.valor_atual || 0
    return { current, target }
  }

  const handleConfirmDeleteGoal = () => {
    if (!goalToDelete) {
      return
    }

    onDeleteGoal(goalToDelete.id)
    setGoalToDelete(null)
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-lg">{plan.nome}</h2>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                  <StatusIndicator status={plan.status} size="sm" />
                  <span>•</span>
                  <span>{formatDate(plan.data_inicio)} - {formatDate(plan.data_fim)}</span>
                  <span>•</span>
                  <span className="font-medium text-primary">{goals.length} meta{goals.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={onNewGoal} className="rounded-full">
            <Plus size={16} className="mr-1.5" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Goals List */}
      <div className="p-5">
        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma meta cadastrada"
            description="Clique em 'Nova Meta' para adicionar metas a este plano."
          />
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const progress = getGoalProgress(goal)
              const isNumeric = goal.tipo_input === 'numerico' || goal.tipo_input === 'escala'
              const progressPercent = progress.target > 0 ? Math.round((progress.current / progress.target) * 100) : 0
              const isAchieved = progressPercent >= 100

              return (
                <div
                  key={goal.id}
                  className={cn(
                    'group p-5 rounded-xl border border-border/50 bg-card',
                    'transition-all duration-200 hover:shadow-md hover:border-primary/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header da Meta */}
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <h4 className="font-semibold text-foreground text-base">
                          {goal.titulo || goal.descricao}
                        </h4>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium',
                          inputTypeColors[goal.tipo_input]
                        )}>
                          {inputTypeLabels[goal.tipo_input]}
                        </span>
                        {goal.status && (
                          <StatusIndicator status={goal.status} size="sm" />
                        )}
                        {isAchieved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle2 size={12} />
                            Atingida
                          </span>
                        )}
                      </div>

                      {/* Descrição */}
                      {goal.titulo && goal.descricao && (
                        <p className="text-sm text-muted-foreground mb-3 bg-muted/30 p-3 rounded-lg">
                          {goal.descricao}
                        </p>
                      )}

                      {/* Meta Esperada e Progresso */}
                      <div className="flex items-center gap-6 text-sm mb-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-muted-foreground">Meta:</span>
                          <span className="font-semibold text-foreground">
                            {goal.meta_esperada}
                            {goal.unidade && <span className="text-muted-foreground ml-1">{goal.unidade}</span>}
                          </span>
                        </div>
                        {isNumeric && progress.current > 0 && (
                          <div className="flex items-baseline gap-2">
                            <span className="text-muted-foreground">Atual:</span>
                            <span className="font-semibold text-primary">
                              {progress.current}
                              {goal.unidade && <span className="text-muted-foreground ml-1">{goal.unidade}</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar (apenas para tipos numéricos) */}
                      {isNumeric && progress.target > 0 && (
                        <div className="mt-3">
                          <ProgressCard
                            title=""
                            current={progress.current}
                            target={progress.target}
                            unit={goal.unidade}
                            variant="compact"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-full"
                        onClick={() => onRegisterProgress(goal)}
                        title="Registrar progresso"
                      >
                        <TrendingUp size={14} className="mr-1.5" />
                        Registrar
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditGoal(goal)}
                          title="Editar meta"
                        >
                          <Edit2 size={14} className="text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setGoalToDelete(goal)}
                          title="Excluir meta"
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleConfirmDeleteGoal}
        title="Excluir meta terapêutica"
        heading="Confirme a exclusão"
        description={
          goalToDelete
            ? `A meta "${goalToDelete.titulo || goalToDelete.descricao}" será removida permanentemente.`
            : ''
        }
        confirmLabel="Excluir meta"
        cancelLabel="Cancelar"
        variant="danger"
        headerColor="danger"
      />
    </div>
  )
}
