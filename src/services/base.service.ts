/**
 * Serviço base abstrato
 * Fornece implementação comum para CRUD com mock
 * Preparado para migração Supabase
 */

import type {
  ServiceResponse,
  ServiceError,
  QueryOptions,
  PaginationOptions,
} from './types'

// Simula delay de rede (configurável)
const MOCK_DELAY = 300

export async function simulateDelay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper para criar resposta de sucesso
export function success<T>(data: T, count?: number): ServiceResponse<T> {
  return { data, error: null, count }
}

// Helper para criar resposta de erro
export function error<T>(message: string, code?: string): ServiceResponse<T> {
  const err: ServiceError = { message, code }
  return { data: null, error: err }
}

// Helper para aplicar paginação
export function paginate<T>(
  items: T[],
  options?: PaginationOptions
): { items: T[]; total: number } {
  const total = items.length

  if (!options) {
    return { items, total }
  }

  const { page = 1, limit = 10, offset } = options
  const start = offset ?? (page - 1) * limit
  const end = start + limit

  return {
    items: items.slice(start, end),
    total,
  }
}

// Helper para aplicar busca em campos de texto
export function searchInFields<T extends Record<string, unknown>>(
  items: T[],
  search: string,
  fields: (keyof T)[]
): T[] {
  if (!search) return items

  const searchLower = search.toLowerCase()
  return items.filter(item =>
    fields.some(field => {
      const value = item[field]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower)
      }
      return false
    })
  )
}

// Helper para ordenação
export function sortBy<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    const comparison = aVal < bVal ? -1 : 1
    return direction === 'asc' ? comparison : -comparison
  })
}

// Helper para filtrar por status
export function filterByStatus<T extends { status?: string }>(
  items: T[],
  status?: string
): T[] {
  if (!status || status === 'all') return items
  return items.filter(item => item.status === status)
}

// Gera ID único (mock)
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Classe base abstrata para serviços
export abstract class BaseMockService<T extends { id: string }> {
  protected items: T[] = []

  protected abstract getSearchFields(): (keyof T)[]

  async getAll(options?: QueryOptions): Promise<ServiceResponse<T[]>> {
    await simulateDelay()

    let result = [...this.items]

    // Aplicar filtros
    if (options?.filters) {
      const { search, status } = options.filters

      if (search) {
        result = searchInFields(result, search as string, this.getSearchFields())
      }

      if (status) {
        result = result.filter(item => {
          const itemWithStatus = item as T & { status?: string }
          return itemWithStatus.status === status
        })
      }
    }

    // Aplicar ordenação
    if (options?.sort) {
      result = sortBy(result, options.sort.field as keyof T, options.sort.direction)
    }

    // Aplicar paginação
    const { items, total } = paginate(result, options?.pagination)

    return success(items, total)
  }

  async getById(id: string): Promise<ServiceResponse<T>> {
    await simulateDelay()

    const item = this.items.find(i => i.id === id)
    if (!item) {
      return error('Item não encontrado', 'NOT_FOUND')
    }

    return success(item)
  }

  async create(data: Omit<T, 'id'>): Promise<ServiceResponse<T>> {
    await simulateDelay()

    const newItem = {
      ...data,
      id: generateId(),
    } as T

    this.items.unshift(newItem)
    return success(newItem)
  }

  async update(id: string, data: Partial<T>): Promise<ServiceResponse<T>> {
    await simulateDelay()

    const index = this.items.findIndex(i => i.id === id)
    if (index === -1) {
      return error('Item não encontrado', 'NOT_FOUND')
    }

    const updated = { ...this.items[index], ...data }
    this.items[index] = updated

    return success(updated)
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    await simulateDelay()

    const index = this.items.findIndex(i => i.id === id)
    if (index === -1) {
      return error('Item não encontrado', 'NOT_FOUND')
    }

    this.items.splice(index, 1)
    return success(true)
  }
}
