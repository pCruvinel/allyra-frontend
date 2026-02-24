import { useState, useCallback } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSize?: number // em bytes
  className?: string
  label?: string
  description?: string
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.png',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  label = 'Clique ou arraste para fazer upload',
  description = 'Formatos permitidos: PDF, PNG Máx 5MB',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback(
    (file: File): boolean => {
      // Verificar tamanho
      if (file.size > maxSize) {
        setError(`Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
        return false
      }

      // Verificar tipo
      const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

      if (!acceptedTypes.some((type) => fileExtension === type || file.type.includes(type.replace('.', '')))) {
        setError('Tipo de arquivo não permitido')
        return false
      }

      setError(null)
      return true
    },
    [accept, maxSize]
  )

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    },
    [validateFile, onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    onFileSelect(null)
  }, [onFileSelect])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {selectedFile ? (
        // Arquivo selecionado
        <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        // Área de drop
        <label
          className={cn(
            'flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary hover:bg-muted/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload
              className={cn(
                'w-8 h-8 mb-3',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <p className="mb-2 text-sm text-foreground">
              <span className="font-medium text-primary">{label}</span>
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleInputChange}
          />
        </label>
      )}

      {/* Mensagem de erro */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
