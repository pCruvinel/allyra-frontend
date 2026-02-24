/**
 * Botões de exportação de relatórios
 */

import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportExportButtonsProps {
  onExportPdf: () => void
  onExportExcel: () => void
  isGenerating: boolean
  disabled?: boolean
}

export function ReportExportButtons({
  onExportPdf,
  onExportExcel,
  isGenerating,
  disabled,
}: ReportExportButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
        onClick={onExportExcel}
        disabled={isGenerating || disabled}
      >
        {isGenerating ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet size={16} className="mr-2" />
        )}
        Gerar Excel
      </Button>
      <Button
        type="button"
        className="flex-1"
        onClick={onExportPdf}
        disabled={isGenerating || disabled}
      >
        {isGenerating ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : (
          <FileText size={16} className="mr-2" />
        )}
        Gerar PDF
      </Button>
    </div>
  )
}
