import { useState, useEffect } from 'react'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { CreateAppointmentModal } from '@/components/modals'
import { useAppointments, usePaginationConfig } from '@/hooks'
import { cn } from '@/lib/utils'

interface AgendamentosSectionProps {
  patientId: string
}

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
  aguardando: 'Aguardando',
  em_atendimento: 'Em Atendimento',
  falta: 'Falta',
  reagendado: 'Reagendado',
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

const statusStyles: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-primary text-white',
  cancelado: 'bg-red-100 text-red-700',
  concluido: 'bg-muted text-muted-foreground',
  aguardando: 'bg-yellow-100 text-yellow-700',
  em_atendimento: 'bg-purple-100 text-purple-700',
  falta: 'bg-red-100 text-red-700',
  reagendado: 'bg-cyan-100 text-cyan-700',
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-primary text-white',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-muted text-muted-foreground',
}

export function AgendamentosSection({ patientId }: AgendamentosSectionProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)

  // Buscar configuração de paginação do banco
  const { itemsPerPage } = usePaginationConfig()

  const { appointments, isLoading, fetchAppointments, createAppointment } = useAppointments({ autoFetch: false })

  // Carregar agendamentos do paciente
  // TODO: Implementar filtro por paciente na API
  useEffect(() => {
    if (patientId) {
      fetchAppointments()
    }
  }, [patientId, fetchAppointments])

  const totalPages = Math.ceil(appointments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAppointments = appointments.slice(startIndex, startIndex + itemsPerPage)

  const handleNewAppointment = () => {
    setIsAppointmentModalOpen(true)
  }

  const handleAppointmentCreate = async (data: {
    service: string
    insurance: string
    professional: string
    patient: string
    date: string
    time: string
  }) => {
    // Calcular data_hora_inicio e data_hora_fim
    // Adiciona offset do navegador para Supabase não interpretar como UTC
    const tzOffset = (() => {
      const off = -new Date().getTimezoneOffset()
      const sign = off >= 0 ? '+' : '-'
      const abs = Math.abs(off)
      return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
    })()
    const dataHoraInicio = `${data.date}T${data.time}:00${tzOffset}`
    const [hours, minutes] = data.time.split(':').map(Number)
    const endMinutes = minutes + 30 // Duração padrão de 30 minutos
    const endHours = hours + Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const dataHoraFim = `${data.date}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00${tzOffset}`

    const result = await createAppointment({
      paciente_id: patientId,
      profissional_id: data.professional,
      servico_id: data.service,
      data_hora_inicio: dataHoraInicio,
      data_hora_fim: dataHoraFim,
      duracao_minutos: 30,
      tipo: 'consulta',
      convenio_id: data.insurance !== 'particular' ? data.insurance : undefined,
      observacoes: '',
    })

    if (result) {
      setIsAppointmentModalOpen(false)
      // Recarregar agendamentos após criar
      fetchAppointments()
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Histórico de agendamentos</h3>
        <Button
          onClick={handleNewAppointment}
          className="rounded-full px-6 bg-primary hover:bg-primary/90"
        >
          Novo agendamento
        </Button>
      </div>

      {/* Lista de Agendamentos */}
      <div className="space-y-4">
        {paginatedAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Indicador de tipo */}
              <div className="w-1 h-12 bg-primary rounded-full" />

              <div>
                <p className="text-sm font-medium text-foreground">
                  {appointment.serviceName}
                </p>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {appointment.dateStr}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {appointment.time}
                  </span>
                  <span>{appointment.duration} min</span>
                </div>
              </div>
            </div>

            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                statusStyles[appointment.status] || 'bg-muted text-muted-foreground'
              )}
            >
              {statusLabels[appointment.status] || appointment.status}
            </span>
          </div>
        ))}
      </div>

      {appointments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum agendamento encontrado
        </div>
      )}

      {/* Paginação */}
      {appointments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={appointments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal de Novo Agendamento */}
      <CreateAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSubmit={handleAppointmentCreate}
        initialPatientId={patientId}
      />
    </div>
  )
}
