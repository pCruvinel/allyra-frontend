/**
 * PdfPreview - Preview do relatório em formato PDF
 * Com personalização de marca/branding da clínica
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, Settings, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { parseDevolutivaNotes, readStoredDevolutivaNotes } from '../utils/devolutivaNotes'
import type { TherapeuticPlan, GoalReport } from '@/types/goals'
import type { PatientListItem } from '@/types/patient'

interface BrandSettings {
  logoUrl: string
  clinicName: string
  primaryColor: string
  address: string
  phone: string
  website: string
}

interface PdfPreviewProps {
  plan: TherapeuticPlan | null
  patient: PatientListItem | undefined
  report: GoalReport | null
}

const STORAGE_KEY = 'allyra_brand_settings'

export function PdfPreview({ plan, patient, report }: PdfPreviewProps) {
  const [showBrandingModal, setShowBrandingModal] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    logoUrl: '',
    clinicName: 'Clínica Allyra',
    primaryColor: '#a78bfa',
    address: 'Rua Exemplo, 123 - Bairro',
    phone: '(11) 9999-9999',
    website: 'www.allyra.com.br',
  })

  // Load brand settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setBrandSettings(JSON.parse(saved))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBrandSettings({ ...brandSettings, logoUrl: event.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const saveBrandSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brandSettings))
    setShowBrandingModal(false)
  }

  const handleExportPdf = () => {
    // Adiciona classe ao body para estilos de impressão
    document.body.classList.add('printing-pdf')
    setIsPrinting(true)

    // Aguarda a renderização do portal e então imprime
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print()

        // Remove classe após impressão
        document.body.classList.remove('printing-pdf')
        setIsPrinting(false)
      })
    })
  }

  if (!plan || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum plano selecionado</p>
      </div>
    )
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const { technicalOpinion, recommendations } = parseDevolutivaNotes(
    readStoredDevolutivaNotes(plan.id) ?? plan.observacoes
  )

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-card rounded-xl border border-border/60 p-4 print:hidden">
        <div>
          <h3 className="font-semibold text-foreground">Relatório de Evolução Terapêutica</h3>
          <p className="text-sm text-muted-foreground">
            Preview do relatório personalizado com a identidade da clínica
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowBrandingModal(true)}>
            <Settings size={16} className="mr-2" />
            Personalizar Marca
          </Button>
          <Button onClick={handleExportPdf}>
            <Download size={16} className="mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* PDF Preview */}
      <div
        id="pdf-report-content"
        className="bg-white rounded-xl border border-border/60 p-8 md:p-12 shadow-lg print:shadow-none print:border-0 print:rounded-none"
      >
        <div className="max-w-[800px] mx-auto" style={{ minHeight: '1000px' }}>
          {/* PDF Header */}
          <div
            className="flex items-start justify-between mb-8 pb-6 border-b-2"
            style={{ borderColor: brandSettings.primaryColor }}
          >
            <div>
              {brandSettings.logoUrl ? (
                <img
                  src={brandSettings.logoUrl}
                  alt="Logo"
                  className="h-[60px] object-contain mb-3"
                />
              ) : (
                <div className="h-[60px] w-[160px] bg-muted rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xs text-muted-foreground">Logo da Clínica</span>
                </div>
              )}
              <h2
                className="font-semibold text-xl"
                style={{ color: brandSettings.primaryColor }}
              >
                {brandSettings.clinicName}
              </h2>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>{brandSettings.address}</p>
                <p>{brandSettings.phone}</p>
                <p>{brandSettings.website}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Data do Relatório</p>
              <p className="font-semibold text-foreground">{formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg text-foreground mb-4">
              Informações do Paciente
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nome Completo</p>
                <p className="text-sm text-foreground">{patient?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data de Nascimento</p>
                <p className="text-sm text-foreground">{formatDate(patient?.birthDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Período do Plano</p>
                <p className="text-sm text-foreground">
                  {formatDate(plan.data_inicio)} a {formatDate(plan.data_fim || plan.data_fim_prevista)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Terapeuta Responsável</p>
                <p className="text-sm text-foreground">
                  {plan.profissional?.usuario?.nome_completo || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          {/* Goals Progress */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg text-foreground mb-4">
              Evolução das Metas Terapêuticas
            </h3>

            <div className="space-y-4">
              {report.progressoPorMeta.map((metaData, index) => {
                const meta = metaData.meta
                const ultimoRegistro = metaData.ultimoRegistro
                const valorAtual = ultimoRegistro ? parseFloat(ultimoRegistro.valor) || 0 : 0
                const valorMeta = parseFloat(meta.meta_esperada) || 1
                const percentual = Math.min((valorAtual / valorMeta) * 100, 100)
                const isAtingido = percentual >= 100

                return (
                  <div key={meta.id} className="border border-border/60 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          {index + 1}. {meta.titulo}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Meta esperada: {meta.meta_esperada} {meta.unidade}
                        </p>
                      </div>
                      <div
                        className="px-3 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: isAtingido
                            ? `${brandSettings.primaryColor}20`
                            : '#ffc10720',
                          color: isAtingido ? brandSettings.primaryColor : '#d97706',
                        }}
                      >
                        {isAtingido ? 'Atingida' : 'Em progresso'}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-muted rounded-full h-2 mb-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentual}%`,
                          backgroundColor: isAtingido
                            ? brandSettings.primaryColor
                            : '#ffc107',
                        }}
                      />
                    </div>

                    <p className="text-xs text-foreground">
                      <span className="font-semibold">Resultado:</span>{' '}
                      {valorAtual} de {meta.meta_esperada} {meta.unidade} ({percentual.toFixed(0)}%)
                      {meta.descricao && ` - ${meta.descricao}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg text-foreground mb-3">
              Resumo e Recomendações
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-foreground leading-relaxed mb-3">
                O paciente demonstrou progresso durante este período de tratamento,
                atingindo {report.estatisticas.metasAtingidas} de {report.estatisticas.totalMetas} metas
                estabelecidas ({report.estatisticas.taxaSucesso.toFixed(0)}% de sucesso).
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {recommendations ||
                  'Recomenda-se a continuidade do tratamento com foco nas metas em andamento, mantendo os exercícios domiciliares e o acompanhamento regular.'}
              </p>
            </div>
          </div>

          {technicalOpinion && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg text-foreground mb-3">Parecer Técnico</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {technicalOpinion}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className="border-t-2 pt-6 mt-12"
            style={{ borderColor: brandSettings.primaryColor }}
          >
            <div className="flex items-end justify-end">
              <div className="text-right">
                <div className="border-t border-muted-foreground pt-2 px-12">
                  <p className="text-xs text-foreground">Assinatura do Terapeuta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branding Settings Modal */}
      <Modal
        isOpen={showBrandingModal}
        onClose={() => setShowBrandingModal(false)}
        title="Personalizar Identidade Visual"
        size="md"
      >
        <ModalBody>
          <div className="space-y-5">
            {/* Logo Upload */}
            <div>
              <Label className="mb-2">Logo da Clínica</Label>
              <div className="flex items-center gap-3">
                {brandSettings.logoUrl && (
                  <img
                    src={brandSettings.logoUrl}
                    alt="Logo Preview"
                    className="h-[60px] w-[160px] object-contain border border-border rounded-lg p-2"
                  />
                )}
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors">
                  <Upload size={16} className="text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {brandSettings.logoUrl ? 'Alterar Logo' : 'Upload Logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recomendado: PNG ou JPG, tamanho máximo 2MB
              </p>
            </div>

            {/* Clinic Name */}
            <div>
              <Label htmlFor="clinicName">Nome da Clínica</Label>
              <Input
                id="clinicName"
                value={brandSettings.clinicName}
                onChange={(e) =>
                  setBrandSettings({ ...brandSettings, clinicName: e.target.value })
                }
                placeholder="Digite o nome da clínica"
                className="mt-1"
              />
            </div>

            {/* Primary Color */}
            <div>
              <Label htmlFor="primaryColor">Cor Principal</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  id="primaryColor"
                  value={brandSettings.primaryColor}
                  onChange={(e) =>
                    setBrandSettings({ ...brandSettings, primaryColor: e.target.value })
                  }
                  className="h-10 w-20 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={brandSettings.primaryColor}
                  onChange={(e) =>
                    setBrandSettings({ ...brandSettings, primaryColor: e.target.value })
                  }
                  placeholder="#a78bfa"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={brandSettings.address}
                onChange={(e) =>
                  setBrandSettings({ ...brandSettings, address: e.target.value })
                }
                placeholder="Rua, número - Bairro"
                className="mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={brandSettings.phone}
                onChange={(e) =>
                  setBrandSettings({ ...brandSettings, phone: e.target.value })
                }
                placeholder="(11) 9999-9999"
                className="mt-1"
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={brandSettings.website}
                onChange={(e) =>
                  setBrandSettings({ ...brandSettings, website: e.target.value })
                }
                placeholder="www.suaclinica.com.br"
                className="mt-1"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setShowBrandingModal(false)}>
            Cancelar
          </Button>
          <Button onClick={saveBrandSettings}>Salvar Configurações</Button>
        </ModalFooter>
      </Modal>

      {/* Portal para impressão - renderiza diretamente no body */}
      {isPrinting &&
        createPortal(
          <div
            id="pdf-print-portal"
            className="fixed inset-0 z-[99999] bg-white overflow-auto print:relative print:overflow-visible"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="p-8 md:p-12 max-w-[800px] mx-auto">
              {/* PDF Header */}
              <div
                className="flex items-start justify-between mb-8 pb-6 border-b-2"
                style={{ borderColor: brandSettings.primaryColor }}
              >
                <div>
                  {brandSettings.logoUrl ? (
                    <img
                      src={brandSettings.logoUrl}
                      alt="Logo"
                      className="h-[60px] object-contain mb-3"
                    />
                  ) : (
                    <div className="h-[60px] w-[160px] bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xs text-gray-500">Logo da Clínica</span>
                    </div>
                  )}
                  <h2
                    className="font-semibold text-xl"
                    style={{ color: brandSettings.primaryColor }}
                  >
                    {brandSettings.clinicName}
                  </h2>
                  <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                    <p>{brandSettings.address}</p>
                    <p>{brandSettings.phone}</p>
                    <p>{brandSettings.website}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Data do Relatório</p>
                  <p className="font-semibold text-gray-900">{formatDate(new Date().toISOString())}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">
                  Informações do Paciente
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nome Completo</p>
                    <p className="text-sm text-gray-900">{patient?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Data de Nascimento</p>
                    <p className="text-sm text-gray-900">{formatDate(patient?.birthDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Período do Plano</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(plan.data_inicio)} a {formatDate(plan.data_fim || plan.data_fim_prevista)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Terapeuta Responsável</p>
                    <p className="text-sm text-gray-900">
                      {plan.profissional?.usuario?.nome_completo || 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goals Progress */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">
                  Evolução das Metas Terapêuticas
                </h3>

                <div className="space-y-4">
                  {report.progressoPorMeta.map((metaData, index) => {
                    const meta = metaData.meta
                    const ultimoRegistro = metaData.ultimoRegistro
                    const valorAtual = ultimoRegistro ? parseFloat(ultimoRegistro.valor) || 0 : 0
                    const valorMeta = parseFloat(meta.meta_esperada) || 1
                    const percentual = Math.min((valorAtual / valorMeta) * 100, 100)
                    const isAtingido = percentual >= 100

                    return (
                      <div key={meta.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">
                              {index + 1}. {meta.titulo}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Meta esperada: {meta.meta_esperada} {meta.unidade}
                            </p>
                          </div>
                          <div
                            className="px-3 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: isAtingido
                                ? `${brandSettings.primaryColor}20`
                                : '#ffc10720',
                              color: isAtingido ? brandSettings.primaryColor : '#d97706',
                            }}
                          >
                            {isAtingido ? 'Atingida' : 'Em progresso'}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentual}%`,
                              backgroundColor: isAtingido
                                ? brandSettings.primaryColor
                                : '#ffc107',
                            }}
                          />
                        </div>

                        <p className="text-xs text-gray-900">
                          <span className="font-semibold">Resultado:</span>{' '}
                          {valorAtual} de {meta.meta_esperada} {meta.unidade} ({percentual.toFixed(0)}%)
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  Resumo e Recomendações
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 leading-relaxed mb-3">
                    O paciente demonstrou progresso durante este período de tratamento,
                    atingindo {report.estatisticas.metasAtingidas} de {report.estatisticas.totalMetas} metas
                    estabelecidas ({report.estatisticas.taxaSucesso.toFixed(0)}% de sucesso).
                  </p>
                  <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {recommendations ||
                      'Recomenda-se a continuidade do tratamento com foco nas metas em andamento, mantendo os exercícios domiciliares e o acompanhamento regular.'}
                  </p>
                </div>
              </div>

              {technicalOpinion && (
                <div className="mb-8">
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">Parecer Técnico</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {technicalOpinion}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div
                className="border-t-2 pt-6 mt-12"
                style={{ borderColor: brandSettings.primaryColor }}
              >
                <div className="flex items-end justify-end">
                  <div className="text-right">
                    <div className="border-t border-gray-500 pt-2 px-12">
                      <p className="text-xs text-gray-900">Assinatura do Terapeuta</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
