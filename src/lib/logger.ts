/**
 * Logger condicional baseado em VITE_IS_PRODUCTION
 *
 * - debug/info: apenas em desenvolvimento (VITE_IS_PRODUCTION=false)
 * - warn/error: sempre aparecem (críticos para debugging em produção)
 */

const isProduction = import.meta.env.VITE_IS_PRODUCTION === 'true'

export const logger = {
  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (tag: string, message: string, data?: unknown) => {
    if (!isProduction) {
      if (data !== undefined) {
        console.log(`[${tag}] ${message}`, data)
      } else {
        console.log(`[${tag}] ${message}`)
      }
    }
  },

  /**
   * Log informativo - apenas em desenvolvimento
   */
  info: (tag: string, message: string, data?: unknown) => {
    if (!isProduction) {
      if (data !== undefined) {
        console.log(`[${tag}] ${message}`, data)
      } else {
        console.log(`[${tag}] ${message}`)
      }
    }
  },

  /**
   * Log de aviso - sempre aparece
   */
  warn: (tag: string, message: string, data?: unknown) => {
    if (data !== undefined) {
      console.warn(`[${tag}] ${message}`, data)
    } else {
      console.warn(`[${tag}] ${message}`)
    }
  },

  /**
   * Log de erro - sempre aparece
   */
  error: (tag: string, message: string, data?: unknown) => {
    if (data !== undefined) {
      console.error(`[${tag}] ${message}`, data)
    } else {
      console.error(`[${tag}] ${message}`)
    }
  },
}
