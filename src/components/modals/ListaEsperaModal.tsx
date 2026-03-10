import { useState, useMemo } from 'react'
import { Clock, User, CalendarPlus, X, Plus, AlertCircle, ArrowLeft, Check, CalendarDays } from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { SingleSelectSearch } from '@/components/ui/single-select-search'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useWaitlist, type WaitlistEntry, type AddToWaitlistData } from '@/hooks/useWaitlist'
import { useAppointmentOptions } from '@/hooks/useAppointmentOptions'
import { useModal } from '@/contexts/ModalContext'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

interface ListaEsperaModalProps {
  isOpen: boolean
  onClose: () => void
  events?: CalendarEvent[]
  onStartAttendance?: (event: CalendarEvent) => void | Promise<void>
  onCancelWaiting?: (event: CalendarEvent) => void | Promise<void>
  onConfirmArrival?: (event: CalendarEvent) => void | Promise<void>
  onReschedule?: (event: CalendarEvent) => void | Promise<void>
}

const MAX_PREVIEW = 5

// Filtra apenas pacientes aguardando atendimento na recepção (status = waiting, que no banco é 'aguardando')
function getWaitingPatients(events: CalendarEvent[] = []) {
  return events.filter(e => e.status === 'waiting')
}

function formatTime(time: string): string {
  return time
}

function calculateWaitTime(arrivalTime: string): string {
  const [hours, minutes] = arrivalTime.split(':').map(Number)
  const appointmentDate = new Date()
  appointmentDate.setHours(hours, minutes, 0, 0)

  const now = new Date()
  const diffMs = now.getTime() - appointmentDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes} min`
  }
  const diffHours = Math.floor(diffMinutes / 60)
  const remainingMinutes = diffMinutes % 60
  return `${diffHours}h ${remainingMinutes}min`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

function getHorarioLabel(horario?: string): string {
  switch (horario) {
    case 'manha': return 'Manhã'
    case 'tarde': return 'Tarde'
    case 'noite': return 'Noite'
    case 'qualquer': return 'Qualquer'
    default: return horario || 'Qualquer'
  }
}

function getPrioridadeLabel(prioridade: number): { label: string; className: string } {
  if (prioridade >= 2) return { label: 'Alta', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
  if (prioridade === 1) return { label: 'Média', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' }
  return { label: 'Normal', className: 'bg-muted text-muted-foreground' }
}

// ================================
// COMPONENTE: Lista de Espera por Vagas
// ================================
interface WaitlistContentProps {
  entries: WaitlistEntry[]
  loading: boolean
  onRemove: (id: string) => void | Promise<void> | Promise<boolean>
  onSchedule: (entry: WaitlistEntry) => void | Promise<void>
}

function WaitlistContent({ entries, loading, onRemove, onSchedule }: WaitlistContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Lista de espera vazia
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Nenhum paciente aguardando vaga no momento.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {entries.length} paciente{entries.length > 1 ? 's' : ''} aguardando vaga
        </span>
      </div>

      {entries.map((entry) => {
        const prioridade = getPrioridadeLabel(entry.prioridade)
        return (
          <div
            key={entry.id}
            className="bg-muted/50 rounded-lg p-4 border border-border"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {entry.paciente?.nome_completo || 'Paciente'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.servico?.nome || 'Serviço não especificado'}
                    {entry.profissional && ` • ${entry.profissional.usuario.nome_completo}`}
                  </p>
                </div>
              </div>
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                prioridade.className
              )}>
                {prioridade.label}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Período:</span>{' '}
                {entry.data_preferencia_inicio
                  ? `${formatDate(entry.data_preferencia_inicio)} - ${formatDate(entry.data_preferencia_fim || '')}`
                  : 'Qualquer data'}
              </div>
              <div>
                <span className="font-medium">Horário:</span>{' '}
                {getHorarioLabel(entry.horario_preferencia)}
              </div>
            </div>

            {entry.motivo && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                "{entry.motivo}"
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Button
                size="sm"
                onClick={() => onSchedule(entry)}
                className="flex-1 rounded-full"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Agendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(entry.id)}
                className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ================================
// COMPONENTE: Pacientes Aguardando Atendimento
// ================================
interface WaitingPatientsContentProps {
  waitingPatients: CalendarEvent[]
  onStartAttendance?: (event: CalendarEvent) => void | Promise<void>
  onCancelWaiting?: (event: CalendarEvent) => void | Promise<void>
  onConfirmArrival?: (event: CalendarEvent) => void | Promise<void>
  onReschedule?: (event: CalendarEvent) => void | Promise<void>
  onClose: () => void
}

function WaitingPatientsContent({
  waitingPatients,
  onStartAttendance,
  onCancelWaiting,
  onConfirmArrival,
  onReschedule,
  onClose
}: WaitingPatientsContentProps) {
  const [showAll, setShowAll] = useState(false)

  if (waitingPatients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum paciente aguardando
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Quando pacientes confirmarem chegada, eles aparecerão aqui.
        </p>
      </div>
    )
  }

  // Modo "Ver todos" — lista compacta com ícones de ação
  if (showAll) {
    return (
      <div>
        {/* Header com botão voltar */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <button
            onClick={() => setShowAll(false)}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h3 className="text-base font-semibold text-foreground">Lista de Espera</h3>
            <p className="text-xs text-muted-foreground">
              {waitingPatients.length} paciente{waitingPatients.length > 1 ? 's' : ''} aguardando
            </p>
          </div>
        </div>

        {/* Lista compacta */}
        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
          {waitingPatients.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 py-3 hover:bg-muted/30 rounded-lg px-1 -mx-1 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.patientName}</p>
                <p className="text-xs text-muted-foreground">
                  Agendado: {formatTime(event.time)}
                </p>
              </div>

              {/* Badge tempo de espera */}
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0",
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}>
                <Clock className="w-3 h-3 mr-1" />
                {calculateWaitTime(event.time)}
              </span>

              {/* Ações compactas (3 ícones) */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {onConfirmArrival && (
                  <button
                    onClick={async () => { await onConfirmArrival(event); onClose() }}
                    className="p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                    title="Confirmar chegada"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {onReschedule && (
                  <button
                    onClick={async () => { await onReschedule(event); onClose() }}
                    className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                    title="Reagendar"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                )}
                {onCancelWaiting && (
                  <button
                    onClick={async () => { await onCancelWaiting(event); onClose() }}
                    className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Modo Preview — primeiros 5 pacientes com ações completas
  const previewPatients = waitingPatients.slice(0, MAX_PREVIEW)
  const totalCount = waitingPatients.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Próximo{previewPatients.length > 1 ? 's' : ''} {previewPatients.length} atendimento{previewPatients.length > 1 ? 's' : ''}
        </span>
      </div>

      {previewPatients.map((event) => (
        <div
          key={event.id}
          className="bg-muted/50 rounded-lg p-4 border border-border"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{event.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  Agendado: {formatTime(event.time)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}>
                <Clock className="w-3 h-3 mr-1" />
                {calculateWaitTime(event.time)}
              </span>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Ações Rápidas
            </p>
            <div className="grid grid-cols-2 gap-2">
              {onConfirmArrival && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => { await onConfirmArrival(event); onClose() }}
                  className="rounded-full text-xs gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirmar chegada
                </Button>
              )}
              {onReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => { await onReschedule(event); onClose() }}
                  className="rounded-full text-xs gap-1"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Reagendar
                </Button>
              )}
              {onStartAttendance && (
                <Button
                  size="sm"
                  onClick={async () => { await onStartAttendance(event); onClose() }}
                  className="rounded-full text-xs gap-1"
                >
                  Iniciar atendimento
                </Button>
              )}
              {onCancelWaiting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => { await onCancelWaiting(event); onClose() }}
                  className="rounded-full text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Botão "Ver todos" */}
      {totalCount > MAX_PREVIEW && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-center text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
        >
          Ver todos ({totalCount})
        </button>
      )}
    </div>
  )
}

// ================================
// COMPONENTE: Formulário para Adicionar à Lista
// ================================
interface AddToWaitlistFormProps {
  onAdd: (data: AddToWaitlistData) => Promise<WaitlistEntry | null>
  onClose: () => void
}

function AddToWaitlistForm({ onAdd, onClose }: AddToWaitlistFormProps) {
  const { patientsOptions, professionalsOptions, servicesOptions, isLoading: isOptionsLoading } = useAppointmentOptions()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    paciente_id: '',
    profissional_id: '',
    servico_id: '',
    data_preferencia_inicio: '',
    data_preferencia_fim: '',
    horario_preferencia: 'qualquer',
    prioridade: 0,
    motivo: '',
  })

  const handleSubmit = async () => {
    if (!formData.paciente_id) return

    setIsSubmitting(true)
    try {
      const result = await onAdd({
        paciente_id: formData.paciente_id,
        profissional_id: formData.profissional_id || undefined,
        servico_id: formData.servico_id || undefined,
        data_preferencia_inicio: formData.data_preferencia_inicio || undefined,
        data_preferencia_fim: formData.data_preferencia_fim || undefined,
        horario_preferencia: formData.horario_preferencia,
        prioridade: formData.prioridade,
        motivo: formData.motivo || undefined,
      })

      if (result) {
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectPatientOptions = useMemo(() =>
    patientsOptions.map(p => ({ value: p.value, label: p.label })),
    [patientsOptions]
  )

  const selectProfessionalOptions = useMemo(() =>
    [{ value: '', label: 'Qualquer profissional' }, ...professionalsOptions.map(p => ({ value: p.value, label: p.label }))],
    [professionalsOptions]
  )

  const selectServiceOptions = useMemo(() =>
    [{ value: '', label: 'Qualquer serviço' }, ...servicesOptions.map(s => ({ value: s.value, label: s.label }))],
    [servicesOptions]
  )

  const horarioOptions = [
    { value: 'qualquer', label: 'Qualquer horário' },
    { value: 'manha', label: 'Manhã (8h-12h)' },
    { value: 'tarde', label: 'Tarde (12h-18h)' },
    { value: 'noite', label: 'Noite (18h-21h)' },
  ]

  const prioridadeOptions = [
    { value: '0', label: 'Normal' },
    { value: '1', label: 'Média' },
    { value: '2', label: 'Alta' },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Adicione pacientes que desejam ser notificados quando houver vagas disponíveis.
          </p>
        </div>
      </div>

      <SingleSelectSearch
        items={selectPatientOptions}
        value={formData.paciente_id}
        onChange={(value) => setFormData(prev => ({ ...prev, paciente_id: value }))}
        getItemId={(p) => p.value}
        getItemLabel={(p) => p.label}
        label="Paciente"
        required
        searchPlaceholder="Buscar paciente..."
        emptyMessage="Nenhum paciente encontrado"
        isLoading={isOptionsLoading}
      />

      <Select
        label="Serviço desejado"
        options={selectServiceOptions}
        value={formData.servico_id}
        onChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}
      />

      <SingleSelectSearch
        items={selectProfessionalOptions}
        value={formData.profissional_id}
        onChange={(value) => setFormData(prev => ({ ...prev, profissional_id: value }))}
        getItemId={(p) => p.value}
        getItemLabel={(p) => p.label}
        label="Profissional preferido"
        searchPlaceholder="Buscar profissional..."
        emptyMessage="Nenhum profissional encontrado"
        isLoading={isOptionsLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">A partir de</label>
          <input
            type="date"
            value={formData.data_preferencia_inicio}
            onChange={(e) => setFormData(prev => ({ ...prev, data_preferencia_inicio: e.target.value }))}
            className="w-full mt-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Até</label>
          <input
            type="date"
            value={formData.data_preferencia_fim}
            onChange={(e) => setFormData(prev => ({ ...prev, data_preferencia_fim: e.target.value }))}
            className="w-full mt-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Horário preferido"
          options={horarioOptions}
          value={formData.horario_preferencia}
          onChange={(value) => setFormData(prev => ({ ...prev, horario_preferencia: value }))}
        />

        <Select
          label="Prioridade"
          options={prioridadeOptions}
          value={String(formData.prioridade)}
          onChange={(value) => setFormData(prev => ({ ...prev, prioridade: Number(value) }))}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Motivo / Observações</label>
        <textarea
          value={formData.motivo}
          onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
          placeholder="Ex: Paciente precisa de horário urgente devido a..."
          className="w-full mt-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 rounded-full"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.paciente_id || isSubmitting}
          className="flex-1 rounded-full"
        >
          {isSubmitting ? 'Adicionando...' : 'Adicionar à lista'}
        </Button>
      </div>
    </div>
  )
}

// ================================
// COMPONENTE PRINCIPAL
// ================================
export function ListaEsperaModal({
  isOpen,
  onClose,
  events = [],
  onStartAttendance,
  onCancelWaiting,
  onConfirmArrival,
  onReschedule,
}: ListaEsperaModalProps) {
  const isMobile = useIsMobile()
  const { openModal } = useModal()
  const [activeTab, setActiveTab] = useState<'aguardando' | 'lista' | 'adicionar'>('aguardando')

  const { entries, loading, removeFromWaitlist, addToWaitlist } = useWaitlist()
  const waitingPatients = useMemo(() => getWaitingPatients(events), [events])

  const handleScheduleFromWaitlist = (entry: WaitlistEntry) => {
    openModal('appointment', undefined, entry.paciente_id)
    onClose()
  }

  const content = (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
      <TabsList className="w-full grid grid-cols-3 mb-4">
        <TabsTrigger value="aguardando" className="text-xs sm:text-sm">
          Aguardando ({waitingPatients.length})
        </TabsTrigger>
        <TabsTrigger value="lista" className="text-xs sm:text-sm">
          Lista ({entries.length})
        </TabsTrigger>
        <TabsTrigger value="adicionar" className="text-xs sm:text-sm">
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="aguardando">
        <WaitingPatientsContent
          waitingPatients={waitingPatients}
          onStartAttendance={onStartAttendance}
          onCancelWaiting={onCancelWaiting}
          onConfirmArrival={onConfirmArrival}
          onReschedule={onReschedule}
          onClose={onClose}
        />
      </TabsContent>

      <TabsContent value="lista">
        <WaitlistContent
          entries={entries}
          loading={loading}
          onRemove={removeFromWaitlist}
          onSchedule={handleScheduleFromWaitlist}
        />
      </TabsContent>

      <TabsContent value="adicionar">
        <AddToWaitlistForm
          onAdd={addToWaitlist}
          onClose={() => setActiveTab('lista')}
        />
      </TabsContent>
    </Tabs>
  )

  // Mobile: usar BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Lista de Espera"
        description="Gerenciar pacientes aguardando"
        snapPoints={[0.7, 0.95]}
      >
        {content}
      </BottomSheet>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lista de Espera"
      description="Gerenciar pacientes aguardando"
      size="lg"
    >
      <ModalBody>
        {content}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="rounded-full">
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
