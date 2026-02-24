/**
 * PlansList - Lista de planos terapêuticos do paciente
 * Padrões UI: cards com borda colorida por status, hover states
 */

import { cn } from '@/lib/utils'
import { Edit2, Trash2, Share2, MoreVertical, Calendar, Target, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/radix-dropdown-menu'
import { StatusIndicator } from '@/components/ui/status-indicator'
import type { TherapeuticPlan } from '@/types/goals'

interface PlansListProps {
  plans: TherapeuticPlan[]
  selectedPlanId?: string
  onSelectPlan: (plan: TherapeuticPlan) => void
  onEditPlan: (plan: TherapeuticPlan) => void
  onDeletePlan: (planId: string) => void
  onSharePlan: (plan: TherapeuticPlan) => void
}

// Cores da borda esquerda por status
const statusBorderColors: Record<string, string> = {
  ativo: 'border-l-green-500',
  concluido: 'border-l-blue-500',
  cancelado: 'border-l-red-500',
  pausado: 'border-l-amber-500',
}

export function PlansList({
  plans,
  selectedPlanId,
  onSelectPlan,
  onEditPlan,
  onDeletePlan,
  onSharePlan,
}: PlansListProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Target size={16} />
          Gestão de Planos Terapêuticos
        </h2>
        <p className="text-xs text-muted-foreground pl-6">
          Selecione um plano para gerenciar suas metas
        </p>
      </div>

      <div className="space-y-3">
        {plans.map(plan => (
          <div
            key={plan.id}
            onClick={() => onSelectPlan(plan)}
            className={cn(
              'group rounded-xl border border-border/60 bg-card p-4 cursor-pointer',
              'border-l-4 transition-all duration-200',
              statusBorderColors[plan.status] || 'border-l-gray-400',
              'hover:shadow-md hover:border-primary/30',
              selectedPlanId === plan.id && 'ring-2 ring-primary/20 border-primary/50 bg-primary/5'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Header com nome e status */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={cn(
                    'font-semibold truncate transition-colors',
                    selectedPlanId === plan.id ? 'text-primary' : 'text-foreground group-hover:text-primary'
                  )}>
                    {plan.nome}
                  </h3>
                  <StatusIndicator status={plan.status} size="sm" />
                </div>

                {/* Datas */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  <span>{formatDate(plan.data_inicio)}</span>
                  <span className="text-muted-foreground/50">→</span>
                  <span>{formatDate(plan.data_fim)}</span>
                </div>

                {/* Observações */}
                {plan.observacoes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-muted/30 p-2 rounded-lg">
                    {plan.observacoes}
                  </p>
                )}

                {/* Link de ação (mobile friendly) */}
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Clique para ver metas
                  </span>
                  <ChevronRight size={14} className={cn(
                    'text-muted-foreground transition-all',
                    'group-hover:text-primary group-hover:translate-x-1'
                  )} />
                </div>
              </div>

              {/* Menu de ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      onEditPlan(plan)
                    }}
                  >
                    <Edit2 size={14} className="mr-2" />
                    Editar plano
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      onSharePlan(plan)
                    }}
                  >
                    <Share2 size={14} className="mr-2" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      onDeletePlan(plan.id)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
