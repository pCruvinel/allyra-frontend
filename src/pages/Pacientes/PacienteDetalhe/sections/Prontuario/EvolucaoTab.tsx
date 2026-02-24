import { useState } from 'react'
import { Calendar, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useMedicalData } from '@/hooks/useMedicalData'
import type { ClinicalEvolution, EvolutionStage } from '@/types/medical-record'

interface EvolucaoTabProps {
  evolutions: ClinicalEvolution[]
  patientId: string
}

export function EvolucaoTab({ evolutions, patientId }: EvolucaoTabProps) {
  const { createEvolucao, createEvolucaoEtapa, isLoading } = useMedicalData({ autoFetch: false })
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [activeStageForm, setActiveStageForm] = useState<string | null>(null)
  const [newStageDescription, setNewStageDescription] = useState('')
  const [newStageDate, setNewStageDate] = useState('')
  const [newStageTime, setNewStageTime] = useState('')

  const handleNewEvolution = async () => {
    if (!newTitle.trim()) return
    const result = await createEvolucao(patientId, { title: newTitle })
    if (result) {
      setNewTitle('')
      setShowNewForm(false)
    }
  }

  const handleNewStage = async (evolutionId: string) => {
    if (!newStageDescription.trim()) return
    const success = await createEvolucaoEtapa(evolutionId, {
      description: newStageDescription,
      date: newStageDate || undefined,
      time: newStageTime || undefined,
    })
    if (success) {
      setNewStageDescription('')
      setNewStageDate('')
      setNewStageTime('')
      setActiveStageForm(null)
    }
  }

  const handleStageCancel = () => {
    setActiveStageForm(null)
    setNewStageDescription('')
    setNewStageDate('')
    setNewStageTime('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Evolução clínica</h3>
          <p className="text-sm text-muted-foreground">Timeline do acompanhamento e tratamento</p>
        </div>
        <Button
          onClick={() => setShowNewForm(true)}
          variant="outline"
          disabled={isLoading}
          className="rounded-full px-6 border-primary text-primary hover:bg-primary/10"
        >
          Nova evolução
        </Button>
      </div>

      {/* Formulário de nova evolução */}
      {showNewForm && (
        <div className="border border-border rounded-xl p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Nova evolução clínica</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowNewForm(false); setNewTitle('') }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título da evolução (ex: Tratamento Ortodôntico)"
              className="flex-1"
            />
            <Button
              onClick={handleNewEvolution}
              disabled={isLoading || !newTitle.trim()}
              className="rounded-full px-6 bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de Evoluções */}
      <div className="space-y-6">
        {evolutions.map((evolution) => (
          <EvolutionCard
            key={evolution.id}
            evolution={evolution}
            onNewStage={() => setActiveStageForm(evolution.id)}
            showStageForm={activeStageForm === evolution.id}
            stageDescription={newStageDescription}
            onStageDescriptionChange={setNewStageDescription}
            stageDate={newStageDate}
            onStageDateChange={setNewStageDate}
            stageTime={newStageTime}
            onStageTimeChange={setNewStageTime}
            onStageSubmit={() => handleNewStage(evolution.id)}
            onStageCancel={handleStageCancel}
            isLoading={isLoading}
          />
        ))}
      </div>

      {evolutions.length === 0 && !showNewForm && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma evolução registrada
        </div>
      )}
    </div>
  )
}

interface EvolutionCardProps {
  evolution: ClinicalEvolution
  onNewStage: () => void
  showStageForm: boolean
  stageDescription: string
  onStageDescriptionChange: (value: string) => void
  stageDate: string
  onStageDateChange: (value: string) => void
  stageTime: string
  onStageTimeChange: (value: string) => void
  onStageSubmit: () => void
  onStageCancel: () => void
  isLoading: boolean
}

function EvolutionCard({
  evolution,
  onNewStage,
  showStageForm,
  stageDescription,
  onStageDescriptionChange,
  stageDate,
  onStageDateChange,
  stageTime,
  onStageTimeChange,
  onStageSubmit,
  onStageCancel,
  isLoading,
}: EvolutionCardProps) {
  return (
    <div className="border border-border rounded-xl p-6">
      {/* Header do Card */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-foreground">{evolution.title}</h4>
        <Button
          onClick={onNewStage}
          size="sm"
          disabled={isLoading}
          className="rounded-full px-4 bg-primary hover:bg-primary/90"
        >
          Nova etapa
        </Button>
      </div>

      {/* Formulário de nova etapa */}
      {showStageForm && (
        <div className="mb-4 p-4 border border-border rounded-xl bg-muted/30 space-y-4">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Descrição da etapa <span className="text-red-500">*</span>
            </label>
            <Input
              value={stageDescription}
              onChange={(e) => onStageDescriptionChange(e.target.value)}
              placeholder="Descreva o procedimento ou evolução"
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5" />
                Data
              </label>
              <Input
                type="date"
                value={stageDate}
                onChange={(e) => onStageDateChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Clock className="w-4 h-4 inline mr-1.5" />
                Hora
              </label>
              <Input
                type="time"
                value={stageTime}
                onChange={(e) => onStageTimeChange(e.target.value)}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={onStageCancel}
              variant="outline"
              size="sm"
              className="rounded-full px-4"
            >
              Cancelar
            </Button>
            <Button
              onClick={onStageSubmit}
              disabled={isLoading || !stageDescription.trim()}
              size="sm"
              className="rounded-full px-4 bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      )}

      {/* Timeline de Etapas */}
      <div className="space-y-4">
        {evolution.stages.map((stage, index) => (
          <StageItem
            key={stage.id}
            stage={stage}
            stageNumber={index + 1}
            totalStages={evolution.stages.length}
          />
        ))}
      </div>
    </div>
  )
}

interface StageItemProps {
  stage: EvolutionStage
  stageNumber: number
  totalStages: number
}

function StageItem({ stage, stageNumber, totalStages }: StageItemProps) {
  const isCompleted = stage.status === 'Concluído'

  return (
    <div className="flex gap-4">
      {/* Timeline Indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            isCompleted ? 'bg-primary' : 'bg-muted'
          )}
        />
        {stageNumber < totalStages && (
          <div className="w-0.5 h-full bg-muted mt-1" />
        )}
      </div>

      {/* Stage Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Etapa {stageNumber}/{totalStages}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {stage.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {stage.time}
              </span>
            </div>
          </div>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              isCompleted
                ? 'bg-primary text-white'
                : 'border border-primary text-primary'
            )}
          >
            {stage.status}
          </span>
        </div>
      </div>
    </div>
  )
}
