import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useConfigurations } from '@/hooks/useConfigurations'

export function ComunicacaoTab() {
  const { updateComunicacao, isLoading } = useConfigurations({ autoFetch: false })
  const [enviarSmsMarcar, setEnviarSmsMarcar] = useState(false)
  const [solicitarConfirmacao, setSolicitarConfirmacao] = useState(false)

  const handleSave = async () => {
    await updateComunicacao({
      enviarSmsMarcar,
      solicitarConfirmacao,
    })
  }

  const handleCancel = () => {
    setEnviarSmsMarcar(false)
    setSolicitarConfirmacao(false)
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Enviar SMS ao marcar
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              Enviar uma mensagem SMS automaticamente quando um agendamento for criado
            </p>
          </div>
          <Switch
            checked={enviarSmsMarcar}
            onCheckedChange={setEnviarSmsMarcar}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Solicitar confirmação via SMS
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              Enviar SMS solicitando confirmação do paciente antes da consulta
            </p>
          </div>
          <Switch
            checked={solicitarConfirmacao}
            onCheckedChange={setSolicitarConfirmacao}
          />
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
