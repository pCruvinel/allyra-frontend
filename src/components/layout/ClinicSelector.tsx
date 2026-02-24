import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Building2, ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useModuleAccess } from '@/hooks/useModuleAccess'

interface ClinicSelectorProps {
  collapsed?: boolean
}

// Paleta de cores suaves para avatares (consistente por índice)
const AVATAR_COLORS = [
  { bg: 'bg-primary/10', text: 'text-primary', bgSolid: 'bg-primary' },
  { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', bgSolid: 'bg-blue-500' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', bgSolid: 'bg-emerald-500' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', bgSolid: 'bg-amber-500' },
  { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', bgSolid: 'bg-rose-500' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', bgSolid: 'bg-cyan-500' },
  { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', bgSolid: 'bg-violet-500' },
  { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', bgSolid: 'bg-orange-500' },
]

export function ClinicSelector({ collapsed = false }: ClinicSelectorProps) {
  const { clinicas, currentClinica, selectClinica } = useAuth()
  const { currentPerfil } = useModuleAccess()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Apenas mostrar para admin_master e desenvolvedor com mais de 1 clínica
  const isGlobalAdmin = currentPerfil === 'admin_master' || currentPerfil === 'desenvolvedor'
  const showSelector = isGlobalAdmin && clinicas.length > 1

  // Filtrar clínicas pela busca
  const filteredClinicas = useMemo(() => {
    if (!searchQuery.trim()) return clinicas
    const query = searchQuery.toLowerCase()
    return clinicas.filter(c => c.name.toLowerCase().includes(query))
  }, [clinicas, searchQuery])

  // Mostrar busca se tiver mais de 5 clínicas
  const showSearch = clinicas.length > 5

  // Obter cor do avatar baseado no índice da clínica
  const getClinicColor = useCallback((clinicaId: string) => {
    const index = clinicas.findIndex(c => c.id === clinicaId)
    return AVATAR_COLORS[index % AVATAR_COLORS.length]
  }, [clinicas])

  // Calcular posição do dropdown
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: collapsed ? 300 : Math.max(rect.width, 300),
      })
    }
  }, [collapsed])

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      // Focar no input de busca após abrir
      setTimeout(() => {
        if (showSearch && searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition, true)
      return () => {
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition, true)
      }
    } else {
      // Limpar busca ao fechar
      setSearchQuery('')
    }
  }, [isOpen, updateDropdownPosition, showSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement
        if (!target.closest('[data-clinic-dropdown]')) {
          setIsOpen(false)
        }
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSelect = (clinicaId: string) => {
    selectClinica(clinicaId)
    setIsOpen(false)
  }

  // Gerar iniciais da clínica para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  if (!showSelector) {
    return null
  }

  const currentColor = currentClinica ? getClinicColor(currentClinica.id) : AVATAR_COLORS[0]

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        collapsed ? "px-2 pt-4 pb-2" : "px-4 pt-4 pb-2"
      )}
    >
      {/* Label de contexto (apenas expandido) */}
      {!collapsed && (
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
          Ambiente
        </p>
      )}

      {/* Botão do Seletor */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`Clínica atual: ${currentClinica?.name}. Clique para trocar.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "group flex items-center w-full rounded-lg transition-all duration-200",
          "border border-border",
          collapsed
            ? "justify-center p-2"
            : "gap-3 px-3 py-2",
          isOpen
            ? "bg-muted"
            : "bg-background hover:bg-muted/50"
        )}
      >
        {/* Avatar da Clínica */}
        <div className={cn(
          "flex items-center justify-center rounded-md font-semibold transition-all duration-200 flex-shrink-0",
          collapsed ? "w-8 h-8 text-[11px]" : "w-9 h-9 text-xs",
          isOpen
            ? cn(currentColor.bgSolid, "text-white")
            : cn(currentColor.bg, currentColor.text)
        )}>
          {currentClinica ? getInitials(currentClinica.name) : <Building2 size={16} />}
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate leading-tight" title={currentClinica?.name}>
                {currentClinica?.name || 'Selecione uma clínica'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {clinicas.length} clínica{clinicas.length > 1 ? 's' : ''}
              </p>
            </div>
            <ChevronDown
              size={16}
              className={cn(
                "text-muted-foreground transition-transform duration-200 flex-shrink-0",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* Tooltip para estado colapsado */}
      {collapsed && showTooltip && !isOpen && (
        <div
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                     bg-foreground text-background px-3 py-2 rounded-lg shadow-lg
                     text-sm font-medium whitespace-nowrap
                     animate-in fade-in-0 zoom-in-95 duration-200"
        >
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2
                          w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-foreground" />
          {currentClinica?.name}
        </div>
      )}

      {/* Dropdown via Portal */}
      {isOpen && createPortal(
        <div
          data-clinic-dropdown
          role="listbox"
          aria-label="Lista de clínicas"
          className={cn(
            "fixed z-[9999] bg-background rounded-lg overflow-hidden",
            "border border-border",
            "shadow-sm",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: 'min(400px, calc(100vh - 100px))',
          }}
        >
          {/* Header do Dropdown */}
          <div className="px-3 py-2.5 border-b border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">
              Trocar Ambiente
            </p>
          </div>

          {/* Campo de Busca (se necessário) */}
          {showSearch && (
            <div className="px-2 py-2 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar clínica..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md
                           placeholder:text-muted-foreground
                           focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50
                           transition-all"
                />
              </div>
            </div>
          )}

          {/* Lista de Clínicas */}
          <div className="p-1 overflow-auto" style={{ maxHeight: showSearch ? '250px' : '300px' }}>
            {filteredClinicas.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma clínica encontrada</p>
              </div>
            ) : (
              filteredClinicas.map((clinica) => {
                const isSelected = currentClinica?.id === clinica.id
                const color = getClinicColor(clinica.id)
                return (
                  <button
                    key={clinica.id}
                    onClick={() => handleSelect(clinica.id)}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex items-center gap-3 w-full px-2.5 py-2 rounded-md transition-colors",
                      "hover:bg-muted",
                      isSelected && "bg-primary/5"
                    )}
                  >
                    {/* Avatar da Clínica com cor única */}
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-md text-xs font-semibold flex-shrink-0",
                      isSelected
                        ? cn(color.bgSolid, "text-white")
                        : cn(color.bg, color.text)
                    )}>
                      {getInitials(clinica.name)}
                    </div>

                    {/* Nome completo */}
                    <span className={cn(
                      "flex-1 text-left text-sm truncate",
                      isSelected ? "text-foreground font-medium" : "text-foreground"
                    )} title={clinica.name}>
                      {clinica.name}
                    </span>

                    {/* Indicador de Selecionado */}
                    {isSelected && (
                      <Check size={16} className="text-primary flex-shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
