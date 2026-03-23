/**
 * CameraCapture — Componente de captura de foto via câmera do dispositivo
 * Usa getUserMedia para preview ao vivo. Fallback para input file se câmera indisponível.
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RotateCcw, Check, Upload } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [hasCamera, setHasCamera] = useState(true)
  const [captured, setCaptured] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(true)

  // Start camera
  const startCamera = useCallback(async () => {
    setIsStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setHasCamera(true)
    } catch {
      setHasCamera(false)
    } finally {
      setIsStarting(false)
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // Capture from video
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/webp', 0.8)
    setCaptured(dataUrl)
    stopCamera()
  }, [stopCamera])

  // Retake
  const handleRetake = useCallback(() => {
    setCaptured(null)
    startCamera()
  }, [startCamera])

  // Confirm
  const handleConfirm = useCallback(() => {
    if (!canvasRef.current) return

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `checkin_foto_${Date.now()}.webp`, { type: 'image/webp' })
          onCapture(file)
        }
      },
      'image/webp',
      0.8
    )
  }, [onCapture])

  // Fallback: file input
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
    }
  }, [onCapture])

  // No camera fallback
  if (!hasCamera && !isStarting) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Camera className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Câmera não disponível neste dispositivo.
          <br />
          Selecione uma foto do dispositivo:
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
            <Upload className="w-4 h-4" />
            Selecionar Foto
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Video/Preview */}
      <div className="relative w-full max-w-sm aspect-[4/3] bg-black rounded-lg overflow-hidden">
        {captured ? (
          <img src={captured} alt="Foto capturada" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Actions */}
      <div className="flex gap-2">
        {captured ? (
          <>
            <Button variant="outline" size="sm" onClick={handleRetake} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              Tirar Outra
            </Button>
            <Button size="sm" onClick={handleConfirm} className="gap-1.5">
              <Check className="w-4 h-4" />
              Usar Esta Foto
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCapture} disabled={isStarting} className="gap-1.5">
              <Camera className="w-4 h-4" />
              Capturar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
