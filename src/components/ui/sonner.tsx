import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success:
            '!bg-green-50 !text-green-800 !border-green-300 [&>svg]:!text-green-600',
          error:
            '!bg-red-50 !text-red-800 !border-red-300 [&>svg]:!text-red-600',
          warning:
            '!bg-yellow-50 !text-yellow-800 !border-yellow-300 [&>svg]:!text-yellow-600',
          info:
            '!bg-blue-50 !text-blue-800 !border-blue-300 [&>svg]:!text-blue-600',
        },
      }}
      {...props}
    />
  )
}
