import { useState, useEffect, useCallback } from 'react'

/**
 * Hook para detectar media queries
 * Usado para responsividade e adaptação de componentes
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((query: string): boolean => {
    // Verificar se está no browser
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  }, [])

  const [matches, setMatches] = useState<boolean>(() => getMatches(query))

  useEffect(() => {
    const matchMedia = window.matchMedia(query)

    // Handler para mudanças
    const handleChange = () => {
      setMatches(getMatches(query))
    }

    // Atualizar estado inicial
    handleChange()

    // Adicionar listener (compatível com Safari < 14)
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange)
    } else {
      matchMedia.addEventListener('change', handleChange)
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange)
      } else {
        matchMedia.removeEventListener('change', handleChange)
      }
    }
  }, [query, getMatches])

  return matches
}

// Breakpoints Tailwind
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/**
 * Verifica se viewport é mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`)
}

/**
 * Verifica se viewport é tablet (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  )
}

/**
 * Verifica se viewport é desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
}

/**
 * Verifica se viewport é menor que breakpoint especificado
 */
export function useBreakpointDown(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`)
}

/**
 * Verifica se viewport é maior ou igual ao breakpoint especificado
 */
export function useBreakpointUp(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
}

/**
 * Retorna o breakpoint atual
 */
export function useCurrentBreakpoint(): keyof typeof BREAKPOINTS | 'xs' {
  const isSm = useBreakpointUp('sm')
  const isMd = useBreakpointUp('md')
  const isLg = useBreakpointUp('lg')
  const isXl = useBreakpointUp('xl')
  const is2xl = useBreakpointUp('2xl')

  if (is2xl) return '2xl'
  if (isXl) return 'xl'
  if (isLg) return 'lg'
  if (isMd) return 'md'
  if (isSm) return 'sm'
  return 'xs'
}

/**
 * Verifica preferência de reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Verifica se dispositivo suporta hover (mouse)
 */
export function useCanHover(): boolean {
  return useMediaQuery('(hover: hover)')
}

/**
 * Verifica se dispositivo suporta touch
 */
export function useIsTouch(): boolean {
  return useMediaQuery('(pointer: coarse)')
}
