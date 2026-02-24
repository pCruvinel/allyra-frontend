import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  Clock,
  CalendarClock,
  Heart,
  CalendarX,
  Award,
  MessageCircle,
  UserCheck,
  CalendarPlus,
  CalendarMinus,
  UserSearch,
  CreditCard,
} from 'lucide-react'
import { StatCard, DataTable, SimpleDropdownMenu, FloatingButton } from '@/components/ui'
import { ChatPanel } from '@/components/chat'
import { useModal } from '@/contexts'
import { useAppointments, useProfessionals } from '@/hooks'
import type { Column, FilterConfig, FilterValues } from '@/components/ui/data-table'

// Interface para dados da tabela
interface AppointmentTableRow {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  insurance: string | null
  status: string
}

// Labels de status traduzidos para exibição
const statusDisplayLabels: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  aguardando: 'Aguardando',
  em_atendimento: 'Em Atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  falta: 'Falta',
  reagendado: 'Reagendado',
}

// Cores de status para o badge
const statusColors: Record<string, string> = {
  agendado: 'bg-blue-500',
  confirmado: 'bg-green-500',
  aguardando: 'bg-yellow-500',
  em_atendimento: 'bg-purple-500',
  concluido: 'bg-muted-foreground',
  cancelado: 'bg-red-500',
  falta: 'bg-orange-500',
  reagendado: 'bg-cyan-500',
}

// Configuração dos cards de estatísticas
const statCardsConfig = [
  {
    id: 'scheduled',
    icon: <Calendar className="w-5 h-5" />,
    label: 'Consultas agendadas hoje',
    statsKey: 'total' as const,
  },
  {
    id: 'waiting',
    icon: <Clock className="w-5 h-5" />,
    label: 'Pacientes aguardando atendimento',
    statsKey: 'waiting' as const,
  },
  {
    id: 'confirmed',
    icon: <CalendarClock className="w-5 h-5" />,
    label: 'Agendamentos confirmados',
    statsKey: 'confirmed' as const,
  },
  {
    id: 'completed',
    icon: <Heart className="w-5 h-5" />,
    label: 'Atendimentos concluídos hoje',
    statsKey: 'completed' as const,
  },
  {
    id: 'noshow',
    icon: <CalendarX className="w-5 h-5" />,
    label: 'Faltas no dia (no-show)',
    statsKey: 'noShow' as const,
  },
  {
    id: 'inprogress',
    icon: <Award className="w-5 h-5" />,
    label: 'Em atendimento agora',
    statsKey: 'inProgress' as const,
  },
]

// Configuração das colunas da tabela
const tableColumns: Column<AppointmentTableRow>[] = [
  {
    key: 'patientName',
    header: 'Nome completo',
    width: 'w-[248px]',
  },
  {
    key: 'date',
    header: 'Data',
    width: 'w-[224px]',
  },
  {
    key: 'time',
    header: 'Horário',
  },
  {
    key: 'insurance',
    header: 'Convênio',
    render: (item) => item.insurance || 'Particular',
  },
  {
    key: 'status',
    header: 'Status',
    render: (item) => (
      <span className={`inline-flex items-center px-2 py-1 ${statusColors[item.status] || 'bg-primary'} text-white rounded-lg text-[10px]`}>
        {statusDisplayLabels[item.status] || item.status}
      </span>
    ),
  },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { openModal } = useModal()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  // Buscar agendamentos do dia do Supabase
  const { appointments, isLoading, stats } = useAppointments({ mode: 'today' })

  // Buscar profissionais para filtros
  const { professionals } = useProfessionals()

  // Gerar configuração de filtros dinamicamente
  const filterConfig: FilterConfig = useMemo(() => ({
    dateFrom: true,
    dateTo: true,
    status: [
      { value: 'agendado', label: 'Agendado' },
      { value: 'confirmado', label: 'Confirmado' },
      { value: 'aguardando', label: 'Aguardando' },
      { value: 'em_atendimento', label: 'Em Atendimento' },
      { value: 'concluido', label: 'Concluído' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'falta', label: 'Falta' },
    ],
    professional: professionals.map(p => ({
      value: p.id,
      label: p.name,
    })),
  }), [professionals])

  // Converter agendamentos para formato da tabela
  const tableData: AppointmentTableRow[] = useMemo(() => {
    return appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patientName,
      date: apt.dateStr,
      time: apt.time,
      insurance: apt.insuranceName,
      status: apt.status,
    }))
  }, [appointments])

  // Filtrar agendamentos com base na pesquisa E filtros
  const filteredAppointments = useMemo(() => {
    let result = tableData

    // Filtro de busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(apt =>
        apt.patientName.toLowerCase().includes(query) ||
        (apt.insurance?.toLowerCase().includes(query) ?? false) ||
        apt.status.toLowerCase().includes(query)
      )
    }

    // Filtro por status
    if (activeFilters.status) {
      result = result.filter(apt => apt.status === activeFilters.status)
    }

    // Filtro por profissional
    if (activeFilters.professional) {
      const originalApts = appointments.filter(a => a.professionalId === activeFilters.professional)
      const ids = new Set(originalApts.map(a => a.id))
      result = result.filter(apt => ids.has(apt.id))
    }

    return result
  }, [searchQuery, activeFilters, tableData, appointments])

  // Converter para formato do modal
  const toModalAppointment = (apt: AppointmentTableRow) => {
    // Buscar dados completos do agendamento original
    const original = appointments.find(a => a.id === apt.id)
    return {
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patientName,
      date: apt.date,
      time: apt.time,
      insurance: apt.insurance ?? undefined,
      insuranceId: original?.convenio?.id,
      professional: original?.professionalName,
      professionalId: original?.professionalId,
      serviceId: original?.servico?.id,
      serviceName: original?.serviceName,
      status: apt.status as 'Ativo' | 'Confirmado' | 'Aguardando' | 'Cancelado',
    }
  }

  // Ações do menu dropdown - condicionais por status
  const getRowActions = (appointment: AppointmentTableRow) => {
    const status = appointment.status.toLowerCase()
    const actions = []

    // Status que permitem registrar chegada
    const canRegisterArrival = ['agendado', 'confirmado'].includes(status)

    // Status que permitem novo agendamento (apenas finalizados)
    const canCreateNew = ['concluido', 'falta', 'cancelado'].includes(status)

    // Status que permitem registrar falta
    const canRegisterAbsence = ['agendado', 'confirmado', 'aguardando'].includes(status)

    // Status que permitem efetuar pagamento
    const canProcessPayment = ['em_atendimento', 'concluido'].includes(status)

    if (canRegisterArrival) {
      actions.push({
        icon: <UserCheck className="w-4 h-4" />,
        label: 'Registrar chegada',
        onClick: () => openModal('arrival', toModalAppointment(appointment)),
      })
    }

    if (canCreateNew) {
      actions.push({
        icon: <CalendarPlus className="w-4 h-4" />,
        label: 'Novo agendamento',
        onClick: () => openModal('appointment', toModalAppointment(appointment)),
      })
    }

    if (canProcessPayment) {
      actions.push({
        icon: <CreditCard className="w-4 h-4" />,
        label: 'Efetuar pagamento',
        onClick: () => openModal('payment', toModalAppointment(appointment)),
      })
    }

    if (canRegisterAbsence) {
      actions.push({
        icon: <CalendarMinus className="w-4 h-4" />,
        label: 'Registrar falta',
        onClick: () => openModal('absence', toModalAppointment(appointment)),
      })
    }

    // Detalhes do paciente sempre disponível
    actions.push({
      icon: <UserSearch className="w-4 h-4" />,
      label: 'Detalhes do paciente',
      onClick: () => navigate({ to: `/pacientes/${appointment.patientId}` }),
    })

    return actions
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleApplyFilters = (filters: FilterValues) => {
    setActiveFilters(filters)
  }

  const handleNewPatient = () => {
    openModal('patient')
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="flex flex-wrap gap-4">
        {statCardsConfig.map((card) => (
          <StatCard
            key={card.id}
            icon={card.icon}
            value={stats[card.statsKey]}
            label={card.label}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Tabela de Atendimentos */}
      <DataTable<AppointmentTableRow>
        title="Próximos atendimentos"
        columns={tableColumns}
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        rowActions={(item) => (
          <SimpleDropdownMenu items={getRowActions(item)} />
        )}
        onSearch={handleSearch}
        filterConfig={filterConfig}
        onApplyFilters={handleApplyFilters}
        onNewItem={handleNewPatient}
        newItemLabel="Novo paciente"
        isLoading={isLoading}
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

export default DashboardPage
