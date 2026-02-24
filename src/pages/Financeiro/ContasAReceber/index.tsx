import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, FileText, Send, Ban, MessageCircle } from 'lucide-react'
import { DataTable, SimpleDropdownMenu, FloatingButton } from '@/components/ui'
import { FinancialSummaryCard } from '@/components/ui/progress-bar'
import { ChatPanel } from '@/components/chat'
import { useContasReceber } from '@/hooks'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

// Interface para dados da tabela
interface ContaTableRow {
  id: string
  unit: string
  invoiceNumber: string
  titleNumber: string
  patientId: string
  patientName: string
  insurance: string
  service: string
  dueDate: string
  value: number
  status: 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado'
}

const statusStyles: Record<ContaTableRow['status'], string> = {
  Pendente: 'bg-yellow-100 text-yellow-700',
  Pago: 'bg-primary text-white',
  Atrasado: 'bg-red-100 text-red-700',
  Cancelado: 'bg-muted text-muted-foreground',
}

// Mapear status do banco para status do frontend
const statusMap: Record<string, ContaTableRow['status']> = {
  aberto: 'Pendente',
  pago: 'Pago',
  vencido: 'Atrasado',
  cancelado: 'Cancelado',
  acordo: 'Pendente',
}

// Configuração de filtros para o DataTable
const filterConfig: FilterConfig = {
  status: [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Pago', label: 'Pago' },
    { value: 'Atrasado', label: 'Atrasado' },
    { value: 'Cancelado', label: 'Cancelado' },
  ],
  dateFrom: true,
  dateTo: true,
}

const tableColumns: Column<ContaTableRow>[] = [
  {
    key: 'unit',
    header: 'UNIDADE',
    width: 'w-[80px]',
  },
  {
    key: 'invoiceNumber',
    header: 'Nº FATURA',
    width: 'w-[100px]',
  },
  {
    key: 'titleNumber',
    header: 'Nº TÍTULO',
    width: 'w-[100px]',
  },
  {
    key: 'patientName',
    header: 'PACIENTE',
    width: 'w-[150px]',
  },
  {
    key: 'insurance',
    header: 'CONVÊNIO',
    width: 'w-[100px]',
  },
  {
    key: 'service',
    header: 'SERVIÇO',
    width: 'w-[150px]',
  },
  {
    key: 'dueDate',
    header: 'DATA DE VENCIMENTO',
    width: 'w-[150px]',
    render: (item) => {
      const date = new Date(item.dueDate)
      return date.toLocaleDateString('pt-BR')
    },
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

export function ContasAReceberPage() {
  const navigate = useNavigate()
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

  // Buscar dados do Supabase
  const { contas, isLoading, summary, setSearch } = useContasReceber()

  // Converter dados do banco para formato da tabela
  const tableData: ContaTableRow[] = useMemo(() => {
    let result = contas.map(conta => ({
      id: conta.id,
      unit: 'Matriz',
      invoiceNumber: conta.id.slice(0, 8).toUpperCase(),
      titleNumber: `TIT-${conta.id.slice(0, 6).toUpperCase()}`,
      patientId: conta.patientId || '',
      patientName: conta.patientName || 'Paciente',
      insurance: conta.insuranceName || 'Particular',
      service: 'Consulta',
      dueDate: conta.dueDate || new Date().toISOString(),
      value: conta.value,
      status: statusMap[conta.status] || 'Pendente',
    }))

    // Aplicar filtros
    if (filters.status) {
      result = result.filter(c => c.status === filters.status)
    }
    if (filters.dateFrom) {
      result = result.filter(c => new Date(c.dueDate) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      result = result.filter(c => new Date(c.dueDate) <= new Date(filters.dateTo))
    }

    return result
  }, [contas, filters])

  const handleViewBoleto = (invoice: ContaTableRow) => {
    console.log('Visualizar boleto:', invoice.id)
  }

  const handleViewDetails = (invoice: ContaTableRow) => {
    navigate({ to: '/financeiro/contas-a-receber/$faturaId', params: { faturaId: invoice.id } })
  }

  const handleResendBoleto = (invoice: ContaTableRow) => {
    console.log('Reenviar boleto:', invoice.id)
  }

  const handleBlockPatient = (invoice: ContaTableRow) => {
    console.log('Bloquear paciente:', invoice.patientId)
  }

  const getRowActions = (invoice: ContaTableRow) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: 'Visualizar Boleto',
      onClick: () => handleViewBoleto(invoice),
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Detalhes da Fatura',
      onClick: () => handleViewDetails(invoice),
    },
    {
      icon: <Send className="w-4 h-4" />,
      label: 'Reenviar Boleto',
      onClick: () => handleResendBoleto(invoice),
    },
    {
      icon: <Ban className="w-4 h-4" />,
      label: 'Bloquear Paciente',
      onClick: () => handleBlockPatient(invoice),
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

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <button onClick={handleGoBack} className="hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Contas a receber</span>
          <span className="text-muted-foreground">›</span>
          <span>Início</span>
          <span className="text-muted-foreground">›</span>
          <span>Financeiro</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-foreground">Contas a receber</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Tabela */}
        <DataTable<ContaTableRow>
          title="Contas a receber"
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
          title="Total de recebíveis"
          total={summary.total}
          received={summary.received}
          toReceive={summary.toReceive}
        />

        {/* Gráfico de Fluxo de Caixa - Dados simplificados */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Fluxo de caixa - Últimos 3 meses
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Análise comparativa de receitas e despesas
          </p>

          {/* Gráfico simplificado */}
          <div className="h-48 flex items-end justify-around gap-4 border-b border-border pb-4">
            {[
              { month: 'Out', value: summary.received * 0.8 },
              { month: 'Nov', value: summary.received * 0.9 },
              { month: 'Dez', value: summary.received },
            ].map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className="w-16 bg-primary rounded-t transition-all"
                  style={{
                    height: `${Math.max((data.value / Math.max(summary.total, 1)) * 150, 10)}px`,
                  }}
                />
                <span className="text-xs text-muted-foreground">{data.month}</span>
              </div>
            ))}
          </div>

          {/* Legenda do eixo Y */}
          <div className="flex flex-col gap-1 mt-4 text-xs text-muted-foreground">
            <span>R$ {new Intl.NumberFormat('pt-BR').format(summary.total)}</span>
            <span>R$ {new Intl.NumberFormat('pt-BR').format(summary.total * 0.8)}</span>
            <span>R$ {new Intl.NumberFormat('pt-BR').format(summary.total * 0.6)}</span>
            <span>R$ {new Intl.NumberFormat('pt-BR').format(summary.total * 0.4)}</span>
            <span>R$ {new Intl.NumberFormat('pt-BR').format(summary.total * 0.2)}</span>
            <span>R$0</span>
          </div>
        </div>
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
