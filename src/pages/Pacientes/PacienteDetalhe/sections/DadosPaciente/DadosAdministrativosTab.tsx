import { useState, useRef } from 'react'
import { FileText } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import { Button } from '@/components/ui/button'
import { DocumentCard, DocumentGrid } from '@/components/ui/document-card'
import { EmptyState } from '@/components/ui/empty-state'
import { useDocuments } from '@/hooks/useDocuments'
import type { PatientDocument } from '@/types/patient'

interface DadosAdministrativosTabProps {
  documents: PatientDocument[]
  patientId: string
}

export function DadosAdministrativosTab({ documents, patientId }: DadosAdministrativosTabProps) {
  const { uploadDocument, deleteDocument, downloadDocument, viewDocument, isLoading, isUploading } = useDocuments({
    patientId,
    type: 'documento_administrativo',
    autoFetch: false,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleView = (id: string) => {
    const doc = documents.find(d => d.id === id)
    if (doc) {
      viewDocument({
        id: doc.id,
        patientId,
        clinicaId: '',
        type: 'documento_administrativo',
        name: doc.name,
        code: doc.code,
        url: doc.url || '',
        uploadedAt: doc.uploadedAt,
        updatedAt: doc.uploadedAt,
      })
    }
  }

  const handleDownload = async (id: string) => {
    const doc = documents.find(d => d.id === id)
    if (doc) {
      await downloadDocument({
        id: doc.id,
        patientId,
        clinicaId: '',
        type: 'documento_administrativo',
        name: doc.name,
        code: doc.code,
        url: doc.url || '',
        uploadedAt: doc.uploadedAt,
        updatedAt: doc.uploadedAt,
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteDocument(id)
    }
  }

  const handleAdd = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadDocument({
      file,
      type: 'documento_administrativo',
      name: file.name,
    })

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
            disabled={isLoading || isUploading}
            className="rounded-full px-6 bg-primary hover:bg-primary/90"
          >
            {isUploading ? 'Enviando...' : 'Adicionar'}
          </Button>
        </div>
      </div>

      {/* Grid de Documentos */}
      <DocumentGrid>
        {filteredDocuments.map((doc) => (
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

      {filteredDocuments.length === 0 && (
        searchQuery ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum documento encontrado para a pesquisa
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Nenhum documento anexado"
            description="Adicione documentos administrativos do paciente como RG, CPF, comprovante de residência e outros."
            action={{
              label: 'Adicionar documento',
              onClick: handleAdd,
            }}
          />
        )
      )}
    </div>
  )
}
