import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useConfigurations } from '@/hooks/useConfigurations'

const simNaoOptions = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
]

const diasOptions = [
  { value: '0', label: 'Não permitir' },
  { value: '1', label: '1 dia' },
  { value: '2', label: '2 dias' },
  { value: '3', label: '3 dias' },
  { value: '5', label: '5 dias' },
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
]

const tempoOptions = [
  { value: '15', label: '15 minutos' },
  { value: '20', label: '20 minutos' },
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '60 minutos' },
]

const incrementoOptions = [
  { value: '5', label: '5 minutos' },
  { value: '10', label: '10 minutos' },
  { value: '15', label: '15 minutos' },
  { value: '30', label: '30 minutos' },
]

export function OperacionalTab() {
  const { updateOperacional, isLoading } = useConfigurations({ autoFetch: false })
  const [recepcaoFinaliza, setRecepcaoFinaliza] = useState('')
  const [marcacaoRetroativa, setMarcacaoRetroativa] = useState('')
  const [prontuarioRetroativo, setProntuarioRetroativo] = useState('')
  const [tempoMinimo, setTempoMinimo] = useState('')
  const [incrementar, setIncrementar] = useState('')
  const [tempoMaximo, setTempoMaximo] = useState('')

  const handleSave = async () => {
    await updateOperacional({
      recepcaoFinaliza: recepcaoFinaliza === 'sim',
      marcacaoRetroativa: parseInt(marcacaoRetroativa) || 0,
      prontuarioRetroativo: parseInt(prontuarioRetroativo) || 0,
      tempoMinimo: parseInt(tempoMinimo) || 30,
      incrementar: parseInt(incrementar) || 15,
      tempoMaximo: parseInt(tempoMaximo) || 60,
    })
  }

  const handleCancel = () => {
    setRecepcaoFinaliza('')
    setMarcacaoRetroativa('')
    setProntuarioRetroativo('')
    setTempoMinimo('')
    setIncrementar('')
    setTempoMaximo('')
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="space-y-6">
        <div>
          <Select
            label="Recepção pode finalizar atendimento"
            required
            options={simNaoOptions}
            value={recepcaoFinaliza}
            onChange={setRecepcaoFinaliza}
            placeholder="Selecione uma opção"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Define se o setor de recepção pode registrar o atendimento como realizado
          </p>
        </div>

        <div>
          <Select
            label="Marcação retroativa"
            required
            options={diasOptions}
            value={marcacaoRetroativa}
            onChange={setMarcacaoRetroativa}
            placeholder="Selecione uma opção"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Definir a quantidade de dias - Define a quantidade de dias que pode realizar a marcação retroativa
          </p>
        </div>

        <div>
          <Select
            label="Prontuário retroativo"
            required
            options={diasOptions}
            value={prontuarioRetroativo}
            onChange={setProntuarioRetroativo}
            placeholder="Selecione uma opção"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Definir a quantidade de dias - Define a quantidade de dias que pode realizar manutenção no prontuário depois do dia da consulta
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Duração da consulta <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Select
              options={tempoOptions}
              value={tempoMinimo}
              onChange={setTempoMinimo}
              placeholder="Tempo Mínimo"
            />
            <Select
              options={incrementoOptions}
              value={incrementar}
              onChange={setIncrementar}
              placeholder="Incrementar"
            />
            <Select
              options={tempoOptions}
              value={tempoMaximo}
              onChange={setTempoMaximo}
              placeholder="Tempo Máximo"
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Intervalo de faixa - Define o tempo de duração das consultas
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
        <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="rounded-full px-8">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading} className="rounded-full px-8">
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
