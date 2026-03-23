import { useState, useMemo, useEffect } from 'react'
import { UserSearch, UserX, Ban, MessageCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, SimpleDropdownMenu, FloatingButton } from '@/components/ui'
import { Select } from '@/components/ui/select'
import { ChatPanel } from '@/components/chat'
import { ConfirmActionModal } from '@/components/modals'
import { NovoUsuarioModal } from '@/components/modals/NovoUsuarioModal'
import { UserDetailsModal } from '@/components/modals/UserDetailsModal'
import { useClients, useUsers } from '@/hooks'
import { useModuleAccess } from '@/hooks/useModuleAccess'
import type { SystemUserFormatted, PerfilTipoDB } from '@/services/users.service'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

const statusStyles: Record<SystemUserFormatted['status'], string> = {
  Ativo: 'bg-primary text-white',
  Inativo: 'bg-muted text-muted-foreground',
  Bloqueado: 'bg-red-100 text-red-700',
}

const tableColumns: Column<SystemUserFormatted>[] = [
  {
    key: 'name',
    header: 'NOME',
    width: 'w-[250px]',
  },
  {
    key: 'email',
    header: 'E-MAIL',
    width: 'w-[220px]',
  },
  {
    key: 'permissionLevel',
    header: 'PERFIL',
    width: 'w-[140px]',
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

type ModalAction = 'deactivate' | 'block' | 'reactivate' | 'details' | null

// Configuração de filtros para o DataTable
const filterConfig: FilterConfig = {
  status: [
    { value: 'Ativo', label: 'Ativo' },
    { value: 'Inativo', label: 'Inativo' },
    { value: 'Bloqueado', label: 'Bloqueado' },
  ],
  type: [
    { value: 'admin_master', label: 'Admin Master' },
    { value: 'desenvolvedor', label: 'Desenvolvedor' },
    { value: 'administrador_total', label: 'Administrador Total' },
    { value: 'socio_profissional', label: 'Sócio Profissional' },
    { value: 'profissional', label: 'Profissional' },
    { value: 'secretaria', label: 'Secretária' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'faturamento', label: 'Faturamento' },
  ],
}

export function UsuariosPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUserFormatted | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [isNovoUsuarioOpen, setIsNovoUsuarioOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  // Obtém o perfil do usuário logado
  const { currentPerfil } = useModuleAccess()

  // Buscar clientes do Supabase
  const { clients, isLoading: isLoadingClients } = useClients()

  // Buscar usuários do Supabase (filtrado por cliente selecionado)
  const { users, isLoading: isLoadingUsers, setClientFilter, createUser, updateUserStatus, setSearch } = useUsers({
    autoFetch: true,
  })

  // Obter lista de clientes para o seletor
  const clientOptions = useMemo(() => {
    return clients.map((client) => ({
      value: client.id,
      label: `${client.code} - ${client.fantasyName}`,
    }))
  }, [clients])

  // Selecionar primeiro cliente por padrão
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id)
    }
  }, [clients, selectedClientId])

  // Atualizar filtro de cliente (só busca quando tem clientId)
  useEffect(() => {
    if (selectedClientId) {
      setClientFilter(selectedClientId)
    }
  }, [selectedClientId, setClientFilter])

  // Filtrar usuários pelo cliente selecionado e filtros aplicados
  const filteredUsers = useMemo(() => {
    let result = users

    // Filtrar por cliente
    if (selectedClientId) {
      result = result.filter(u => u.clientId === selectedClientId)
    }

    // Filtrar por status
    if (filters.status) {
      result = result.filter(u => u.status === filters.status)
    }

    // Filtrar por tipo/perfil (usando o campo permissionLevel que já está formatado)
    if (filters.type) {
      // Mapear o tipo do filtro para o permissionLevel formatado
      const perfilLabelMap: Record<string, string> = {
        'admin_master': 'Admin Master',
        'desenvolvedor': 'Desenvolvedor',
        'administrador_total': 'Administrador Total',
        'socio_profissional': 'Sócio Profissional',
        'profissional': 'Profissional',
        'secretaria': 'Secretária',
        'administrativo': 'Administrativo',
        'financeiro': 'Financeiro',
        'faturamento': 'Faturamento',
      }
      const targetLabel = perfilLabelMap[filters.type]
      if (targetLabel) {
        result = result.filter(u => u.permissionLevel === targetLabel)
      }
    }

    return result
  }, [users, selectedClientId, filters])

  const handleDeactivate = (user: SystemUserFormatted) => {
    setSelectedUser(user)
    setModalAction('deactivate')
  }

  const handleBlock = (user: SystemUserFormatted) => {
    setSelectedUser(user)
    setModalAction('block')
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setModalAction(null)
  }

  const handleConfirmDeactivate = async () => {
    if (selectedUser) {
      await updateUserStatus(selectedUser.id, false)
      handleCloseModal()
    }
  }

  const handleConfirmBlock = async () => {
    if (selectedUser) {
      await updateUserStatus(selectedUser.id, false)
      handleCloseModal()
    }
  }

  const handleViewDetails = (user: SystemUserFormatted) => {
    setSelectedUser(user)
    setModalAction('details')
  }

  const handleReactivate = (user: SystemUserFormatted) => {
    setSelectedUser(user)
    setModalAction('reactivate')
  }

  const handleConfirmReactivate = async () => {
    if (selectedUser) {
      await updateUserStatus(selectedUser.id, true)
      handleCloseModal()
    }
  }

  const getRowActions = (user: SystemUserFormatted) => {
    const actions = [
      {
        icon: <UserSearch className="w-4 h-4" />,
        label: 'Detalhes do usuário',
        onClick: () => handleViewDetails(user),
      },
    ]

    // Ações baseadas no status atual
    if (user.status === 'Ativo') {
      actions.push(
        {
          icon: <UserX className="w-4 h-4" />,
          label: 'Desativar usuário',
          onClick: () => handleDeactivate(user),
        },
        {
          icon: <Ban className="w-4 h-4" />,
          label: 'Bloquear usuário',
          onClick: () => handleBlock(user),
        }
      )
    } else {
      // Inativo ou Bloqueado - pode reativar
      actions.push({
        icon: <RotateCcw className="w-4 h-4" />,
        label: 'Reativar usuário',
        onClick: () => handleReactivate(user),
      })
    }

    return actions
  }

  const handleSearch = (query: string) => {
    setSearch(query)
  }

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleNewUser = () => {
    setIsNovoUsuarioOpen(true)
  }

  const handleNovoUsuarioSubmit = async (data: {
    name: string
    permissionLevel: string
    email: string
    phone?: string
  }) => {
    if (!selectedClientId) {
      toast.error('Selecione um cliente primeiro')
      return
    }

    // Mapear permissionLevel para perfil_tipo do banco
    const perfilMap: Record<string, PerfilTipoDB> = {
      'Admin Master': 'super_admin',
      'Administrador Total': 'admin_clinica',
      'Administrador Parcial': 'admin_clinica',
      'Profissional de Saúde': 'profissional',
      'Recepcionista': 'recepcionista',
      'Financeiro': 'financeiro',
      'Visualizador': 'visualizador',
    }

    const result = await createUser({
      email: data.email,
      nome_completo: data.name,
      telefone: data.phone,
      clinica_id: selectedClientId,
      perfil_tipo: perfilMap[data.permissionLevel] || 'visualizador',
    })

    if (result) {
      setIsNovoUsuarioOpen(false)
    }
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  // Converter para formato compatível com UserDetailsModal
  const selectedUserForModal = selectedUser ? {
    id: selectedUser.id,
    clientId: selectedUser.clientCode,
    name: selectedUser.name,
    email: selectedUser.email,
    phone: selectedUser.phone || undefined,
    permissionLevel: selectedUser.permissionLevel,
    status: selectedUser.status,
    lastAccess: selectedUser.lastAccess || undefined,
    createdAt: selectedUser.createdAt,
  } : null

  return (
    <div className="space-y-6 pb-20">
      {/* Header com Seletor de Cliente */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Cliente:</span>
            <Select
              options={clientOptions}
              value={selectedClientId}
              onChange={setSelectedClientId}
              placeholder="Selecione o cliente"
              className="w-64"
              disabled={isLoadingClients}
            />
          </div>
        </div>
      </div>

      <DataTable<SystemUserFormatted>
        title="Listagem de usuários"
        columns={tableColumns}
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        rowActions={(item) => <SimpleDropdownMenu items={getRowActions(item)} />}
        onSearch={handleSearch}
        filterConfig={filterConfig}
        onApplyFilters={handleApplyFilters}
        onNewItem={handleNewUser}
        newItemLabel="Novo usuário"
        isLoading={isLoadingUsers}
        onItemClick={handleViewDetails}
      />

      {/* Botão Flutuante de Chat */}
      <FloatingButton
        icon={<MessageCircle className="w-8 h-8 text-primary-foreground" fill="currentColor" />}
        onClick={handleOpenChat}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Modal de Desativar Usuário */}
      <ConfirmActionModal
        isOpen={modalAction === 'deactivate'}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDeactivate}
        title="Desativar usuário"
        itemCount={1}
        itemLabel="usuário selecionado"
        description={`Tem certeza que deseja desativar o usuário "${selectedUser?.name}"? O usuário não poderá mais acessar o sistema.`}
        confirmLabel="Desativar"
        cancelLabel="Voltar"
        variant="warning"
      />

      {/* Modal de Bloquear Usuário */}
      <ConfirmActionModal
        isOpen={modalAction === 'block'}
        onClose={handleCloseModal}
        onConfirm={handleConfirmBlock}
        title="Bloquear usuário"
        itemCount={1}
        itemLabel="usuário selecionado"
        description={`Tem certeza que deseja bloquear o usuário "${selectedUser?.name}"? O acesso será imediatamente suspenso.`}
        confirmLabel="Bloquear"
        cancelLabel="Voltar"
        variant="danger"
      />

      {/* Modal de Reativar Usuário */}
      <ConfirmActionModal
        isOpen={modalAction === 'reactivate'}
        onClose={handleCloseModal}
        onConfirm={handleConfirmReactivate}
        title="Reativar usuário"
        itemCount={1}
        itemLabel="usuário selecionado"
        description={`Tem certeza que deseja reativar o usuário "${selectedUser?.name}"? O usuário voltará a ter acesso ao sistema.`}
        confirmLabel="Reativar"
        cancelLabel="Voltar"
        variant="warning"
      />

      {/* Modal de Novo Usuário */}
      <NovoUsuarioModal
        isOpen={isNovoUsuarioOpen}
        onClose={() => setIsNovoUsuarioOpen(false)}
        onSubmit={handleNovoUsuarioSubmit}
        currentUserPerfil={currentPerfil || 'admin_master'}
      />

      {/* Modal de Detalhes do Usuário */}
      <UserDetailsModal
        isOpen={modalAction === 'details'}
        onClose={handleCloseModal}
        user={selectedUserForModal}
      />
    </div>
  )
}
