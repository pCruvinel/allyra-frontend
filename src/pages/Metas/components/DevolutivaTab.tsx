/**
 * DevolutivaTab - Container principal da aba Devolutiva
 *
 * Implementa estrutura do backup FeedbackReport.tsx:
 * 1. Sem paciente selecionado: Grid de pacientes com estatísticas
 * 2. Com paciente selecionado: Relatório completo em scroll único
 */

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Users,
  Download,
  Share2,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { ViewToggle } from '@/components/ui/view-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Textarea } from '@/components/ui/textarea'
import { usePatients } from '@/hooks/usePatients'
import { useTherapeuticPlans } from '@/hooks/useTherapeuticPlans'
import { useGoalReport } from '@/hooks/useGoalProgress'
import { ShareModal } from './modals/ShareModal'
import { PdfPreview } from './PdfPreview'
import { cn } from '@/lib/utils'
import type { TherapeuticPlan, GoalProgressByMeta } from '@/types/goals'
import type { PatientListItem } from '@/types/patient'

type ViewMode = 'grid' | 'list'

interface PatientWithStats extends PatientListItem {
  ciclosCompletos: number
  taxaSucesso: number
  planosAtivos: number
}

interface DevolutivaTabProps {
  searchQuery?: string
}

export function DevolutivaTab({ searchQuery = '' }: DevolutivaTabProps) {
  // Estado de navegação
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<TherapeuticPlan | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Estado de modais
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Configurações de branding para PDF
  const [brandSettings, setBrandSettings] = useState({
    logoUrl: '',
    clinicName: 'Clínica Allyra',
    primaryColor: '#a78bfa',
    address: 'Rua Exemplo, 123 - Bairro',
    phone: '(11) 9999-9999',
    website: 'www.allyra.com.br',
  })

  // Carrega configurações de branding do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('allyra_brand_settings')
    if (saved) {
      try {
        setBrandSettings(JSON.parse(saved))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Estado do parecer técnico
  const [technicalOpinion, setTechnicalOpinion] = useState('')
  const [isEditingOpinion, setIsEditingOpinion] = useState(false)

  // Hooks de dados
  const { patients, isLoading: patientsLoading } = usePatients()
  const { plans, isLoading: plansLoading } = useTherapeuticPlans({
    autoFetch: !!selectedPatientId,
    pacienteId: selectedPatientId || undefined,
  })
  const { report, isLoading: reportLoading } = useGoalReport({
    autoFetch: !!selectedPlan?.id,
    planoId: selectedPlan?.id,
  })

  // Dados computados - stats serão carregados no relatório individual
  const patientsWithStats: PatientWithStats[] = useMemo(() => {
    return patients.map((p) => ({
      ...p,
      ciclosCompletos: -1, // Será verificado ao selecionar paciente
      taxaSucesso: -1, // Será calculado no relatório
      planosAtivos: -1, // Será carregado ao selecionar
    }))
  }, [patients])

  // Filtrar pacientes pela busca
  const filteredPatientsWithStats = useMemo(() => {
    if (!searchQuery.trim()) return patientsWithStats
    const query = searchQuery.toLowerCase()
    return patientsWithStats.filter((p) => p.name.toLowerCase().includes(query))
  }, [patientsWithStats, searchQuery])

  const currentPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  )

  // Handlers
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId)
    setSelectedPlan(null)
    setShowPdfPreview(false)
  }

  const handleBackToPatients = () => {
    setSelectedPatientId(null)
    setSelectedPlan(null)
    setShowPdfPreview(false)
    setTechnicalOpinion('')
  }

  const handleSaveOpinion = () => {
    // TODO: Salvar no banco
    setIsEditingOpinion(false)
  }

  const handleExportPdf = () => {
    if (!selectedPlan || !report) return

    // Adiciona classe ao body para estilos de impressão
    document.body.classList.add('printing-pdf')
    setIsPrinting(true)

    // Aguarda a renderização do portal e então imprime
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print()

        // Remove classe após impressão
        document.body.classList.remove('printing-pdf')
        setIsPrinting(false)
      })
    })
  }

  const formatDateForPdf = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  // Auto-selecionar primeiro plano quando paciente é selecionado
  useMemo(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0])
    }
  }, [plans, selectedPlan])

  // Loading state
  if (patientsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // =====================================================
  // RENDERIZAÇÃO: Grid de Pacientes
  // =====================================================
  if (!selectedPatientId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Relatórios de Devolutiva
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione um paciente para visualizar o relatório de evolução
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ViewToggle
              value={viewMode}
              onChange={(mode) => setViewMode(mode as ViewMode)}
              storageKey="devolutiva-view"
            />

            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
              <Users size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                {filteredPatientsWithStats.filter((p) => p.status === 'active').length} pacientes
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredPatientsWithStats.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            description={
              searchQuery
                ? `Não encontramos pacientes para "${searchQuery}". Tente outro termo de busca.`
                : 'Cadastre pacientes para gerar relatórios de devolutiva.'
            }
          />
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatientsWithStats.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient.id)}
                className="bg-card rounded-xl border p-5 text-left transition-all border-border/60 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-base">
                      {patient.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          patient.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  Clique para visualizar os planos terapêuticos e relatórios de evolução deste paciente.
                </p>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-sm font-medium text-primary">Ver relatório →</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nome do Paciente
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredPatientsWithStats.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient.id)}
                    className="transition-colors hover:bg-muted/40 cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-foreground">{patient.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          patient.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-primary">Ver relatório →</span>
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

  // =====================================================
  // RENDERIZAÇÃO: Relatório do Paciente
  // =====================================================

  // Preparar dados para gráficos
  const overallData = report
    ? [
        { categoria: 'Atingidas', valor: report.estatisticas.metasAtingidas, fill: 'hsl(var(--primary))' },
        { categoria: 'Parciais', valor: report.estatisticas.metasParciais, fill: '#ffc107' },
        { categoria: 'Não Atingidas', valor: report.estatisticas.metasNaoAtingidas, fill: '#dc3545' },
      ]
    : []

  const getTrendIcon = (registros: GoalProgressByMeta['registros']) => {
    if (registros.length < 2) return <Minus size={14} />
    const last = parseFloat(registros[registros.length - 1]?.valor || '0')
    const prev = parseFloat(registros[registros.length - 2]?.valor || '0')
    if (last > prev) return <TrendingUp size={14} />
    if (last < prev) return <TrendingDown size={14} />
    return <Minus size={14} />
  }

  const getTrendLabel = (registros: GoalProgressByMeta['registros']) => {
    if (registros.length < 2) return 'Estável'
    const last = parseFloat(registros[registros.length - 1]?.valor || '0')
    const prev = parseFloat(registros[registros.length - 2]?.valor || '0')
    if (last > prev) return 'Em evolução'
    if (last < prev) return 'Em declínio'
    return 'Estável'
  }

  const getTrendColor = (registros: GoalProgressByMeta['registros']) => {
    if (registros.length < 2) return 'bg-muted text-muted-foreground'
    const last = parseFloat(registros[registros.length - 1]?.valor || '0')
    const prev = parseFloat(registros[registros.length - 2]?.valor || '0')
    if (last > prev) return 'bg-primary/10 text-primary'
    if (last < prev) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-muted text-muted-foreground'
  }

  // Loading report
  if (plansLoading || reportLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  // Empty state quando não há planos ou relatório
  if (!plansLoading && !reportLoading && plans.length === 0) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToPatients}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Voltar para pacientes</span>
        </button>

        <EmptyState
          icon={FileText}
          title="Nenhum plano terapêutico encontrado"
          description={`${currentPatient?.name || 'Este paciente'} ainda não possui planos terapêuticos cadastrados. Crie um plano na aba "Planos Terapêuticos" para gerar relatórios de devolutiva.`}
        />
      </div>
    )
  }

  // PDF Preview mode
  if (showPdfPreview) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setShowPdfPreview(false)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Voltar ao Relatório</span>
        </button>

        <PdfPreview
          plan={selectedPlan}
          patient={currentPatient}
          report={report}
        />
      </div>
    )
  }

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Relatório de Devolutiva</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentPatient?.name} -{' '}
            {selectedPlan
              ? `${new Date(selectedPlan.data_inicio).toLocaleDateString('pt-BR')} a ${new Date(selectedPlan.data_fim || selectedPlan.data_fim_prevista || '').toLocaleDateString('pt-BR')}`
              : ''}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPdfPreview(true)}>
            <FileText size={16} className="mr-2" />
            Visualizar PDF
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowShareModal(true)}>
            <Share2 size={16} className="mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Taxa de Sucesso Geral</span>
            <TrendingUp size={20} className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            {report?.estatisticas.taxaSucesso.toFixed(0) || 0}%
          </p>
          <p className="text-xs text-primary mt-1">
            {report?.estatisticas.metasAtingidas || 0} de {report?.estatisticas.totalMetas || 0}{' '}
            metas atingidas
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total de Registros</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {report?.estatisticas.totalRegistros || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Registros de progresso</p>
        </div>

        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Metas em Andamento</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {report?.estatisticas.metasParciais || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Em evolução</p>
        </div>
      </div>

      {/* Gráfico Visão Geral */}
      <div className="bg-card rounded-xl border border-border/60 p-6">
        <h3 className="font-semibold text-foreground mb-4">Visão Geral das Metas</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={overallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detalhamento por Meta */}
      <div className="space-y-4">
        {report?.progressoPorMeta.map((metaData) => {
          const meta = metaData.meta
          const registros = metaData.registros
          const ultimoRegistro = metaData.ultimoRegistro
          const valorAtual = ultimoRegistro ? parseFloat(ultimoRegistro.valor) || 0 : 0
          const valorMeta = parseFloat(meta.meta_esperada) || 1
          const percentual = Math.min((valorAtual / valorMeta) * 100, 100)

          // Dados para o gráfico de linha
          const chartData = registros.map((r) => ({
            data: new Date(r.data).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            }),
            valor: parseFloat(r.valor) || 0,
            meta: parseFloat(meta.meta_esperada) || 0,
          }))

          return (
            <div key={meta.id} className="bg-card rounded-xl border border-border/60 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-foreground">{meta.titulo}</h4>
                    <span
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        getTrendColor(registros)
                      )}
                    >
                      {getTrendIcon(registros)}
                      {getTrendLabel(registros)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Meta Esperada</span>
                      <p className="font-semibold text-foreground">
                        {meta.meta_esperada} {meta.unidade}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor Atual</span>
                      <p className="font-semibold text-foreground">
                        {valorAtual} {meta.unidade}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Percentual</span>
                      <p className="font-semibold text-primary">{percentual.toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2 mt-4">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Gráfico de Evolução */}
              {chartData.length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      name="Valor Atingido"
                    />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      stroke="#dc3545"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Meta Esperada"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )
        })}
      </div>

      {/* Parecer Técnico */}
      <div className="bg-card rounded-xl border border-border/60 p-6">
        <h3 className="font-semibold text-foreground mb-2">Parecer Técnico</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Insira suas observações e recomendações para a família
        </p>
        <Textarea
          value={technicalOpinion}
          onChange={(e) => {
            setTechnicalOpinion(e.target.value)
            setIsEditingOpinion(true)
          }}
          placeholder="Digite seu parecer técnico aqui..."
          className="min-h-[150px] resize-y"
        />

        {isEditingOpinion && (
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setTechnicalOpinion('')
                setIsEditingOpinion(false)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveOpinion}>Salvar Parecer</Button>
          </div>
        )}
      </div>

      {/* Recomendações */}
      <div className="bg-primary/5 rounded-xl border border-primary/30 p-6">
        <h3 className="font-semibold text-primary mb-3">
          Recomendações para o Próximo Ciclo
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span className="text-foreground">Manter frequência de sessões semanais</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span className="text-foreground">
              Aumentar complexidade dos exercícios conforme evolução
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span className="text-foreground">
              Reforçar orientações para exercícios domiciliares com a família
            </span>
          </li>
        </ul>
      </div>

      {/* Share Modal */}
      {selectedPlan && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          planId={selectedPlan.id}
          planName={selectedPlan.nome}
          patientName={currentPatient?.name || ''}
        />
      )}

      {/* Portal para impressão direta - renderiza no body */}
      {isPrinting &&
        selectedPlan &&
        report &&
        createPortal(
          <div
            id="pdf-print-portal"
            className="fixed inset-0 z-[99999] bg-white overflow-auto print:relative print:overflow-visible"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="p-8 md:p-12 max-w-[800px] mx-auto">
              {/* PDF Header */}
              <div
                className="flex items-start justify-between mb-8 pb-6 border-b-2"
                style={{ borderColor: brandSettings.primaryColor }}
              >
                <div>
                  {brandSettings.logoUrl ? (
                    <img
                      src={brandSettings.logoUrl}
                      alt="Logo"
                      className="h-[60px] object-contain mb-3"
                    />
                  ) : (
                    <div className="h-[60px] w-[160px] bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xs text-gray-500">Logo da Clínica</span>
                    </div>
                  )}
                  <h2
                    className="font-semibold text-xl"
                    style={{ color: brandSettings.primaryColor }}
                  >
                    {brandSettings.clinicName}
                  </h2>
                  <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                    <p>{brandSettings.address}</p>
                    <p>{brandSettings.phone}</p>
                    <p>{brandSettings.website}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Data do Relatório</p>
                  <p className="font-semibold text-gray-900">
                    {formatDateForPdf(new Date().toISOString())}
                  </p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">
                  Informações do Paciente
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nome Completo</p>
                    <p className="text-sm text-gray-900">{currentPatient?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Data de Nascimento</p>
                    <p className="text-sm text-gray-900">
                      {formatDateForPdf(currentPatient?.birthDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Período do Plano</p>
                    <p className="text-sm text-gray-900">
                      {formatDateForPdf(selectedPlan.data_inicio)} a{' '}
                      {formatDateForPdf(selectedPlan.data_fim || selectedPlan.data_fim_prevista)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Terapeuta Responsável</p>
                    <p className="text-sm text-gray-900">
                      {selectedPlan.profissional?.usuario?.nome_completo || 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goals Progress */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">
                  Evolução das Metas Terapêuticas
                </h3>

                <div className="space-y-4">
                  {report.progressoPorMeta.map((metaData, index) => {
                    const meta = metaData.meta
                    const ultimoRegistro = metaData.ultimoRegistro
                    const valorAtual = ultimoRegistro
                      ? parseFloat(ultimoRegistro.valor) || 0
                      : 0
                    const valorMeta = parseFloat(meta.meta_esperada) || 1
                    const percentual = Math.min((valorAtual / valorMeta) * 100, 100)
                    const isAtingido = percentual >= 100

                    return (
                      <div key={meta.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">
                              {index + 1}. {meta.titulo}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Meta esperada: {meta.meta_esperada} {meta.unidade}
                            </p>
                          </div>
                          <div
                            className="px-3 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: isAtingido
                                ? `${brandSettings.primaryColor}20`
                                : '#ffc10720',
                              color: isAtingido ? brandSettings.primaryColor : '#d97706',
                            }}
                          >
                            {isAtingido ? 'Atingida' : 'Em progresso'}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentual}%`,
                              backgroundColor: isAtingido
                                ? brandSettings.primaryColor
                                : '#ffc107',
                            }}
                          />
                        </div>

                        <p className="text-xs text-gray-900">
                          <span className="font-semibold">Resultado:</span> {valorAtual} de{' '}
                          {meta.meta_esperada} {meta.unidade} ({percentual.toFixed(0)}%)
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  Resumo e Recomendações
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 leading-relaxed mb-3">
                    O paciente demonstrou progresso durante este período de tratamento,
                    atingindo {report.estatisticas.metasAtingidas} de{' '}
                    {report.estatisticas.totalMetas} metas estabelecidas (
                    {report.estatisticas.taxaSucesso.toFixed(0)}% de sucesso).
                  </p>
                  <p className="text-sm text-gray-900 leading-relaxed">
                    Recomenda-se a continuidade do tratamento com foco nas metas em andamento,
                    mantendo os exercícios domiciliares e o acompanhamento regular.
                  </p>
                </div>
              </div>

              {/* Technical Opinion if exists */}
              {technicalOpinion && (
                <div className="mb-8">
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">Parecer Técnico</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {technicalOpinion}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div
                className="border-t-2 pt-6 mt-12"
                style={{ borderColor: brandSettings.primaryColor }}
              >
                <div className="flex items-end justify-end">
                  <div className="text-right">
                    <div className="border-t border-gray-500 pt-2 px-12">
                      <p className="text-xs text-gray-900">Assinatura do Terapeuta</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
