/**
 * SignaturePadComponent — Canvas de assinatura digital
 * Usa a lib `signature_pad` para captura de assinatura em tela touch/mouse
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import SignaturePadLib from 'signature_pad'
import { Button } from '@/components/ui/button'
import { Undo2, Trash2, Check } from 'lucide-react'

interface SignaturePadProps {
  onSign: (file: File) => void
  onCancel: () => void
}

export function SignaturePad({ onSign, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Initialize signature pad
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d')?.scale(ratio, ratio)

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3,
    })

    pad.addEventListener('endStroke', () => {
      setIsEmpty(pad.isEmpty())
    })

    padRef.current = pad

    return () => {
      pad.off()
    }
  }, [])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !padRef.current) return
      const canvas = canvasRef.current
      const data = padRef.current.toData()
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      padRef.current.clear()
      padRef.current.fromData(data)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleClear = useCallback(() => {
    padRef.current?.clear()
    setIsEmpty(true)
  }, [])

  const handleUndo = useCallback(() => {
    if (!padRef.current) return
    const data = padRef.current.toData()
    if (data.length > 0) {
      data.pop()
      padRef.current.fromData(data)
      setIsEmpty(padRef.current.isEmpty())
    }
  }, [])

  const handleConfirm = useCallback(() => {
    if (!canvasRef.current || !padRef.current || padRef.current.isEmpty()) return

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `checkin_assinatura_${Date.now()}.png`, { type: 'image/png' })
          onSign(file)
        }
      },
      'image/png'
    )
  }, [onSign])

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Label */}
      <p className="text-sm text-muted-foreground">
        Assine no quadro abaixo com o dedo ou mouse:
      </p>

      {/* Canvas */}
      <div className="w-full max-w-sm border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          style={{ height: '200px' }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="outline" size="sm" onClick={handleUndo} disabled={isEmpty} className="gap-1.5">
          <Undo2 className="w-4 h-4" />
          Desfazer
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear} disabled={isEmpty} className="gap-1.5">
          <Trash2 className="w-4 h-4" />
          Limpar
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={isEmpty} className="gap-1.5">
          <Check className="w-4 h-4" />
          Confirmar
        </Button>
      </div>
    </div>
  )
}
