/**
 * MetasNavbar - Navbar específica do módulo Metas
 * Design: SearchBar | ModeToggle | Tutorial
 */

import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetasSearchBar } from './MetasSearchBar'
import { ModeToggle } from './ModeToggle'
import { useMetasMode } from '../contexts/MetasModeContext'

type TabView = 'pacientes' | 'registro' | 'planos' | 'atendimento' | 'devolutiva'

interface MetasNavbarProps {
  activeTab: TabView
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function MetasNavbar({
  activeTab,
  searchQuery,
  onSearchChange,
}: MetasNavbarProps) {
  const { showTutorial } = useMetasMode()

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/60">
      {/* SearchBar à esquerda */}
      <div className="flex-1 max-w-[600px]">
        <MetasSearchBar
          activeTab={activeTab}
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>

      {/* Ações à direita */}
      <div className="flex items-center gap-3">
        <ModeToggle />

        <Button
          variant="ghost"
          size="sm"
          onClick={showTutorial}
          className="text-muted-foreground hover:text-primary gap-1.5"
        >
          <HelpCircle size={16} />
          <span className="text-sm font-medium">? Tutorial</span>
        </Button>
      </div>
    </div>
  )
}
