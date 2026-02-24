/**
 * Painel de filtros dinâmicos para relatórios
 */

import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useData } from '@/contexts/DataContext'
import { REPORT_TYPES } from '@/types/relatorio'
import type { TipoRelatorio, FiltrosRelatorio } from '@/types/relatorio'

interface ReportFiltersProps {
  tipo: TipoRelatorio
  filtros: Omit<FiltrosRelatorio, 'tipo'>
  onChange: (filtros: Omit<FiltrosRelatorio, 'tipo'>) => void
}

export function ReportFilters({ tipo, filtros, onChange }: ReportFiltersProps) {
  const { professionals } = useData()

  // Busca configuração do tipo de relatório
  const config = useMemo(() => {
    return REPORT_TYPES.find((r) => r.tipo === tipo)
  }, [tipo])

  const filtrosDisponiveis = config?.filtrosDisponiveis || ['periodo']

  const handleChange = (field: keyof Omit<FiltrosRelatorio, 'tipo'>, value: string) => {
    onChange({ ...filtros, [field]: value || undefined })
  }

  // Opções para o select de profissionais
  // A API retorna profissionais com estrutura: { id, usuario: { nome_completo, ... } }
  const profissionalOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos os profissionais' },
      ...professionals.map((prof) => ({
        value: prof.id,
        label: prof.usuario?.nome_completo || 'Profissional',
      })),
    ]
  }, [professionals])

  // Opções para o select de status
  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'realizado', label: 'Realizado' },
  ]

  return (
    <div className="space-y-4">
      {/* Período - sempre presente */}
      {filtrosDisponiveis.includes('periodo') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Data Inicial *</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filtros.dateFrom || ''}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Data Final *</Label>
            <Input
              id="dateTo"
              type="date"
              value={filtros.dateTo || ''}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {/* Profissional */}
      {filtrosDisponiveis.includes('profissional') && (
        <div className="space-y-2">
          <Select
            label="Profissional"
            options={profissionalOptions}
            value={filtros.profissionalId || ''}
            onChange={(value) => handleChange('profissionalId', value)}
            placeholder="Todos os profissionais"
          />
        </div>
      )}

      {/* Status */}
      {filtrosDisponiveis.includes('status') && (
        <div className="space-y-2">
          <Select
            label="Status"
            options={statusOptions}
            value={filtros.status || ''}
            onChange={(value) => handleChange('status', value)}
            placeholder="Todos os status"
          />
        </div>
      )}
    </div>
  )
}
