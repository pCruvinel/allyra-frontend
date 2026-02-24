/**
 * ReportPreviewPage - Página de preview do relatório
 * Exibe visualização prévia antes de exportar PDF/Excel
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Printer,
  Settings,
  Upload,
  Loader2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { relatorioService } from '@/services/relatorio.service'
import { REPORT_TYPES } from '@/types/relatorio'
import type { TipoRelatorio } from '@/types/relatorio'

interface BrandSettings {
  logoUrl: string
  clinicName: string
  primaryColor: string
  address: string
  phone: string
  website: string
}

interface PreviewData {
  dados: Record<string, unknown>[]
  totais?: Record<string, number>
  colunas: { key: string; label: string }[]
  geradoEm: string
}

const STORAGE_KEY = 'allyra_brand_settings'

export function ReportPreviewPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/relatorios/preview' }) as {
    tipo?: TipoRelatorio
    dateFrom?: string
    dateTo?: string
    profissionalId?: string
    status?: string
  }
  const { currentClinica } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showBrandingModal, setShowBrandingModal] = useState(false)
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    logoUrl: '',
    clinicName: 'Clínica',
    primaryColor: '#a78bfa',
    address: '',
    phone: '',
    website: '',
  })

  const tipo = search.tipo
  const dateFrom = search.dateFrom || ''
  const dateTo = search.dateTo || ''
  const config = REPORT_TYPES.find((r) => r.tipo === tipo)

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

  // Fetch preview data
  useEffect(() => {
    async function fetchPreview() {
      if (!tipo || !dateFrom || !dateTo || !currentClinica?.id) {
        setError('Parâmetros inválidos')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await relatorioService.getPreviewData(
          {
            tipo,
            formato: 'pdf',
            filtros: {
              dateFrom,
              dateTo,
              profissionalId: search.profissionalId,
              status: search.status,
            },
          },
          currentClinica.id
        )

        const colunas = response.colunas && response.colunas.length > 0
          ? response.colunas
          : [{ key: 'mensagem', label: 'Mensagem' }]

        setPreviewData({
          dados: response.dados,
          totais: response.totais,
          colunas,
          geradoEm: response.geradoEm,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar preview')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [tipo, dateFrom, dateTo, search.profissionalId, search.status, currentClinica?.id])

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

  const handlePrint = () => {
    window.print()
  }

  const handleExportPdf = useCallback(async () => {
    if (!tipo || !currentClinica?.id) return

    setIsExporting(true)
    try {
      const blob = await relatorioService.downloadRelatorio(
        {
          tipo,
          formato: 'pdf',
          filtros: {
            dateFrom,
            dateTo,
            profissionalId: search.profissionalId,
            status: search.status,
          },
        },
        currentClinica.id
      )

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `relatorio-${tipo}-${timestamp}.pdf`
      relatorioService.downloadBlob(blob, filename)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
    } finally {
      setIsExporting(false)
    }
  }, [tipo, dateFrom, dateTo, search.profissionalId, search.status, currentClinica?.id])

  const handleExportExcel = useCallback(async () => {
    if (!tipo || !currentClinica?.id) return

    setIsExporting(true)
    try {
      const blob = await relatorioService.downloadRelatorio(
        {
          tipo,
          formato: 'excel',
          filtros: {
            dateFrom,
            dateTo,
            profissionalId: search.profissionalId,
            status: search.status,
          },
        },
        currentClinica.id
      )

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `relatorio-${tipo}-${timestamp}.xlsx`
      relatorioService.downloadBlob(blob, filename)
    } catch (err) {
      console.error('Erro ao exportar Excel:', err)
    } finally {
      setIsExporting(false)
    }
  }, [tipo, dateFrom, dateTo, search.profissionalId, search.status, currentClinica?.id])

  const formatDate = (date: string) => {
    if (!date) return '-'
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return String(value)
  }

  const handleGoBack = () => {
    navigate({ to: '/relatorios' })
  }

  if (!tipo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">Parâmetros inválidos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tipo de relatório não especificado
          </p>
          <Button onClick={handleGoBack} className="mt-4">
            Voltar para Relatórios
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Preview do Relatório</h1>
            <p className="text-sm text-muted-foreground">
              {config?.titulo} - {formatDate(dateFrom)} a {formatDate(dateTo)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBrandingModal(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Marca
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Preview Area */}
        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 min-h-[500px]">
          <div
            id="report-preview-content"
            className="bg-white text-black mx-auto max-w-4xl p-8 rounded-lg shadow-lg print:shadow-none print:max-w-none print:p-0"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            {/* Report Header */}
            <div className="border-b-2 pb-4 mb-6" style={{ borderColor: brandSettings.primaryColor }}>
              <div className="flex items-start justify-between">
                <div>
                  {brandSettings.logoUrl ? (
                    <img src={brandSettings.logoUrl} alt="Logo" className="h-16 mb-2" />
                  ) : (
                    <div
                      className="h-16 w-32 flex items-center justify-center rounded text-white font-bold text-xl"
                      style={{ backgroundColor: brandSettings.primaryColor }}
                    >
                      {brandSettings.clinicName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <h1 className="text-2xl font-bold mt-2">{brandSettings.clinicName}</h1>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {brandSettings.address && <p>{brandSettings.address}</p>}
                  {brandSettings.phone && <p>{brandSettings.phone}</p>}
                  {brandSettings.website && <p>{brandSettings.website}</p>}
                </div>
              </div>
            </div>

            {/* Report Title */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{config?.titulo || 'Relatório'}</h2>
              <p className="text-gray-600">
                Período: {formatDate(dateFrom)} a {formatDate(dateTo)}
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-red-600">Erro ao carregar dados</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            )}

            {/* Data Table */}
            {!isLoading && !error && previewData && previewData.dados.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: brandSettings.primaryColor }}>
                      {previewData.colunas.map((col) => (
                        <th
                          key={col.key}
                          className="px-3 py-2 text-left text-white text-sm font-semibold border border-gray-300"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.dados.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {previewData.colunas.map((col) => (
                          <td key={col.key} className="px-3 py-2 text-sm border border-gray-200">
                            {formatValue(row[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  {previewData.totais && Object.keys(previewData.totais).length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        {previewData.colunas.map((col, index) => (
                          <td key={col.key} className="px-3 py-2 text-sm border border-gray-300">
                            {index === 0
                              ? 'TOTAL'
                              : previewData.totais?.[col.key] !== undefined
                                ? formatValue(previewData.totais[col.key])
                                : ''}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && previewData && previewData.dados.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sem dados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Nenhum registro encontrado para o período selecionado.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
              Gerado em:{' '}
              {previewData?.geradoEm
                ? new Date(previewData.geradoEm).toLocaleString('pt-BR')
                : new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30 print:hidden">
          <div className="text-sm text-muted-foreground">
            {previewData && `${previewData.dados.length} registro(s) encontrado(s)`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} disabled={isLoading || !previewData}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isLoading || isExporting || !previewData}
              className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Excel
            </Button>
            <Button onClick={handleExportPdf} disabled={isLoading || isExporting || !previewData}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Branding Settings Modal */}
      <Modal
        isOpen={showBrandingModal}
        onClose={() => setShowBrandingModal(false)}
        title="Configurações de Marca"
      >
        <ModalBody className="space-y-4">
          <div className="space-y-2">
            <Label>Logo da Clínica</Label>
            <div className="flex items-center gap-4">
              {brandSettings.logoUrl ? (
                <img src={brandSettings.logoUrl} alt="Logo" className="h-16 rounded" />
              ) : (
                <div className="h-16 w-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                  Sem logo
                </div>
              )}
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </span>
                </Button>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicName">Nome da Clínica</Label>
            <Input
              id="clinicName"
              value={brandSettings.clinicName}
              onChange={(e) => setBrandSettings({ ...brandSettings, clinicName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Cor Principal</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primaryColor"
                value={brandSettings.primaryColor}
                onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                className="h-10 w-20 rounded border"
              />
              <Input
                value={brandSettings.primaryColor}
                onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                className="w-32"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={brandSettings.address}
              onChange={(e) => setBrandSettings({ ...brandSettings, address: e.target.value })}
              placeholder="Rua Exemplo, 123 - Bairro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={brandSettings.phone}
              onChange={(e) => setBrandSettings({ ...brandSettings, phone: e.target.value })}
              placeholder="(11) 9999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={brandSettings.website}
              onChange={(e) => setBrandSettings({ ...brandSettings, website: e.target.value })}
              placeholder="www.clinica.com.br"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowBrandingModal(false)}>
            Cancelar
          </Button>
          <Button onClick={saveBrandSettings}>Salvar</Button>
        </ModalFooter>
      </Modal>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-preview-content,
          #report-preview-content * {
            visibility: visible;
          }
          #report-preview-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  )
}

export default ReportPreviewPage
