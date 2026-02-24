/**
 * AttendanceRegistry - Registro de atendimentos e faltas no modo stand-alone
 * Timeline agrupada por data
 */

import { useState, useMemo } from 'react'
import { Calendar, Plus, UserCheck, UserX, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-shadcn'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { useStandalonePatients } from '../../hooks/useStandalonePatients'
import { useStandaloneAttendance } from '../../hooks/useStandaloneAttendance'
import { toast } from 'sonner'

interface AttendanceRegistryProps {
  searchQuery?: string
}

export function AttendanceRegistry({ searchQuery = '' }: AttendanceRegistryProps) {
  const { activePatients, getPatientById, isLoading: patientsLoading } = useStandalonePatients()
  const {
    recordsByDate,
    sortedDates,
    isLoading,
    registerAttendance,
  } = useStandaloneAttendance({
    getPatientName: (id) => getPatientById(id)?.nome,
  })

  // Filtrar registros pela busca
  const filteredRecordsByDate = useMemo(() => {
    if (!searchQuery.trim()) return recordsByDate
    const query = searchQuery.toLowerCase()
    const filtered: typeof recordsByDate = {}
    for (const date of Object.keys(recordsByDate)) {
      const records = recordsByDate[date].filter(
        (r) =>
          r.paciente?.nome?.toLowerCase().includes(query) ||
          r.observacoes?.toLowerCase().includes(query)
      )
      if (records.length > 0) {
        filtered[date] = records
      }
    }
    return filtered
  }, [recordsByDate, searchQuery])

  const filteredDates = useMemo(() => {
    return sortedDates.filter((date) => filteredRecordsByDate[date])
  }, [sortedDates, filteredRecordsByDate])

  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false)

  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')

  const getTodayDate = () => new Date().toISOString().split('T')[0]
  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const resetForm = () => {
    setSelectedPatient('')
    setSelectedDate('')
    setSelectedTime('')
    setNotes('')
  }

  const handleOpenAttendanceDialog = () => {
    setSelectedDate(getTodayDate())
    setSelectedTime(getCurrentTime())
    setIsAttendanceDialogOpen(true)
  }

  const handleOpenAbsenceDialog = () => {
    setSelectedDate(getTodayDate())
    setSelectedTime(getCurrentTime())
    setIsAbsenceDialogOpen(true)
  }

  const handleRegisterAttendance = () => {
    if (!selectedPatient || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const patient = getPatientById(selectedPatient)
    registerAttendance({
      pacienteId: selectedPatient,
      pacienteNome: patient?.nome,
      data: selectedDate,
      horario: selectedTime,
      tipo: 'presente',
      observacoes: notes || undefined,
    })

    resetForm()
    setIsAttendanceDialogOpen(false)
  }

  const handleRegisterAbsence = () => {
    if (!selectedPatient || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const patient = getPatientById(selectedPatient)
    registerAttendance({
      pacienteId: selectedPatient,
      pacienteNome: patient?.nome,
      data: selectedDate,
      horario: selectedTime,
      tipo: 'ausente',
      observacoes: notes || undefined,
    })

    resetForm()
    setIsAbsenceDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Registro de Atendimento</h2>
            <p className="text-sm text-muted-foreground">
              Registre atendimentos realizados e faltas manualmente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleOpenAttendanceDialog}>
            <Plus size={16} className="mr-2" />
            Registrar Atendimento Realizado
          </Button>
          <Button variant="outline" className="border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20" onClick={handleOpenAbsenceDialog}>
            <UserX size={16} className="mr-2" />
            Registrar Falta/Ausência
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {filteredDates.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={searchQuery ? 'Nenhum registro encontrado' : 'Nenhum registro de atendimento'}
          description={
            searchQuery
              ? `Não encontramos registros para "${searchQuery}". Tente outro termo de busca.`
              : 'Comece registrando um atendimento ou uma falta.'
          }
          action={
            !searchQuery
              ? {
                  label: 'Registrar Atendimento',
                  onClick: handleOpenAttendanceDialog,
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {filteredDates.map(date => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                  <Clock size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {formatDate(date)}
                  </span>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Records */}
              <div className="space-y-3">
                {filteredRecordsByDate[date].map(record => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {record.tipo === 'presente' ? (
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <UserCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <UserX size={20} className="text-amber-600 dark:text-amber-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            {record.paciente?.nome || 'Paciente'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.horario}
                          </p>
                        </div>
                      </div>

                      {record.tipo === 'presente' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Presente
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Ausente
                        </Badge>
                      )}
                    </div>

                    {record.observacoes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">{record.observacoes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Dica:</span>{' '}
          Os registros de presença e falta são essenciais para calcular a assiduidade do paciente e gerar relatórios precisos.
        </p>
      </div>

      {/* Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Atendimento</DialogTitle>
            <DialogDescription>
              Registre um atendimento que foi realizado
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Paciente *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient} disabled={patientsLoading || activePatients.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={patientsLoading ? "Carregando..." : activePatients.length === 0 ? "Nenhum paciente" : "Selecione o paciente"} />
                </SelectTrigger>
                <SelectContent>
                  {patientsLoading ? (
                    <SelectItem value="loading" disabled>Carregando pacientes...</SelectItem>
                  ) : activePatients.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhum paciente ativo</SelectItem>
                  ) : (
                    activePatients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!patientsLoading && activePatients.length === 0 && (
                <p className="text-sm text-amber-600">
                  Nenhum paciente cadastrado. Cadastre pacientes primeiro na aba "Pacientes".
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Horário *</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o atendimento..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              resetForm()
              setIsAttendanceDialogOpen(false)
            }}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterAttendance} disabled={patientsLoading || activePatients.length === 0}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Absence Dialog */}
      <Dialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Falta/Ausência</DialogTitle>
            <DialogDescription>
              Registre uma falta ou ausência do paciente
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Paciente *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient} disabled={patientsLoading || activePatients.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={patientsLoading ? "Carregando..." : activePatients.length === 0 ? "Nenhum paciente" : "Selecione o paciente"} />
                </SelectTrigger>
                <SelectContent>
                  {patientsLoading ? (
                    <SelectItem value="loading" disabled>Carregando pacientes...</SelectItem>
                  ) : activePatients.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhum paciente ativo</SelectItem>
                  ) : (
                    activePatients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Horário *</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Motivo</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informe o motivo da ausência..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              resetForm()
              setIsAbsenceDialogOpen(false)
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterAbsence}
              disabled={patientsLoading || activePatients.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Registrar Falta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
