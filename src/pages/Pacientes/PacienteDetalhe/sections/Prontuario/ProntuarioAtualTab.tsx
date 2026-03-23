import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ClipboardList, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SimpleDropdownMenu } from '@/components/ui/dropdown-menu'
import { Pagination } from '@/components/ui/pagination'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { useMedicalData } from '@/hooks/useMedicalData'
import { apiService, type ApiResponse, type Appointment } from '@/services/api.service'
import { goalsService } from '@/services/goals.service'
import { usePaginationConfig } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { PendingGoalEvaluation } from '@/types/clinical-intelligence'
import type { MedicalRecord } from '@/types/medical-record'
import { ProntuarioDetalheModal } from './ProntuarioDetalheModal'
import { GoalsExecutionWidget } from '@/pages/Metas/components/GoalsExecutionWidget'

interface ProntuarioAtualTabProps {
  records: MedicalRecord[]
  patientId: string
}

const extractPendingGoals = (details: unknown): PendingGoalEvaluation[] => {
  if (Array.isArray(details)) {
    return details as PendingGoalEvaluation[]
  }

  if (
    details &&
    typeof details === 'object' &&
    Array.isArray((details as { pendingGoals?: unknown[] }).pendingGoals)
  ) {
    return (details as { pendingGoals: PendingGoalEvaluation[] }).pendingGoals
  }

  return []
}

export function ProntuarioAtualTab({ records, patientId }: ProntuarioAtualTabProps) {
  const { createProntuario, signProntuario, isLoading } = useMedicalData({ autoFetch: false })
  const { user, currentClinica } = useAuth()
  const clinicaId = currentClinica?.id || ''
  const [currentPage, setCurrentPage] = useState(1)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [displayRecords, setDisplayRecords] = useState(records)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [pendingGoalEvaluations, setPendingGoalEvaluations] = useState<PendingGoalEvaluation[]>([])
  const [showPendingGoalsModal, setShowPendingGoalsModal] = useState(false)
  const [goalExecutionContext, setGoalExecutionContext] = useState<{
    recordId?: string | null
    appointmentId?: string | null
  } | null>(null)
  const [showIntegratedGoalsPanel, setShowIntegratedGoalsPanel] = useState(false)
  const [formPendingGoals, setFormPendingGoals] = useState<PendingGoalEvaluation[]>([])
  const [formPendingGoalsLoading, setFormPendingGoalsLoading] = useState(false)
  const [formData, setFormData] = useState({
    appointmentId: '',
    diagnosis: '',
    complaint: '',
    diseaseHistory: '',
    prescription: '',
    privateNotes: '',
  })

  const { itemsPerPage } = usePaginationConfig()

  useEffect(() => {
    setDisplayRecords(records)
  }, [records])

  useEffect(() => {
    if (!clinicaId || !patientId) return

    const fetchPatientAppointments = async () => {
      setAppointmentsLoading(true)
      try {
        const query = new URLSearchParams({
          clinica_id: clinicaId,
          paciente_id: patientId,
          mode: 'all',
        })
        const response = await apiService.get<ApiResponse<Appointment[]>>(`/api/appointments?${query.toString()}`)
        setAppointments(response.data || [])
      } catch {
        toast.error('Não foi possível carregar os agendamentos elegíveis para prontuário')
      } finally {
        setAppointmentsLoading(false)
      }
    }

    void fetchPatientAppointments()
  }, [clinicaId, patientId])

  useEffect(() => {
    if (!clinicaId || !patientId || !formData.appointmentId) {
      setFormPendingGoals([])
      setFormPendingGoalsLoading(false)
      return
    }

    const fetchPendingGoals = async () => {
      setFormPendingGoalsLoading(true)
      try {
        const result = await goalsService.getPendingEvaluations(clinicaId, {
          pacienteId: patientId,
          agendamentoId: formData.appointmentId,
        })

        if (result.error) {
          toast.error(result.error.message)
          setFormPendingGoals([])
          return
        }

        setFormPendingGoals(result.data || [])
      } finally {
        setFormPendingGoalsLoading(false)
      }
    }

    void fetchPendingGoals()
  }, [clinicaId, formData.appointmentId, patientId])

  const eligibleAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          !!appointment.data_chegada &&
          ['em_atendimento', 'concluido'].includes(appointment.status),
      ),
    [appointments],
  )

  const appointmentOptions = useMemo(
    () =>
      eligibleAppointments.map((appointment) => {
        const startDate = new Date(appointment.data_hora_inicio)
        const label = Number.isNaN(startDate.getTime())
          ? appointment.servico?.nome || 'Sessão elegível'
          : `${startDate.toLocaleDateString('pt-BR')} ${startDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })} • ${appointment.servico?.nome || 'Sessão'}`

        return {
          value: appointment.id,
          label,
        }
      }),
    [eligibleAppointments],
  )

  const totalPages = Math.ceil(displayRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRecords = displayRecords.slice(startIndex, startIndex + itemsPerPage)

  const handleViewDetails = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedRecord(null)
  }

  const resetForm = () => {
    setFormData({
      appointmentId: '',
      diagnosis: '',
      complaint: '',
      diseaseHistory: '',
      prescription: '',
      privateNotes: '',
    })
    setFormPendingGoals([])
    setShowNewForm(false)
  }

  const handleNewRecord = async () => {
    if (!formData.appointmentId || !formData.diagnosis.trim() || !formData.complaint.trim()) return

    const result = await createProntuario(patientId, {
      agendamentoId: formData.appointmentId,
      diagnosis: formData.diagnosis,
      complaint: formData.complaint,
      diseaseHistory: formData.diseaseHistory || undefined,
      prescription: formData.prescription || undefined,
      privateNotes: formData.privateNotes || undefined,
    })

    if (result) {
      setDisplayRecords((current) => [result, ...current])
      resetForm()
    }
  }

  const handleSignRecord = useCallback(async (recordId: string) => {
    const result = await signProntuario(recordId)

    if (result.data) {
      setDisplayRecords((current) =>
        current.map((record) => (record.id === recordId ? result.data! : record)),
      )
      if (selectedRecord?.id === recordId) {
        setSelectedRecord(result.data)
      }
      setPendingGoalEvaluations([])
      setShowPendingGoalsModal(false)
      setShowIntegratedGoalsPanel(false)
      setGoalExecutionContext(null)
      return
    }

    if (result.error?.code === 'PENDING_GOAL_EVALUATIONS') {
      const pendingGoals = extractPendingGoals(result.error.details)
      const targetRecord = displayRecords.find((record) => record.id === recordId)
      setPendingGoalEvaluations(pendingGoals)
      setGoalExecutionContext({
        recordId,
        appointmentId:
          targetRecord?.appointmentId ??
          pendingGoals[0]?.appointmentId ??
          null,
      })
      setShowPendingGoalsModal(true)
    }
  }, [displayRecords, selectedRecord?.id, signProntuario])

  const openIntegratedGoalsPanel = () => {
    setShowIntegratedGoalsPanel(true)
  }

  const handleIntegratedGoalsFinish = () => {
    if (goalExecutionContext?.recordId) {
      void handleSignRecord(goalExecutionContext.recordId)
    }
  }

  const getRowActions = (record: MedicalRecord) => [
    {
      icon: <ClipboardList className="w-4 h-4" />,
      label: 'Detalhes do prontuário',
      onClick: () => handleViewDetails(record),
    },
    ...(!record.isSigned ? [{
      icon: <ShieldCheck className="w-4 h-4" />,
      label: 'Assinar prontuário',
      onClick: () => void handleSignRecord(record.id),
    }] : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Histórico de prontuário</h3>
        <Button
          onClick={() => setShowNewForm(true)}
          disabled={isLoading}
          className="rounded-full px-6 bg-primary hover:bg-primary/90"
        >
          Novo prontuário
        </Button>
      </div>

      {showNewForm && (
        <div className="border border-border rounded-xl p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-foreground">Novo prontuário</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <Select
              label="Sessão vinculada"
              required
              options={appointmentOptions}
              value={formData.appointmentId}
              onChange={(value) => setFormData({ ...formData, appointmentId: value })}
              placeholder={
                appointmentsLoading
                  ? 'Carregando sessões elegíveis...'
                  : eligibleAppointments.length > 0
                    ? 'Selecione a sessão confirmada'
                    : 'Nenhuma sessão liberada para prontuário'
              }
              disabled={appointmentsLoading || appointmentOptions.length === 0}
            />
            <p className="text-xs text-muted-foreground -mt-2">
              O prontuário só pode ser iniciado para atendimentos com presença confirmada e status em atendimento ou concluído.
            </p>

            {!formData.appointmentId && (
              <div className="rounded-lg border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                Selecione a sessão para liberar o registro integrado de metas terapêuticas.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Queixa principal <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.complaint}
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                placeholder="Ex: Dor de cabeça frequente há 3 semanas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                História da doença atual
              </label>
              <Textarea
                value={formData.diseaseHistory}
                onChange={(e) => setFormData({ ...formData, diseaseHistory: e.target.value })}
                placeholder="Descreva a evolução dos sintomas, fatores de melhora/piora, tratamentos anteriores..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Diagnóstico <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Ex: Cefaleia tensional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Prescrição médica
              </label>
              <Textarea
                value={formData.prescription}
                onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                placeholder={'1. Medicamento - posologia\n2. Medicamento - posologia\n3. Orientações adicionais'}
                className="min-h-[100px]"
              />
            </div>

            {clinicaId && formData.appointmentId && (
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {formPendingGoalsLoading
                        ? 'Verificando pendências clínicas...'
                        : formPendingGoals.length > 0
                          ? `${formPendingGoals.length} meta(s) ativa(s) aguardam avaliação para esta sessão.`
                          : 'Nenhuma pendência identificada para esta sessão, mas o registro de progresso segue disponível.'}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      O mesmo fluxo de metas será reaproveitado no fechamento do prontuário, sem UI paralela.
                    </p>
                  </div>
                </div>

                <GoalsExecutionWidget
                  patientId={patientId}
                  appointmentId={formData.appointmentId}
                  embedded
                  hidePatientSelector
                  title="Metas terapêuticas da sessão"
                  description="Registre o progresso clínico antes de salvar ou assinar a evolução."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Observações privadas
              </label>
              <Textarea
                value={formData.privateNotes}
                onChange={(e) => setFormData({ ...formData, privateNotes: e.target.value })}
                placeholder="Anotações internas (não visíveis ao paciente)..."
                className="min-h-[80px] bg-primary/5 border-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Estas observações são visíveis apenas para o profissional.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                Rascunho clínico em nome de <strong>{user?.name || 'Profissional'}</strong>. A assinatura só fica disponível após salvar.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={resetForm}
                className="rounded-full px-4"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleNewRecord}
                disabled={
                  isLoading ||
                  !formData.appointmentId ||
                  !formData.diagnosis.trim() ||
                  !formData.complaint.trim()
                }
                className="rounded-full px-6 bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showIntegratedGoalsPanel && goalExecutionContext && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-base font-semibold text-foreground">Pendências de metas bloqueando a assinatura</h4>
              <p className="text-sm text-muted-foreground">
                Execute as avaliações abaixo e, ao finalizar, a assinatura do prontuário será tentada novamente.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowIntegratedGoalsPanel(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {pendingGoalEvaluations.length > 0 && (
            <div className="rounded-lg border border-border bg-white/70 p-4">
              <p className="text-sm font-medium text-foreground mb-2">Pendências identificadas</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {pendingGoalEvaluations.map((goal) => (
                  <li key={goal.goalId}>
                    {goal.title} • meta {goal.targetValue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <GoalsExecutionWidget
            patientId={patientId}
            appointmentId={goalExecutionContext.appointmentId || undefined}
            recordId={goalExecutionContext.recordId || undefined}
            embedded
            hidePatientSelector
            title="Execução clínica de metas"
            description="Ao concluir os registros pendentes, o sistema tentará finalizar a assinatura automaticamente."
            onFinish={handleIntegratedGoalsFinish}
          />
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Diagnóstico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Horário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Situação
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {paginatedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {record.diagnosis}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {record.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {record.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    record.isSigned
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {record.isSigned ? 'Assinado' : 'Rascunho'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <SimpleDropdownMenu items={getRowActions(record)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayRecords.length === 0 && !showNewForm && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum prontuário registrado
        </div>
      )}

      {displayRecords.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayRecords.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      <ProntuarioDetalheModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        record={selectedRecord}
      />

      <ConfirmationModal
        isOpen={showPendingGoalsModal}
        onClose={() => setShowPendingGoalsModal(false)}
        onConfirm={openIntegratedGoalsPanel}
        title="Assinatura bloqueada por metas pendentes"
        heading="Avaliação clínica obrigatória antes de assinar"
        description={
          pendingGoalEvaluations.length > 0
            ? `${pendingGoalEvaluations.length} meta(s) ativa(s) ainda não possuem avaliação registrada para este prontuário.`
            : 'Há metas ativas sem avaliação registrada para este prontuário.'
        }
        confirmLabel="Executar metas agora"
        cancelLabel="Fechar"
        variant="warning"
      />
    </div>
  )
}
