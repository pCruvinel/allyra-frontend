import { useState, useRef } from 'react'
import { SearchInput } from '@/components/ui/search-input'
import { Button } from '@/components/ui/button'
import { DocumentCard, DocumentGrid } from '@/components/ui/document-card'
import { useMedicalData } from '@/hooks/useMedicalData'
import { toast } from 'sonner'
import type { MedicalAttachment } from '@/types/medical-record'

interface AnexosTabProps {
  attachments: MedicalAttachment[]
  patientId: string
}

export function AnexosTab({ attachments, patientId }: AnexosTabProps) {
  const { createAnexo, deleteAnexo, isLoading } = useMedicalData({ autoFetch: false })
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredAttachments = attachments.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleView = (id: string) => {
    const doc = attachments.find(a => a.id === id)
    if (doc?.url) {
      window.open(doc.url, '_blank')
    }
  }

  const handleDownload = (id: string) => {
    const doc = attachments.find(a => a.id === id)
    if (doc?.url) {
      const link = document.createElement('a')
      link.href = doc.url
      link.download = doc.name
      link.click()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este anexo?')) {
      await deleteAnexo(id)
    }
  }

  const handleAdd = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Por enquanto, criar com URL placeholder (depois integrar com Storage)
    // Em produção, faria upload para Supabase Storage primeiro
    const fakeUrl = URL.createObjectURL(file)

    const result = await createAnexo(patientId, {
      name: file.name,
      url: fakeUrl,
      type: 'outros',
    })

    if (result) {
      toast.info('Nota: Upload para storage será implementado na próxima fase')
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Input de arquivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {/* Header com título, pesquisa e botão adicionar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Documentos anexados</h3>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Pesquisar"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={isLoading}
            className="rounded-full px-6 bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>
      </div>

      {/* Grid de Documentos */}
      <DocumentGrid>
        {filteredAttachments.map((doc) => (
          <DocumentCard
            key={doc.id}
            id={doc.id}
            name={doc.name}
            code={doc.code}
            uploadedAt={doc.uploadedAt}
            url={doc.url}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        ))}
      </DocumentGrid>

      {filteredAttachments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery
            ? 'Nenhum documento encontrado para a pesquisa'
            : 'Nenhum documento anexado'}
        </div>
      )}
    </div>
  )
}
