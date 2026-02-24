import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, CreditCard, MessageCircle } from 'lucide-react'
import { DataTable, SimpleDropdownMenu, FloatingButton } from '@/components/ui'
import { FinancialSummaryCard } from '@/components/ui/progress-bar'
import { ChatPanel } from '@/components/chat'
import { RegistrarRepasseModal } from '@/components/modals/RegistrarRepasseModal'
import { DetalhesRepasseModal } from '@/components/modals/DetalhesRepasseModal'
import { useRepasses } from '@/hooks'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

// Interface para dados da tabela
interface RepasseTableRow {
  id: string
  unit: string
  transferCode: string
  issueDate: string
  paymentDate: string
  quantity: number
  value: number
  status: 'Total' | 'Parcial' | 'Pendente'
}

const statusStyles: Record<RepasseTableRow['status'], string> = {
  Total: 'bg-primary text-white',
  Parcial: 'bg-yellow-500 text-white',
  Pendente: 'bg-muted text-muted-foreground',
}

// Mapear status do banco para status do frontend
const statusMap: Record<string, RepasseTableRow['status']> = {
  gerado: 'Pendente',
  aprovado: 'Parcial',
  pago: 'Total',
  cancelado: 'Pendente',
}

// Configuração de filtros para o DataTable
const filterConfig: FilterConfig = {
  status: [
    { value: 'Total', label: 'Total' },
    { value: 'Parcial', label: 'Parcial' },
    { value: 'Pendente', label: 'Pendente' },
  ],
  dateFrom: true,
  dateTo: true,
}

const tableColumns: Column<RepasseTableRow>[] = [
  {
    key: 'unit',
    header: 'UNIDADE',
    width: 'w-[80px]',
  },
  {
    key: 'transferCode',
    header: 'REPASSE',
    width: 'w-[120px]',
  },
  {
    key: 'issueDate',
    header: 'EMISSÃO',
    width: 'w-[100px]',
    render: (item) => {
      const date = new Date(item.issueDate)
      return date.toLocaleDateString('pt-BR')
    },
  },
  {
    key: 'paymentDate',
    header: 'PAGAMENTO',
    width: 'w-[100px]',
    render: (item) => {
      if (!item.paymentDate) return '-'
      const date = new Date(item.paymentDate)
      return date.toLocaleDateString('pt-BR')
    },
  },
  {
    key: 'quantity',
    header: 'QUANTIDADE',
    width: 'w-[100px]',
    render: (item) => item.quantity.toString().padStart(3, '0'),
  },
  {
    key: 'value',
    header: 'VALOR',
    width: 'w-[100px]',
    render: (item) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(item.value)
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
        {item.status}
      </span>
    ),
  },
]

export function RepassePage() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isRegistrarRepasseOpen, setIsRegistrarRepasseOpen] = useState(false)
  const [isDetalhesRepasseOpen, setIsDetalhesRepasseOpen] = useState(false)
  const [selectedTransferId, setSelectedTransferId] = useState<string>('')
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  // Buscar dados do Supabase
  const { repasses, isLoading, summary, setSearch, payRepasse } = useRepasses()

  // Converter dados do banco para formato da tabela
  const tableData: RepasseTableRow[] = useMemo(() => {
    let result = repasses.map(repasse => ({
      id: repasse.id,
      unit: 'Matriz',
      transferCode: `REP-${repasse.id.slice(0, 6).toUpperCase()}`,
      issueDate: repasse.periodStart,
      paymentDate: repasse.paymentDate || '',
      quantity: 1,
      value: repasse.totalValue,
      status: statusMap[repasse.status] || 'Pendente',
    }))

    // Aplicar filtros
    if (filters.status) {
      result = result.filter(r => r.status === filters.status)
    }
    if (filters.dateFrom) {
      result = result.filter(r => new Date(r.issueDate) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      result = result.filter(r => new Date(r.issueDate) <= new Date(filters.dateTo))
    }

    return result
  }, [repasses, filters])

  const handleViewRepasse = (transfer: RepasseTableRow) => {
    setSelectedTransferId(transfer.id)
    setIsDetalhesRepasseOpen(true)
  }

  const handleRealizarRepasse = async (transfer: RepasseTableRow) => {
    setSelectedTransferId(transfer.id)
    setIsRegistrarRepasseOpen(true)
  }

  const getRowActions = (transfer: RepasseTableRow) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: 'Visualizar Repasse',
      onClick: () => handleViewRepasse(transfer),
    },
    {
      icon: <CreditCard className="w-4 h-4" />,
      label: 'Realizar Repasse',
      onClick: () => handleRealizarRepasse(transfer),
    },
  ]

  const handleSearch = (query: string) => {
    setSearch(query)
  }

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleGoBack = () => {
    navigate({ to: '/financeiro' })
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  const handleRegistrarRepasseSubmit = async (file: File | null) => {
    console.log('Repasse registrado com arquivo:', file?.name)
    if (selectedTransferId) {
      await payRepasse(selectedTransferId)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={handleGoBack} className="hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Repasse</span>
          <span className="text-muted-foreground">›</span>
          <span>Início</span>
          <span className="text-muted-foreground">›</span>
          <span>Financeiro</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-foreground">Repasse</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Tabela */}
        <DataTable<RepasseTableRow>
          title="Repasse"
          columns={tableColumns}
          data={tableData}
          keyExtractor={(item) => item.id}
          rowActions={(item) => <SimpleDropdownMenu items={getRowActions(item)} />}
          onSearch={handleSearch}
          filterConfig={filterConfig}
          onApplyFilters={handleApplyFilters}
          isLoading={isLoading}
        />

        {/* Resumo Financeiro */}
        <FinancialSummaryCard
          title="Total de repasses"
          total={summary.total}
          received={summary.paid}
          toReceive={summary.pending + summary.approved}
          receivedLabel="Repassados"
          toReceiveLabel="A repassar"
        />
      </div>

      {/* Modal Registrar Repasse */}
      <RegistrarRepasseModal
        isOpen={isRegistrarRepasseOpen}
        onClose={() => setIsRegistrarRepasseOpen(false)}
        onSubmit={handleRegistrarRepasseSubmit}
      />

      {/* Modal Detalhes Repasse */}
      <DetalhesRepasseModal
        isOpen={isDetalhesRepasseOpen}
        onClose={() => setIsDetalhesRepasseOpen(false)}
        transferId={selectedTransferId}
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
