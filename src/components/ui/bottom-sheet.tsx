import * as React from 'react'
import { Drawer } from 'vaul'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  snapPoints?: (number | string)[]
  activeSnapPoint?: number | string | null
  setActiveSnapPoint?: (snapPoint: number | string | null) => void
  modal?: boolean
  dismissible?: boolean
  shouldScaleBackground?: boolean
  className?: string
  /** Ocultar o handle de arrastar (default: true) */
  showHandle?: boolean
  /** Ocupar 100% da altura disponivel (default: false) */
  fullHeight?: boolean
}

const BottomSheet = React.forwardRef<HTMLDivElement, BottomSheetProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      snapPoints,
      activeSnapPoint,
      setActiveSnapPoint,
      modal = true,
      dismissible = true,
      shouldScaleBackground = true,
      className,
      showHandle = true,
      fullHeight = false,
    },
    ref
  ) => {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
        modal={modal}
        dismissible={dismissible}
        shouldScaleBackground={shouldScaleBackground}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Drawer.Content
            ref={ref}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 mt-24 flex flex-col rounded-t-[10px] border bg-background relative',
              fullHeight ? 'h-[100dvh]' : 'h-auto',
              className
            )}
          >
            {/* Handle para arrastar */}
            {showHandle && (
              <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
            )}

            {/* Title e Description para acessibilidade (sempre presente) */}
            {title ? (
              <Drawer.Title className="px-4 pt-4 text-lg font-semibold leading-none tracking-tight">
                {title}
              </Drawer.Title>
            ) : (
              <VisuallyHidden.Root asChild>
                <Drawer.Title>Conteúdo</Drawer.Title>
              </VisuallyHidden.Root>
            )}

            {description ? (
              <Drawer.Description className="px-4 pt-2 text-sm text-muted-foreground">
                {description}
              </Drawer.Description>
            ) : (
              <VisuallyHidden.Root asChild>
                <Drawer.Description>Conteúdo do painel</Drawer.Description>
              </VisuallyHidden.Root>
            )}

            {/* Header com botão fechar */}
            {(title || description) && dismissible && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Fechar</span>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }
)
BottomSheet.displayName = 'BottomSheet'

// Componentes auxiliares para composição
const BottomSheetTrigger = Drawer.Trigger
const BottomSheetClose = Drawer.Close
const BottomSheetPortal = Drawer.Portal
const BottomSheetOverlay = Drawer.Overlay

// Versão com trigger embutido
interface BottomSheetWithTriggerProps extends Omit<BottomSheetProps, 'open' | 'onOpenChange'> {
  trigger: React.ReactNode
  defaultOpen?: boolean
}

const BottomSheetWithTrigger: React.FC<BottomSheetWithTriggerProps> = ({
  trigger,
  defaultOpen = false,
  children,
  ...props
}) => {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <BottomSheet open={open} onOpenChange={setOpen} {...props}>
        {children}
      </BottomSheet>
    </>
  )
}

// Footer fixo para bottom sheet (útil para botões de ação)
interface BottomSheetFooterProps {
  children: React.ReactNode
  className?: string
}

const BottomSheetFooter: React.FC<BottomSheetFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'sticky bottom-0 mt-auto border-t bg-background px-4 py-4',
        className
      )}
    >
      {children}
    </div>
  )
}

// Seção para agrupar conteúdo
interface BottomSheetSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

const BottomSheetSection: React.FC<BottomSheetSectionProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <div className={cn('py-2', className)}>
      {title && (
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          {title}
        </h4>
      )}
      {children}
    </div>
  )
}

export {
  BottomSheet,
  BottomSheetWithTrigger,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetFooter,
  BottomSheetSection,
}
