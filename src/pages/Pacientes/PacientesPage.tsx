import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Ban, MessageCircle, RotateCcw, UserSearch, UserX } from 'lucide-react'
import { DataTable, FloatingButton, SimpleDropdownMenu, StatusBadge } from '@/components/ui'
import { ChatPanel } from '@/components/chat'
import { ConfirmActionModal, NovoPacienteModal } from '@/components/modals'
import { usePatients, useInsurances } from '@/hooks'
import type { PatientListItem } from '@/types/patient'
import type { CreatePatientInput } from '@/schemas/patient.schema'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'

const tableColumns: Column<PatientListItem>[] = [
  {
    key: 'name',
    header: 'NOME COMPLETO',
    width: 'min-w-[180px] max-w-[280px] flex-1',
    truncate: true,
    showOnMobile: true,
    mobilePriority: 1,
  },
  {
    key: 'email',
    header: 'E-MAIL',
    width: 'min-w-[180px] max-w-[240px] flex-1',
    truncate: true,
    showOnMobile: true,
    mobilePriority: 2,
  },
  {
    key: 'cpf',
    header: 'CPF',
    width: 'w-[130px]',
    showOnMobile: true,
    mobilePriority: 3,
  },
  {
    key: 'insurance',
    header: 'CONVÊNIO',
    width: 'min-w-[100px] max-w-[150px]',
    truncate: true,
  },
  {
    key: 'status',
    header: 'STATUS',
    width: 'w-[100px]',
    showOnMobile: true,
    mobilePriority: 4,
    render: (item) => <StatusBadge status={item.status} variant="patient" />,
  },
]

// Configuração base de filtros para o DataTable (status)
const statusFilterOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'blocked', label: 'Bloqueado' },
]

type ModalAction = 'deactivate' | 'block' | 'reactivate' | null

export function PacientesPage() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [isNovoPacienteOpen, setIsNovoPacienteOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  // Usar o hook de pacientes
  const {
    patients,
    isLoading,
    error,
    setSearch,
    createPatient,
    changeStatus,
    refresh,
  } = usePatients()

  // Usar o hook de convênios para popular o filtro
  const { insurances } = useInsurances()

  // Configuração dinâmica de filtros
  const filterConfig: FilterConfig = useMemo(() => {
    const insuranceOptions = insurances.map(ins => ({
      value: ins.id,
      label: ins.name,
    }))

    return {
      status: statusFilterOptions,
      insurance: insuranceOptions.length > 0 ? insuranceOptions : undefined,
    }
  }, [insurances])

  // Filtrar pacientes localmente baseado nos filtros aplicados
  const filteredPatients = useMemo(() => {
    let result = patients

    // Filtrar por status
    if (filters.status) {
      result = result.filter(p => p.status === filters.status)
    }

    // Filtrar por convênio
    if (filters.insurance) {
      result = result.filter(p => p.insuranceId === filters.insurance)
    }

    return result
  }, [patients, filters])

  const handleDeactivate = (patient: PatientListItem) => {
    setSelectedPatient(patient)
    setModalAction('deactivate')
  }

  const handleBlock = (patient: PatientListItem) => {
    setSelectedPatient(patient)
    setModalAction('block')
  }

  const handleReactivate = (patient: PatientListItem) => {
    setSelectedPatient(patient)
    setModalAction('reactivate')
  }

  const handleCloseModal = () => {
    setSelectedPatient(null)
    setModalAction(null)
  }

  const handleConfirmDeactivate = async () => {
    if (!selectedPatient) return

    setIsProcessing(true)
    const success = await changeStatus(selectedPatient.id, 'inactive')
    setIsProcessing(false)

    if (success) {
      handleCloseModal()
    }
  }

  const handleConfirmBlock = async () => {
    if (!selectedPatient) return

    setIsProcessing(true)
    const success = await changeStatus(selectedPatient.id, 'blocked')
    setIsProcessing(false)

    if (success) {
      handleCloseModal()
    }
  }

  const handleConfirmReactivate = async () => {
    if (!selectedPatient) return

    setIsProcessing(true)
    const success = await changeStatus(selectedPatient.id, 'active')
    setIsProcessing(false)

    if (success) {
      handleCloseModal()
    }
  }

  const handleViewDetails = (patient: PatientListItem) => {
    navigate({ to: '/pacientes/$patientId', params: { patientId: patient.id }, search: { tab: undefined } })
  }

  const getRowActions = (patient: PatientListItem) => {
    const actions = [
      {
        icon: <UserSearch className="w-4 h-4" />,
        label: 'Detalhes do paciente',
        onClick: () => handleViewDetails(patient),
      },
    ]

    // Ações baseadas no status atual
    if (patient.status === 'active') {
      actions.push(
        {
          icon: <UserX className="w-4 h-4" />,
          label: 'Desativar paciente',
          onClick: () => handleDeactivate(patient),
        },
        {
          icon: <Ban className="w-4 h-4" />,
          label: 'Bloquear paciente',
          onClick: () => handleBlock(patient),
        }
      )
    } else if (patient.status === 'inactive' || patient.status === 'blocked') {
      actions.push({
        icon: <RotateCcw className="w-4 h-4" />,
        label: 'Reativar paciente',
        onClick: () => handleReactivate(patient),
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

  const handleNewPatient = () => {
    setIsNovoPacienteOpen(true)
  }

  const handleNovoPacienteSubmit = async (data: CreatePatientInput) => {
    setIsProcessing(true)
    const result = await createPatient(data)
    setIsProcessing(false)

    if (result) {
      setIsNovoPacienteOpen(false)
    }
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  // Tratamento de erro
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => {
              void refresh()
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <DataTable<PatientListItem>
        title="Listagem de pacientes"
        columns={tableColumns}
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        rowActions={(item) => <SimpleDropdownMenu items={getRowActions(item)} />}
        onSearch={handleSearch}
        filterConfig={filterConfig}
        onApplyFilters={handleApplyFilters}
        onNewItem={handleNewPatient}
        newItemLabel="Novo paciente"
        isLoading={isLoading}
        onItemClick={handleViewDetails}
      />

      {/* Botão Flutuante de Chat */}
      <FloatingButton
        icon={<MessageCircle className="w-8 h-8 text-primary-foreground" fill="currentColor" />}
        onClick={handleOpenChat}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Modal de Desativar Paciente */}
      <ConfirmActionModal
        isOpen={modalAction === 'deactivate'}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDeactivate}
        title="Desativar paciente"
        itemCount={1}
        itemLabel="paciente selecionado"
        description={`Tem certeza que deseja desativar o paciente "${selectedPatient?.name}"? O paciente não poderá mais realizar agendamentos.`}
        confirmLabel={isProcessing ? 'Desativando...' : 'Desativar'}
        cancelLabel="Voltar"
        variant="warning"
      />

      {/* Modal de Bloquear Paciente */}
      <ConfirmActionModal
        isOpen={modalAction === 'block'}
        onClose={handleCloseModal}
        onConfirm={handleConfirmBlock}
        title="Bloquear paciente"
        itemCount={1}
        itemLabel="paciente selecionado"
        description={`Tem certeza que deseja bloquear o paciente "${selectedPatient?.name}"? O paciente será impedido de acessar o sistema.`}
        confirmLabel={isProcessing ? 'Bloqueando...' : 'Bloquear'}
        cancelLabel="Voltar"
        variant="danger"
      />

      {/* Modal de Reativar Paciente */}
      <ConfirmActionModal
        isOpen={modalAction === 'reactivate'}
        onClose={handleCloseModal}
        onConfirm={handleConfirmReactivate}
        title="Reativar paciente"
        itemCount={1}
        itemLabel="paciente selecionado"
        description={`Tem certeza que deseja reativar o paciente "${selectedPatient?.name}"? O paciente voltará a ter acesso ao sistema.`}
        confirmLabel={isProcessing ? 'Reativando...' : 'Reativar'}
        cancelLabel="Voltar"
        variant="warning"
      />

      {/* Modal de Novo Paciente */}
      <NovoPacienteModal
        isOpen={isNovoPacienteOpen}
        onClose={() => setIsNovoPacienteOpen(false)}
        onSubmit={handleNovoPacienteSubmit}
        isLoading={isProcessing}
      />
    </div>
  )
}
