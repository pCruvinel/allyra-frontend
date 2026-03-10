import { useState, useMemo } from 'react'
import { Circle, CheckCircle2, MinusCircle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useTherapeuticPlans } from '@/hooks/useTherapeuticPlans'
import { useGoals } from '@/hooks/useGoals'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { TherapeuticGoal } from '@/types/goals'

interface GoalValue {
  meta_id: string
  valor_registrado: string
  status_classificacao: 'atingido' | 'nao_atingido' | 'parcial' | 'nao_avaliado'
  tipo_input: string
}

interface PatientGoalsWidgetProps {
  patientId: string
  clinicaId: string
}

export function PatientGoalsWidget({ patientId, clinicaId }: PatientGoalsWidgetProps) {
  const [goalValues, setGoalValues] = useState<Record<string, GoalValue>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Busca planos do paciente selecionado
  const { plans, isLoading: plansLoading } = useTherapeuticPlans({
    autoFetch: true,
    pacienteId: patientId,
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

  // Helpers
  const getCompletionStatus = (goal: TherapeuticGoal, value: string): GoalValue['status_classificacao'] => {
    if (!value) return 'nao_avaliado'

    const tipoInput = goal.tipo_input || 'numerico'

    if (tipoInput === 'numerico') {
      const current = parseFloat(value)
      const expected = parseFloat(goal.meta_esperada || '0')
      return current >= expected ? 'atingido' : 'parcial'
    }

    if (tipoInput === 'booleano') {
      return value === 'Sim' ? 'atingido' : 'nao_atingido'
    }

    if (tipoInput === 'escala') {
      const current = parseFloat(value)
      const expected = parseFloat(goal.meta_esperada || '0')
      if (current >= expected) return 'atingido'
      if (current >= expected * 0.7) return 'parcial'
      return 'nao_atingido'
    }

    return 'nao_avaliado'
  }

  const updateGoalValue = (goal: TherapeuticGoal, value: string) => {
    const status = getCompletionStatus(goal, value)
    
    setGoalValues(prev => ({
      ...prev,
      [goal.id]: {
        meta_id: goal.id,
        valor_registrado: value,
        status_classificacao: status,
        tipo_input: goal.tipo_input || 'numerico'
      }
    }))
  }

  const handleSave = async () => {
    if (!supabase) {
      toast.error('Supabase Client não configurado.')
      return
    }

    const recordsToSave = Object.values(goalValues).filter(v => v.valor_registrado !== '')
    
    if (recordsToSave.length === 0) {
      toast.info('Nenhuma meta avaliada para salvar.')
      return
    }

    setIsSaving(true)
    try {
      const payloads = recordsToSave.map(record => ({
        meta_id: record.meta_id,
        clinica_id: clinicaId,
        valor_medido: record.tipo_input === 'booleano' ? null : parseFloat(record.valor_registrado) || null,
        anotacoes: `Avaliação do dia: ${record.valor_registrado}`,
        data_registro: new Date().toISOString(),
        registrado_por_id: null as string | null,
      }))

      // The DB schema for registro_progresso uses: meta_id, clinica_id, valor_medido, status_classificacao, anotacoes, registrado_por_id
      const finalPayloads = payloads.map((p, index) => ({
        ...p,
        status_classificacao: recordsToSave[index].status_classificacao
      }))

      // Get user id directly
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        finalPayloads.forEach(p => { p.registrado_por_id = session.user.id })
      }

      const { error } = await supabase
        .from('registro_progresso')
        .insert(finalPayloads)

      if (error) throw error

      toast.success('Progresso salvo com sucesso!')
      
      // Cleanup locally
      setGoalValues({})
    } catch (err: unknown) {
      console.error('Failed to save goals progress:', err)
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error('Erro ao salvar progresso: ' + errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  if (plansLoading || goalsLoading) {
    return <Skeleton className="h-40 w-full rounded-xl mt-4" />
  }

  if (!activePlan || goals.length === 0) {
    return null // Return nothing if there are no goals to execute to keep UI clean
  }

  return (
    <div className="mt-6 mb-4 p-5 rounded-xl border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-base">Metas Terapêuticas do Atendimento</h3>
          <p className="text-xs text-muted-foreground">Registre o desempenho do paciente hoje ({activePlan.nome})</p>
        </div>
      </div>

      <div className="space-y-4">
        {goals.map(goal => {
          const record = goalValues[goal.id]
          const status = record?.status_classificacao || 'nao_avaliado'
          const tipoInput = goal.tipo_input || 'numerico'
          const value = record?.valor_registrado || ''

          return (
            <div key={goal.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-3 border-b border-border/50 last:border-0 last:pb-0">
              {/* Status Indicator */}
              <div className="pt-1 hidden sm:block">
                {status === 'nao_avaliado' && <Circle size={18} className="text-muted-foreground" />}
                {status === 'atingido' && <CheckCircle2 size={18} className="text-emerald-500" />}
                {status === 'parcial' && <MinusCircle size={18} className="text-amber-500" />}
                {status === 'nao_atingido' && <MinusCircle size={18} className="text-destructive" />}
              </div>

              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-2 sm:mb-0">
                  <h4 className="text-sm font-medium text-foreground">
                    {goal.titulo || goal.descricao}
                  </h4>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border ml-2 whitespace-nowrap">
                    Meta: {goal.meta_esperada} {goal.unidade}
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-64 shrink-0">
                {tipoInput === 'numerico' && (
                  <Input
                    type="number"
                    size={32}
                    value={value}
                    onChange={(e) => updateGoalValue(goal, e.target.value)}
                    placeholder="Resultado alcançado..."
                    className="h-9"
                  />
                )}

                {tipoInput === 'booleano' && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={value === 'Sim' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateGoalValue(goal, 'Sim')}
                      className="flex-1 h-9"
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      variant={value === 'Não' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => updateGoalValue(goal, 'Não')}
                      className="flex-1 h-9"
                    >
                      Não
                    </Button>
                  </div>
                )}

                {tipoInput === 'escala' && (
                  <div className="flex gap-1 justify-between">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Button
                        key={n}
                        type="button"
                        variant={value === String(n) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateGoalValue(goal, String(n))}
                        className="w-10 h-9 font-medium"
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {Object.values(goalValues).some(v => v.valor_registrado !== '') && (
        <div className="mt-4 pt-4 border-t border-primary/20 flex justify-end">
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving}
            className="rounded-full shadow-sm"
          >
            {isSaving ? 'Salvando...' : 'Salvar Avaliações das Metas'}
          </Button>
        </div>
      )}
    </div>
  )
}
