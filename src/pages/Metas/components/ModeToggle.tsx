/**
 * ModeToggle - Switch para alternar entre modo Stand-alone e Integrado
 */

import { Link2, Unlink } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useMetasMode } from '../contexts/MetasModeContext'

export function ModeToggle() {
  const { isStandaloneMode, toggleMode } = useMetasMode()

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
      <div className="flex items-center gap-2">
        {isStandaloneMode ? (
          <Unlink size={16} className="text-amber-500" />
        ) : (
          <Link2 size={16} className="text-primary" />
        )}
        <span className="text-sm font-medium text-foreground">
          {isStandaloneMode ? 'Modo Stand-alone' : 'Modo Integrado'}
        </span>
      </div>

      <Switch
        checked={isStandaloneMode}
        onCheckedChange={toggleMode}
        className="data-[state=checked]:bg-amber-500"
      />
    </div>
  )
}
