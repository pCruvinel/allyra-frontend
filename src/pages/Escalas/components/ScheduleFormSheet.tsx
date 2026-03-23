import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DateInput } from '@/components/ui/date-input'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { ScheduleType } from './ScheduleBlock'

interface FilterOption {
  value: string
  label: string
}

interface ScheduleFormState {
  profissionalId: string
  diasSemana: number[]
  horaInicio: string
  horaFim: string
  tipo: ScheduleType
  recorrente: boolean
  vigenciaInicio: string
  vigenciaFim: string
}

interface ScheduleFormSheetProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  isEditing: boolean
  isSubmitting: boolean
  formState: ScheduleFormState
  onFieldChange: <K extends keyof ScheduleFormState>(
    key: K,
    value: ScheduleFormState[K],
  ) => void
  professionalsOptions: FilterOption[]
}

const WEEKDAYS = [
  { value: 1, short: 'Seg', full: 'Segunda' },
  { value: 2, short: 'Ter', full: 'Terça' },
  { value: 3, short: 'Qua', full: 'Quarta' },
  { value: 4, short: 'Qui', full: 'Quinta' },
  { value: 5, short: 'Sex', full: 'Sexta' },
  { value: 6, short: 'Sáb', full: 'Sábado' },
  { value: 0, short: 'Dom', full: 'Domingo' },
]

const SCHEDULE_TYPE_OPTIONS: Array<{ value: ScheduleType; label: string }> = [
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'pausa', label: 'Pausa' },
  { value: 'ferias', label: 'Férias' },
  { value: 'treinamento', label: 'Treinamento' },
]

function DayChip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-150',
        'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {label}
    </button>
  )
}

export function ScheduleFormSheet({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  isSubmitting,
  formState,
  onFieldChange,
  professionalsOptions,
}: ScheduleFormSheetProps) {
  function toggleDay(day: number) {
    const current = formState.diasSemana
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day]
    onFieldChange('diasSemana', next)
  }

  function selectWeekdays() {
    onFieldChange('diasSemana', [1, 2, 3, 4, 5])
  }

  function selectAll() {
    onFieldChange('diasSemana', [0, 1, 2, 3, 4, 5, 6])
  }

  function clearAll() {
    onFieldChange('diasSemana', [])
  }

  const countSelected = formState.diasSemana.length

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar escala' : 'Nova escala'}
      description={
        isEditing
          ? 'Altere os dados da escala existente.'
          : 'Configure a grade do profissional. Selecione um ou mais dias da semana.'
      }
      size="md"
    >
      <ResponsiveModalBody>
        <div className="space-y-5">
          {/* Section 1: Professional & Type */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Profissional e tipo
            </legend>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                options={professionalsOptions}
                value={formState.profissionalId}
                onChange={(value) => onFieldChange('profissionalId', value)}
                label="Profissional"
                placeholder="Selecione"
                disabled={isSubmitting || isEditing}
              />
              <Select
                options={SCHEDULE_TYPE_OPTIONS}
                value={formState.tipo}
                onChange={(value) =>
                  onFieldChange('tipo', value as ScheduleType)
                }
                label="Tipo de bloco"
                disabled={isSubmitting}
              />
            </div>
          </fieldset>

          {/* Section 2: Days of Week — chip selector */}
          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dias da semana
                {countSelected > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {countSelected}
                  </span>
                )}
              </legend>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={selectWeekdays}
                  disabled={isSubmitting}
                  className="text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Seg–Sex
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={isSubmitting}
                  className="text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Todos
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={isSubmitting}
                  className="text-[11px] font-medium text-destructive hover:underline disabled:opacity-50"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((wd) => (
                <DayChip
                  key={wd.value}
                  label={wd.short}
                  selected={formState.diasSemana.includes(wd.value)}
                  disabled={isSubmitting || isEditing}
                  onClick={() => toggleDay(wd.value)}
                />
              ))}
            </div>
          </fieldset>

          {/* Section 3: Time Range */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Horário
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Início">
                <Input
                  type="time"
                  value={formState.horaInicio}
                  onChange={(event) =>
                    onFieldChange('horaInicio', event.target.value)
                  }
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label="Término">
                <Input
                  type="time"
                  value={formState.horaFim}
                  onChange={(event) =>
                    onFieldChange('horaFim', event.target.value)
                  }
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Section 4: Validity & Recurrence */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Vigência
            </legend>
            <div className="grid gap-3 md:grid-cols-2">
              <DateInput
                label="Data inicial"
                value={formState.vigenciaInicio}
                onChange={(value) => onFieldChange('vigenciaInicio', value)}
                disabled={isSubmitting}
              />
              <DateInput
                label="Data final (opcional)"
                value={formState.vigenciaFim}
                onChange={(value) => onFieldChange('vigenciaFim', value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Escala recorrente
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Desative para blocos pontuais.
                  </p>
                </div>
                <Switch
                  checked={formState.recorrente}
                  onCheckedChange={(checked) =>
                    onFieldChange('recorrente', checked)
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </fieldset>
        </div>
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || countSelected === 0}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditing
            ? 'Salvar alterações'
            : countSelected > 1
              ? `Criar ${countSelected} escalas`
              : 'Criar escala'}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  )
}

export type { ScheduleFormState }
