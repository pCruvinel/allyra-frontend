import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { UserSearch, UserX, Ban, MessageCircle } from 'lucide-react'
import { DataTable, SimpleDropdownMenu, FloatingButton, StatusBadge } from '@/components/ui'
import { ChatPanel } from '@/components/chat'
import { ConfirmActionModal } from '@/components/modals'
import { NovoClienteModal } from '@/components/modals/NovoClienteModal'
import { useClients } from '@/hooks'
import type { ClientFormatted } from '@/services/clients.service'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'

const tableColumns: Column<ClientFormatted>[] = [
  {
    key: 'code',
    header: 'CÓDIGO',
    width: 'w-[120px]',
  },
  {
    key: 'fantasyName',
    header: 'NOME FANTASIA',
    width: 'w-[220px]',
  },
  {
    key: 'cnpj',
    header: 'CNPJ',
    width: 'w-[160px]',
    render: (item) => {
      // Formatar CNPJ
      const cnpj = item.cnpj
      if (cnpj.length === 14) {
        return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
      }
      return cnpj
    },
  },
  {
    key: 'city',
    header: 'CIDADE/UF',
    render: (item) => item.city && item.state ? `${item.city}/${item.state}` : '-',
  },
  {
    key: 'status',
    header: 'STATUS',
    render: (item) => <StatusBadge status={item.status} variant="client" />,
  },
]

// Configuração de filtros para o DataTable
const filterConfig: FilterConfig = {
  status: [
    { value: 'ativa', label: 'Ativa' },
    { value: 'inativa', label: 'Inativa' },
    { value: 'bloqueada', label: 'Bloqueada' },
  ],
}

type ModalAction = 'deactivate' | 'block' | null

export function ClientesPage() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientFormatted | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [isNovoClienteOpen, setIsNovoClienteOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  // Buscar clientes do Supabase
  const { clients, isLoading, createClient, updateClientStatus, setSearch } = useClients()

  // Filtrar clientes baseado nos filtros aplicados
  const tableData = useMemo(() => {
    let result = clients

    // Filtrar por status
    if (filters.status) {
      result = result.filter(c => c.status === filters.status)
    }

    return result
  }, [clients, filters])

  const handleDeactivate = (client: ClientFormatted) => {
    setSelectedClient(client)
    setModalAction('deactivate')
  }

  const handleBlock = (client: ClientFormatted) => {
    setSelectedClient(client)
    setModalAction('block')
  }

  const handleCloseModal = () => {
    setSelectedClient(null)
    setModalAction(null)
  }

  const handleConfirmDeactivate = async () => {
    if (selectedClient) {
      await updateClientStatus(selectedClient.id, 'inativa')
      handleCloseModal()
    }
  }

  const handleConfirmBlock = async () => {
    if (selectedClient) {
      await updateClientStatus(selectedClient.id, 'bloqueada')
      handleCloseModal()
    }
  }

  const handleViewDetails = (client: ClientFormatted) => {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: client.id } })
  }

  const getRowActions = (client: ClientFormatted) => [
    {
      icon: <UserSearch className="w-4 h-4" />,
      label: 'Detalhes do cliente',
      onClick: () => handleViewDetails(client),
    },
    {
      icon: <UserX className="w-4 h-4" />,
      label: 'Desativar cliente',
      onClick: () => handleDeactivate(client),
    },
    {
      icon: <Ban className="w-4 h-4" />,
      label: 'Bloquear cliente',
      onClick: () => handleBlock(client),
    },
  ]

  const handleSearch = (query: string) => {
    setSearch(query)
  }

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleNewClient = () => {
    setIsNovoClienteOpen(true)
  }

  const handleNovoClienteSubmit = async (data: {
    code: string
    fantasyName: string
    companyName: string
    cnpj: string
    stateRegistration?: string
    email: string
    phone: string
    cep: string
    address: string
    neighborhood: string
    city: string
    state: string
    modules: string[]
  }) => {
    // Montar endereço completo
    const endereco = [data.address, data.neighborhood, data.city, data.state]
      .filter(Boolean)
      .join(', ')

    const result = await createClient({
      cnpj: data.cnpj.replace(/\D/g, ''), // Remove formatação do CNPJ
      nome_fantasia: data.fantasyName,
      razao_social: data.companyName,
      email: data.email,
      telefone: data.phone,
      endereco_completo: endereco || undefined,
      cidade: data.city || undefined,
      estado: data.state || undefined,
      cep: data.cep || undefined,
      bairro: data.neighborhood || undefined,
      modulos_ativos: data.modules,
    })

    if (result) {
      setIsNovoClienteOpen(false)
    }
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  return (
    <div className="space-y-6 pb-20">
      <DataTable<ClientFormatted>
        title="Listagem de clientes"
        columns={tableColumns}
        data={tableData}
        keyExtractor={(item) => item.id}
        rowActions={(item) => <SimpleDropdownMenu items={getRowActions(item)} />}
        onSearch={handleSearch}
        filterConfig={filterConfig}
        onApplyFilters={handleApplyFilters}
        onNewItem={handleNewClient}
        newItemLabel="Novo cliente"
        isLoading={isLoading}
      />

      {/* Botão Flutuante de Chat */}
      <FloatingButton
        icon={<MessageCircle className="w-8 h-8 text-primary-foreground" fill="currentColor" />}
        onClick={handleOpenChat}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Modal de Desativar Cliente */}
      <ConfirmActionModal
        isOpen={modalAction === 'deactivate'}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDeactivate}
        title="Desativar cliente"
        itemCount={1}
        itemLabel="cliente selecionado"
        description={`Tem certeza que deseja desativar o cliente "${selectedClient?.fantasyName}"? O cliente não poderá mais acessar o sistema.`}
        confirmLabel="Desativar"
        cancelLabel="Voltar"
        variant="warning"
      />

      {/* Modal de Bloquear Cliente */}
      <ConfirmActionModal
        isOpen={modalAction === 'block'}
        onClose={handleCloseModal}
        onConfirm={handleConfirmBlock}
        title="Bloquear cliente"
        itemCount={1}
        itemLabel="cliente selecionado"
        description={`Tem certeza que deseja bloquear o cliente "${selectedClient?.fantasyName}"? O acesso será imediatamente suspenso.`}
        confirmLabel="Bloquear"
        cancelLabel="Voltar"
        variant="danger"
      />

      {/* Modal de Novo Cliente */}
      <NovoClienteModal
        isOpen={isNovoClienteOpen}
        onClose={() => setIsNovoClienteOpen(false)}
        onSubmit={handleNovoClienteSubmit}
      />
    </div>
  )
}
