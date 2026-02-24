import { useState } from 'react'
import { FileCheck } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { DocumentCard, DocumentGrid } from '@/components/ui/document-card'
import { EmptyState } from '@/components/ui/empty-state'
import { useDocuments } from '@/hooks/useDocuments'
import type { PatientConsent } from '@/types/patient'

interface PrivacidadeTabProps {
  consent: PatientConsent
  patientId: string
}

export function PrivacidadeTab({ consent, patientId }: PrivacidadeTabProps) {
  const { updateConsent, downloadDocument, viewDocument, deleteDocument, isLoading } = useDocuments({
    patientId,
    autoFetch: false,
  })

  const [formData, setFormData] = useState({
    termsOfUse: consent.termsOfUse,
    privacyPolicy: consent.privacyPolicy,
    contract: consent.contract,
  })

  const handleSave = async () => {
    await updateConsent(patientId, {
      termsOfUse: formData.termsOfUse,
      privacyPolicy: formData.privacyPolicy,
      contract: formData.contract,
    })
  }

  const handleCancel = () => {
    setFormData({
      termsOfUse: consent.termsOfUse,
      privacyPolicy: consent.privacyPolicy,
      contract: consent.contract,
    })
  }

  const handleView = (id: string) => {
    const doc = consent.termsOfUseDoc?.id === id ? consent.termsOfUseDoc
      : consent.privacyPolicyDoc?.id === id ? consent.privacyPolicyDoc
      : consent.contractDoc?.id === id ? consent.contractDoc
      : null

    if (doc) {
      viewDocument({
        id: doc.id,
        patientId,
        clinicaId: '',
        type: 'termo_consentimento',
        name: doc.id,
        url: '',
        uploadedAt: doc.uploadedAt,
        updatedAt: doc.uploadedAt,
      })
    }
  }

  const handleDownload = async (id: string) => {
    const doc = consent.termsOfUseDoc?.id === id ? consent.termsOfUseDoc
      : consent.privacyPolicyDoc?.id === id ? consent.privacyPolicyDoc
      : consent.contractDoc?.id === id ? consent.contractDoc
      : null

    if (doc) {
      await downloadDocument({
        id: doc.id,
        patientId,
        clinicaId: '',
        type: 'termo_consentimento',
        name: doc.id,
        url: '',
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

  return (
    <div className="space-y-6">
      {/* Switches de consentimento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Termos de uso */}
        <div>
          <h4 className="text-sm font-medium text-foreground">Termos de uso</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Este campo representa o aceite do termo
          </p>
          <Switch
            checked={formData.termsOfUse}
            onCheckedChange={(checked) => setFormData({ ...formData, termsOfUse: checked })}
          />
        </div>

        {/* Políticas de privacidade */}
        <div>
          <h4 className="text-sm font-medium text-foreground">Políticas de privacidade</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Este campo representa o aceite da política
          </p>
          <Switch
            checked={formData.privacyPolicy}
            onCheckedChange={(checked) => setFormData({ ...formData, privacyPolicy: checked })}
          />
        </div>

        {/* Contrato */}
        <div>
          <h4 className="text-sm font-medium text-foreground">Contrato</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Este campo representa o aceite do contrato
          </p>
          <Switch
            checked={formData.contract}
            onCheckedChange={(checked) => setFormData({ ...formData, contract: checked })}
          />
        </div>
      </div>

      {/* Seção de documentos */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Termos e políticas</h3>

        {!consent.termsOfUseDoc && !consent.privacyPolicyDoc && !consent.contractDoc ? (
          <EmptyState
            icon={FileCheck}
            title="Nenhum documento anexado"
            description="Os termos de uso, políticas de privacidade e contratos assinados pelo paciente serão exibidos aqui."
          />
        ) : (
          <DocumentGrid>
            {consent.termsOfUseDoc && (
              <DocumentCard
                id={consent.termsOfUseDoc.id}
                name="Termos de uso"
                code={consent.termsOfUseDoc.uploadedAt}
                uploadedAt=""
                onView={handleView}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            )}
            {consent.privacyPolicyDoc && (
              <DocumentCard
                id={consent.privacyPolicyDoc.id}
                name="Políticas de privacidade"
                code={consent.privacyPolicyDoc.uploadedAt}
                uploadedAt=""
                onView={handleView}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            )}
            {consent.contractDoc && (
              <DocumentCard
                id={consent.contractDoc.id}
                name="Contrato"
                code={consent.contractDoc.uploadedAt}
                uploadedAt=""
                onView={handleView}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            )}
          </DocumentGrid>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="rounded-full px-6 border-primary text-primary hover:bg-primary/10"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="rounded-full px-6 bg-primary hover:bg-primary/90"
        >
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
