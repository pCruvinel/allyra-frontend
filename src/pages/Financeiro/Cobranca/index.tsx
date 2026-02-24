import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, X, Ban, MessageCircle, CheckCircle, Clock, Calendar, DollarSign } from 'lucide-react'
import { DataTable, SimpleDropdownMenu, FloatingButton, Button } from '@/components/ui'
import { FinancialSummaryCard } from '@/components/ui/progress-bar'
import { ChatPanel } from '@/components/chat'
import { NovaCobrancaModal } from '@/components/modals/NovaCobrancaModal'
import { useContasReceber } from '@/hooks'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

// Interface para dados da tabela de cobrança
interface CobrancaTableRow {
  id: string
  patientId: string
  patientName: string
  totalValue: number
  installmentValue: number
  installments: number
  dueDate: string
  status: 'Pendente' | 'Pago' | 'Cancelado'
}

const statusStyles: Record<CobrancaTableRow['status'], string> = {
  Pendente: 'bg-yellow-100 text-yellow-700',
  Pago: 'bg-primary text-white',
  Cancelado: 'bg-muted text-muted-foreground',
}

// Mapear status do banco para status do frontend
const statusMap: Record<string, CobrancaTableRow['status']> = {
  aberto: 'Pendente',
  vencido: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  acordo: 'Pendente',
}

// Configuração de filtros para o DataTable
const filterConfig: FilterConfig = {
  status: [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Pago', label: 'Pago' },
    { value: 'Cancelado', label: 'Cancelado' },
  ],
}

const tableColumns: Column<CobrancaTableRow>[] = [
  {
    key: 'patientName',
    header: 'PACIENTE',
    width: 'w-[200px]',
  },
  {
    key: 'totalValue',
    header: 'VALOR TOTAL',
    width: 'w-[120px]',
    render: (item) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(item.totalValue)
    },
  },
  {
    key: 'installmentValue',
    header: 'PARCELAS',
    width: 'w-[120px]',
    render: (item) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(item.installmentValue)
    },
  },
  {
    key: 'dueDate',
    header: 'VENCIMENTO',
    width: 'w-[120px]',
    render: (item) => {
      const date = new Date(item.dueDate)
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
        {item.status}
      </span>
    ),
  },
]

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  valueColor?: string
}

function StatCard({ icon, value, label, valueColor = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className={cn('text-2xl font-bold', valueColor)}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function CobrancaPage() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isNovaCobrancaOpen, setIsNovaCobrancaOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  // Buscar contas a receber do Supabase (usadas como cobranças)
  const { contas, isLoading, summary, setSearch } = useContasReceber()

  // Converter contas a receber para formato de cobrança
  const tableData: CobrancaTableRow[] = useMemo(() => {
    let result = contas.map(conta => ({
      id: conta.id,
      patientId: conta.patientId || '',
      patientName: conta.patientName || 'Paciente',
      totalValue: conta.value,
      installmentValue: conta.value, // Valor único por parcela
      installments: 1,
      dueDate: conta.dueDate || new Date().toISOString(),
      status: statusMap[conta.status] || 'Pendente',
    }))

    // Aplicar filtros
    if (filters.status) {
      result = result.filter(c => c.status === filters.status)
    }

    return result
  }, [contas, filters])

  // Calcular estatísticas
  const stats = useMemo(() => {
    const pending = tableData.filter(c => c.status === 'Pendente')
    return {
      activeCount: tableData.length,
      pendingCount: pending.length,
      todayTotal: pending.reduce((sum, c) => sum + c.totalValue, 0),
      total: tableData.reduce((sum, c) => sum + c.totalValue, 0),
    }
  }, [tableData])

  const handleViewCobranca = (billing: CobrancaTableRow) => {
    console.log('Visualizar cobrança:', billing.id)
  }

  const handleCancelCobranca = (billing: CobrancaTableRow) => {
    console.log('Cancelar cobrança:', billing.id)
  }

  const handleBlockPatient = (billing: CobrancaTableRow) => {
    console.log('Bloquear paciente:', billing.patientId)
  }

  const getRowActions = (billing: CobrancaTableRow) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: 'Visualizar Cobrança',
      onClick: () => handleViewCobranca(billing),
    },
    {
      icon: <X className="w-4 h-4" />,
      label: 'Cancelar Cobrança',
      onClick: () => handleCancelCobranca(billing),
    },
    {
      icon: <Ban className="w-4 h-4" />,
      label: 'Bloquear Paciente',
      onClick: () => handleBlockPatient(billing),
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

  const handleNovaCobranca = () => {
    setIsNovaCobrancaOpen(true)
  }

  const handleCobrancaSubmit = (data: { patientName: string; value: number; paymentMethod: string; installments: number; discount: number; delayDays: number; message: string }) => {
    console.log('Nova cobrança criada:', data)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={handleGoBack} className="hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span>Cobrança</span>
            <span className="text-muted-foreground">›</span>
            <span>Início</span>
            <span className="text-muted-foreground">›</span>
            <span>Financeiro</span>
            <span className="text-muted-foreground">›</span>
            <span className="text-foreground">Cobrança</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full">
              <CheckCircle className="w-4 h-4 mr-2 text-primary" />
              Cobranças disponíveis
            </Button>
            <Button variant="outline" className="rounded-full">
              <Clock className="w-4 h-4 mr-2" />
              Histórico de cobranças
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-primary" />}
            value={stats.activeCount.toString().padStart(2, '0')}
            label="Cobranças ativas"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-primary" />}
            value={stats.pendingCount.toString().padStart(2, '0')}
            label="Cobranças pendentes"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-primary" />}
            value={formatCurrency(stats.todayTotal)}
            label="Total pendente"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-primary" />}
            value={formatCurrency(stats.total)}
            label="Total"
          />
        </div>

        {/* Tabela */}
        <DataTable<CobrancaTableRow>
          title="Cobrança"
          columns={tableColumns}
          data={tableData}
          keyExtractor={(item) => item.id}
          rowActions={(item) => <SimpleDropdownMenu items={getRowActions(item)} />}
          onSearch={handleSearch}
          filterConfig={filterConfig}
          onApplyFilters={handleApplyFilters}
          onNewItem={handleNovaCobranca}
          newItemLabel="Nova cobrança"
          isLoading={isLoading}
        />

        {/* Resumo Financeiro */}
        <FinancialSummaryCard
          title="Total de cobranças"
          total={summary.total}
          received={summary.received}
          toReceive={summary.toReceive}
        />
      </div>

      {/* Modal Nova Cobrança */}
      <NovaCobrancaModal
        isOpen={isNovaCobrancaOpen}
        onClose={() => setIsNovaCobrancaOpen(false)}
        onSubmit={handleCobrancaSubmit}
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
