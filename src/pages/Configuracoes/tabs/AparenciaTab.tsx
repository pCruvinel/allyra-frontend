import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'
import { useConfigurations } from '@/hooks/useConfigurations'

export function AparenciaTab() {
  const { updateAparencia, isLoading } = useConfigurations({ autoFetch: false })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [corPrimaria, setCorPrimaria] = useState('#a78bfa')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    await updateAparencia({
      logoUrl: logoPreview || undefined,
      nomeEmpresa,
      corPrimaria,
    })
  }

  const handleCancel = () => {
    setLogoPreview(null)
    setNomeEmpresa('')
    setCorPrimaria('#a78bfa')
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Logo da empresa
          </label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors overflow-hidden"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar imagem
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG ou GIF. Máximo 2MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome da empresa <span className="text-red-500">*</span>
          </label>
          <Input
            value={nomeEmpresa}
            onChange={(e) => setNomeEmpresa(e.target.value)}
            placeholder="Digite o nome da empresa"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Nome que será exibido no sistema e nos documentos
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cor primária <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              style={{ backgroundColor: corPrimaria }}
              onClick={() => document.getElementById('color-picker')?.click()}
            />
            <Input
              value={corPrimaria}
              onChange={(e) => setCorPrimaria(e.target.value)}
              placeholder="#FFFFFF"
              className="w-32"
            />
            <input
              id="color-picker"
              type="color"
              value={corPrimaria}
              onChange={(e) => setCorPrimaria(e.target.value)}
              className="w-0 h-0 opacity-0 absolute"
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Cor principal utilizada nos botões e elementos destacados
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
