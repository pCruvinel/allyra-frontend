import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { Printer, MessageCircle, Loader2 } from 'lucide-react'
import { Button, FloatingButton } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { ChatPanel } from '@/components/chat'
import { useContasReceber, usePaginationConfig } from '@/hooks'
import { cn } from '@/lib/utils'
import type { ContaReceberFormatted, ContaReceberStatusDB } from '@/services/financial.service'

const statusStyles: Record<ContaReceberStatusDB, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  pago: 'bg-primary text-white',
  vencido: 'bg-red-100 text-red-700',
  cancelado: 'bg-muted text-muted-foreground',
  acordo: 'bg-yellow-100 text-yellow-700',
}

const statusLabels: Record<ContaReceberStatusDB, string> = {
  aberto: 'Aberto',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
  acordo: 'Em Acordo',
}

export function DetalhesFaturaPage() {
  const { faturaId } = useParams({ from: '/financeiro/contas-a-receber/$faturaId' })
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentConta, setCurrentConta] = useState<ContaReceberFormatted | null>(null)
  const [patientContas, setPatientContas] = useState<ContaReceberFormatted[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Buscar configuração de paginação do banco
  const { itemsPerPage } = usePaginationConfig()

  const { getContaById, getContasByPatient } = useContasReceber({ autoFetch: false })

  // Carregar conta atual e contas do paciente
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Buscar conta atual
        const conta = await getContaById(faturaId)
        setCurrentConta(conta)

        // Se tiver paciente, buscar todas as contas do paciente
        if (conta?.patientId) {
          const contas = await getContasByPatient(conta.patientId)
          setPatientContas(contas)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (faturaId) {
      loadData()
    }
  }, [faturaId, getContaById, getContasByPatient])

  const totalPages = Math.ceil(patientContas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedContas = patientContas.slice(startIndex, startIndex + itemsPerPage)



  const handlePrint = () => {
    console.log('Imprimir fatura')
  }

  const handleViewBoleto = () => {
    console.log('Visualizar boleto')
  }

  const handleResend = () => {
    console.log('Reenviar')
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Header do Paciente */}
        <div className="bg-muted rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {currentConta?.patientName || 'Paciente não encontrado'}
              </h1>
              <p className="text-sm text-muted-foreground">Paciente</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">
                {currentConta?.loteNumber || '-'}
              </p>
              <p className="text-sm text-muted-foreground">Nº do lote</p>
            </div>
          </div>
        </div>

        {/* Tabela de Faturas */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header da Tabela */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Fatura</h2>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="text-muted-foreground"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewBoleto}
                className="text-primary"
              >
                Boleto
              </Button>
              <Button
                onClick={handleResend}
                className="rounded-full px-6 bg-primary hover:bg-primary/90"
              >
                Reenviar
              </Button>
            </div>
          </div>

          {/* Tabela */}
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  LOTE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  PACIENTE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  CONVÊNIO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  DATA DE VENCIMENTO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  VALOR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedContas.map((conta) => (
                <tr key={conta.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-1 h-8 bg-primary rounded-full mr-3" />
                      <span className="text-sm text-foreground">{conta.loteNumber || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {conta.patientName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {conta.insuranceName || 'Particular'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {conta.dueDateFormatted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatCurrency(conta.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        statusStyles[conta.status]
                      )}
                    >
                      {statusLabels[conta.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="px-6 py-4 border-t border-border">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={patientContas.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
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
