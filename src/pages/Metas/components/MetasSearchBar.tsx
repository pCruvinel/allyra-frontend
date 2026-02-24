/**
 * MetasSearchBar - Barra de busca contextual para o módulo de Metas
 * O placeholder muda dinamicamente de acordo com a tab ativa
 */

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

type TabView = 'pacientes' | 'registro' | 'planos' | 'atendimento' | 'devolutiva'

interface MetasSearchBarProps {
  activeTab: TabView
  value: string
  onChange: (value: string) => void
}

const placeholders: Record<TabView, string> = {
  pacientes: 'Buscar pacientes...',
  registro: 'Buscar pacientes ou atendimentos...',
  planos: 'Buscar pacientes, metas ou planos...',
  atendimento: 'Buscar pacientes ou sessões...',
  devolutiva: 'Buscar relatórios ou pacientes...',
}

export function MetasSearchBar({ activeTab, value, onChange }: MetasSearchBarProps) {
  return (
    <div className="relative max-w-[600px] w-full">
      <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholders[activeTab] || 'Buscar...'}
        className="pl-11 pr-10 rounded-lg h-10"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
