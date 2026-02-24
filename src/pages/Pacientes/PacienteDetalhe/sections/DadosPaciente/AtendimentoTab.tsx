import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CheckSquare, Calendar, CalendarClock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { PatientInsurance } from '@/types/patient'

interface AtendimentoTabProps {
  data: PatientInsurance
}

const conveniosOptions = [
  { value: 'Unimed', label: 'Unimed' },
  { value: 'Bradesco Saúde', label: 'Bradesco Saúde' },
  { value: 'SulAmérica', label: 'SulAmérica' },
  { value: 'Amil', label: 'Amil' },
  { value: 'Porto Seguro', label: 'Porto Seguro' },
  { value: 'Particular', label: 'Particular' },
]

export function AtendimentoTab({ data }: AtendimentoTabProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    insuranceName: data.insuranceName,
    cardNumber: data.cardNumber,
    validUntil: data.validUntil,
  })

  const handleSave = () => {
    console.log('Salvando atendimento:', formData)
  }

  const handleCancel = () => {
    setFormData({
      insuranceName: data.insuranceName,
      cardNumber: data.cardNumber,
      validUntil: data.validUntil,
    })
  }

  const handleGoToAgenda = () => {
    navigate({ to: '/agenda' })
  }

  return (
    <div className="space-y-6">
      {/* Convênio */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Convênio <span className="text-red-500">*</span>
        </label>
        <Select
          options={conveniosOptions}
          value={formData.insuranceName}
          onChange={(value) => setFormData({ ...formData, insuranceName: value })}
          placeholder="Selecione o convênio"
        />
      </div>

      {/* Carteirinha e Validade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Carteirinha <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.cardNumber}
            onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
            placeholder="0000 0000 0000 0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Validade <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-wrap justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleGoToAgenda}
          className="rounded-full px-6 border-primary text-primary hover:bg-primary/10"
        >
          Ir para agenda
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          className="rounded-full px-6 border-primary text-primary hover:bg-primary/10"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="rounded-full px-6 bg-primary hover:bg-primary/90"
        >
          Salvar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border">
        {/* Sessões Realizadas */}
        <div className="p-4 sm:p-6 border border-border rounded-xl">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">{data.sessionsCompleted}</p>
          <p className="text-sm text-muted-foreground">Sessões realizadas</p>
        </div>

        {/* Primeira Sessão */}
        <div className="p-4 sm:p-6 border border-border rounded-xl">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          {data.firstSession?.date ? (
            <>
              <p className="text-xl font-bold text-primary">{data.firstSession.date}</p>
              <p className="text-sm text-foreground">{data.firstSession.time}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem registro</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">Primeira sessão</p>
        </div>

        {/* Próxima Sessão */}
        <div className="p-4 sm:p-6 border border-border rounded-xl">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
            <CalendarClock className="w-5 h-5 text-primary" />
          </div>
          {data.nextSession?.date ? (
            <>
              <p className="text-xl font-bold text-primary">{data.nextSession.date}</p>
              <p className="text-sm text-foreground">{data.nextSession.time}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem agendamento</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">Próxima sessão</p>
        </div>
      </div>
    </div>
  )
}
