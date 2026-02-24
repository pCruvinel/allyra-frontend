import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useConfigurations } from '@/hooks/useConfigurations'

interface FieldConfig {
  id: string
  label: string
  enabled: boolean
  required: boolean
  saveToProfile: boolean
}

const initialFields: FieldConfig[] = [
  { id: 'nome', label: 'Nome completo', enabled: true, required: true, saveToProfile: true },
  { id: 'cpf', label: 'CPF', enabled: true, required: true, saveToProfile: true },
  { id: 'email', label: 'E-mail', enabled: true, required: false, saveToProfile: true },
  { id: 'telefone', label: 'Telefone', enabled: true, required: true, saveToProfile: true },
  { id: 'data_nascimento', label: 'Data de nascimento', enabled: true, required: false, saveToProfile: true },
  { id: 'convenio', label: 'Convênio', enabled: true, required: false, saveToProfile: true },
  { id: 'endereco', label: 'Endereço', enabled: false, required: false, saveToProfile: false },
  { id: 'observacoes', label: 'Observações', enabled: false, required: false, saveToProfile: false },
]

export function CadastroRapidoTab() {
  const { updateCadastroRapido, isLoading } = useConfigurations({ autoFetch: false })
  const [fields, setFields] = useState<FieldConfig[]>(initialFields)

  const updateField = (id: string, key: keyof FieldConfig, value: boolean) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    )
  }

  const handleSave = async () => {
    await updateCadastroRapido({ campos: fields })
  }

  const handleCancel = () => {
    setFields(initialFields)
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Configure quais campos serão exibidos no cadastro rápido de pacientes e quais são obrigatórios.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div
              key={field.id}
              className="border border-border rounded-xl p-4 hover:border-muted-foreground/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-foreground">{field.label}</span>
                <Switch
                  checked={field.enabled}
                  onCheckedChange={(checked) => updateField(field.id, 'enabled', checked)}
                />
              </div>

              {field.enabled && (
                <div className="flex items-center gap-6 pt-2 border-t border-border/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={field.required}
                      onCheckedChange={(checked) =>
                        updateField(field.id, 'required', checked as boolean)
                      }
                    />
                    <span className="text-sm text-muted-foreground">Obrigatório</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={field.saveToProfile}
                      onCheckedChange={(checked) =>
                        updateField(field.id, 'saveToProfile', checked as boolean)
                      }
                    />
                    <span className="text-sm text-muted-foreground">Salvar</span>
                  </label>
                </div>
              )}
            </div>
          ))}
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
