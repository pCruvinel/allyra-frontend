/**
 * Configurações de paginação
 * Valores padrão usados quando não há configuração no banco
 */

// Valor padrão de itens por página (usado como fallback)
export const DEFAULT_ITEMS_PER_PAGE = 10

// Opções disponíveis para seleção
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const

// Tipo para as opções
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]
