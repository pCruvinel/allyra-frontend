import { useState, useMemo } from 'react'
import { FileText, Send, MessageCircle } from 'lucide-react'
import { DataTable, SimpleDropdownMenu, FloatingButton } from '@/components/ui'
import { ChatPanel } from '@/components/chat'
import { useFaturamentos } from '@/hooks'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'
import type { FaturaEmitidaStatus } from '@/types/billing'
import { cn } from '@/lib/utils'

// Interface para dados da tabela
interface FaturamentoTableRow {
  id: string
  unit: string
  title: string
  invoiceNumber: string
  patientId: string | null
  patientName: string
  insurance: string
  responsible?: string
  value: number
  issueDate: string
  status: FaturaEmitidaStatus
}

// Mapear status do banco para status do frontend
const statusMap: Record<string, FaturaEmitidaStatus> = {
  emitida: 'Emitida',
  enviada: 'Pendente',
  paga: 'Paga',
  cancelada: 'Cancelada',
  vencida: 'Pendente',
}

const statusStyles: Record<FaturaEmitidaStatus, string> = {
  Emitida: 'bg-blue-100 text-blue-700',
  Paga: 'bg-primary text-white',
  Cancelada: 'bg-red-100 text-red-700',
  Pendente: 'bg-yellow-100 text-yellow-700',
}

// Configuração de filtros para o DataTable
const filterConfig: FilterConfig = {
  status: [
    { value: 'Emitida', label: 'Emitida' },
    { value: 'Paga', label: 'Paga' },
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Cancelada', label: 'Cancelada' },
  ],
  dateFrom: true,
  dateTo: true,
}

const tableColumns: Column<FaturamentoTableRow>[] = [
  {
    key: 'unit',
    header: 'UNIDADE',
    width: 'w-[80px]',
    showOnMobile: true,
    mobilePriority: 2,
  },
  {
    key: 'title',
    header: 'TÍTULO',
    width: 'w-[100px]',
    showOnMobile: false,
  },
  {
    key: 'invoiceNumber',
    header: 'FATURA',
    width: 'w-[100px]',
    showOnMobile: true,
    mobilePriority: 1,
  },
  {
    key: 'patientName',
    header: 'PACIENTE',
    width: 'w-[150px]',
    truncate: true,
    showOnMobile: true,
    mobilePriority: 3,
  },
  {
    key: 'insurance',
    header: 'CONVÊNIO/RESPONSÁVEL',
    width: 'w-[150px]',
    truncate: true,
    render: (item) => item.responsible || item.insurance,
    showOnMobile: false,
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
    showOnMobile: true,
    mobilePriority: 4,
  },
  {
    key: 'status',
    header: 'STATUS',
    width: 'w-[100px]',
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
    showOnMobile: false,
  },
]

export function FaturamentosEmitidosPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  // Buscar faturamentos do Supabase
  const { faturamentos, isLoading, updateStatus } = useFaturamentos()

  // Converter dados do banco para formato da tabela
  const tableData: FaturamentoTableRow[] = useMemo(() => {
    let result = faturamentos.map(fat => ({
      id: fat.id,
      unit: 'Matriz',
      title: fat.type,
      invoiceNumber: fat.invoiceNumber,
      patientId: fat.patientId,
      patientName: fat.patientName || 'Paciente',
      insurance: fat.insuranceName || 'Particular',
      value: fat.totalValue,
      issueDate: fat.issueDate,
      status: statusMap[fat.status] || 'Emitida',
    }))

    // Aplicar filtros
    if (filters.status) {
      result = result.filter(f => f.status === filters.status)
    }
    if (filters.dateFrom) {
      result = result.filter(f => new Date(f.issueDate) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      result = result.filter(f => new Date(f.issueDate) <= new Date(filters.dateTo))
    }

    return result
  }, [faturamentos, filters])

  const handleViewDetails = (item: FaturamentoTableRow) => {
    console.log('Ver detalhes da fatura:', item.id)
  }

  const handleSendInvoice = async (item: FaturamentoTableRow) => {
    await updateStatus(item.id, 'enviada')
    console.log('Fatura enviada:', item.id)
  }

  const getRowActions = (item: FaturamentoTableRow) => [
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Detalhes da fatura emitida',
      onClick: () => handleViewDetails(item),
    },
    {
      icon: <Send className="w-4 h-4" />,
      label: 'Enviar fatura emitida',
      onClick: () => handleSendInvoice(item),
    },
  ]

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }



  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Tabela */}
        <DataTable<FaturamentoTableRow>
          title="Faturamentos emitidos"
          columns={tableColumns}
          data={tableData}
          keyExtractor={(item) => item.id}
          rowActions={(item) => <SimpleDropdownMenu items={getRowActions(item)} />}
          filterConfig={filterConfig}
          onApplyFilters={handleApplyFilters}
          isLoading={isLoading}
          emptyState={{
            title: 'Nenhum faturamento encontrado',
            description: 'Não há faturamentos emitidos no período selecionado.',
          }}
        />
      </div>

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
