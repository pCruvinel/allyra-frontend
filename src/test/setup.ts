/**
 * Setup de testes Vitest
 * Configura mocks globais e ambiente de teste
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
  isProduction: false,
}))

// Mock de variáveis de ambiente para testes
vi.stubEnv('VITE_APP_ENV', 'development')
vi.stubEnv('VITE_SHOW_DEV_MODULES', 'true')
vi.stubEnv('VITE_IS_PRODUCTION', 'false')
