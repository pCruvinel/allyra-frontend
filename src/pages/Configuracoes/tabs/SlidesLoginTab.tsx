/**
 * SlidesLoginTab - Aba de gerenciamento de slides do login
 *
 * Permite criar, editar, excluir e reordenar slides exibidos na tela de login.
 *
 * Permissões:
 * - admin_master/desenvolvedor: gerencia slides globais e de todas as clínicas
 * - administrador_total: gerencia apenas slides da própria clínica
 */

import { useState } from 'react'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Globe,
  Building2,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { SlideFormModal } from '@/components/modals/SlideFormModal'
import { useLoginSlidesAdmin } from '@/hooks/useLoginSlidesAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import type { LoginSlide, CreateSlideData, UpdateSlideData } from '@/services/login-slides.service'

// Tabs de escopo
type ScopeTab = 'global' | 'clinica'

const tipoLabels: Record<string, { label: string; color: string }> = {
  promocao: { label: 'Promoção', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  noticia: { label: 'Notícia', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  feature: { label: 'Feature', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  aviso: { label: 'Aviso', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  custom: { label: 'Personalizado', color: 'bg-muted text-muted-foreground' },
}

export function SlidesLoginTab() {
  const { user, currentClinica } = useAuth()
  const isGlobalAdmin = user?.perfil_tipo === 'admin_master' || user?.perfil_tipo === 'desenvolvedor'

  // Tabs: admin global vê ambas, outros veem só clínica
  const [scopeTab, setScopeTab] = useState<ScopeTab>(isGlobalAdmin ? 'global' : 'clinica')

  // Hook com clinicaId baseado na tab selecionada
  const clinicaId = scopeTab === 'global' ? null : currentClinica?.id || null

  const {
    slides,
    isLoading,
    createSlide,
    updateSlide,
    deleteSlide,
    toggleSlideActive,
    moveSlideUp,
    moveSlideDown,
    isCreating,
    isUpdating,
    isDeleting,
  } = useLoginSlidesAdmin({ clinicaId })

  // Estado dos modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<LoginSlide | null>(null)
  const [deletingSlide, setDeletingSlide] = useState<LoginSlide | null>(null)

  // Handlers
  const handleCreateSlide = () => {
    setEditingSlide(null)
    setIsFormModalOpen(true)
  }

  const handleEditSlide = (slide: LoginSlide) => {
    setEditingSlide(slide)
    setIsFormModalOpen(true)
  }

  const handleDeleteSlide = (slide: LoginSlide) => {
    setDeletingSlide(slide)
  }

  const handleFormSubmit = async (data: CreateSlideData | UpdateSlideData) => {
    if (editingSlide) {
      await updateSlide(editingSlide.id, data as UpdateSlideData)
    } else {
      await createSlide(data as CreateSlideData)
    }
    setIsFormModalOpen(false)
    setEditingSlide(null)
  }

  const handleConfirmDelete = async () => {
    if (deletingSlide) {
      await deleteSlide(deletingSlide.id)
      setDeletingSlide(null)
    }
  }

  // Filtrar slides pelo escopo
  const filteredSlides = slides.filter((slide) => {
    if (scopeTab === 'global') {
      return slide.clinica_id === null
    }
    return slide.clinica_id === clinicaId
  })

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Slides da Tela de Login</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os slides exibidos na página de login
          </p>
        </div>
        <Button onClick={handleCreateSlide} className="rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Novo Slide
        </Button>
      </div>

      {/* Tabs de escopo (só para admin global) */}
      {isGlobalAdmin && (
        <div className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setScopeTab('global')}
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2',
              scopeTab === 'global'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Globe className="w-4 h-4" />
            Slides Globais
          </button>
          <button
            type="button"
            onClick={() => setScopeTab('clinica')}
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2',
              scopeTab === 'clinica'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Building2 className="w-4 h-4" />
            Slides da Clínica
          </button>
        </div>
      )}

      {/* Info do escopo */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-6">
        {scopeTab === 'global' ? (
          <p>
            <Globe className="w-3 h-3 inline mr-1" />
            Slides globais são exibidos para <strong>todas</strong> as clínicas na tela de login.
          </p>
        ) : (
          <p>
            <Building2 className="w-3 h-3 inline mr-1" />
            Slides da clínica são exibidos apenas para usuários desta clínica específica.
          </p>
        )}
      </div>

      {/* Lista de slides */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredSlides.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {scopeTab === 'global'
              ? 'Nenhum slide global cadastrado'
              : 'Nenhum slide da clínica cadastrado'}
          </p>
          <Button
            variant="outline"
            onClick={handleCreateSlide}
            className="mt-4 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar primeiro slide
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSlides.map((slide, index) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              index={index}
              isFirst={index === 0}
              isLast={index === filteredSlides.length - 1}
              onEdit={() => handleEditSlide(slide)}
              onDelete={() => handleDeleteSlide(slide)}
              onToggleActive={() => toggleSlideActive(slide.id, !slide.ativo)}
              onMoveUp={() => moveSlideUp(slide.id)}
              onMoveDown={() => moveSlideDown(slide.id)}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}

      {/* Modal de criação/edição */}
      <SlideFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingSlide(null)
        }}
        onSubmit={handleFormSubmit}
        slide={editingSlide}
        clinicaId={scopeTab === 'global' ? null : clinicaId}
        isLoading={isCreating || isUpdating}
      />

      {/* Modal de confirmação de exclusão */}
      <ConfirmationModal
        isOpen={!!deletingSlide}
        onClose={() => setDeletingSlide(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Slide"
        heading="Tem certeza?"
        description={
          <>
            O slide <strong>"{deletingSlide?.titulo}"</strong> será excluído permanentemente.
            Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

// Componente de card individual do slide
interface SlideCardProps {
  slide: LoginSlide
  index: number
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isUpdating: boolean
}

function SlideCard({
  slide,
  index,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isUpdating,
}: SlideCardProps) {
  const tipoConfig = tipoLabels[slide.tipo] || tipoLabels.custom

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-colors',
        slide.ativo
          ? 'bg-background border-border'
          : 'bg-muted/50 border-border/50 opacity-60'
      )}
    >
      {/* Grip para drag (visual) */}
      <div className="text-muted-foreground cursor-grab">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Preview da imagem */}
      <div className="w-16 h-16 rounded-lg bg-primary flex-shrink-0 overflow-hidden">
        {slide.imagem_url ? (
          <img
            src={slide.imagem_url}
            alt={slide.titulo}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-white/60" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              tipoConfig.color
            )}
          >
            {tipoConfig.label}
          </span>
          {!slide.ativo && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              Inativo
            </span>
          )}
        </div>
        <h4 className="font-medium text-foreground truncate">{slide.titulo}</h4>
        {slide.descricao && (
          <p className="text-sm text-muted-foreground truncate">{slide.descricao}</p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        {/* Mover para cima */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          disabled={isFirst || isUpdating}
          className="h-8 w-8"
          title="Mover para cima"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>

        {/* Mover para baixo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={isLast || isUpdating}
          className="h-8 w-8"
          title="Mover para baixo"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>

        {/* Toggle ativo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleActive}
          disabled={isUpdating}
          className="h-8 w-8"
          title={slide.ativo ? 'Desativar' : 'Ativar'}
        >
          {slide.ativo ? (
            <Eye className="w-4 h-4 text-green-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>

        {/* Editar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </Button>

        {/* Excluir */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
