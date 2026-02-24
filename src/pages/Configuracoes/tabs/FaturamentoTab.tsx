import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useConfigurations } from '@/hooks/useConfigurations'

const simNaoOptions = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
]

const plataformaOptions = [
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'todos', label: 'Todos os canais' },
]

const notificacaoOptions = [
  { value: 'sempre', label: 'Sempre' },
  { value: 'nunca', label: 'Nunca' },
  { value: 'apenas_pendentes', label: 'Apenas pendentes' },
]

const enviarFaturaOptions = [
  { value: 'automatico', label: 'Automaticamente' },
  { value: 'manual', label: 'Manualmente' },
  { value: 'nao_enviar', label: 'Não enviar' },
]

const diaVencimentoOptions = [
  { value: '5', label: 'Dia 5' },
  { value: '10', label: 'Dia 10' },
  { value: '15', label: 'Dia 15' },
  { value: '20', label: 'Dia 20' },
  { value: '25', label: 'Dia 25' },
  { value: '30', label: 'Dia 30' },
]

export function FaturamentoTab() {
  const { updateFaturamento, isLoading } = useConfigurations({ autoFetch: false })
  const [imposto, setImposto] = useState('')
  const [unificarTitulos, setUnificarTitulos] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [notificacao, setNotificacao] = useState('')
  const [enviarFatura, setEnviarFatura] = useState('')
  const [diaVencimento, setDiaVencimento] = useState('')

  const handleSave = async () => {
    await updateFaturamento({
      imposto: parseFloat(imposto) || 0,
      unificarTitulos: unificarTitulos === 'sim',
      plataforma,
      notificacao,
      enviarFatura,
      diaVencimento: parseInt(diaVencimento) || 10,
    })
  }

  const handleCancel = () => {
    setImposto('')
    setUnificarTitulos('')
    setPlataforma('')
    setNotificacao('')
    setEnviarFatura('')
    setDiaVencimento('')
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Imposto sobre o faturamento <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={imposto}
            onChange={(e) => setImposto(e.target.value)}
            placeholder="Ex: 15"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Percentual de imposto aplicado sobre o faturamento (%)
          </p>
        </div>

        <div>
          <Select
            label="Unificar títulos"
            required
            options={simNaoOptions}
            value={unificarTitulos}
            onChange={setUnificarTitulos}
            placeholder="Selecione uma opção"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Unificar todos os títulos do paciente em uma única fatura
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Faturamento para paciente <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Select
              options={plataformaOptions}
              value={plataforma}
              onChange={setPlataforma}
              placeholder="Plataforma"
            />
            <Select
              options={notificacaoOptions}
              value={notificacao}
              onChange={setNotificacao}
              placeholder="Notificação"
            />
            <Select
              options={enviarFaturaOptions}
              value={enviarFatura}
              onChange={setEnviarFatura}
              placeholder="Enviar fatura"
            />
            <Select
              options={diaVencimentoOptions}
              value={diaVencimento}
              onChange={setDiaVencimento}
              placeholder="Dia vencimento"
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Configurações de envio de fatura para o paciente
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
