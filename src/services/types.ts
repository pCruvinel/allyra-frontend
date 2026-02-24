/**
 * Tipos base para a camada de serviços
 * Preparado para migração Supabase
 */

// Resposta padrão de serviço
export interface ServiceResponse<T> {
  data: T | null
  error: ServiceError | null
  count?: number
}

// Erro de serviço
export interface ServiceError {
  message: string
  code?: string
  details?: unknown
}

// Opções de paginação
export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

// Opções de ordenação
export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

// Opções de filtro genérico
export interface FilterOptions {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: unknown
}

// Opções de query combinadas
export interface QueryOptions {
  pagination?: PaginationOptions
  sort?: SortOptions
  filters?: FilterOptions
}

// Contexto de clínica para multi-tenant
export interface ClinicContext {
  clinicaId: string
  userId: string
}

// Interface base para todos os serviços
export interface BaseService<T, CreateInput, UpdateInput> {
  getAll(options?: QueryOptions): Promise<ServiceResponse<T[]>>
  getById(id: string): Promise<ServiceResponse<T>>
  create(data: CreateInput): Promise<ServiceResponse<T>>
  update(id: string, data: UpdateInput): Promise<ServiceResponse<T>>
  delete(id: string): Promise<ServiceResponse<boolean>>
}
