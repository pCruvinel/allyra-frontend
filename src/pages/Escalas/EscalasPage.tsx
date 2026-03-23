import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, Loader2, CalendarRange, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useModulePermission } from '@/hooks/useModuleAccess'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useRelatorios } from '@/hooks/useRelatorios'
import { apiService } from '@/services/api.service'
import type { ProfessionalWorkloadSummary } from '@/types/clinical-intelligence'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ScheduleFilterBar } from './components/ScheduleFilterBar'
import { ScheduleFormSheet, type ScheduleFormState } from './components/ScheduleFormSheet'
import { WeeklyScheduleGrid } from './components/WeeklyScheduleGrid'
import { WorkloadDashboard } from './components/WorkloadDashboard'
import type { WorkloadRow } from './components/WorkloadTable'
import type { WorkloadStatsData } from './components/WorkloadStats'
import type { ScheduleType } from './components/ScheduleBlock'

// ─── Types ───────────────────────────────────────────

interface ScheduleItem {
  id: string
  profissional_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  tipo?: ScheduleType | null
  recorrente?: boolean | null
  vigencia_inicio?: string | null
  vigencia_fim?: string | null
  profissional?: {
    id: string
    usuario?: {
      nome_completo?: string
    } | null
  } | null
}

// ─── Helpers ─────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function getMonthEnd(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
}

function normalizeDate(value?: string | null): string {
  return value ? value.slice(0, 10) : ''
}

function buildDefaultFormState(overrides?: Partial<ScheduleFormState>): ScheduleFormState {
  return {
    profissionalId: '',
    diasSemana: [1, 2, 3, 4, 5],
    horaInicio: '08:00',
    horaFim: '17:00',
    tipo: 'atendimento',
    recorrente: true,
    vigenciaInicio: getToday(),
    vigenciaFim: '',
    ...overrides,
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Não foi possível concluir a operação.'
}

// ─── Page Component ──────────────────────────────────

export function EscalasPage() {
  const { currentClinica } = useAuth()
  const {
    canAccess,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    isLoading: isPermissionLoading,
  } = useModulePermission('escalas_rh')
  const { professionals, professionalsOptions, isLoading: isProfessionalsLoading } = useProfessionals()
  const { gerarExcel, gerarPdf, isGenerating } = useRelatorios()

  // ─── Filter State ──────────────────────────────────
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('')
  const [vigenciaData, setVigenciaData] = useState(getToday())
  const [workloadStart, setWorkloadStart] = useState(getMonthStart())
  const [workloadEnd, setWorkloadEnd] = useState(getMonthEnd())
  const [workloadSearch, setWorkloadSearch] = useState('')

  // ─── Data State ────────────────────────────────────
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [workload, setWorkload] = useState<ProfessionalWorkloadSummary[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [isLoadingWorkload, setIsLoadingWorkload] = useState(false)

  // ─── Form State ────────────────────────────────────
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)
  const [formState, setFormState] = useState<ScheduleFormState>(buildDefaultFormState())

  // ─── Derived Data ──────────────────────────────────

  const professionalNameById = useMemo(
    () => new Map(professionals.map((item) => [item.id, item.name])),
    [professionals],
  )

  const professionalFilterOptions = useMemo(
    () => [{ value: '', label: 'Todos os profissionais' }, ...professionalsOptions],
    [professionalsOptions],
  )

  const professionalInfoList = useMemo(
    () => professionals.map((p) => ({ id: p.id, name: p.name })),
    [professionals],
  )

  const workloadRows = useMemo<WorkloadRow[]>(
    () =>
      workload
        .map((item) => ({
          id: item.professionalId,
          professionalName:
            professionalNameById.get(item.professionalId) || 'Profissional não identificado',
          allocatedHours: item.allocatedHours,
          attendedHours: item.attendedHours,
          utilization: item.utilization,
        }))
        .filter((row) => {
          if (!workloadSearch.trim()) return true
          return row.professionalName.toLowerCase().includes(workloadSearch.trim().toLowerCase())
        }),
    [professionalNameById, workload, workloadSearch],
  )

  const workloadStats = useMemo<WorkloadStatsData>(() => {
    const totalAllocatedHours = workload.reduce((sum, item) => sum + item.allocatedHours, 0)
    const totalAttendedHours = workload.reduce((sum, item) => sum + item.attendedHours, 0)
    const utilization = totalAllocatedHours > 0 ? totalAttendedHours / totalAllocatedHours : 0
    return {
      professionals: workload.length,
      totalAllocatedHours,
      totalAttendedHours,
      utilization,
    }
  }, [workload])

  // ─── Data Fetching ─────────────────────────────────

  const loadSchedules = useCallback(async () => {
    if (!currentClinica?.id || !canAccess) {
      setSchedules([])
      return
    }
    setIsLoadingSchedules(true)
    try {
      const response = await apiService.getSchedules(currentClinica.id, {
        profissionalId: selectedProfessionalId || undefined,
        vigenciaData: vigenciaData || undefined,
      })
      if (response.error) throw new Error(response.error)
      setSchedules((response.data || []) as ScheduleItem[])
    } catch (error) {
      toast.error(getErrorMessage(error))
      setSchedules([])
    } finally {
      setIsLoadingSchedules(false)
    }
  }, [canAccess, currentClinica?.id, selectedProfessionalId, vigenciaData])

  const loadWorkload = useCallback(async () => {
    if (!currentClinica?.id || !canAccess || !workloadStart || !workloadEnd) {
      setWorkload([])
      return
    }
    setIsLoadingWorkload(true)
    try {
      const response = await apiService.getSchedulesWorkload(
        currentClinica.id,
        workloadStart,
        workloadEnd,
        selectedProfessionalId || undefined,
      )
      if (response.error) throw new Error(response.error)
      setWorkload(response.data || [])
    } catch (error) {
      toast.error(getErrorMessage(error))
      setWorkload([])
    } finally {
      setIsLoadingWorkload(false)
    }
  }, [canAccess, currentClinica?.id, selectedProfessionalId, workloadEnd, workloadStart])

  useEffect(() => {
    void loadSchedules()
  }, [loadSchedules])

  useEffect(() => {
    void loadWorkload()
  }, [loadWorkload])

  // ─── Form Handlers ─────────────────────────────────

  function openCreateSheet(dayOfWeek?: number) {
    setEditingSchedule(null)
    setFormState(
      buildDefaultFormState({
        profissionalId: selectedProfessionalId || '',
        vigenciaInicio: vigenciaData || getToday(),
        diasSemana: dayOfWeek !== undefined ? [dayOfWeek] : [1, 2, 3, 4, 5],
      }),
    )
    setIsSheetOpen(true)
  }

  function openEditSheet(scheduleId: string) {
    const schedule = schedules.find((item) => item.id === scheduleId)
    if (!schedule) return
    setEditingSchedule(schedule)
    setFormState({
      profissionalId: schedule.profissional_id,
      diasSemana: [schedule.dia_semana],
      horaInicio: schedule.hora_inicio,
      horaFim: schedule.hora_fim,
      tipo: schedule.tipo || 'atendimento',
      recorrente: Boolean(schedule.recorrente),
      vigenciaInicio: normalizeDate(schedule.vigencia_inicio) || getToday(),
      vigenciaFim: normalizeDate(schedule.vigencia_fim),
    })
    setIsSheetOpen(true)
  }

  function resetSheet() {
    setIsSheetOpen(false)
    setEditingSchedule(null)
    setFormState(buildDefaultFormState())
  }

  function updateFormField<K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }))
  }

  function validateForm(): string | null {
    if (!formState.profissionalId) return 'Selecione um profissional.'
    if (formState.diasSemana.length === 0) return 'Selecione pelo menos um dia da semana.'
    if (!formState.horaInicio || !formState.horaFim) return 'Informe o horário inicial e final.'
    if (formState.horaInicio >= formState.horaFim) return 'O horário final deve ser maior que o inicial.'
    if (!formState.vigenciaInicio) return 'Informe a vigência inicial.'
    if (formState.vigenciaFim && formState.vigenciaFim < formState.vigenciaInicio) {
      return 'A vigência final não pode ser anterior à vigência inicial.'
    }
    return null
  }

  async function handleSubmit() {
    if (!currentClinica?.id) return
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      if (editingSchedule) {
        // Edit: single day (diasSemana[0])
        const payload = {
          clinica_id: currentClinica.id,
          profissional_id: formState.profissionalId,
          dia_semana: formState.diasSemana[0],
          hora_inicio: formState.horaInicio,
          hora_fim: formState.horaFim,
          tipo: formState.tipo,
          recorrente: formState.recorrente,
          vigencia_inicio: formState.vigenciaInicio,
          vigencia_fim: formState.vigenciaFim || null,
        }
        const response = await apiService.updateSchedule(editingSchedule.id, payload)
        if (response.error) throw new Error(response.error)
        toast.success('Escala atualizada com sucesso.')
      } else {
        // Create: one schedule per selected day
        const base = {
          clinica_id: currentClinica.id,
          profissional_id: formState.profissionalId,
          hora_inicio: formState.horaInicio,
          hora_fim: formState.horaFim,
          tipo: formState.tipo,
          recorrente: formState.recorrente,
          vigencia_inicio: formState.vigenciaInicio,
          vigencia_fim: formState.vigenciaFim || null,
        }

        const results = await Promise.allSettled(
          formState.diasSemana.map((dia) =>
            apiService.createSchedule({ ...base, dia_semana: dia }),
          ),
        )

        const failures = results.filter((r) => r.status === 'rejected')
        const successCount = results.length - failures.length

        if (failures.length > 0 && successCount > 0) {
          toast.warning(
            `${successCount} escala(s) criada(s), ${failures.length} falhou(aram).`,
          )
        } else if (failures.length > 0) {
          throw new Error('Não foi possível criar as escalas.')
        } else {
          toast.success(
            successCount === 1
              ? 'Escala criada com sucesso.'
              : `${successCount} escalas criadas com sucesso.`,
          )
        }
      }
      resetSheet()
      await Promise.all([loadSchedules(), loadWorkload()])
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(scheduleId: string) {
    if (!window.confirm('Deseja remover esta escala?')) return
    try {
      const response = await apiService.deleteSchedule(scheduleId)
      if ('error' in response && response.error) {
        throw new Error(String(response.error))
      }
      toast.success('Escala removida com sucesso.')
      await Promise.all([loadSchedules(), loadWorkload()])
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleExport(format: 'pdf' | 'excel') {
    if (!canExport) {
      toast.error('Seu perfil não possui permissão para exportar.')
      return
    }
    const filtros = {
      dateFrom: workloadStart,
      dateTo: workloadEnd,
      ...(selectedProfessionalId ? { profissionalId: selectedProfessionalId } : {}),
    }
    if (format === 'pdf') {
      await gerarPdf('escalas', filtros)
      return
    }
    await gerarExcel('escalas', filtros)
  }

  // ─── Guard States ──────────────────────────────────

  if (isPermissionLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentClinica?.id) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Selecione uma clínica"
        description="O módulo de escalas precisa de uma clínica ativa para carregar profissionais, grade e carga horária."
      />
    )
  }

  if (!canAccess) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Sem acesso ao módulo"
        description="Seu perfil não possui permissão para visualizar escalas e carga horária."
      />
    )
  }

  // ─── Render ────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">Escalas e RH</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie a grade semanal dos profissionais e acompanhe a utilização da carga horária.
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="grade" className="space-y-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="grade" className="gap-1.5">
              <CalendarRange className="h-4 w-4" />
              Grade Semanal
            </TabsTrigger>
            <TabsTrigger value="carga" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Carga Horária
            </TabsTrigger>
          </TabsList>

          {canCreate && (
            <Button type="button" onClick={() => openCreateSheet()}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Nova escala
            </Button>
          )}
        </div>

        {/* ─── Tab: Grade Semanal ───────────────────── */}
        <TabsContent value="grade" className="space-y-4">
          <ScheduleFilterBar
            professionalOptions={professionalFilterOptions}
            selectedProfessionalId={selectedProfessionalId}
            onProfessionalChange={setSelectedProfessionalId}
            vigenciaData={vigenciaData}
            onVigenciaChange={setVigenciaData}
          />

          <WeeklyScheduleGrid
            schedules={schedules}
            professionals={professionalInfoList}
            selectedProfessionalId={selectedProfessionalId}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={openEditSheet}
            onDelete={(id) => void handleDelete(id)}
            onCreate={openCreateSheet}
            isLoading={isLoadingSchedules || isProfessionalsLoading}
          />
        </TabsContent>

        {/* ─── Tab: Carga Horária ──────────────────── */}
        <TabsContent value="carga">
          <WorkloadDashboard
            professionalOptions={professionalFilterOptions}
            selectedProfessionalId={selectedProfessionalId}
            onProfessionalChange={setSelectedProfessionalId}
            workloadStart={workloadStart}
            onWorkloadStartChange={setWorkloadStart}
            workloadEnd={workloadEnd}
            onWorkloadEndChange={setWorkloadEnd}
            stats={workloadStats}
            rows={workloadRows}
            isLoading={isLoadingWorkload || isProfessionalsLoading}
            onSearch={setWorkloadSearch}
            canExport={canExport}
            isGenerating={isGenerating}
            onExport={(format) => void handleExport(format)}
          />
        </TabsContent>
      </Tabs>

      {/* Schedule Form Sheet */}
      <ScheduleFormSheet
        isOpen={isSheetOpen}
        onClose={resetSheet}
        onSubmit={() => void handleSubmit()}
        isEditing={!!editingSchedule}
        isSubmitting={isSubmitting}
        formState={formState}
        onFieldChange={updateFormField}
        professionalsOptions={professionalsOptions}
      />

      {/* Submitting overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-full bg-background px-5 py-3 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Salvando escala...</span>
          </div>
        </div>
      )}
    </div>
  )
}
