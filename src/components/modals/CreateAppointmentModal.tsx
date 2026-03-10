import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Users } from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CpfInput } from '@/components/ui/cpf-input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select } from '@/components/ui/select'
import { SingleSelectSearch } from '@/components/ui/single-select-search'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useAppointmentOptions } from '@/hooks/useAppointmentOptions'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { CreatePatientInput } from '@/services/patients.service'
import { apiService } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'

interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AppointmentFormData) => void
  initialPatientId?: string
  initialProfessionalId?: string
}

export interface AppointmentFormData {
  service: string
  insurance: string
  professional: string
  professionals?: string[]  // Para modo grupo com múltiplos profissionais
  patient: string
  patients?: string[]  // Para modo grupo
  date: string
  time: string
  room?: string        // ID da sala (opcional)
  isGrupo?: boolean    // Modo atendimento em grupo
  isRecurring?: boolean // Novo: Modo recorrente
  recurrenceType?: 'semanal' | 'quinzenal' | 'mensal'
  recurrenceEndDate?: string
}

// Formata data atual para YYYY-MM-DD usando horário LOCAL (evita bug UTC-3 retornar ontem)
function getTodayDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Encontra próximo horário disponível (próxima meia hora)
function getNextTimeSlot(): string {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()

  // Se passou das 17:30, default para 08:00 (próximo dia útil)
  if (hours >= 17 && minutes > 30) {
    return '08:00'
  }

  // Se antes das 8h, default para 08:00
  if (hours < 8) {
    return '08:00'
  }

  // Arredonda para próxima meia hora
  const nextMinutes = minutes < 30 ? 30 : 0
  const nextHours = minutes < 30 ? hours : hours + 1

  return `${nextHours.toString().padStart(2, '0')}:${nextMinutes.toString().padStart(2, '0')}`
}

export function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialPatientId,
  initialProfessionalId,
}: CreateAppointmentModalProps) {
  const isMobile = useIsMobile()
  const { currentClinica } = useAuth()
  const [activeTab, setActiveTab] = useState('agendamento')
  // Ref que bloqueia o fechamento do modal durante troca de tabs
  const closeLockRef = useRef(false)
  // Guarda o paciente selecionado para controle da tab
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  // Modo atendimento em grupo
  const [isGrupoMode, setIsGrupoMode] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState<{ value: string; label: string }[]>([])
  const [selectedProfessionals, setSelectedProfessionals] = useState<{ value: string; label: string }[]>([])
  const [isCheckingConflict, setIsCheckingConflict] = useState(false)

  // Hook que busca dados reais
  const {
    patientsOptions,
    professionalsOptions,
    servicesOptions,
    insurancesOptions,
    roomsOptions,
    timeOptions,
    isLoading: isOptionsLoading,
    getPatientDefaultInsurance,
    createPatient,
    refreshAll,
  } = useAppointmentOptions()

  // Estado do formulário de agendamento com defaults
  const [formData, setFormData] = useState<AppointmentFormData>({
    service: '',
    insurance: '',
    professional: '',
    patient: '',
    date: getTodayDate(),
    time: getNextTimeSlot(),
    room: '',
  })

  // Lista local de pacientes (inclui pacientes criados via cadastro rápido)
  const [localPatientOptions, setLocalPatientOptions] = useState(patientsOptions)

  // Sincroniza lista local quando dados do hook atualizam
  useEffect(() => {
    setLocalPatientOptions(patientsOptions)
  }, [patientsOptions])

  // Pré-preenche paciente quando modal abre com initialPatientId
  // Importante: também dispara quando patientsOptions carrega (pode ser async)
  useEffect(() => {
    if (isOpen && initialPatientId && patientsOptions.length > 0) {
      const patientOption = patientsOptions.find(p => p.value === initialPatientId)
      if (patientOption) {
        // Usa defaultInsuranceId diretamente do patientOption
        const insuranceId = patientOption.defaultInsuranceId
        setFormData(prev => ({
          ...prev,
          patient: initialPatientId,
          // Só preenche convênio se ainda não tiver sido preenchido ou se é o preenchimento inicial
          insurance: prev.insurance || insuranceId || '',
        }))
        setSelectedPatient(initialPatientId)
      }
    }
  }, [isOpen, initialPatientId, patientsOptions])

  useEffect(() => {
    if (!isOpen || !initialProfessionalId || professionalsOptions.length === 0) return

    const professionalExists = professionalsOptions.some((professional) => professional.value === initialProfessionalId)
    if (!professionalExists) return

    setFormData((prev) => ({
      ...prev,
      professional: initialProfessionalId,
    }))
  }, [isOpen, initialProfessionalId, professionalsOptions])

  // Estado do formulário de cadastro rápido de paciente
  const [quickPatientForm, setQuickPatientForm] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    birthDate: '',
    insurance: '',
  })

  const [isCreatingPatient, setIsCreatingPatient] = useState(false)

  // Quando paciente é selecionado, preenche convênio automaticamente
  const handlePatientChange = (patientId: string) => {
    setFormData((prev) => ({ ...prev, patient: patientId }))
    setSelectedPatient(patientId)

    // Auto-preenche convênio com o default do paciente
    const defaultInsuranceId = getPatientDefaultInsurance(patientId)
    if (defaultInsuranceId) {
      setFormData((prev) => ({ ...prev, insurance: defaultInsuranceId }))
    }
  }

  const handleSubmit = async () => {
    if (!currentClinica?.id) return

    setIsCheckingConflict(true)

    // Calculate duration logic (same as GlobalModals) or just check what is provided 
    // We only need an approximation for conflict check or exact if possible.
    // 60 mins default for fallback
    const duracaoMinutos = 60
    const tzOffset = (() => {
      const off = -new Date().getTimezoneOffset()
      const sign = off >= 0 ? '+' : '-'
      const abs = Math.abs(off)
      const hh = String(Math.floor(abs / 60)).padStart(2, '0')
      const mm = String(abs % 60).padStart(2, '0')
      return `${sign}${hh}:${mm}`
    })()
    const dataHoraInicio = `${formData.date}T${formData.time}:00${tzOffset}`
    const [hours, minutes] = formData.time.split(':').map(Number)
    const endMinutes = minutes + duracaoMinutos
    const endHours = hours + Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const dataHoraFim = `${formData.date}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00${tzOffset}`

    const conflictTarget = isGrupoMode ? (selectedProfessionals.length > 0 ? selectedProfessionals[0].value : formData.professional) : formData.professional
    
    try {
      if (conflictTarget && currentClinica) {
        const conflictRes = await apiService.checkAppointmentConflicts({
          clinica_id: currentClinica.id,
          profissional_id: conflictTarget,
          data_hora_inicio: dataHoraInicio,
          data_hora_fim: dataHoraFim,
          sala_id: formData.room || undefined,
        })
  
        if (conflictRes.data?.hasConflict && conflictRes.data.conflicts.length > 0) {
          const c = conflictRes.data.conflicts[0]
          let msg = `Conflito de horário detectado.`
          if (c.type === 'sala') {
            msg = `A sala ${c.resource_name} já está reservada para o paciente ${c.paciente_nome} nesse horário.`
          } else if (c.type === 'profissional') {
            msg = `O profissional ${c.resource_name} já possui agendamento com ${c.paciente_nome} nesse horário.`
          } else if (c.type === 'paciente') {
            msg = `O paciente ${c.resource_name} já possui outro agendamento nesse horário.`
          } else {
            msg = `Conflito detectado para ${c.resource_name} (paciente: ${c.paciente_nome}) nesse horário.`
          }
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

    // Se modo grupo, incluir lista de pacientes e profissionais
    if (isGrupoMode && selectedPatients.length >= 2) {
      onSubmit({
        ...formData,
        isGrupo: true,
        patients: selectedPatients.map(p => p.value),
        professionals: selectedProfessionals.length > 0 ? selectedProfessionals.map(p => p.value) : [formData.professional],
      })
    } else {
      onSubmit(formData)
    }
    handleClose()
  }

  // Troca de tab com lock para prevenir fechamento acidental do modal
  const handleTabChange = useCallback((value: string) => {
    closeLockRef.current = true
    setActiveTab(value)
    // Libera o lock após o ciclo de eventos completo
    setTimeout(() => {
      closeLockRef.current = false
    }, 150)
  }, [])

  const handleClose = useCallback(() => {
    // Se estamos no meio de uma troca de tab, não fechar o modal
    if (closeLockRef.current) return
    onClose()
    // Reset forms para defaults
    setFormData({
      service: '',
      insurance: '',
      professional: '',
      patient: '',
      date: getTodayDate(),
      time: getNextTimeSlot(),
      room: '',
      isRecurring: false,
      recurrenceType: undefined,
      recurrenceEndDate: '',
    })
    setQuickPatientForm({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      birthDate: '',
      insurance: '',
    })
    setSelectedPatient('')
    setIsGrupoMode(false)
    setSelectedPatients([])
    setSelectedProfessionals([])
    setActiveTab('agendamento')
  }, [onClose])

  const handleChange = (field: keyof AppointmentFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleQuickPatientChange = (field: keyof typeof quickPatientForm, value: string) => {
    setQuickPatientForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleQuickPatientSubmit = async () => {
    if (!quickPatientForm.name || !quickPatientForm.cpf) {
      toast.error('Nome e CPF são obrigatórios')
      return
    }

    setIsCreatingPatient(true)

    try {
      // Prepara dados para criação no Supabase
      const createData: CreatePatientInput = {
        name: quickPatientForm.name,
        email: quickPatientForm.email || '',
        cpf: quickPatientForm.cpf,
        phone: quickPatientForm.phone || undefined,
        birthDate: quickPatientForm.birthDate || undefined,
        insurance: quickPatientForm.insurance || 'Particular',
      }

      // Cria paciente no Supabase
      const newPatient = await createPatient(createData)

      if (newPatient) {
        // Adiciona à lista local de options
        const newPatientOption = {
          value: newPatient.id,
          label: newPatient.name,
          defaultInsuranceId: newPatient.insuranceId,
          cpf: newPatient.cpf,
          phone: newPatient.phone,
        }
        setLocalPatientOptions((prev) => [...prev, newPatientOption])

        // Seleciona automaticamente o novo paciente
        setFormData((prev) => ({
          ...prev,
          patient: newPatient.id,
          insurance: newPatient.insuranceId || prev.insurance,
        }))

        // Limpar formulário de cadastro rápido
        setQuickPatientForm({
          name: '',
          email: '',
          cpf: '',
          phone: '',
          birthDate: '',
          insurance: '',
        })

        // Voltar para tab de agendamento
        setActiveTab('agendamento')

        toast.success(`Paciente ${newPatient.name} cadastrado! Continue o agendamento.`)

        // Refresh para garantir sincronização
        await refreshAll()
      }
    } catch {
      toast.error('Erro ao cadastrar paciente. Tente novamente.')
    } finally {
      setIsCreatingPatient(false)
    }
  }

  // Toggle modo grupo
  const handleToggleGrupo = () => {
    setIsGrupoMode(!isGrupoMode)
    if (!isGrupoMode) {
      // Entrando em modo grupo - adiciona paciente atual se selecionado
      if (selectedPatient) {
        const patientOption = selectPatientOptions.find(p => p.value === selectedPatient)
        if (patientOption) {
          setSelectedPatients([patientOption])
        }
      }
      // Adiciona profissional atual se selecionado
      if (formData.professional) {
        const profOption = selectProfessionalOptions.find(p => p.value === formData.professional)
        if (profOption) {
          setSelectedProfessionals([profOption])
        }
      }
    } else {
      // Saindo do modo grupo - limpa listas
      setSelectedPatients([])
      setSelectedProfessionals([])
    }
  }

  // Validacao do formulario
  const isFormValid = isGrupoMode
    ? !!(formData.service &&
      formData.insurance &&
      (selectedProfessionals.length > 0 || formData.professional) &&
      selectedPatients.length >= 2 &&
      formData.date &&
      formData.time)
    : !!(formData.service &&
      formData.insurance &&
      formData.professional &&
      formData.patient &&
      formData.date &&
      formData.time && 
      (!formData.isRecurring || (formData.recurrenceType && formData.recurrenceEndDate)))

  const isQuickPatientValid = quickPatientForm.name && quickPatientForm.cpf

  // Converte options para formato do Select
  const selectPatientOptions = useMemo(() =>
    localPatientOptions.map(p => ({ value: p.value, label: p.label })),
    [localPatientOptions]
  )

  const selectProfessionalOptions = useMemo(() =>
    professionalsOptions.map(p => ({ value: p.value, label: p.label })),
    [professionalsOptions]
  )

  const selectServiceOptions = useMemo(() =>
    servicesOptions.map(s => ({ value: s.value, label: s.label })),
    [servicesOptions]
  )

  const selectInsuranceOptions = useMemo(() =>
    insurancesOptions.map(i => ({ value: i.value, label: i.label })),
    [insurancesOptions]
  )

  const selectTimeOptions = useMemo(() =>
    timeOptions.map(t => ({ value: t.value, label: t.label })),
    [timeOptions]
  )

  // Conteúdo das Tabs (compartilhado entre mobile e desktop)
  const tabsContent = (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList
        className="w-full sm:w-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TabsTrigger value="agendamento" className="flex-1 sm:flex-none">Agendamento</TabsTrigger>
        <TabsTrigger
          value="cadastro-paciente"
          disabled={!!selectedPatient}
          className={`flex-1 sm:flex-none ${selectedPatient ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={selectedPatient ? 'Paciente já selecionado. Limpe a seleção para cadastrar um novo.' : undefined}
        >
          {isMobile ? 'Novo paciente' : 'Cadastro rápido de paciente'}
        </TabsTrigger>
      </TabsList>

      {/* Tab: Agendamento */}
      <TabsContent value="agendamento">
        {isOptionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Carregando dados...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label="Serviço"
              required
              options={selectServiceOptions}
              value={formData.service}
              onChange={handleChange('service')}
              placeholder="Selecione uma opção"
            />

            <Select
              label="Convênio"
              required
              options={selectInsuranceOptions}
              value={formData.insurance}
              onChange={handleChange('insurance')}
              placeholder="Selecione uma opção"
            />

            <Select
              label="Sala / Consultório (opcional)"
              options={roomsOptions}
              value={formData.room || ''}
              onChange={handleChange('room')}
              placeholder="Selecione uma sala"
            />

            {/* Profissional - modo normal ou grupo */}
            {isGrupoMode ? (
              <MultiSelectSearch
                items={selectProfessionalOptions}
                value={selectedProfessionals}
                onChange={setSelectedProfessionals}
                minSelection={1}
                maxSelection={3}
                getItemId={(p) => p.value}
                getItemLabel={(p) => p.label}
                label="Profissionais"
                required
                searchPlaceholder="Buscar profissional..."
                emptyMessage="Nenhum profissional encontrado"
                isLoading={isOptionsLoading}
              />
            ) : (
              <SingleSelectSearch
                items={selectProfessionalOptions}
                value={formData.professional}
                onChange={(value) => handleChange('professional')(value)}
                getItemId={(p) => p.value}
                getItemLabel={(p) => p.label}
                label="Profissional"
                required
                searchPlaceholder="Buscar profissional..."
                emptyMessage="Nenhum profissional encontrado"
                isLoading={isOptionsLoading}
              />
            )}

            {/* Toggle para modo grupo */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={handleToggleGrupo}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all",
                  isGrupoMode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background border border-border/60 hover:bg-muted hover:border-border"
                )}
              >
                <Users size={16} />
                Atendimento em grupo
              </button>
              {isGrupoMode && (
                <span className="text-sm text-muted-foreground">
                  {selectedPatients.length}/5 pacientes
                </span>
              )}
            </div>

            {/* Selecao de paciente(s) */}
            {isGrupoMode ? (
              <MultiSelectSearch
                items={selectPatientOptions}
                value={selectedPatients}
                onChange={setSelectedPatients}
                minSelection={2}
                maxSelection={5}
                getItemId={(p) => p.value}
                getItemLabel={(p) => p.label}
                label="Pacientes do grupo"
                required
                searchPlaceholder="Buscar paciente pelo nome..."
                emptyMessage="Nenhum paciente encontrado"
                isLoading={isOptionsLoading}
              />
            ) : (
              <SingleSelectSearch
                items={selectPatientOptions}
                value={formData.patient}
                onChange={(value) => {
                  if (value) {
                    handlePatientChange(value)
                  } else {
                    setFormData(prev => ({ ...prev, patient: '' }))
                    setSelectedPatient('')
                  }
                }}
                getItemId={(p) => p.value}
                getItemLabel={(p) => p.label}
                label="Paciente"
                required
                searchPlaceholder="Buscar paciente..."
                emptyMessage="Nenhum paciente encontrado"
                isLoading={isOptionsLoading}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date')(e.target.value)}
                  className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <Select
                label="Horário"
                required
                options={selectTimeOptions}
                value={formData.time}
                onChange={handleChange('time')}
                placeholder="Escolha o horário"
              />
            </div>

            {/* Toggle para recorrência (apenas para modo padrão) */}
            {!isGrupoMode && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50 mt-2">
                <button
                  type="button"
                  onClick={() => handleChange('isRecurring')(!formData.isRecurring ? 'true' : '')}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all",
                    formData.isRecurring
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background border border-border/60 hover:bg-muted hover:border-border"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                  Agendamento recorrente
                </button>
              </div>
            )}

            {!isGrupoMode && formData.isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-border rounded-xl bg-card">
                <Select
                  label="Frequência"
                  required
                  options={[
                    { value: 'semanal', label: 'Semanal' },
                    { value: 'quinzenal', label: 'Quinzenal' },
                    { value: 'mensal', label: 'Mensal' },
                  ]}
                  value={formData.recurrenceType || ''}
                  onChange={handleChange('recurrenceType')}
                  placeholder="Selecione a frequência"
                />
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">
                    Repetir até <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={formData.date}
                    value={formData.recurrenceEndDate || ''}
                    onChange={(e) => handleChange('recurrenceEndDate')(e.target.value)}
                    className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </TabsContent>

      {/* Tab: Cadastro Rápido de Paciente */}
      <TabsContent value="cadastro-paciente">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cadastre rapidamente um novo paciente. Após o cadastro, você voltará automaticamente para a tab de agendamento.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <Input
                value={quickPatientForm.name}
                onChange={(e) => handleQuickPatientChange('name', e.target.value)}
                placeholder="Nome do paciente"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                CPF <span className="text-red-500">*</span>
              </label>
              <CpfInput
                value={quickPatientForm.cpf}
                onChange={(value) => handleQuickPatientChange('cpf', value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <Input
                type="email"
                value={quickPatientForm.email}
                onChange={(e) => handleQuickPatientChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Telefone
              </label>
              <PhoneInput
                value={quickPatientForm.phone}
                onChange={(value) => handleQuickPatientChange('phone', value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Data de nascimento
              </label>
              <input
                type="date"
                value={quickPatientForm.birthDate}
                onChange={(e) => handleQuickPatientChange('birthDate', e.target.value)}
                className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <Select
              label="Convênio"
              options={selectInsuranceOptions}
              value={quickPatientForm.insurance}
              onChange={(value) => handleQuickPatientChange('insurance', value)}
              placeholder="Selecione uma opção"
            />
          </div>

          {/* Botão de cadastro apenas no desktop (mobile usa footer) */}
          {!isMobile && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleQuickPatientSubmit}
                disabled={!isQuickPatientValid || isCreatingPatient}
                className="rounded-full"
              >
                {isCreatingPatient ? 'Cadastrando...' : 'Cadastrar e voltar ao agendamento'}
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )

  // Footer mobile: stack vertical (primario em cima)
  const mobileAgendamentoActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isOptionsLoading || isCheckingConflict}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
      >
        {isCheckingConflict ? 'Verificando...' : isGrupoMode
          ? `Criar agendamento em grupo (${selectedPatients.length} pacientes)`
          : 'Criar agendamento'}
      </Button>
      <Button
        variant="outline"
        onClick={handleClose}
        className="w-full rounded-full"
      >
        Cancelar
      </Button>
    </div>
  )

  const mobileCadastroActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleQuickPatientSubmit}
        disabled={!isQuickPatientValid || isCreatingPatient}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
      >
        {isCreatingPatient ? 'Cadastrando...' : 'Cadastrar paciente'}
      </Button>
      <Button
        variant="outline"
        onClick={() => setActiveTab('agendamento')}
        className="w-full rounded-full"
      >
        Voltar ao agendamento
      </Button>
    </div>
  )

  // Mobile: usar AppDrawer fullscreen
  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title="Crie um agendamento"
      >
        <AppDrawerBody>
          {tabsContent}
        </AppDrawerBody>
        <AppDrawerFooter>
          {activeTab === 'agendamento' ? mobileAgendamentoActions : mobileCadastroActions}
        </AppDrawerFooter>
      </AppDrawer>
    )
  }

  // Desktop: usar Modal tradicional
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crie um agendamento"
      size="lg"
    >
      <ModalBody className="space-y-6">
        {tabsContent}
      </ModalBody>

      {activeTab === 'agendamento' && (
        <ModalFooter>
          <Button variant="outline" onClick={handleClose} className="rounded-full px-8">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isOptionsLoading || isCheckingConflict}
            className="rounded-full px-8"
          >
            {isCheckingConflict ? 'Verificando...' : isGrupoMode
              ? `Criar grupo (${selectedPatients.length})`
              : 'Criar'}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  )
}
