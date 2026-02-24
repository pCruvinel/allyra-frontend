import { useState } from 'react'
import { ClipboardList, X, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SimpleDropdownMenu } from '@/components/ui/dropdown-menu'
import { Pagination } from '@/components/ui/pagination'
import { useMedicalData } from '@/hooks/useMedicalData'
import { usePaginationConfig } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import type { MedicalRecord } from '@/types/medical-record'
import { ProntuarioDetalheModal } from './ProntuarioDetalheModal'

interface ProntuarioAtualTabProps {
  records: MedicalRecord[]
  patientId: string
}

export function ProntuarioAtualTab({ records, patientId }: ProntuarioAtualTabProps) {
  const { createProntuario, isLoading } = useMedicalData({ autoFetch: false })
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [formData, setFormData] = useState({
    diagnosis: '',
    complaint: '',
    diseaseHistory: '',
    prescription: '',
    privateNotes: '',
  })

  // Buscar configuração de paginação do banco
  const { itemsPerPage } = usePaginationConfig()

  const totalPages = Math.ceil(records.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRecords = records.slice(startIndex, startIndex + itemsPerPage)

  const handleViewDetails = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedRecord(null)
  }

  const handleNewRecord = async () => {
    if (!formData.diagnosis.trim() || !formData.complaint.trim()) return

    const result = await createProntuario(patientId, {
      diagnosis: formData.diagnosis,
      complaint: formData.complaint,
      diseaseHistory: formData.diseaseHistory || undefined,
      prescription: formData.prescription || undefined,
      privateNotes: formData.privateNotes || undefined,
    })

    if (result) {
      setFormData({
        diagnosis: '',
        complaint: '',
        diseaseHistory: '',
        prescription: '',
        privateNotes: '',
      })
      setShowNewForm(false)
    }
  }

  const resetForm = () => {
    setFormData({
      diagnosis: '',
      complaint: '',
      diseaseHistory: '',
      prescription: '',
      privateNotes: '',
    })
    setShowNewForm(false)
  }

  const getRowActions = (record: MedicalRecord) => [
    {
      icon: <ClipboardList className="w-4 h-4" />,
      label: 'Detalhes do prontuário',
      onClick: () => handleViewDetails(record),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Histórico de prontuário</h3>
        <Button
          onClick={() => setShowNewForm(true)}
          disabled={isLoading}
          className="rounded-full px-6 bg-primary hover:bg-primary/90"
        >
          Novo prontuário
        </Button>
      </div>

      {/* Formulário de novo prontuário */}
      {showNewForm && (
        <div className="border border-border rounded-xl p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-foreground">Novo prontuário</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {/* Queixa Principal */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Queixa principal <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.complaint}
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                placeholder="Ex: Dor de cabeça frequente há 3 semanas"
              />
            </div>

            {/* História da Doença Atual */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                História da doença atual
              </label>
              <Textarea
                value={formData.diseaseHistory}
                onChange={(e) => setFormData({ ...formData, diseaseHistory: e.target.value })}
                placeholder="Descreva a evolução dos sintomas, fatores de melhora/piora, tratamentos anteriores..."
                className="min-h-[100px]"
              />
            </div>

            {/* Diagnóstico */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Diagnóstico <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Ex: Cefaleia tensional"
              />
            </div>

            {/* Prescrição Médica */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Prescrição médica
              </label>
              <Textarea
                value={formData.prescription}
                onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                placeholder="1. Medicamento - posologia&#10;2. Medicamento - posologia&#10;3. Orientações adicionais"
                className="min-h-[100px]"
              />
            </div>

            {/* Observações Privadas */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Observações privadas
              </label>
              <Textarea
                value={formData.privateNotes}
                onChange={(e) => setFormData({ ...formData, privateNotes: e.target.value })}
                placeholder="Anotações internas (não visíveis ao paciente)..."
                className="min-h-[80px] bg-primary/5 border-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Estas observações são visíveis apenas para o profissional.
              </p>
            </div>

            {/* Indicador de Assinatura */}
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                Assinado por: <strong>{user?.name || 'Profissional'}</strong>
              </span>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={resetForm}
                className="rounded-full px-4"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleNewRecord}
                disabled={isLoading || !formData.diagnosis.trim() || !formData.complaint.trim()}
                className="rounded-full px-6 bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Diagnóstico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Horário
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {paginatedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {record.diagnosis}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {record.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {record.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <SimpleDropdownMenu items={getRowActions(record)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {records.length === 0 && !showNewForm && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum prontuário registrado
        </div>
      )}

      {/* Paginação */}
      {records.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={records.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal de Detalhes do Prontuário */}
      <ProntuarioDetalheModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        record={selectedRecord}
      />
    </div>
  )
}
