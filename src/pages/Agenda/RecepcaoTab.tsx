/**
 * RecepcaoTab — Visão Kanban de Recepção
 * Exibe os agendamentos do dia em colunas por status:
 * - Agendados/Confirmados (chegada pendente)
 * - Aguardando (paciente na clínica)
 * - Em Atendimento
 *
 * Usa `useAppointments({ mode: 'today' })` para dados reais via apiService.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  User,
  Clock,
  Play,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppointments, type AppointmentFormatted } from '@/hooks/useAppointments'
import { cn } from '@/lib/utils'
import { FileText } from 'lucide-react'
import { CheckinModal } from '@/components/modals/CheckinModal'
import { apiService } from '@/services/api.service'
import { toast } from 'sonner'
import { XCircle } from 'lucide-react'

// -------------------------------------------
// Helpers
// -------------------------------------------

function formatTime(time: string): string {
  return time
}

function calculateWaitTime(arrivalDateTime?: string | null, fallbackTime?: string): string {
  let referenceDate: Date | null = null

  if (arrivalDateTime) {
    referenceDate = new Date(arrivalDateTime)
  } else if (fallbackTime) {
    const [hours, minutes] = fallbackTime.split(':').map(Number)
    referenceDate = new Date()
    referenceDate.setHours(hours, minutes, 0, 0)
  }

  if (!referenceDate || Number.isNaN(referenceDate.getTime())) {
    return '0min'
  }

  const now = new Date()
  const diffMs = now.getTime() - referenceDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes}min`
  }
  const diffHours = Math.floor(diffMinutes / 60)
  const remainingMinutes = diffMinutes % 60
  return `${diffHours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`
}

// -------------------------------------------
// Card de paciente individual
// -------------------------------------------

interface PatientCardProps {
  appointment: AppointmentFormatted
  actions: {
    label: string
    icon: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'outline'
  }[]
  statusBadge?: React.ReactNode
}

function PatientCard({ appointment, actions, statusBadge }: PatientCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {appointment.patientName}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {formatTime(appointment.time)} — {appointment.serviceName}
            </p>
            {appointment.professionalName && (
              <p className="text-xs text-muted-foreground truncate">
                {appointment.professionalName}
              </p>
            )}
          </div>
        </div>
        {statusBadge && <div className="flex-shrink-0">{statusBadge}</div>}
      </div>

      {/* Ações */}
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              className="rounded-full text-xs gap-1.5"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// -------------------------------------------
// Coluna do Kanban
// -------------------------------------------

interface ColumnProps {
  title: string
  icon: React.ReactNode
  count: number
  headerColor: string
  children: React.ReactNode
  emptyMessage: string
}

function Column({ title, icon, count, headerColor, children, emptyMessage }: ColumnProps) {
  return (
    <div className="flex flex-col bg-muted/30 rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className={cn('flex items-center gap-2 px-4 py-3', headerColor)}>
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-background/80 text-foreground text-xs font-bold">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[60vh]">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

// -------------------------------------------
// Componente Principal
// -------------------------------------------

export function RecepcaoTab() {
  const navigate = useNavigate()
  const {
    appointments,
    isLoading,
    startAttendance,
    completeAttendance,
    stats,
    refresh,
  } = useAppointments({ mode: 'today' })

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  
  const [arrivalModalInfo, setArrivalModalInfo] = useState<{
    isOpen: boolean;
    appointment: AppointmentFormatted | null;
  }>({ isOpen: false, appointment: null })

  // Agrupa agendamentos por status
  const grouped = useMemo(() => ({
    agendados: appointments.filter(
      a => a.status === 'agendado' || a.status === 'confirmado'
    ),
    aguardando: appointments.filter(a => a.status === 'aguardando'),
    em_atendimento: appointments.filter(a => a.status === 'em_atendimento'),
  }), [appointments])

  // Wrapper para ações com loading individual
  const withLoading = async (id: string, action: () => Promise<boolean>) => {
    setActionLoadingId(id)
    try {
      await action()
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRegisterArrival = (apt: AppointmentFormatted) => {
    setArrivalModalInfo({ isOpen: true, appointment: apt })
  }

  const handleCheckinSuccess = () => {
    setArrivalModalInfo({ isOpen: false, appointment: null })
    refresh()
  }

  const handleStartAttendance = (apt: AppointmentFormatted) => {
    withLoading(apt.id, async () => {
      return await startAttendance(apt.id)
    })
  }

  const handleCompleteAttendance = (apt: AppointmentFormatted) => {
    withLoading(apt.id, async () => {
      return await completeAttendance(apt.id)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo rápido */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.total}</span> agendamentos hoje
          </p>
          {stats.completed > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-green-600">{stats.completed}</span> concluídos
            </p>
          )}
          {stats.noShow > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-red-600">{stats.noShow}</span> faltas
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          className="rounded-full gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Grid Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coluna: Agendados Hoje */}
        <Column
          title="Agendados Hoje"
          icon={<Clock className="w-4 h-4" />}
          count={grouped.agendados.length}
          headerColor="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          emptyMessage="Nenhum agendamento pendente de chegada"
        >
          {grouped.agendados.map(apt => (
            <PatientCard
              key={apt.id}
              appointment={apt}
              statusBadge={
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                  apt.status === 'confirmado'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                )}>
                  {apt.status === 'confirmado' ? 'Confirmado' : 'Agendado'}
                </span>
              }
              actions={[
                {
                  label: actionLoadingId === apt.id ? 'Registrando...' : 'Registrar Chegada',
                  icon: <UserCheck className="w-3.5 h-3.5" />,
                  onClick: () => handleRegisterArrival(apt),
                },
                ...(apt.serieRecorrenciaId ? [{
                  label: 'Cancelar série',
                  icon: <XCircle className="w-3.5 h-3.5" />,
                  variant: 'outline' as const,
                  onClick: async () => {
                    if (!confirm('Cancelar todos os agendamentos futuros desta série?')) return
                    try {
                      const today = new Date().toISOString().split('T')[0]
                      const resp = await apiService.cancelSeriesAppointments(apt.serieRecorrenciaId!, today)
                      if (resp.error) {
                        toast.error(resp.error)
                      } else {
                        toast.success(`${resp.data?.cancelled || 0} agendamentos da série cancelados`)
                        refresh()
                      }
                    } catch {
                      toast.error('Erro ao cancelar série')
                    }
                  },
                }] : []),
              ]}
            />
          ))}
        </Column>

        {/* Coluna: Aguardando */}
        <Column
          title="Aguardando"
          icon={<Clock className="w-4 h-4" />}
          count={grouped.aguardando.length}
          headerColor="bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
          emptyMessage="Nenhum paciente aguardando"
        >
          {grouped.aguardando.map(apt => (
            <PatientCard
              key={apt.id}
              appointment={apt}
              statusBadge={
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                )}>
                  <Clock className="w-3 h-3 mr-1" />
                  {calculateWaitTime(apt.data_chegada, apt.time)}
                </span>
              }
              actions={[
                {
                  label: 'Abrir Prontuário',
                  icon: <FileText className="w-3.5 h-3.5" />,
                  onClick: () => navigate({ to: `/pacientes/${apt.patientId}/prontuario` }),
                  variant: 'outline',
                },
                {
                  label: actionLoadingId === apt.id ? 'Iniciando...' : 'Iniciar Atendimento',
                  icon: <Play className="w-3.5 h-3.5" />,
                  onClick: () => handleStartAttendance(apt),
                },
              ]}
            />
          ))}
        </Column>

        {/* Coluna: Em Atendimento */}
        <Column
          title="Em Atendimento"
          icon={<Stethoscope className="w-4 h-4" />}
          count={grouped.em_atendimento.length}
          headerColor="bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
          emptyMessage="Nenhum paciente em atendimento"
        >
          {grouped.em_atendimento.map(apt => (
            <PatientCard
              key={apt.id}
              appointment={apt}
              statusBadge={
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                )}>
                  Em atendimento
                </span>
              }
              actions={[
                {
                  label: 'Abrir Prontuário',
                  icon: <FileText className="w-3.5 h-3.5" />,
                  onClick: () => navigate({ to: `/pacientes/${apt.patientId}/prontuario` }),
                  variant: 'outline',
                },
                {
                  label: actionLoadingId === apt.id ? 'Concluindo...' : 'Concluir Atendimento',
                  icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                  onClick: () => handleCompleteAttendance(apt),
                },
              ]}
            />
          ))}
        </Column>
      </div>

      {/* Moda de chekin */}
      {arrivalModalInfo.appointment && (
        <CheckinModal
          isOpen={arrivalModalInfo.isOpen}
          onClose={() => setArrivalModalInfo({ isOpen: false, appointment: null })}
          onSuccess={handleCheckinSuccess}
          appointment={arrivalModalInfo.appointment}
        />
      )}
    </div>
  )
}
