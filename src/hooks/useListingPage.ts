import { useState, useCallback } from 'react'

/**
 * Tipos de ação disponíveis para modais de confirmação em páginas de listagem
 */
export type ListingModalAction = 'deactivate' | 'block' | 'reactivate' | 'delete' | null

/**
 * Opções de configuração para o hook useListingPage
 */
interface UseListingPageOptions<T> {
  /** Callback para desativar um item */
  onDeactivate?: (item: T) => Promise<void>
  /** Callback para bloquear um item */
  onBlock?: (item: T) => Promise<void>
  /** Callback para reativar um item */
  onReactivate?: (item: T) => Promise<void>
  /** Callback para excluir um item */
  onDelete?: (item: T) => Promise<void>
  /** Labels customizados para os modais */
  labels?: Partial<Record<NonNullable<ListingModalAction>, {
    title: string
    description: string | ((item: T) => string)
    confirmLabel: string
  }>>
}

/**
 * Retorno do hook useListingPage
 */
interface UseListingPageReturn<T> {
  /** Item selecionado para a ação */
  selectedItem: T | null
  /** Ação atual (determina qual modal mostrar) */
  modalAction: ListingModalAction
  /** Se o modal de confirmação deve estar aberto */
  isConfirmModalOpen: boolean
  /** Se está processando uma ação */
  isLoading: boolean
  /** Inicia uma ação com um item */
  handleAction: (action: ListingModalAction, item: T) => void
  /** Confirma a ação atual */
  handleConfirm: () => Promise<void>
  /** Fecha o modal e limpa o estado */
  handleCloseModal: () => void
  /** Retorna as props para o ConfirmationModal baseado na ação atual */
  getConfirmModalProps: () => {
    title: string
    description: string
    confirmLabel: string
    variant: 'danger' | 'warning' | 'info'
  }
}

/**
 * Configurações padrão para cada tipo de ação
 */
const defaultActionConfigs: Record<NonNullable<ListingModalAction>, {
  title: string
  description: string
  confirmLabel: string
  variant: 'danger' | 'warning' | 'info'
}> = {
  deactivate: {
    title: 'Desativar',
    description: 'Tem certeza que deseja desativar este item? Ele não aparecerá mais nas listagens ativas.',
    confirmLabel: 'Desativar',
    variant: 'warning',
  },
  block: {
    title: 'Bloquear',
    description: 'Tem certeza que deseja bloquear este item? Ele não poderá ser utilizado até ser desbloqueado.',
    confirmLabel: 'Bloquear',
    variant: 'danger',
  },
  reactivate: {
    title: 'Reativar',
    description: 'Tem certeza que deseja reativar este item? Ele voltará a aparecer nas listagens ativas.',
    confirmLabel: 'Reativar',
    variant: 'info',
  },
  delete: {
    title: 'Excluir',
    description: 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
    confirmLabel: 'Excluir',
    variant: 'danger',
  },
}

/**
 * Hook para gerenciar estado e ações comuns em páginas de listagem
 *
 * Encapsula a lógica de:
 * - Seleção de item para ação
 * - Controle de modal de confirmação
 * - Execução de ações (desativar, bloquear, reativar, excluir)
 * - Loading state durante operações
 *
 * @example
 * const {
 *   selectedItem,
 *   isConfirmModalOpen,
 *   isLoading,
 *   handleAction,
 *   handleConfirm,
 *   handleCloseModal,
 *   getConfirmModalProps,
 * } = useListingPage({
 *   onDeactivate: async (patient) => {
 *     await patientService.deactivate(patient.id)
 *     refetch()
 *   },
 *   onBlock: async (patient) => {
 *     await patientService.block(patient.id)
 *     refetch()
 *   },
 * })
 *
 * // Na tabela
 * <DropdownMenuItem onClick={() => handleAction('deactivate', row)}>
 *   Desativar
 * </DropdownMenuItem>
 *
 * // Modal de confirmação
 * <ConfirmationModal
 *   isOpen={isConfirmModalOpen}
 *   onClose={handleCloseModal}
 *   onConfirm={handleConfirm}
 *   isLoading={isLoading}
 *   {...getConfirmModalProps()}
 * />
 */
export function useListingPage<T>(
  options: UseListingPageOptions<T> = {}
): UseListingPageReturn<T> {
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [modalAction, setModalAction] = useState<ListingModalAction>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = useCallback((action: ListingModalAction, item: T) => {
    setSelectedItem(item)
    setModalAction(action)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null)
    setModalAction(null)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!selectedItem || !modalAction) return

    const actionMap: Record<NonNullable<ListingModalAction>, ((item: T) => Promise<void>) | undefined> = {
      deactivate: options.onDeactivate,
      block: options.onBlock,
      reactivate: options.onReactivate,
      delete: options.onDelete,
    }

    const actionFn = actionMap[modalAction]
    if (!actionFn) {
      handleCloseModal()
      return
    }

    setIsLoading(true)
    try {
      await actionFn(selectedItem)
      handleCloseModal()
    } catch (error) {
      // Erro é tratado pelo callback (toast, etc.)
      console.error(`Error executing ${modalAction}:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedItem, modalAction, options, handleCloseModal])

  const getConfirmModalProps = useCallback(() => {
    if (!modalAction) {
      return {
        title: '',
        description: '',
        confirmLabel: '',
        variant: 'info' as const,
      }
    }

    // Usar labels customizados se fornecidos
    const customLabels = options.labels?.[modalAction]
    const defaultConfig = defaultActionConfigs[modalAction]

    const description = customLabels?.description
      ? typeof customLabels.description === 'function' && selectedItem
        ? customLabels.description(selectedItem)
        : customLabels.description as string
      : defaultConfig.description

    return {
      title: customLabels?.title || defaultConfig.title,
      description,
      confirmLabel: customLabels?.confirmLabel || defaultConfig.confirmLabel,
      variant: defaultConfig.variant,
    }
  }, [modalAction, options.labels, selectedItem])

  return {
    selectedItem,
    modalAction,
    isConfirmModalOpen: modalAction !== null,
    isLoading,
    handleAction,
    handleConfirm,
    handleCloseModal,
    getConfirmModalProps,
  }
}
