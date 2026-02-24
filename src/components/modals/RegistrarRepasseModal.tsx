import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface RegistrarRepasseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (file: File | null) => void
}

export function RegistrarRepasseModal({ isOpen, onClose, onSubmit }: RegistrarRepasseModalProps) {
  const isMobile = useIsMobile()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSubmit = () => {
    onSubmit(selectedFile)
    onClose()
    setSelectedFile(null)
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
  }

  const content = (
    <div>
      <label className="block text-sm font-medium text-foreground mb-4">
        Anexar nota fiscal
      </label>
      <FileUpload
        onFileSelect={handleFileSelect}
        accept=".pdf,.png"
        maxSize={5 * 1024 * 1024}
        label="Clique ou arraste para fazer upload"
        description="Formatos permitidos: PDF, PNG Max 5MB"
      />
    </div>
  )

  // Footer mobile: stack vertical (primario embaixo)
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleSubmit}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
      >
        Salvar
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full rounded-full"
      >
        Cancelar
      </Button>
    </div>
  )

  // Mobile: usar BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Registrar pagamento de repasse"
        snapPoints={[0.55, 0.7]}
        dismissible
      >
        <div className="px-2">
          {content}
        </div>
        <BottomSheetFooter>
          {mobileActions}
        </BottomSheetFooter>
      </BottomSheet>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar pagamento de repasse" size="md">
      <ModalBody className="space-y-6">
        {content}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="rounded-full px-8">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          Salvar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
