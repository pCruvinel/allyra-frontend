import { useState, useEffect, useMemo, useCallback } from 'react'
import { CalendarClock, Users } from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SingleSelectSearch } from '@/components/ui/single-select-search'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { RecurrenceSection } from '@/components/scheduling/RecurrenceSection'
import type { RecurrenceData } from '@/components/scheduling/RecurrenceSection'
import { toast } from 'sonner'
import { useAppointmentOptions } from '@/hooks/useAppointmentOptions'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { apiService } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScheduleMode = 'unico' | 'recorrente'

interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AppointmentFormData) => void
  initialPatientId?: string
  initialProfessionalId?: string
  initialDate?: string
  initialTime?: string
}

export interface AppointmentFormData {
  service: string
  insurance: string
  professional: string
  professionals?: string[]
  patient: string
  patients?: string[]
  date: string
  time: string
  room?: string
  isGrupo?: boolean
  isRecurring?: boolean
  recurrenceType?: 'semanal' | 'quinzenal' | 'mensal'
  recurrenceEndDate?: string
  diasSemana?: number[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayDate(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function getNextTimeSlot(): string {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  if (hours >= 17 && minutes > 30) return '08:00'
  if (hours < 8) return '08:00'
  const nextMinutes = minutes < 30 ? 30 : 0
  const nextHours = minutes < 30 ? hours : hours + 1
  return `${nextHours.toString().padStart(2, '0')}:${nextMinutes.toString().padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialPatientId,
  initialProfessionalId,
  initialDate,
  initialTime,
}: CreateAppointmentModalProps) {
  const isMobile = useIsMobile()
  const { currentClinica } = useAuth()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('unico')

  // Shared fields (persist between tabs)
  const [service, setService] = useState('')
  const [insurance, setInsurance] = useState('')
  const [professional, setProfessional] = useState('')
  const [room, setRoom] = useState('')
  const [selectedPatient, setSelectedPatient] = useState('')

  // Único mode
  const [singleDate, setSingleDate] = useState(initialDate || getTodayDate())
  const [singleTime, setSingleTime] = useState(initialTime || getNextTimeSlot())

  // Recorrente mode
  const [recurrenceData, setRecurrenceData] = useState<RecurrenceData>({
    mode: 'diasSemana',
    diasSemana: [],
    intervaloTipo: undefined,
    startDate: initialDate || getTodayDate(),
    endDate: '',
    time: initialTime || getNextTimeSlot(),
  })

  // Group mode (only in Único tab)
  const [isGrupoMode, setIsGrupoMode] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState<{ value: string; label: string }[]>([])

  const [isCheckingConflict, setIsCheckingConflict] = useState(false)

  // ---------------------------------------------------------------------------
  // Data hook
  // ---------------------------------------------------------------------------

  const {
    patientsOptions,
    professionalsOptions,
    servicesOptions,
    insurancesOptions,
    roomsOptions,
    timeOptions,
    isLoading: isOptionsLoading,
    getPatientDefaultInsurance,
  } = useAppointmentOptions()

  // ---------------------------------------------------------------------------
  // Effects: pre-fill from props
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isOpen && initialPatientId && patientsOptions.length > 0) {
      const opt = patientsOptions.find(p => p.value === initialPatientId)
      if (opt) {
        setSelectedPatient(initialPatientId)
        if (!insurance && opt.defaultInsuranceId) setInsurance(opt.defaultInsuranceId)
      }
    }
  }, [isOpen, initialPatientId, patientsOptions, insurance])

  useEffect(() => {
    if (!isOpen || !initialProfessionalId || professionalsOptions.length === 0) return
    if (!professionalsOptions.some(p => p.value === initialProfessionalId)) return
    setProfessional(initialProfessionalId)
  }, [isOpen, initialProfessionalId, professionalsOptions])

  useEffect(() => {
    if (!isOpen) return
    if (initialDate) { setSingleDate(initialDate); setRecurrenceData(prev => ({ ...prev, startDate: initialDate })) }
    if (initialTime) { setSingleTime(initialTime); setRecurrenceData(prev => ({ ...prev, time: initialTime })) }
  }, [initialDate, initialTime, isOpen])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId)
    const defaultInsuranceId = getPatientDefaultInsurance(patientId)
    if (defaultInsuranceId) setInsurance(defaultInsuranceId)
  }

  const handleRecurrenceChange = useCallback((update: Partial<RecurrenceData>) => {
    setRecurrenceData(prev => ({ ...prev, ...update }))
  }, [])

  const handleClose = useCallback(() => {
    onClose()
    // Reset all state
    setScheduleMode('unico')
    setService('')
    setInsurance('')
    setProfessional('')
    setRoom('')
    setSelectedPatient('')
    setSingleDate(initialDate || getTodayDate())
    setSingleTime(initialTime || getNextTimeSlot())
    setRecurrenceData({
      mode: 'diasSemana',
      diasSemana: [],
      intervaloTipo: undefined,
      startDate: initialDate || getTodayDate(),
      endDate: '',
      time: initialTime || getNextTimeSlot(),
    })
    setIsGrupoMode(false)
    setSelectedPatients([])
  }, [initialDate, initialTime, onClose])

  const handleSubmit = async () => {
    if (!currentClinica?.id) return

    setIsCheckingConflict(true)

    const activeTime = scheduleMode === 'unico' ? singleTime : recurrenceData.time
    const activeDate = scheduleMode === 'unico' ? singleDate : recurrenceData.startDate
    const duracaoMinutos = 60
    const tzOffset = (() => {
      const off = -new Date().getTimezoneOffset()
      const sign = off >= 0 ? '+' : '-'
      const abs = Math.abs(off)
      return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
    })()

    const dataHoraInicio = `${activeDate}T${activeTime}:00${tzOffset}`
    const [hours, minutes] = activeTime.split(':').map(Number)
    const endMinutes = minutes + duracaoMinutos
    const endHours = hours + Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const dataHoraFim = `${activeDate}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00${tzOffset}`

    const conflictTarget = professional

    // Conflict check
    try {
      if (conflictTarget && currentClinica) {
        const conflictRes = await apiService.checkAppointmentConflicts({
          clinica_id: currentClinica.id,
          profissional_id: conflictTarget,
          data_hora_inicio: dataHoraInicio,
          data_hora_fim: dataHoraFim,
          sala_id: room || undefined,
        })

        if (conflictRes.data?.hasConflict && conflictRes.data.conflicts.length > 0) {
          const c = conflictRes.data.conflicts[0]
          let msg = 'Conflito de horário detectado.'
          if (c.type === 'sala') msg = `A sala ${c.resource_name} já está reservada para o paciente ${c.paciente_nome} nesse horário.`
          else if (c.type === 'profissional') msg = `O profissional ${c.resource_name} já possui agendamento com ${c.paciente_nome} nesse horário.`
          else if (c.type === 'paciente') msg = `O paciente ${c.resource_name} já possui outro agendamento nesse horário.`
          else msg = `Conflito detectado para ${c.resource_name} (paciente: ${c.paciente_nome}) nesse horário.`
          toast.error(msg)
          return
        }
      }
    } catch {
      toast.error('Erro ao verificar disponibilidade.')
      return
    } finally {
      setIsCheckingConflict(false)
    }

    // Build submission payload
    const basePayload: AppointmentFormData = {
      service,
      insurance,
      professional,
      patient: selectedPatient,
      date: activeDate,
      time: activeTime,
      room: room || undefined,
    }

    if (scheduleMode === 'unico' && isGrupoMode && selectedPatients.length >= 2) {
      onSubmit({
        ...basePayload,
        isGrupo: true,
        patients: selectedPatients.map(p => p.value),
        professionals: [professional],
      })
    } else if (scheduleMode === 'recorrente') {
      onSubmit({
        ...basePayload,
        isRecurring: true,
        recurrenceType: recurrenceData.mode === 'intervalo' ? recurrenceData.intervaloTipo : 'semanal',
        recurrenceEndDate: recurrenceData.endDate,
        diasSemana: recurrenceData.mode === 'diasSemana' ? recurrenceData.diasSemana : undefined,
      })
    } else {
      onSubmit(basePayload)
    }
    handleClose()
  }

  const handleToggleGrupo = () => {
    setIsGrupoMode(!isGrupoMode)
    if (!isGrupoMode) {
      if (selectedPatient) {
        const opt = selectPatientOptions.find(p => p.value === selectedPatient)
        if (opt) setSelectedPatients([opt])
      }
    } else {
      setSelectedPatients([])
    }
  }

  // ---------------------------------------------------------------------------
  // Computed: validation
  // ---------------------------------------------------------------------------

  const isSharedValid = !!(service && insurance && professional && selectedPatient)

  const isUnicoValid = isGrupoMode
    ? !!(isSharedValid && professional && selectedPatients.length >= 2 && singleDate && singleTime)
    : !!(isSharedValid && singleDate && singleTime)

  const isRecorrenteValid = !!(isSharedValid
    && recurrenceData.time
    && recurrenceData.startDate
    && recurrenceData.endDate
    && (
      (recurrenceData.mode === 'diasSemana' && recurrenceData.diasSemana.length > 0)
      || (recurrenceData.mode === 'intervalo' && recurrenceData.intervaloTipo)
    ))

  const isFormValid = scheduleMode === 'unico' ? isUnicoValid : isRecorrenteValid

  // ---------------------------------------------------------------------------
  // Computed: select options
  // ---------------------------------------------------------------------------

  const selectPatientOptions = useMemo(() =>
    patientsOptions.map(p => ({ value: p.value, label: p.label })),
    [patientsOptions],
  )

  const selectProfessionalOptions = useMemo(() =>
    professionalsOptions.map(p => ({ value: p.value, label: p.label })),
    [professionalsOptions],
  )

  const selectServiceOptions = useMemo(() =>
    servicesOptions.map(s => ({ value: s.value, label: s.label })),
    [servicesOptions],
  )

  const selectInsuranceOptions = useMemo(() =>
    insurancesOptions.map(i => ({ value: i.value, label: i.label })),
    [insurancesOptions],
  )

  const selectTimeOptions = useMemo(() =>
    timeOptions.map(t => ({ value: t.value, label: t.label })),
    [timeOptions],
  )

  // ---------------------------------------------------------------------------
  // JSX: Shared fields (rendered above tabs in both modes)
  // ---------------------------------------------------------------------------

  const sharedFields = isOptionsLoading ? (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <span className="ml-2 text-muted-foreground">Carregando dados...</span>
    </div>
  ) : (
    <>
      {/* ── Tipo de Atendimento ── */}
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Tipo de atendimento
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Serviço" required options={selectServiceOptions} value={service} onChange={setService} placeholder="Selecione uma opção" />
          <Select label="Convênio" required options={selectInsuranceOptions} value={insurance} onChange={setInsurance} placeholder="Selecione uma opção" />
        </div>
        <Select label="Sala / Consultório (opcional)" options={roomsOptions} value={room} onChange={setRoom} placeholder="Selecione uma sala" />
      </fieldset>

      {/* ── Participantes ── */}
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Participantes
        </legend>

        {/* Profissional is always single-select */}
        {scheduleMode === 'unico' && isGrupoMode ? (
          <>
            <SingleSelectSearch items={selectProfessionalOptions} value={professional} onChange={v => setProfessional(v)}
              getItemId={p => p.value} getItemLabel={p => p.label}
              label="Profissional" required searchPlaceholder="Buscar profissional..." emptyMessage="Nenhum profissional encontrado" isLoading={isOptionsLoading} />
            <MultiSelectSearch items={selectPatientOptions} value={selectedPatients} onChange={setSelectedPatients}
              minSelection={2} maxSelection={5} getItemId={p => p.value} getItemLabel={p => p.label}
              label="Pacientes do grupo" required searchPlaceholder="Buscar paciente pelo nome..." emptyMessage="Nenhum paciente encontrado" isLoading={isOptionsLoading} />
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SingleSelectSearch items={selectProfessionalOptions} value={professional} onChange={v => setProfessional(v)}
              getItemId={p => p.value} getItemLabel={p => p.label}
              label="Profissional" required searchPlaceholder="Buscar profissional..." emptyMessage="Nenhum profissional encontrado" isLoading={isOptionsLoading} />
            <SingleSelectSearch items={selectPatientOptions} value={selectedPatient}
              onChange={v => { if (v) handlePatientChange(v); else setSelectedPatient('') }}
              getItemId={p => p.value} getItemLabel={p => p.label}
              label="Paciente" required searchPlaceholder="Buscar paciente..." emptyMessage="Nenhum paciente encontrado" isLoading={isOptionsLoading} />
          </div>
        )}

        {/* Grupo toggle — only in Único mode */}
        {scheduleMode === 'unico' && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
            <button type="button" onClick={handleToggleGrupo}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all',
                isGrupoMode ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background border border-border/60 hover:bg-muted hover:border-border',
              )}>
              <Users size={16} />
              Atendimento em grupo
            </button>
            {isGrupoMode && <span className="text-sm text-muted-foreground">{selectedPatients.length}/5 pacientes</span>}
          </div>
        )}
      </fieldset>
    </>
  )

  // ---------------------------------------------------------------------------
  // JSX: Full form content
  // ---------------------------------------------------------------------------

  const formContent = (
    <div className="space-y-6">
      {sharedFields}

      {!isOptionsLoading && (
        <Tabs value={scheduleMode} onValueChange={v => setScheduleMode(v as ScheduleMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="unico" className="flex-1">Único</TabsTrigger>
            <TabsTrigger value="recorrente" className="flex-1">Recorrente</TabsTrigger>
          </TabsList>

          {/* ── Tab: Único ── */}
          <TabsContent value="unico">
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Data e horário
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="single-date" className="text-sm font-medium text-foreground">
                    Data <span className="text-destructive" aria-hidden="true">*</span>
                    <span className="sr-only">(campo obrigatório)</span>
                  </label>
                  <div className="relative">
                    <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input id="single-date" type="date" value={singleDate}
                      onChange={e => setSingleDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                </div>
                <Select label="Horário" required options={selectTimeOptions} value={singleTime} onChange={setSingleTime} placeholder="Escolha o horário" />
              </div>
            </fieldset>
          </TabsContent>

          {/* ── Tab: Recorrente ── */}
          <TabsContent value="recorrente">
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Configuração de recorrência
              </legend>
              <RecurrenceSection
                data={recurrenceData}
                timeOptions={selectTimeOptions}
                onChange={handleRecurrenceChange}
              />
            </fieldset>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )

  // ---------------------------------------------------------------------------
  // Submit label
  // ---------------------------------------------------------------------------

  const submitLabel = isCheckingConflict
    ? 'Verificando...'
    : scheduleMode === 'unico'
      ? isGrupoMode
        ? `Criar grupo (${selectedPatients.length} pacientes)`
        : 'Criar agendamento'
      : 'Criar série recorrente'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isMobile) {
    return (
      <AppDrawer open={isOpen} onOpenChange={open => !open && handleClose()} title="Novo agendamento">
        <AppDrawerBody>{formContent}</AppDrawerBody>
        <AppDrawerFooter>
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={handleSubmit} disabled={!isFormValid || isOptionsLoading || isCheckingConflict} className="w-full rounded-full bg-primary hover:bg-primary/90">
              {submitLabel}
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full rounded-full">Cancelar</Button>
          </div>
        </AppDrawerFooter>
      </AppDrawer>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo agendamento" size="lg">
      <ModalBody className="space-y-6">{formContent}</ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={handleClose} className="rounded-full px-8">Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!isFormValid || isOptionsLoading || isCheckingConflict} className="rounded-full px-8">
          {submitLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
