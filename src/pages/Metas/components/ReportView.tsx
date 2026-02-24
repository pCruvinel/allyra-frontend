/**
 * ReportView - Visualização completa do relatório de metas
 * Inclui estatísticas, gráficos e detalhamento por meta
 */

import { useState } from 'react'
import { FileText, Download, Target, Calendar, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, ProgressCard, ProgressGrid } from '@/components/ui/progress-card'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { useGoalReport } from '@/hooks/useGoalProgress'
import {
  EvolutionChart,
  StatusDistributionChart,
  ProgressComparisonChart,
} from './ReportCharts'
import { cn } from '@/lib/utils'
import type { TherapeuticPlan } from '@/types/goals'

interface ReportViewProps {
  plan: TherapeuticPlan
  className?: string
}

export function ReportView({ plan, className }: ReportViewProps) {
  const { report, isLoading, error, refresh } = useGoalReport({ planoId: plan.id })
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'details'>('overview')

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Não definida'
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return 'Data inválida'
    return parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Helper para pegar a data de fim (compatível com ambos os campos do banco)
  const dataFim = plan.data_fim || plan.data_fim_prevista

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  // Error state
  if (error || !report) {
    return (
      <div className={cn('rounded-xl border bg-card p-8 text-center', className)}>
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold text-foreground mb-2">
          Erro ao carregar relatório
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error || 'Não foi possível carregar os dados do relatório.'}
        </p>
        <Button onClick={refresh} variant="outline">
          Tentar novamente
        </Button>
      </div>
    )
  }

  const { estatisticas, progressoPorMeta } = report

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header do Relatório */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Relatório de Evolução
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {plan.nome} • {formatDate(plan.data_inicio)} - {formatDate(dataFim)}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={16} />
          Exportar PDF
        </Button>
      </div>

      {/* Estatísticas Resumidas */}
      <ProgressGrid columns={4}>
        <StatCard
          title="Total de Metas"
          value={estatisticas.totalMetas}
          icon={<Target className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Metas Atingidas"
          value={estatisticas.metasAtingidas}
          subtitle={`${estatisticas.taxaSucesso.toFixed(0)}% de sucesso`}
          trend={estatisticas.metasAtingidas > 0 ? 'up' : 'stable'}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          title="Em Andamento"
          value={estatisticas.metasParciais}
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
        />
        <StatCard
          title="Total de Registros"
          value={estatisticas.totalRegistros}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
        />
      </ProgressGrid>

      {/* Tabs de Navegação */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'evolution', label: 'Evolução' },
          { id: 'details', label: 'Detalhamento' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição de Status */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Distribuição de Status
            </h3>
            <StatusDistributionChart statistics={estatisticas} />
          </div>

          {/* Comparativo Atual vs Meta */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Progresso por Meta
            </h3>
            <ProgressComparisonChart data={progressoPorMeta} />
          </div>
        </div>
      )}

      {activeTab === 'evolution' && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Evolução ao Longo do Tempo
          </h3>
          <EvolutionChart data={progressoPorMeta} className="mt-4" />
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-4">
          {progressoPorMeta.map((metaData) => {
            const meta = metaData.meta
            const ultimoRegistro = metaData.ultimoRegistro
            const valorAtual = ultimoRegistro ? parseFloat(ultimoRegistro.valor) || 0 : 0
            const valorMeta = parseFloat(meta.meta_esperada) || 1

            return (
              <div key={meta.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-foreground">
                        {meta.titulo}
                      </h4>
                      {meta.status && (
                        <StatusIndicator status={meta.status} size="sm" />
                      )}
                    </div>
                    {meta.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {meta.descricao}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">
                      {valorAtual}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}/ {meta.meta_esperada}
                    </span>
                    {meta.unidade && (
                      <span className="text-sm text-muted-foreground ml-1">
                        {meta.unidade}
                      </span>
                    )}
                  </div>
                </div>

                <ProgressCard
                  title=""
                  current={valorAtual}
                  target={valorMeta}
                  variant="compact"
                />

                {/* Histórico de Registros */}
                {metaData.registros.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">
                      Últimos Registros
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {metaData.registros.slice(-5).map((registro, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-md bg-muted text-sm"
                        >
                          <span className="font-medium">{registro.valor}</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(registro.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {progressoPorMeta.length === 0 && (
            <div className="rounded-xl border bg-card p-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhuma meta cadastrada neste plano.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
