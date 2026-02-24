/**
 * Data Service - Gerenciamento de Dados com Controle de Ambiente
 *
 * Este serviço encapsula operações do Supabase e automaticamente:
 * - Em DESENVOLVIMENTO (VITE_IS_PRODUCTION = false):
 *   - Insere dados com is_test_data = true
 *   - Consultas incluem dados de teste
 * - Em PRODUÇÃO (VITE_IS_PRODUCTION = true):
 *   - Insere dados com is_test_data = false
 *   - Consultas filtram dados de teste (is_test_data != true)
 */

import { supabase, isProduction, isSupabaseConfigured } from './supabase'

// Tabelas que possuem coluna is_test_data
const TABLES_WITH_TEST_DATA_FLAG = [
  'clinicas',
  'usuarios',
  'pacientes',
  'agendamentos',
  'prontuarios',
  'faturamentos',
  'contas_receber',
] as const

type TableWithTestFlag = (typeof TABLES_WITH_TEST_DATA_FLAG)[number]

/**
 * Verifica se uma tabela tem a coluna is_test_data
 */
export function hasTestDataColumn(table: string): boolean {
  return TABLES_WITH_TEST_DATA_FLAG.includes(table as TableWithTestFlag)
}

/**
 * Prepara dados para inserção, adicionando is_test_data se necessário
 */
export function prepareInsertData<T extends Record<string, unknown>>(
  table: string,
  data: T
): T & { is_test_data?: boolean } {
  if (!hasTestDataColumn(table)) {
    return data
  }

  return {
    ...data,
    is_test_data: !isProduction,
  }
}

/**
 * Prepara dados em lote para inserção
 */
export function prepareInsertDataBatch<T extends Record<string, unknown>>(
  table: string,
  dataArray: T[]
): (T & { is_test_data?: boolean })[] {
  return dataArray.map((data) => prepareInsertData(table, data))
}

/**
 * Cria um builder de query com filtro de dados de teste em produção
 *
 * Uso:
 * ```ts
 * const { data } = await queryWithTestFilter('pacientes')
 *   .select('*')
 *   .eq('clinica_id', clinicaId)
 * ```
 */
export function queryWithTestFilter(table: string) {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  const query = supabase.from(table)

  // Em produção, filtra dados de teste
  // NOTA: O filtro deve ser aplicado na query final, não aqui
  // Retornamos o query builder e o consumidor deve aplicar .neq() se necessário
  return query
}

/**
 * Helper para aplicar filtro de dados de teste em queries
 *
 * Uso:
 * ```ts
 * let query = supabase.from('pacientes').select('*')
 * query = applyTestDataFilter(query, 'pacientes')
 * const { data } = await query
 * ```
 */
export function applyTestDataFilter<T>(
  query: T,
  table: string
): T {
  if (!isProduction && hasTestDataColumn(table)) {
    // Em desenvolvimento, não filtra - mostra todos os dados
    return query
  }

  if (isProduction && hasTestDataColumn(table)) {
    // Em produção, filtra dados de teste
    // TypeScript não conhece o tipo exato, mas o Supabase query builder tem .neq()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (query as any).neq('is_test_data', true) as T
  }

  return query
}

/**
 * Serviço de dados com operações CRUD
 */
export const dataService = {
  /**
   * Insere um registro com flag de teste automático
   */
  async insert<T extends Record<string, unknown>>(
    table: string,
    data: T
  ) {
    if (!supabase) {
      throw new Error('Supabase não configurado')
    }

    const preparedData = prepareInsertData(table, data)
    return supabase.from(table).insert(preparedData)
  },

  /**
   * Insere múltiplos registros com flag de teste automático
   */
  async insertMany<T extends Record<string, unknown>>(
    table: string,
    dataArray: T[]
  ) {
    if (!supabase) {
      throw new Error('Supabase não configurado')
    }

    const preparedData = prepareInsertDataBatch(table, dataArray)
    return supabase.from(table).insert(preparedData)
  },

  /**
   * Seleciona registros filtrando dados de teste em produção
   */
  select(table: string, columns = '*') {
    if (!supabase) {
      throw new Error('Supabase não configurado')
    }

    let query = supabase.from(table).select(columns)

    // Em produção, filtra dados de teste
    if (isProduction && hasTestDataColumn(table)) {
      query = query.neq('is_test_data', true)
    }

    return query
  },

  /**
   * Atualiza registros (não altera is_test_data)
   */
  update<T extends Record<string, unknown>>(table: string, data: T) {
    if (!supabase) {
      throw new Error('Supabase não configurado')
    }

    // Remove is_test_data do update para não alterar acidentalmente
    const { is_test_data: _testDataFlag, ...safeData } = data as T & { is_test_data?: boolean }
    void _testDataFlag // Ignorar intencionalmente
    return supabase.from(table).update(safeData)
  },

  /**
   * Deleta registros
   */
  delete(table: string) {
    if (!supabase) {
      throw new Error('Supabase não configurado')
    }

    return supabase.from(table).delete()
  },

  /**
   * Retorna informações do ambiente
   */
  getEnvironmentInfo() {
    return {
      isProduction,
      isSupabaseConfigured,
      testDataBehavior: isProduction
        ? 'Dados de teste são filtrados automaticamente'
        : 'Novos registros são marcados como dados de teste',
    }
  },
}

export default dataService
