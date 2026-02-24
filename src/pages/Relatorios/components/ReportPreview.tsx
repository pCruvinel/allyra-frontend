/**
 * ReportPreview - Preview visual do relatório antes de gerar PDF/Excel
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, Settings, Upload, X, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { REPORT_TYPES } from '@/types/relatorio'
import type { TipoRelatorio } from '@/types/relatorio'
import type { PreviewData } from '@/hooks/useRelatorios'

interface BrandSettings {
  logoUrl: string
  clinicName: string
  primaryColor: string
  address: string
  phone: string
  website: string
}

interface ReportPreviewProps {
  tipo: TipoRelatorio
  data: PreviewData | null
  isLoading: boolean
  dateFrom: string
  dateTo: string
  onClose: () => void
  onExportPdf: () => void
  onExportExcel: () => void
  isExporting: boolean
}

const STORAGE_KEY = 'allyra_brand_settings'

export function ReportPreview({
  tipo,
  data,
  isLoading,
  dateFrom,
  dateTo,
  onClose,
  onExportPdf,
  onExportExcel,
  isExporting,
}: ReportPreviewProps) {
  const [showBrandingModal, setShowBrandingModal] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    logoUrl: '',
    clinicName: 'Clínica',
    primaryColor: '#a78bfa',
    address: '',
    phone: '',
    website: '',
  })

  // Busca configuração do tipo de relatório
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
    document.body.classList.add('printing-report')
    setIsPrinting(true)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print()
        document.body.classList.remove('printing-report')
        setIsPrinting(false)
      })
    })
  }

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

  // Preview content
  const previewContent = (
    <div
      id="report-preview-content"
      className="bg-white text-black min-h-[600px]"
      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* Header */}
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

      {/* Data Table */}
      {!isLoading && data && data.dados.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: brandSettings.primaryColor }}>
                {data.colunas.map((col) => (
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
              {data.dados.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  {data.colunas.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-sm border border-gray-200">
                      {formatValue(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {/* Totals Row */}
            {data.totais && Object.keys(data.totais).length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  {data.colunas.map((col, index) => (
                    <td key={col.key} className="px-3 py-2 text-sm border border-gray-300">
                      {index === 0 ? 'TOTAL' : data.totais?.[col.key] !== undefined ? formatValue(data.totais[col.key]) : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data && data.dados.length === 0 && (
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
        Gerado em: {data?.geradoEm ? new Date(data.geradoEm).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  )

  // Print portal (rendered when printing)
  const printPortal = isPrinting
    ? createPortal(
        <div className="print-only fixed inset-0 bg-white z-[9999] p-8">{previewContent}</div>,
        document.body
      )
    : null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Preview do Relatório</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBrandingModal(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Marca
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg p-8 mx-auto max-w-4xl">
              {previewContent}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/30">
            <div className="text-sm text-muted-foreground">
              {data && `${data.dados.length} registro(s) encontrado(s)`}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint} disabled={isLoading || !data}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                onClick={onExportExcel}
                disabled={isLoading || isExporting || !data}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                onClick={onExportPdf}
                disabled={isLoading || isExporting || !data}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Gerando...' : 'Exportar PDF'}
              </Button>
            </div>
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

      {printPortal}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only,
          .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}
