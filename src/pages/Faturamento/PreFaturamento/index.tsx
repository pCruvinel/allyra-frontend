import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  FileText,
  Pencil,
  Trash2,
  MessageCircle,
  Filter,
  CheckCircle,
} from 'lucide-react'
import {
  Button,
  SimpleDropdownMenu,
  FloatingButton,
  SearchInput,
  Pagination,
} from '@/components/ui'
import { Input } from '@/components/ui/input'
import { ChatPanel } from '@/components/chat'
import { AlterarPreFaturamentoModal } from '@/components/modals/AlterarPreFaturamentoModal'
import { ConfirmActionModal } from '@/components/modals'
import { usePreFaturamentos, usePaginationConfig } from '@/hooks'
import type { PreFaturamento } from '@/types/billing'
import { cn } from '@/lib/utils'

// Interface para dados da tabela
interface PreFaturamentoTableRow {
  id: string
  patientId: string
  patientName: string
  unit: string
  insurance: string
  professionalId: string
  professionalName: string
  service: string
  date: string
  value: number
  isOpen: boolean
}

export function PreFaturamentoPage() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAlterarModalOpen, setIsAlterarModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PreFaturamento | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isFaturarModalOpen, setIsFaturarModalOpen] = useState(false)

  // Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    patient: '',
    unit: '',
    insurance: '',
  })

  // Buscar pré-faturamentos do Supabase
  const { preFaturamentos, total, createFaturamento } = usePreFaturamentos()

  // Converter dados do banco para formato da tabela
  const tableData: PreFaturamentoTableRow[] = useMemo(() => {
    return preFaturamentos.map(item => ({
      id: item.id,
      patientId: item.patientId,
      patientName: item.patientName,
      unit: 'Matriz', // Unidade padrão
      insurance: item.insuranceName || 'Particular',
      professionalId: item.professionalId,
      professionalName: item.professionalName,
      service: item.serviceName,
      date: item.date,
      value: item.value,
      isOpen: item.isOpen,
    }))
  }, [preFaturamentos])

  // Buscar configuração de paginação do banco
  const { itemsPerPage } = usePaginationConfig()
  const totalPages = Math.ceil(tableData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = tableData.slice(startIndex, startIndex + itemsPerPage)

  const handleGoBack = () => {
    navigate({ to: '/faturamento' })
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.map((item) => item.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleEditItem = (item: PreFaturamentoTableRow) => {
    // Converter para tipo esperado pelo modal
    const preFat: PreFaturamento = {
      ...item,
      status: 'Aberto',
    }
    setSelectedItem(preFat)
    setIsAlterarModalOpen(true)
  }

  const handleViewDetails = (item: PreFaturamentoTableRow) => {
    console.log('Ver detalhes:', item.id)
  }

  const handleFaturar = (item: PreFaturamentoTableRow) => {
    const preFat: PreFaturamento = {
      ...item,
      status: 'Aberto',
    }
    setSelectedItem(preFat)
    setIsFaturarModalOpen(true)
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setIsDeleteModalOpen(true)
  }

  const handleBatchFalta = () => {
    if (selectedIds.length === 0) return
    console.log('Registrar falta para:', selectedIds)
  }

  const handleBatchFinalizar = () => {
    if (selectedIds.length === 0) return
    console.log('Finalizar atendimento:', selectedIds)
  }

  const handleBatchFaturar = () => {
    if (selectedIds.length === 0) return
    setIsFaturarModalOpen(true)
  }

  const handleConfirmDelete = () => {
    console.log('Excluindo itens:', selectedIds)
    setSelectedIds([])
    setIsDeleteModalOpen(false)
  }

  const handleConfirmFaturar = async () => {
    const idsToFaturar = selectedItem ? [selectedItem.id] : selectedIds
    if (idsToFaturar.length > 0) {
      const result = await createFaturamento(idsToFaturar, 'convenio')
      if (result) {
        console.log('Faturamento criado:', result.invoiceNumber)
      }
    }
    setSelectedIds([])
    setSelectedItem(null)
    setIsFaturarModalOpen(false)
  }

  const handleAlterarSubmit = (data: {
    value: number
    procedure: string
    transferRule: string
    insurance: string
  }) => {
    console.log('Alterando pré-faturamento:', selectedItem?.id, data)
    setIsAlterarModalOpen(false)
    setSelectedItem(null)
  }

  const getRowActions = (item: PreFaturamentoTableRow) => [
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Faturar',
      onClick: () => handleFaturar(item),
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Detalhes da fatura',
      onClick: () => handleViewDetails(item),
    },
    {
      icon: <Pencil className="w-4 h-4" />,
      label: 'Editar fatura',
      onClick: () => handleEditItem(item),
    },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isAllSelected = paginatedData.length > 0 && selectedIds.length === paginatedData.length

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={handleGoBack} className="hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Pré-faturamento</span>
          <span className="text-muted-foreground">›</span>
          <span>Início</span>
          <span className="text-muted-foreground">›</span>
          <span>Faturamento</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-foreground">Pré-faturamento</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Filtros */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Data inicial</span>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Data final</span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Paciente</span>
              <Input
                type="text"
                placeholder="Buscar paciente"
                value={filters.patient}
                onChange={(e) => setFilters({ ...filters, patient: e.target.value })}
                className="w-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Unidade</span>
              <Input
                type="text"
                placeholder="Todas"
                value={filters.unit}
                onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
                className="w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Convênio</span>
              <Input
                type="text"
                placeholder="Todos"
                value={filters.insurance}
                onChange={(e) => setFilters({ ...filters, insurance: e.target.value })}
                className="w-32"
              />
            </div>
            <Button variant="outline" className="rounded-full">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </div>

        {/* Ações em Lote */}
        {selectedIds.length > 0 && (
          <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedIds.length} item(s) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelete}
                className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchFalta}
                className="rounded-full"
              >
                Registrar falta
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchFinalizar}
                className="rounded-full"
              >
                Finalizar atendimento
              </Button>
              <Button
                size="sm"
                onClick={handleBatchFaturar}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Faturar
              </Button>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-card rounded-2xl border border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Pré-faturamento</h2>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-60"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    PACIENTE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    UNIDADE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    CONVÊNIO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    PROFISSIONAL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    SERVIÇO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    DATA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    VALOR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    ATD. ABERTO
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-1 h-8 bg-primary rounded-full mr-3" />
                        <span className="text-sm text-foreground">{item.patientName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">{item.unit}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{item.insurance}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{item.professionalName}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{item.service}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{formatDate(item.date)}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{formatCurrency(item.value)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          item.isOpen ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {item.isOpen ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <SimpleDropdownMenu items={getRowActions(item)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total || tableData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modal Alterar Pré-faturamento */}
      <AlterarPreFaturamentoModal
        isOpen={isAlterarModalOpen}
        onClose={() => {
          setIsAlterarModalOpen(false)
          setSelectedItem(null)
        }}
        onSubmit={handleAlterarSubmit}
        preFaturamento={selectedItem}
      />

      {/* Modal Confirmar Exclusão */}
      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir pré-faturamento"
        itemCount={selectedIds.length}
        itemLabel="item(s) selecionado(s)"
        description={`Tem certeza que deseja excluir ${selectedIds.length} item(s) do pré-faturamento? Esta ação não poderá ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Modal Confirmar Faturamento */}
      <ConfirmActionModal
        isOpen={isFaturarModalOpen}
        onClose={() => {
          setIsFaturarModalOpen(false)
          setSelectedItem(null)
        }}
        onConfirm={handleConfirmFaturar}
        title="Faturar"
        itemCount={selectedItem ? 1 : selectedIds.length}
        itemLabel="item(s) selecionado(s)"
        description={`Tem certeza que deseja faturar ${selectedItem ? '1 item' : `${selectedIds.length} itens`}?`}
        confirmLabel="Faturar"
        cancelLabel="Cancelar"
        variant="warning"
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
