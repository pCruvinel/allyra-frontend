/**
 * Página de Relatórios
 * Layout split-screen: tipos de relatórios à esquerda, filtros à direita
 * Nota: MainLayout é aplicado na definição da rota (routes/index.tsx)
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FileText, Eye, FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { useRelatorios } from '@/hooks/useRelatorios'
import { REPORT_TYPES } from '@/types/relatorio'
import type { TipoRelatorio, FiltrosRelatorio } from '@/types/relatorio'
import { ReportTypeCard } from './components/ReportTypeCard'
import { ReportFilters } from './components/ReportFilters'

// Data padrão: último mês
const getDefaultDates = () => {
  const today = new Date()
  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  return {
    dateFrom: lastMonth.toISOString().split('T')[0],
    dateTo: today.toISOString().split('T')[0],
  }
}

export function RelatoriosPage() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<TipoRelatorio | null>(null)
  const [filtros, setFiltros] = useState<Omit<FiltrosRelatorio, 'tipo'>>(getDefaultDates())
  const { gerarPdf, gerarExcel, isGenerating } = useRelatorios()

  // Busca configuração do tipo selecionado
  const selectedConfig = useMemo(() => {
    return REPORT_TYPES.find((r) => r.tipo === selectedType)
  }, [selectedType])

  // Verifica se os filtros obrigatórios estão preenchidos
  const canGenerate = useMemo(() => {
    return filtros.dateFrom && filtros.dateTo
  }, [filtros.dateFrom, filtros.dateTo])

  const handleExportPdf = useCallback(() => {
    if (selectedType) {
      gerarPdf(selectedType, filtros)
    }
  }, [selectedType, filtros, gerarPdf])

  const handleExportExcel = useCallback(() => {
    if (selectedType) {
      gerarExcel(selectedType, filtros)
    }
  }, [selectedType, filtros, gerarExcel])

  const handleShowPreview = useCallback(() => {
    if (selectedType && filtros.dateFrom && filtros.dateTo) {
      // Navega para a página de preview com os parâmetros na URL
      navigate({
        to: '/relatorios/preview',
        search: {
          tipo: selectedType,
          dateFrom: filtros.dateFrom,
          dateTo: filtros.dateTo,
          ...(filtros.profissionalId && { profissionalId: filtros.profissionalId }),
          ...(filtros.status && { status: filtros.status }),
        },
      })
    }
  }, [selectedType, filtros, navigate])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Coluna Esquerda: Grid de Tipos (2/5) */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Tipo de Relatório
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {REPORT_TYPES.map((config) => (
              <ReportTypeCard
                key={config.tipo}
                config={config}
                selected={selectedType === config.tipo}
                onClick={() => setSelectedType(config.tipo)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Coluna Direita: Filtros (3/5) */}
      <div className="lg:col-span-3">
        {selectedType && selectedConfig ? (
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {selectedConfig.titulo}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedConfig.descricao}
              </p>
            </div>

            <ReportFilters
              tipo={selectedType}
              filtros={filtros}
              onChange={setFiltros}
            />

            {/* Divisor de Ações */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </span>
              </div>
            </div>

            {/* Botões de ação - Layout melhorado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={handleShowPreview}
                disabled={!canGenerate}
                className="h-12"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>

              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={!canGenerate || isGenerating}
                className="h-12 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>

              <Button
                onClick={handleExportPdf}
                disabled={!canGenerate || isGenerating}
                className="h-12"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6">
            <EmptyState
              icon={FileText}
              title="Selecione um tipo de relatório"
              description="Escolha um relatório na lista ao lado para configurar os filtros"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default RelatoriosPage
