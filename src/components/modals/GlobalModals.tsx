import { useState } from 'react'
import { useModal } from '@/contexts'
import { usePatients } from '@/hooks/usePatients'
import { useAppointments } from '@/hooks/useAppointments'
import { useAppointmentOptions } from '@/hooks/useAppointmentOptions'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { apiService } from '@/services/api.service'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import {
  CreateAppointmentModal,
  ProcessPaymentModal,
  ConfirmAbsenceModal,
  NovoPacienteModal,
} from '.'
import { CheckinModal } from '@/components/modals/CheckinModal'
import type { PaymentFormData } from './ProcessPaymentModal'

import { type CreatePatientInput } from '@/schemas/patient.schema'

interface CreateAppointmentData {
  service: string
  insurance: string
  professional: string
  patient: string
  patients?: string[]  // Para modo grupo
  date: string
  time: string
  room?: string
  isGrupo?: boolean
  isRecurring?: boolean
  recurrenceType?: 'semanal' | 'quinzenal' | 'mensal'
  recurrenceEndDate?: string
  diasSemana?: number[]
}

export function GlobalModals() {
  const { modalState, closeModal } = useModal()
  const { currentClinica } = useAuth()
  const { createPatient } = usePatients({ autoFetch: false })
  const { registerNoShow, createAppointment } = useAppointments({ autoFetch: false })
  const { getServiceDuration, insurancesOptions } = useAppointmentOptions()
  const { refresh } = useData()

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Handler para confirmar chegada — agora usa CheckinModal diretamente
  const handleCheckinSuccess = () => {
    closeModal()
    refresh()
  }

  // Handler para criar novo agendamento (suporta modo grupo)
  const handleCreateAppointment = async (data: CreateAppointmentData) => {
    if (!currentClinica) {
      toast.error('Selecione uma clinica primeiro')
      return
    }

    // Obter duracao do servico selecionado (default: 60 min)
    const duracaoMinutos = getServiceDuration(data.service)

    // Calcular data_hora_inicio e data_hora_fim
    // Adiciona offset local (ex: -03:00) para que o Supabase armazene
    // o valor UTC correto e não 3h adiantado
    const tzOffset = (() => {
      const off = -new Date().getTimezoneOffset() // em minutos, positivo para UTC-3 = -180 -> 180
      const sign = off >= 0 ? '+' : '-'
      const abs = Math.abs(off)
      const hh = String(Math.floor(abs / 60)).padStart(2, '0')
      const mm = String(abs % 60).padStart(2, '0')
      return `${sign}${hh}:${mm}` // ex: "-03:00"
    })()
    const dataHoraInicio = `${data.date}T${data.time}:00${tzOffset}`
    const [hours, minutes] = data.time.split(':').map(Number)
    const endMinutes = minutes + duracaoMinutos
    const endHours = hours + Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const dataHoraFim = `${data.date}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00${tzOffset}`

    // Verificar se o convenio selecionado e "Particular" (pelo nome, nao pelo ID)
    const selectedInsurance = insurancesOptions.find(i => i.value === data.insurance)
    const isParticular = selectedInsurance?.label?.toLowerCase() === 'particular'

    // Se modo grupo, criar agendamento em grupo via API
    if (data.isGrupo && data.patients && data.patients.length >= 2) {
      logger.info('GlobalModals', `Criando agendamento em grupo para ${data.patients.length} pacientes`)

      const result = await apiService.createAppointment({
        is_grupo: true,
        paciente_ids: data.patients,
        profissional_id: data.professional,
        servico_id: data.service,
        data_hora_inicio: dataHoraInicio,
        data_hora_fim: dataHoraFim,
        duracao_minutos: duracaoMinutos,
        convenio_id: isParticular ? undefined : data.insurance,
        sala_id: data.room || undefined,
        observacoes: 'Atendimento em grupo',
      }, currentClinica.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(`Agendamento em grupo criado para ${data.patients.length} pacientes!`)
      await refresh()
      closeModal()
      return
    }

    // Modo normal: criar agendamento unico
    let result

    if (data.isRecurring && data.recurrenceType && data.recurrenceEndDate) {
      const resp = await apiService.createRecurrentAppointment({
        paciente_id: data.patient,
        profissional_id: data.professional,
        servico_id: data.service,
        data_hora_inicio: dataHoraInicio,
        data_hora_fim: dataHoraFim,
        duracao_minutos: duracaoMinutos,
        tipo: 'consulta',
        convenio_id: isParticular ? undefined : data.insurance,
        sala_id: data.room || undefined,
        observacoes: '',
        recorrencia_tipo: data.recurrenceType,
        recorrencia_data_fim: data.recurrenceEndDate,
        dias_semana: data.diasSemana || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, currentClinica.id)
      
      if (resp.error) {
        toast.error(resp.error)
        return
      }

      const countCriados = resp.data?.criados || 0
      const countConflitos = resp.data?.conflitos || 0
      
      if (countConflitos > 0) {
        toast.warning(`Série finalizada: ${countCriados} agendamentos criados. ${countConflitos} conflitos ignorados.`)
      } else {
        toast.success(`Série de ${countCriados} agendamentos criada com sucesso!`)
      }
      
      await refresh()
      closeModal()
      return
    } else {
      result = await createAppointment({
        paciente_id: data.patient,
        profissional_id: data.professional,
        servico_id: data.service,
        data_hora_inicio: dataHoraInicio,
        data_hora_fim: dataHoraFim,
        duracao_minutos: duracaoMinutos,
        tipo: 'consulta',
        convenio_id: isParticular ? undefined : data.insurance,
        sala_id: data.room || undefined,
        observacoes: '',
      })
    }

    if (result) {
      closeModal()
    }
  }

  // Handler para processar pagamento
  const handleProcessPayment = async (data: PaymentFormData) => {
    const appointmentId = data.appointmentId || String(modalState.appointment?.id)

    if (!appointmentId) {
      toast.error('Agendamento não identificado')
      return
    }

    // Converter valores de string para number
    const valor = parseFloat(data.value.replace(',', '.')) || 0
    const desconto = parseFloat(data.discount.replace(',', '.')) || 0

    if (valor <= 0) {
      toast.error('Informe um valor válido')
      return
    }

    setIsProcessingPayment(true)

    try {
      const result = await apiService.payAppointment(appointmentId, {
        valor,
        forma_pagamento: data.paymentMethod,
        parcelas: parseInt(data.installments, 10) || 1,
        desconto,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data?.success) {
        toast.success(`Pagamento registrado! Fatura: ${result.data.data.numero_fatura}`)
        closeModal()
        // Atualizar dados após pagamento (agendamento mudou de status)
        refresh()
      }
    } catch (err) {
      logger.error('GlobalModals', 'Erro ao processar pagamento:', err)
      toast.error('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handler para registrar falta do paciente
  const handleConfirmAbsence = async () => {
    if (!modalState.appointment?.id) {
      toast.error('Agendamento não identificado')
      return
    }

    const success = await registerNoShow(String(modalState.appointment.id))
    if (success) {
      closeModal()
    }
  }

  const handleCreatePatient = async (data: CreatePatientInput) => {
    if (!currentClinica) {
      toast.error('Selecione uma clínica primeiro')
      return
    }

    const result = await createPatient(data)

    if (result) {
      closeModal()
    }
  }

  return (
    <>
      {modalState.type === 'arrival' && modalState.appointment && (
        <CheckinModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={handleCheckinSuccess}
          appointment={{
            id: String(modalState.appointment.id),
            patientName: modalState.appointment.patientName || '',
            dateStr: modalState.appointment.date || '',
            date: modalState.appointment.date || '',
            time: modalState.appointment.time || '',
            serviceName: modalState.appointment.serviceName || '',
          }}
        />
      )}

      <CreateAppointmentModal
        isOpen={modalState.type === 'appointment'}
        onClose={closeModal}
        onSubmit={handleCreateAppointment}
        initialPatientId={modalState.initialPatientId}
        initialProfessionalId={modalState.initialProfessionalId}
      />

      <ProcessPaymentModal
        isOpen={modalState.type === 'payment'}
        onClose={closeModal}
        onSubmit={handleProcessPayment}
        patientName={modalState.appointment?.patientName || ''}
        serviceName={modalState.appointment?.serviceName}
        appointmentId={String(modalState.appointment?.id || '')}
        isLoading={isProcessingPayment}
      />

      <ConfirmAbsenceModal
        isOpen={modalState.type === 'absence'}
        onClose={closeModal}
        onConfirm={handleConfirmAbsence}
      />

      <NovoPacienteModal
        isOpen={modalState.type === 'patient'}
        onClose={closeModal}
        onSubmit={handleCreatePatient}
      />
    </>
  )
}
