/**
 * Página de Orçamentos
 * Lista todos os orçamentos da clínica com filtros e ações
 */

import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Eye,
  CheckCircle,
  Calendar,
  Trash2,
  Plus,
  MessageCircle,
} from 'lucide-react'
import { DataTable, SimpleDropdownMenu, FloatingButton } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { ChatPanel } from '@/components/chat'
import { useOrcamentos } from '@/hooks'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'
import type { OrcamentoStatus } from '@/types/orcamento'
import { statusLabels, statusStyles } from '@/types/orcamento'
import { cn } from '@/lib/utils'
import { NovoOrcamentoModal } from './NovoOrcamentoModal'

// Interface para dados da tabela
interface OrcamentoTableRow {
  id: string
  numero: string
  pacienteNome: string
  profissionalNome: string
  valorFinal: number
  status: OrcamentoStatus
  validade: string
  createdAt: string
}

// Configuração de filtros para o DataTable
const filterConfig: FilterConfig = {
  status: [
    { value: 'pendente', label: 'Pendente' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'rejeitado', label: 'Rejeitado' },
    { value: 'expirado', label: 'Expirado' },
    { value: 'convertido', label: 'Convertido' },
  ],
  dateFrom: true,
  dateTo: true,
}

const tableColumns: Column<OrcamentoTableRow>[] = [
  {
    key: 'numero',
    header: 'NÚMERO',
    width: 'w-[120px]',
  },
  {
    key: 'pacienteNome',
    header: 'PACIENTE',
    width: 'w-[180px]',
  },
  {
    key: 'profissionalNome',
    header: 'PROFISSIONAL',
    width: 'w-[150px]',
  },
  {
    key: 'valorFinal',
    header: 'VALOR',
    width: 'w-[120px]',
    render: (item) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(item.valorFinal)
    },
  },
  {
    key: 'validade',
    header: 'VALIDADE',
    width: 'w-[120px]',
    render: (item) => {
      if (!item.validade) return '-'
      const date = new Date(item.validade)
      return date.toLocaleDateString('pt-BR')
    },
  },
  {
    key: 'createdAt',
    header: 'DATA CRIAÇÃO',
    width: 'w-[120px]',
    render: (item) => {
      const date = new Date(item.createdAt)
      return date.toLocaleDateString('pt-BR')
    },
  },
  {
    key: 'status',
    header: 'STATUS',
    render: (item) => (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          statusStyles[item.status]
        )}
      >
        {statusLabels[item.status]}
      </span>
    ),
  },
]

export function OrcamentosPage() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  // Buscar dados via hook
  const {
    orcamentos,
    isLoading,
    summary,
    aprovarOrcamento,
    deleteOrcamento,
  } = useOrcamentos()

  // Converter dados para formato da tabela
  const tableData: OrcamentoTableRow[] = useMemo(() => {
    let result = orcamentos.map((orc) => ({
      id: orc.id,
      numero: orc.numero,
      pacienteNome: orc.pacienteNome,
      profissionalNome: orc.profissionalNome,
      valorFinal: orc.valorFinal,
      status: orc.status,
      validade: orc.validade || '',
      createdAt: orc.createdAt,
    }))

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.numero.toLowerCase().includes(query) ||
          o.pacienteNome.toLowerCase().includes(query) ||
          o.profissionalNome.toLowerCase().includes(query)
      )
    }

    // Aplicar filtros
    if (filters.status) {
      result = result.filter((o) => o.status === filters.status)
    }
    if (filters.dateFrom) {
      result = result.filter((o) => new Date(o.createdAt) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      result = result.filter((o) => new Date(o.createdAt) <= new Date(filters.dateTo))
    }

    return result
  }, [orcamentos, searchQuery, filters])

  const handleViewDetails = (orc: OrcamentoTableRow) => {
    navigate({ to: '/orcamentos/$orcamentoId', params: { orcamentoId: orc.id } })
  }

  const handleAprovar = async (orc: OrcamentoTableRow) => {
    await aprovarOrcamento(orc.id)
  }

  const handleConverterAgendamento = async (orc: OrcamentoTableRow) => {
    // Navegar para agenda com o orçamento pré-selecionado
    navigate({ to: '/agenda', search: { orcamentoId: orc.id } })
  }

  const handleExcluir = async (orc: OrcamentoTableRow) => {
    if (window.confirm(`Deseja realmente excluir o orçamento ${orc.numero}?`)) {
      await deleteOrcamento(orc.id)
    }
  }

  const getRowActions = (orc: OrcamentoTableRow) => {
    const actions = [
      {
        icon: <Eye className="w-4 h-4" />,
        label: 'Ver detalhes',
        onClick: () => handleViewDetails(orc),
      },
    ]

    if (orc.status === 'pendente') {
      actions.push({
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Aprovar orçamento',
        onClick: () => handleAprovar(orc),
      })
    }

    if (orc.status === 'aprovado') {
      actions.push({
        icon: <Calendar className="w-4 h-4" />,
        label: 'Converter em agendamento',
        onClick: () => handleConverterAgendamento(orc),
      })
    }

    if (orc.status !== 'convertido') {
      actions.push({
        icon: <Trash2 className="w-4 h-4" />,
        label: 'Excluir orçamento',
        onClick: () => handleExcluir(orc),
      })
    }

    return actions
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleGoBack = () => {
    navigate({ to: '/' })
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  const handleNovoOrcamento = () => {
    setIsNovoModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <button onClick={handleGoBack} className="hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Orçamentos</span>
          <span className="text-muted-foreground">›</span>
          <span>Início</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-foreground">Orçamentos</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{summary.total}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pendentes}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm text-muted-foreground">Aprovados</p>
            <p className="text-2xl font-bold text-green-600">{summary.aprovados}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(summary.valorTotal)}
            </p>
          </div>
        </div>

        {/* Botão Novo Orçamento */}
        <div className="flex justify-end">
          <Button
            onClick={handleNovoOrcamento}
            className="rounded-full px-6 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo orçamento
          </Button>
        </div>

        {/* Tabela */}
        <DataTable<OrcamentoTableRow>
          title="Orçamentos"
          columns={tableColumns}
          data={tableData}
          keyExtractor={(item) => item.id}
          rowActions={(item) => <SimpleDropdownMenu items={getRowActions(item)} />}
          onSearch={handleSearch}
          filterConfig={filterConfig}
          onApplyFilters={handleApplyFilters}
          isLoading={isLoading}
        />
      </div>

      {/* Modal Novo Orçamento */}
      <NovoOrcamentoModal
        isOpen={isNovoModalOpen}
        onClose={() => setIsNovoModalOpen(false)}
      />

      {/* Botão Flutuante de Chat */}
      <FloatingButton
        icon={<MessageCircle className="w-8 h-8 text-primary-foreground" fill="currentColor" />}
        onClick={handleOpenChat}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}

export default OrcamentosPage
