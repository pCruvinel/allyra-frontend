import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useMedicalData } from '@/hooks/useMedicalData'
import type { Anamnesis } from '@/types/medical-record'

interface AnamneseTabProps {
  anamnesis?: Anamnesis | null
  patientId: string
}

const yesNoOptions = [
  { value: 'Sim', label: 'Sim' },
  { value: 'Não', label: 'Não' },
]

export function AnamneseTab({ anamnesis, patientId }: AnamneseTabProps) {
  const { saveAnamnese, isLoading } = useMedicalData({ autoFetch: false })
  const [formData, setFormData] = useState({
    hasHereditaryDisease: anamnesis?.hasHereditaryDisease ? 'Sim' : 'Não',
    usesMedication: anamnesis?.usesMedication ? 'Sim' : 'Não',
  })

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      hasHereditaryDisease: anamnesis?.hasHereditaryDisease ? 'Sim' : 'NÃ£o',
      usesMedication: anamnesis?.usesMedication ? 'Sim' : 'NÃ£o',
    }))
  }, [anamnesis])

  const handleSave = async () => {
    await saveAnamnese(patientId, {
      hasHereditaryDisease: formData.hasHereditaryDisease === 'Sim',
      usesMedication: formData.usesMedication === 'Sim',
    })
  }

  const handleCancel = () => {
    setFormData({
      hasHereditaryDisease: anamnesis?.hasHereditaryDisease ? 'Sim' : 'Não',
      usesMedication: anamnesis?.usesMedication ? 'Sim' : 'Não',
    })
  }

  return (
    <div className="space-y-6">
      {/* Doença hereditária */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Possui doença hereditária? <span className="text-red-500">*</span>
        </label>
        <Select
          options={yesNoOptions}
          value={formData.hasHereditaryDisease}
          onChange={(value) => setFormData({ ...formData, hasHereditaryDisease: value })}
          placeholder="Selecione"
        />
      </div>

      {/* Uso de medicação */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Faz uso de alguma medicação? <span className="text-red-500">*</span>
        </label>
        <Select
          options={yesNoOptions}
          value={formData.usesMedication}
          onChange={(value) => setFormData({ ...formData, usesMedication: value })}
          placeholder="Selecione"
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="rounded-full px-6 border-primary text-primary hover:bg-primary/10"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="rounded-full px-6 bg-primary hover:bg-primary/90"
        >
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
