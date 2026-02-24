/**
 * SlideFormModal - Modal para criar/editar slides do login
 *
 * Features:
 * - Formulário completo com todos os campos do slide
 * - Preview do slide em tempo real
 * - Validação com Zod
 * - Suporte a dark mode
 * - Responsivo (BottomSheet em mobile)
 */

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Image, Link, Type, AlignLeft, Calendar, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { FormField } from '@/components/ui/form-field'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { LoginSlide, CreateSlideData, UpdateSlideData } from '@/services/login-slides.service'

// Schema de validação
const slideSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(200, 'Máximo 200 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  imagem_url: z.string().url('URL inválida').optional().or(z.literal('')),
  botao_texto: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  botao_link: z.string().url('URL inválida').optional().or(z.literal('')),
  tipo: z.enum(['promocao', 'noticia', 'feature', 'aviso', 'custom']),
  ativo: z.boolean(),
  data_inicio: z.string().optional().or(z.literal('')),
  data_fim: z.string().optional().or(z.literal('')),
})

type SlideFormData = z.infer<typeof slideSchema>

interface SlideFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSlideData | UpdateSlideData) => Promise<void>
  slide?: LoginSlide | null
  clinicaId?: string | null
  isLoading?: boolean
}

const tipoOptions = [
  { value: 'promocao', label: 'Promoção' },
  { value: 'noticia', label: 'Notícia' },
  { value: 'feature', label: 'Feature' },
  { value: 'aviso', label: 'Aviso' },
  { value: 'custom', label: 'Personalizado' },
]

export function SlideFormModal({
  isOpen,
  onClose,
  onSubmit,
  slide,
  clinicaId,
  isLoading = false,
}: SlideFormModalProps) {
  const isMobile = useIsMobile()
  const isEditing = !!slide

  const form = useForm<SlideFormData>({
    resolver: zodResolver(slideSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      imagem_url: '',
      botao_texto: '',
      botao_link: '',
      tipo: 'feature',
      ativo: true,
      data_inicio: '',
      data_fim: '',
    },
  })

  // Preencher formulário ao editar
  useEffect(() => {
    if (slide) {
      form.reset({
        titulo: slide.titulo,
        descricao: slide.descricao || '',
        imagem_url: slide.imagem_url || '',
        botao_texto: slide.botao_texto || '',
        botao_link: slide.botao_link || '',
        tipo: slide.tipo as SlideFormData['tipo'],
        ativo: slide.ativo,
        data_inicio: slide.data_inicio ? slide.data_inicio.split('T')[0] : '',
        data_fim: slide.data_fim ? slide.data_fim.split('T')[0] : '',
      })
    } else {
      form.reset({
        titulo: '',
        descricao: '',
        imagem_url: '',
        botao_texto: '',
        botao_link: '',
        tipo: 'feature',
        ativo: true,
        data_inicio: '',
        data_fim: '',
      })
    }
  }, [slide, form])

  const handleSubmit = async (data: SlideFormData) => {
    const submitData: CreateSlideData | UpdateSlideData = {
      titulo: data.titulo,
      descricao: data.descricao || undefined,
      imagem_url: data.imagem_url || undefined,
      botao_texto: data.botao_texto || undefined,
      botao_link: data.botao_link || undefined,
      tipo: data.tipo,
      ativo: data.ativo,
      data_inicio: data.data_inicio || undefined,
      data_fim: data.data_fim || undefined,
    }

    // Adicionar clinica_id apenas ao criar
    if (!isEditing) {
      ;(submitData as CreateSlideData).clinica_id = clinicaId || undefined
    }

    await onSubmit(submitData)
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Preview do slide
  const watchedValues = form.watch()
  const PreviewSection = () => (
    <div className="rounded-xl bg-primary p-6 mb-6">
      <p className="text-xs text-white/60 mb-3 uppercase tracking-wider">Preview</p>
      <div className="text-white text-center">
        {watchedValues.imagem_url && (
          <img
            src={watchedValues.imagem_url}
            alt="Preview"
            className="max-h-32 mx-auto rounded-lg mb-3 object-contain"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
        <h3 className="text-lg font-bold mb-1">
          {watchedValues.titulo || 'Título do slide'}
        </h3>
        {watchedValues.descricao && (
          <p className="text-sm text-white/70 mb-2">{watchedValues.descricao}</p>
        )}
        {watchedValues.botao_texto && (
          <button className="mt-2 px-4 py-1.5 text-xs border border-white/30 rounded-full hover:bg-white/10 transition-colors">
            {watchedValues.botao_texto}
          </button>
        )}
      </div>
    </div>
  )

  const formContent = (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Preview */}
      <PreviewSection />

      {/* Título */}
      <FormField label="Título" required error={form.formState.errors.titulo?.message}>
        <div className="relative">
          <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            {...form.register('titulo')}
            placeholder="Ex: Transforme dados em insights"
            className="pl-10"
          />
        </div>
      </FormField>

      {/* Descrição */}
      <FormField label="Descrição" error={form.formState.errors.descricao?.message}>
        <div className="relative">
          <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <textarea
            {...form.register('descricao')}
            placeholder="Descrição complementar do slide..."
            rows={3}
            className={cn(
              'w-full pl-10 pr-3 py-2 text-sm bg-background border border-border rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'resize-none'
            )}
          />
        </div>
      </FormField>

      {/* URL da Imagem */}
      <FormField label="URL da Imagem" error={form.formState.errors.imagem_url?.message}>
        <div className="relative">
          <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            {...form.register('imagem_url')}
            placeholder="https://exemplo.com/imagem.png"
            className="pl-10"
          />
        </div>
      </FormField>

      {/* Botão (Texto + Link) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Texto do Botão" error={form.formState.errors.botao_texto?.message}>
          <Input
            {...form.register('botao_texto')}
            placeholder="Ex: Saiba mais"
          />
        </FormField>

        <FormField label="Link do Botão" error={form.formState.errors.botao_link?.message}>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              {...form.register('botao_link')}
              placeholder="https://..."
              className="pl-10"
            />
          </div>
        </FormField>
      </div>

      {/* Tipo e Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Tipo" error={form.formState.errors.tipo?.message}>
          <Controller
            name="tipo"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                options={tipoOptions}
              />
            )}
          />
        </FormField>

        <FormField label="Status">
          <div className="flex items-center gap-3 h-10">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...form.register('ativo')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {watchedValues.ativo ? (
                <>
                  <Eye className="w-4 h-4" /> Ativo
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" /> Inativo
                </>
              )}
            </span>
          </div>
        </FormField>
      </div>

      {/* Agendamento (Datas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Início da Exibição" error={form.formState.errors.data_inicio?.message}>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              {...form.register('data_inicio')}
              className="pl-10"
            />
          </div>
        </FormField>

        <FormField label="Fim da Exibição" error={form.formState.errors.data_fim?.message}>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              {...form.register('data_fim')}
              className="pl-10"
            />
          </div>
        </FormField>
      </div>

      {/* Info sobre escopo */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        {clinicaId ? (
          <p>Este slide será visível apenas para usuários desta clínica.</p>
        ) : (
          <p>Este slide será visível <strong>globalmente</strong> em todas as clínicas.</p>
        )}
      </div>
    </form>
  )

  const footerActions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isLoading}
        className="rounded-full px-6"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        onClick={form.handleSubmit(handleSubmit)}
        className="rounded-full px-6"
      >
        {isLoading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar slide'}
      </Button>
    </>
  )

  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title={isEditing ? 'Editar Slide' : 'Novo Slide'}
      >
        <AppDrawerBody>{formContent}</AppDrawerBody>
        <AppDrawerFooter>
          <div className="flex flex-col gap-3 w-full">
            <Button
              type="submit"
              disabled={isLoading}
              onClick={form.handleSubmit(handleSubmit)}
              className="w-full rounded-full"
            >
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar slide'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full rounded-full"
            >
              Cancelar
            </Button>
          </div>
        </AppDrawerFooter>
      </AppDrawer>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Slide' : 'Novo Slide'}
      size="lg"
    >
      <ModalBody>{formContent}</ModalBody>
      <ModalFooter>{footerActions}</ModalFooter>
    </Modal>
  )
}
