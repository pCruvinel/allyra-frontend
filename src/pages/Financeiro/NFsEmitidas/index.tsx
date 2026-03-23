import { useState, useMemo } from 'react'
import { Eye, Download, X, MessageCircle } from 'lucide-react'
import { DataTable, SimpleDropdownMenu, FloatingButton } from '@/components/ui'
import { ChatPanel } from '@/components/chat'
import { useNotasFiscais } from '@/hooks'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

// Interface para dados da tabela
interface NFTableRow {
  id: string
  unit: string
  nfNumber: string
  issueDate: string
  patientName: string
  service: string
  value: number
  status: 'Emitida' | 'Cancelada'
}

const statusStyles: Record<NFTableRow['status'], string> = {
  Emitida: 'bg-primary text-white',
  Cancelada: 'bg-red-100 text-red-700',
}

// Mapear status do banco para status do frontend
const statusMap: Record<string, NFTableRow['status']> = {
  emitida: 'Emitida',
  cancelada: 'Cancelada',
  autorizada: 'Emitida',
  rejeitada: 'Cancelada',
}

// Configuração de filtros para o DataTable
const filterConfig: FilterConfig = {
  status: [
    { value: 'Emitida', label: 'Emitida' },
    { value: 'Cancelada', label: 'Cancelada' },
  ],
  dateFrom: true,
  dateTo: true,
}

const tableColumns: Column<NFTableRow>[] = [
  {
    key: 'unit',
    header: 'UNIDADE',
    width: 'w-[80px]',
  },
  {
    key: 'nfNumber',
    header: 'Nº NF',
    width: 'w-[100px]',
  },
  {
    key: 'issueDate',
    header: 'DATA DE EMISSÃO',
    width: 'w-[130px]',
    render: (item) => {
      const date = new Date(item.issueDate)
      return date.toLocaleDateString('pt-BR')
    },
  },
  {
    key: 'patientName',
    header: 'PACIENTE',
    width: 'w-[180px]',
  },
  {
    key: 'service',
    header: 'SERVIÇO',
    width: 'w-[150px]',
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

export function NFsEmitidasPage() {
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
  const { notas, isLoading, summary, setSearch } = useNotasFiscais()

  // Converter dados do banco para formato da tabela
  const tableData: NFTableRow[] = useMemo(() => {
    let result = notas.map(nota => ({
      id: nota.id,
      unit: 'Matriz',
      nfNumber: nota.number,
      issueDate: nota.issueDate,
      patientName: nota.patientName || 'Paciente',
      service: 'Consulta',
      value: nota.totalValue,
      status: statusMap[nota.status] || 'Emitida',
    }))

    // Aplicar filtros
    if (filters.status) {
      result = result.filter(n => n.status === filters.status)
    }
    if (filters.dateFrom) {
      result = result.filter(n => new Date(n.issueDate) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      result = result.filter(n => new Date(n.issueDate) <= new Date(filters.dateTo))
    }

    return result
  }, [notas, filters])

  const handleViewNF = (nf: NFTableRow) => {
    console.log('Visualizar NF:', nf.id)
  }

  const handleDownloadNF = (nf: NFTableRow) => {
    console.log('Baixar NF:', nf.id)
  }

  const handleCancelNF = (nf: NFTableRow) => {
    console.log('Cancelar NF:', nf.id)
  }

  const getRowActions = (nf: NFTableRow) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: 'Visualizar NF',
      onClick: () => handleViewNF(nf),
    },
    {
      icon: <Download className="w-4 h-4" />,
      label: 'Baixar NF',
      onClick: () => handleDownloadNF(nf),
    },
    ...(nf.status === 'Emitida'
      ? [
          {
            icon: <X className="w-4 h-4" />,
            label: 'Cancelar NF',
            onClick: () => handleCancelNF(nf),
          },
        ]
      : []),
  ]

  const handleSearch = (query: string) => {
    setSearch(query)
  }

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }



  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  // Usar dados do summary do hook
  const totalEmitidas = tableData.filter((nf) => nf.status === 'Emitida').length
  const totalCanceladas = tableData.filter((nf) => nf.status === 'Cancelada').length

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-3xl font-bold text-primary">
              {totalEmitidas.toString().padStart(2, '0')}
            </p>
            <p className="text-sm text-muted-foreground">NFs Emitidas</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-3xl font-bold text-red-500">
              {totalCanceladas.toString().padStart(2, '0')}
            </p>
            <p className="text-sm text-muted-foreground">NFs Canceladas</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-3xl font-bold text-primary">{formatCurrency(summary.issued)}</p>
            <p className="text-sm text-muted-foreground">Valor Total Emitido</p>
          </div>
        </div>

        {/* Tabela */}
        <DataTable<NFTableRow>
          title="NFs Emitidas"
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
