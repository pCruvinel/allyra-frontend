import { useState, useEffect } from 'react'
import { FileText, Loader2, ChevronLeft } from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button, SimpleDropdownMenu } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useRepasses } from '@/hooks'
import type { RepasseDetalheFormatted, RepasseItemFormatted } from '@/services/financial.service'

interface DetalhesRepasseModalProps {
  isOpen: boolean
  onClose: () => void
  transferId: string
}

type ViewMode = 'list' | 'detail'

const statusStyles: Record<string, string> = {
  Total: 'bg-primary text-white',
  Parcial: 'bg-yellow-500 text-white',
  Pendente: 'bg-muted text-muted-foreground',
  pago: 'bg-primary text-white',
  gerado: 'bg-muted text-muted-foreground',
  aprovado: 'bg-yellow-500 text-white',
}

export function DetalhesRepasseModal({ isOpen, onClose, transferId }: DetalhesRepasseModalProps) {
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null)
  const [transferDetails, setTransferDetails] = useState<RepasseDetalheFormatted[]>([])
  const [transferItems, setTransferItems] = useState<RepasseItemFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { getRepasseDetails, getRepasseItems } = useRepasses({ autoFetch: false })

  // Carregar detalhes quando o modal abrir
  useEffect(() => {
    if (isOpen && transferId) {
      setIsLoading(true)
      getRepasseDetails(transferId)
        .then(details => {
          setTransferDetails(details)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, transferId, getRepasseDetails])

  // Carregar itens quando um detalhe for selecionado
  useEffect(() => {
    if (selectedDetailId) {
      setIsLoading(true)
      getRepasseItems(selectedDetailId)
        .then(items => {
          setTransferItems(items)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [selectedDetailId, getRepasseItems])

  const handleViewDetails = (detailId: string) => {
    setSelectedDetailId(detailId)
    setViewMode('detail')
  }

  const handleBack = () => {
    setViewMode('list')
    setSelectedDetailId(null)
    setTransferItems([])
  }

  const handleClose = () => {
    setViewMode('list')
    setSelectedDetailId(null)
    setTransferDetails([])
    setTransferItems([])
    onClose()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getRowActions = (detail: RepasseDetalheFormatted) => [
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Detalhes',
      onClick: () => handleViewDetails(detail.id),
    },
  ]

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pago: 'Total',
      gerado: 'Pendente',
      aprovado: 'Parcial',
      Total: 'Total',
      Parcial: 'Parcial',
      Pendente: 'Pendente',
    }
    return labels[status] || status
  }

  // Conteudo da lista de detalhes
  const listContent = (
    <div className="border border-border rounded-lg overflow-hidden">
      {transferDetails.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum detalhe de repasse encontrado.
        </div>
      ) : isMobile ? (
        // Mobile: cards
        <div className="divide-y divide-border">
          {transferDetails.map((detail, index) => (
            <div
              key={detail.id}
              className="p-4 hover:bg-muted/50 cursor-pointer"
              onClick={() => handleViewDetails(detail.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-8 bg-primary rounded-full" />
                  <span className="text-sm font-medium text-foreground">
                    Repasse {(index + 1).toString().padStart(4, '0')}
                  </span>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    statusStyles[detail.status] || 'bg-muted text-muted-foreground'
                  )}
                >
                  {getStatusLabel(detail.status)}
                </span>
              </div>
              <div className="ml-3 space-y-1">
                <p className="text-sm text-foreground">{detail.profissionalName}</p>
                <p className="text-sm font-semibold text-primary">{formatCurrency(detail.valor)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: tabela
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                REPASSE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                PROFISSIONAL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                VALOR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ACOES
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {transferDetails.map((detail, index) => (
              <tr key={detail.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-1 h-8 bg-primary rounded-full mr-3" />
                    <span className="text-sm text-foreground">{(index + 1).toString().padStart(4, '0')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {detail.profissionalName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {formatCurrency(detail.valor)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      statusStyles[detail.status] || 'bg-muted text-muted-foreground'
                    )}
                  >
                    {getStatusLabel(detail.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <SimpleDropdownMenu items={getRowActions(detail)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  // Conteudo dos itens do repasse
  const detailContent = (
    <div className="border border-border rounded-lg overflow-hidden">
      {transferItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum item de repasse encontrado.
        </div>
      ) : isMobile ? (
        // Mobile: cards
        <div className="divide-y divide-border">
          {transferItems.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-8 bg-pink-400 rounded-full" />
                <span className="text-sm font-medium text-foreground">
                  {item.dataAtendimentoFormatted}
                </span>
              </div>
              <div className="ml-3 space-y-1">
                <p className="text-sm text-foreground">{item.pacienteName}</p>
                <p className="text-sm text-muted-foreground">{item.servico}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-semibold text-primary">{formatCurrency(item.valorRepasse)}</p>
                  <p className="text-xs text-muted-foreground">{item.regraAplicada}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: tabela
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ATENDIMENTO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                FATURA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                PACIENTE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                SERVICO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                REPASSE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                REGRA
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {transferItems.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-1 h-8 bg-pink-400 rounded-full mr-3" />
                    <span className="text-sm text-foreground">
                      {item.dataAtendimentoFormatted}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {item.numeroFatura}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {item.pacienteName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {item.servico}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {formatCurrency(item.valorRepasse)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {item.regraAplicada}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  const content = isLoading ? (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ) : viewMode === 'list' ? listContent : detailContent

  // Footer mobile: stack vertical
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      {viewMode === 'detail' && (
        <Button
          variant="outline"
          onClick={handleBack}
          className="w-full rounded-full border-primary text-primary hover:bg-primary/10"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      )}
      <Button
        onClick={handleClose}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
      >
        Fechar
      </Button>
    </div>
  )

  // Mobile: usar AppDrawer (fullscreen por ter tabela/lista grande)
  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title={viewMode === 'list' ? 'Detalhes do repasse' : 'Itens do repasse'}
        showBackButton={viewMode === 'detail'}
        onBack={handleBack}
      >
        <AppDrawerBody>
          {content}
        </AppDrawerBody>
        <AppDrawerFooter>
          {mobileActions}
        </AppDrawerFooter>
      </AppDrawer>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalhes do repasse" size="lg">
      <ModalBody>
        {content}
      </ModalBody>

      <ModalFooter>
        {viewMode === 'detail' && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="rounded-full px-8 border-primary text-primary hover:bg-primary/10"
          >
            Voltar
          </Button>
        )}
        <Button
          onClick={handleClose}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
