import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useConfigurations } from '@/hooks/useConfigurations'

const planoContaOptions = [
  { value: 'receita-consulta', label: 'Receita de Consultas' },
  { value: 'receita-exame', label: 'Receita de Exames' },
  { value: 'receita-procedimento', label: 'Receita de Procedimentos' },
]

export function PadraoTab() {
  const { updatePadrao, isLoading } = useConfigurations({ autoFetch: false })
  const [planoContaPadrao, setPlanoContaPadrao] = useState('')

  const handleSave = async () => {
    await updatePadrao({ planoContaPadrao })
  }

  const handleCancel = () => {
    setPlanoContaPadrao('')
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="max-w-md">
        <Select
          label="Plano de conta padrão"
          required
          options={planoContaOptions}
          value={planoContaPadrao}
          onChange={setPlanoContaPadrao}
          placeholder="Selecione uma opção"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Título de contas à receber - Cobrança para convênio - Define o plano de contas padrão para títulos emitidos automático de contas à receber de convênio
        </p>
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
