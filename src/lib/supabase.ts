/**
 * Configuração do Supabase Client
 *
 * Cliente configurado para integração com Supabase.
 * Variáveis de ambiente em .env.local:
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Flag de ambiente (para controle de dados de teste)
export const isProduction = import.meta.env.VITE_IS_PRODUCTION === 'true'
export const appEnv = import.meta.env.VITE_APP_ENV || 'development'

// DEBUG: Logs para diagnóstico
logger.debug('Supabase', `URL: ${supabaseUrl ? `✅ ${supabaseUrl.substring(0, 30)}...` : '❌ AUSENTE'}`)
logger.debug('Supabase', `Anon Key: ${supabaseAnonKey ? '✅ Presente' : '❌ AUSENTE'}`)

// Verifica se as variáveis estão configuradas
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

logger.debug('Supabase', `isConfigured: ${isSupabaseConfigured}`)

// Cliente Supabase com configuração explícita de CORS e network
// IMPORTANTE: detectSessionInUrl: false é necessário para Realtime funcionar com RLS
// Ref: https://github.com/orgs/supabase/discussions/26980
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Necessário para Realtime + RLS
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

// DEBUG: Verificar se cliente foi criado
logger.debug('Supabase', `Cliente criado: ${supabase ? '✅ OK' : '❌ FALHOU'}`)
if (supabase) {
  logger.debug('Supabase', `Método .rpc: ${typeof supabase.rpc === 'function' ? '✅ Disponível' : '❌ AUSENTE'}`)
  logger.debug('Supabase', `Método .from: ${typeof supabase.from === 'function' ? '✅ Disponível' : '❌ AUSENTE'}`)
  logger.debug('Supabase', `Auth: ${supabase.auth ? '✅ OK' : '❌ NULL'}`)
}

// Tipos do Supabase
export type SupabaseUser = {
  id: string
  email: string
  user_metadata: {
    name?: string
    avatar_url?: string
  }
}

// Converte usuário Supabase para formato da aplicação
export function mapSupabaseUser(supabaseUser: SupabaseUser | null): {
  id: string
  email: string
  name: string
  avatar?: string
} | null {
  if (!supabaseUser) return null

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
    avatar: supabaseUser.user_metadata?.avatar_url,
  }
}

/**
 * Helper para marcar dados como teste
 * Adiciona is_test_data: true quando não estiver em produção
 */
export function withTestDataFlag<T extends Record<string, unknown>>(data: T): T & { is_test_data: boolean } {
  return {
    ...data,
    is_test_data: !isProduction,
  }
}

/**
 * Limpa todos os dados de teste do banco
 * CUIDADO: Só funciona em ambiente de desenvolvimento
 * Usa a API centralizada em vez de RPC direta ao Supabase
 */
export async function cleanupTestData(): Promise<{ success: boolean; error?: string; deletedCounts?: Record<string, number> }> {
  if (isProduction) {
    return { success: false, error: 'Não é possível limpar dados de teste em produção' }
  }

  try {
    // Importação dinâmica para evitar dependência circular
    const { apiService } = await import('@/services/api.service')

    const response = await apiService.post<{
      success: boolean
      message?: string
      error?: string
      deletedCounts?: Record<string, number>
    }>('/api/admin/cleanup-test-data')

    if ('error' in response && response.error) {
      return { success: false, error: response.error }
    }

    return {
      success: response.success ?? true,
      deletedCounts: response.deletedCounts,
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}
