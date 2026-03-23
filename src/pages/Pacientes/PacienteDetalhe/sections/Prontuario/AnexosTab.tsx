import { useEffect, useRef, useState } from 'react'
import { SearchInput } from '@/components/ui/search-input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { DocumentCard, DocumentGrid } from '@/components/ui/document-card'
import { useMedicalData } from '@/hooks/useMedicalData'
import { toast } from 'sonner'
import type { MedicalAttachment, MedicalRecord } from '@/types/medical-record'

interface AnexosTabProps {
  attachments: MedicalAttachment[]
  records: MedicalRecord[]
  patientId: string
}

export function AnexosTab({ attachments, records, patientId }: AnexosTabProps) {
  const { createAnexo, deleteAnexo, isLoading } = useMedicalData({ autoFetch: false })
  const [displayAttachments, setDisplayAttachments] = useState(attachments)
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplayAttachments(attachments)
  }, [attachments])

  useEffect(() => {
    if (!selectedRecordId && records[0]?.id) {
      setSelectedRecordId(records[0].id)
    }
  }, [records, selectedRecordId])

  const filteredAttachments = displayAttachments.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const recordOptions = records.map((record) => ({
    value: record.id,
    label: `${record.date} ${record.time} • ${record.diagnosis}`,
  }))

  const handleView = (id: string) => {
    const doc = displayAttachments.find(a => a.id === id)
    if (doc?.url) {
      window.open(doc.url, '_blank')
    }
  }

  const handleDownload = (id: string) => {
    const doc = displayAttachments.find(a => a.id === id)
    if (doc?.url) {
      const link = document.createElement('a')
      link.href = doc.url
      link.download = doc.name
      link.click()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este anexo?')) {
      const attachment = displayAttachments.find((item) => item.id === id)
      const prontuarioId = attachment?.prontuarioId || selectedRecordId

      if (!prontuarioId) {
        toast.error('Não foi possível identificar o prontuário vinculado a este anexo')
        return
      }

      const deleted = await deleteAnexo(id, prontuarioId)
      if (deleted) {
        setDisplayAttachments((current) => current.filter((item) => item.id !== id))
      }
    }
  }

  const handleAdd = () => {
    if (!records.length) {
      toast.error('Crie um prontuário antes de enviar anexos')
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!selectedRecordId) {
      toast.error('Selecione o prontuário ao qual o anexo será vinculado')
      return
    }

    const result = await createAnexo(patientId, {
      file,
      prontuarioId: selectedRecordId,
      type: 'outros',
    })

    if (result) {
      setDisplayAttachments((current) => [result, ...current])
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
          <div className="w-72">
            <Select
              options={recordOptions}
              value={selectedRecordId}
              onChange={setSelectedRecordId}
              placeholder="Selecione o prontuário"
              disabled={records.length === 0}
            />
          </div>
          <div className="w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Pesquisar"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={isLoading || records.length === 0}
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
            code={doc.code || doc.type.toUpperCase()}
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
            : records.length === 0
              ? 'Crie um prontuário para liberar anexos'
              : 'Nenhum documento anexado'}
        </div>
      )}
    </div>
  )
}
