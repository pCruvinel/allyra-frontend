/**
 * PortalPacientePage - Página pública de visualização de progresso
 * Acesso via token gerado pelo profissional
 */

import { useParams } from '@tanstack/react-router'
import { AlertCircle, Target, TrendingUp, Calendar, User, Building2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressCard, StatCard } from '@/components/ui/progress-card'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { usePortalData } from '@/hooks/useGoalProgress'
import type { GoalInputType } from '@/types/goals'

const inputTypeLabels: Record<GoalInputType, string> = {
  numerico: 'Numérico',
  booleano: 'Sim/Não',
  escala: 'Escala',
  protocolo: 'Protocolo',
}

export function PortalPacientePage() {
  const { token } = useParams({ from: '/portal/$token' })
  const { data, isLoading, error, isValid } = usePortalData(token)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !isValid || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-background dark:from-red-900/10 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card rounded-2xl border p-8 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Link Inválido ou Expirado
            </h1>
            <p className="text-muted-foreground">
              {error || 'Este link de acesso não é mais válido. Solicite um novo link ao seu terapeuta.'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Powered by <span className="font-semibold text-primary">Allyra</span>
          </p>
        </div>
      </div>
    )
  }

  const { plano, paciente, clinica, metas, opcoes } = data

  // Calcula estatísticas
  const totalMetas = metas.length
  const metasConcluidas = metas.filter(m => m.status === 'achieved').length
  const percentualGeral = totalMetas > 0 ? Math.round((metasConcluidas / totalMetas) * 100) : 0

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Relatório de Evolução
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Portal do Paciente
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{clinica?.nome}</p>
              <p className="text-xs text-muted-foreground">
                Atualizado em {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info do Paciente e Plano */}
        <div className="bg-card rounded-2xl border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{paciente?.nome}</h2>
                <p className="text-sm text-muted-foreground">Paciente</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{plano?.nome}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIndicator status={plano?.status || 'ativo'} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(plano?.data_inicio || '')} - {formatDate(plano?.data_fim || '')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Progresso Geral"
            value={`${percentualGeral}%`}
            subtitle="do plano concluído"
            trend={percentualGeral >= 50 ? 'up' : 'stable'}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Total de Metas"
            value={totalMetas}
            subtitle="definidas no plano"
            icon={<Target className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Metas Atingidas"
            value={metasConcluidas}
            subtitle={`de ${totalMetas} metas`}
            trend={metasConcluidas > 0 ? 'up' : 'stable'}
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
        </div>

        {/* Lista de Metas */}
        <div className="bg-card rounded-2xl border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-foreground">Metas do Plano Terapêutico</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe o progresso de cada meta definida
            </p>
          </div>

          <div className="divide-y">
            {metas.map((meta) => {
              const current = meta.valor_atual || 0
              const target = parseFloat(meta.meta_esperada || '0')
              const isNumeric = meta.tipo_input === 'numerico' || meta.tipo_input === 'escala'

              return (
                <div key={meta.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-foreground">
                          {meta.titulo || meta.descricao}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                          {inputTypeLabels[meta.tipo_input]}
                        </span>
                        {meta.status && (
                          <StatusIndicator status={meta.status} size="sm" />
                        )}
                      </div>

                      {meta.titulo && meta.descricao && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {meta.descricao}
                        </p>
                      )}

                      {/* Progress para tipos numéricos */}
                      {isNumeric && target > 0 && (
                        <ProgressCard
                          title=""
                          current={current}
                          target={target}
                          unit={meta.unidade}
                          variant="compact"
                        />
                      )}

                      {/* Para booleano/protocolo */}
                      {!isNumeric && (
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="text-muted-foreground">Meta:</span>
                          <span className="font-medium text-foreground">
                            {meta.meta_esperada}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {metas.length === 0 && (
              <div className="p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhuma meta cadastrada neste plano.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Observações do Plano (se disponível) */}
        {opcoes?.mostrarParecer && plano?.observacoes && (
          <div className="bg-card rounded-2xl border p-6 mt-8">
            <h3 className="font-semibold text-foreground mb-3">Observações do Profissional</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {plano.observacoes}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{clinica?.nome}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by <span className="font-semibold text-primary">Allyra</span> - Sistema de Gestão para Clínicas
          </p>
        </div>
      </footer>
    </div>
  )
}
