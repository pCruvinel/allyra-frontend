/**
 * AuthContext - Gerenciamento de Autenticação
 *
 * INTEGRADO COM API:
 * - Usa apiService para comunicação com backend
 * - Token JWT armazenado em localStorage
 * - Multi-tenant (seleção de clínica)
 * - Logout limpa token local
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { apiService } from '@/services/api.service'
import { logger } from '@/lib/logger'
import type { PerfilTipo } from '@/config/permissions'

// Tipos de usuário
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  perfil_tipo?: PerfilTipo
  telefone?: string
  cpf?: string
  is_master?: boolean
  // Campos de perfil profissional
  data_nascimento?: string
  endereco?: string
  registro_profissional?: string
  especialidade?: string
  bio?: string
  created_at?: string
}

// Tipos de clínica (multi-tenant)
export interface Clinica {
  id: string
  name: string
  slug?: string
  permissoes?: Record<string, boolean>
}

// Provider de autenticação social
export type AuthProvider = 'google' | 'apple' | 'email'

interface AuthContextType {
  // Estado do usuário
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Multi-tenant
  clinicas: Clinica[]
  currentClinica: Clinica | null

  // Métodos de autenticação
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>

  // Multi-tenant
  selectClinica: (clinicaId: string) => void

  // Atualização de dados
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Storage keys
const STORAGE_KEY = 'allyra_user'
const CLINICA_KEY = 'allyra_clinica'

// Busca dados do usuário via API
async function fetchUserWithClinics(): Promise<{ user: User; clinicas: Clinica[] } | null> {
  logger.debug('Auth', 'fetchUserWithClinics - iniciando via API...')

  try {
    // Chama endpoint da API que retorna usuário + clínicas
    const response = await apiService.getUserWithClinics()

    logger.debug('Auth', 'Resposta da API:', response)

    // Mapear dados para formato da aplicação
    const user: User = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      avatar: response.user.avatar,
      perfil_tipo: response.user.perfil_tipo as PerfilTipo,
      telefone: response.user.telefone,
      cpf: response.user.cpf,
      data_nascimento: response.user.data_nascimento,
      endereco: response.user.endereco,
      registro_profissional: response.user.registro_profissional,
      especialidade: response.user.especialidade,
      bio: response.user.bio,
      created_at: response.user.created_at,
    }

    const clinicas: Clinica[] = response.clinicas.map(c => ({
      id: c.id,
      name: c.name,
      permissoes: c.permissoes,
    }))

    logger.debug('Auth', 'Dados carregados via API:', {
      name: user.name,
      perfil: user.perfil_tipo,
      clinicas: clinicas.length,
      clinicasNomes: clinicas.map(c => c.name),
    })

    return { user, clinicas }
  } catch (err) {
    logger.error('Auth', 'Erro ao buscar dados via API:', err)
    return null
  }
}

// Função para recuperar usuário do localStorage
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Função para salvar usuário no localStorage
const storeUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Função para recuperar clínica selecionada
const getStoredClinica = (): Clinica | null => {
  try {
    const stored = localStorage.getItem(CLINICA_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Função para salvar clínica selecionada
const storeClinica = (clinica: Clinica | null) => {
  if (clinica) {
    localStorage.setItem(CLINICA_KEY, JSON.stringify(clinica))
  } else {
    localStorage.removeItem(CLINICA_KEY)
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [isLoading, setIsLoading] = useState(false)
  // Estado interno para controle de inicialização (não exposto no contexto)
const [, setIsInitializing] = useState(true)
  const [clinicas, setClinicas] = useState<Clinica[]>([])
  const [currentClinica, setCurrentClinica] = useState<Clinica | null>(getStoredClinica)
  // Lock para prevenir chamadas duplicadas de logout
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Sincroniza estado com localStorage quando usuário muda
  useEffect(() => {
    storeUser(user)

    // Se deslogou, limpa tudo
    if (!user) {
      setClinicas([])
      setCurrentClinica(null)
      storeClinica(null)
    }
  }, [user])

  // Sincroniza clínica selecionada
  useEffect(() => {
    storeClinica(currentClinica)
  }, [currentClinica])

  // Verifica se tem token ao montar componente
  useEffect(() => {
    const initAuth = async () => {
      // Se tem token, sincroniza com Supabase (background) e busca dados do usuário
      if (apiService.hasToken()) {
        logger.debug('Auth', 'Token encontrado, sincronizando Supabase em background...')
        apiService.syncSupabaseSession() // Não bloqueia - sincroniza em background
        logger.debug('Auth', 'Buscando dados do usuário...')
        try {
          const result = await fetchUserWithClinics()
          if (result) {
            setUser(result.user)
            setClinicas(result.clinicas)
            // Seleciona primeira clínica se não tiver uma selecionada
            if (result.clinicas.length > 0) {
              const stored = getStoredClinica()
              const validStored = stored && result.clinicas.find(c => c.id === stored.id)
              if (validStored) {
                setCurrentClinica(validStored)
              } else {
                setCurrentClinica(result.clinicas[0])
                storeClinica(result.clinicas[0])
              }
            }
          }
        } catch (error) {
          logger.error('Auth', 'Erro ao buscar dados do usuário:', error)
          // Token inválido/expirado, limpa tudo
          await apiService.logout()
          setUser(null)
        }
      }
      setIsInitializing(false)
    }

    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Login via API - retorna dados completos do usuário + clínicas
      const loginResponse = await apiService.login(email, password)
      logger.debug('Auth', 'Login bem-sucedido!')

      // Token já foi salvo automaticamente pelo apiService
      // Mapear dados da resposta para formato da aplicação
      const user: User = {
        id: loginResponse.user.id,
        email: loginResponse.user.email,
        name: loginResponse.user.name,
        avatar: loginResponse.user.avatar,
        perfil_tipo: loginResponse.user.perfil_tipo as PerfilTipo,
        telefone: loginResponse.user.telefone,
        cpf: loginResponse.user.cpf,
        data_nascimento: loginResponse.user.data_nascimento,
        endereco: loginResponse.user.endereco,
        registro_profissional: loginResponse.user.registro_profissional,
        especialidade: loginResponse.user.especialidade,
        bio: loginResponse.user.bio,
        created_at: loginResponse.user.created_at,
      }

      const clinicas: Clinica[] = loginResponse.clinicas.map(c => ({
        id: c.id,
        name: c.name,
        permissoes: c.permissoes,
      }))

      logger.debug('Auth', 'Dados carregados:', {
        name: user.name,
        perfil: user.perfil_tipo,
        clinicas: clinicas.length,
        clinicasNomes: clinicas.map(c => c.name),
      })

      // Salva no localStorage ANTES de atualizar estado
      storeUser(user)
      flushSync(() => {
        setUser(user)
        setClinicas(clinicas)
        // Seleciona primeira clínica como default
        if (clinicas.length > 0) {
          setCurrentClinica(clinicas[0])
          storeClinica(clinicas[0])
        }
      })
      toast.success('Login realizado com sucesso!')

      // Pré-carrega dados do dashboard em BACKGROUND (não bloqueia)
      // Isso aquece o cache do servidor para quando o usuário acessar o dashboard
      if (clinicas.length > 0) {
        apiService.getBootstrapData(clinicas[0].id).catch(err => {
          logger.debug('Auth', 'Bootstrap preload failed (non-blocking):', err)
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    toast.error('Login social não implementado. Use email/senha.')
    throw new Error('Login social não implementado')
  }, [])

  const loginWithApple = useCallback(async () => {
    toast.error('Login social não implementado. Use email/senha.')
    throw new Error('Login social não implementado')
  }, [])

  const logout = useCallback(async () => {
    // Previne chamadas duplicadas (debounce)
    if (isLoggingOut) {
      logger.debug('Auth', 'Logout já em andamento, ignorando chamada duplicada')
      return
    }

    try {
      setIsLoggingOut(true)
      logger.debug('Auth', 'Iniciando logout...')

      // Limpa token via apiService (agora async para limpar sessão Supabase também)
      await apiService.logout()

      // Limpar estado local
      logger.debug('Auth', 'Limpando estado React...')
      setUser(null)
      setClinicas([])
      setCurrentClinica(null)

      // Limpar TODO o localStorage e sessionStorage
      logger.debug('Auth', 'Limpando storage...')
      localStorage.clear()
      sessionStorage.clear()

      toast.success('Logout realizado com sucesso!')

      // Pequeno delay para garantir que o toast apareça
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirecionar para login
      logger.debug('Auth', 'Redirecionando para /login...')
      window.location.href = '/login'
    } catch (error) {
      logger.error('Auth', 'Erro inesperado no logout:', error)

      // Mesmo com erro, força limpeza e redirecionamento
      localStorage.clear()
      sessionStorage.clear()

      toast.error('Erro ao fazer logout, mas você será desconectado')

      // Força redirecionamento mesmo com erro
      setTimeout(() => {
        window.location.href = '/login'
      }, 500)
    } finally {
      // Reset do lock após tudo (mas como estamos redirecionando, isso não será executado)
      // Mantém aqui para caso o redirecionamento falhe
      setIsLoggingOut(false)
    }
  }, [isLoggingOut])

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      // Register via API - retorna dados completos do usuário + clínicas
      const registerResponse = await apiService.register(name, email, password)
      logger.debug('Auth', 'Cadastro bem-sucedido!')

      // Token já foi salvo automaticamente pelo apiService
      // Mapear dados da resposta para formato da aplicação
      const user: User = {
        id: registerResponse.user.id,
        email: registerResponse.user.email,
        name: registerResponse.user.name,
        avatar: registerResponse.user.avatar,
        perfil_tipo: registerResponse.user.perfil_tipo as PerfilTipo,
        telefone: registerResponse.user.telefone,
        cpf: registerResponse.user.cpf,
        data_nascimento: registerResponse.user.data_nascimento,
        endereco: registerResponse.user.endereco,
        registro_profissional: registerResponse.user.registro_profissional,
        especialidade: registerResponse.user.especialidade,
        bio: registerResponse.user.bio,
        created_at: registerResponse.user.created_at,
      }

      const clinicas: Clinica[] = registerResponse.clinicas.map(c => ({
        id: c.id,
        name: c.name,
        permissoes: c.permissoes,
      }))

      // Salva no localStorage ANTES de atualizar estado
      storeUser(user)
      flushSync(() => {
        setUser(user)
        setClinicas(clinicas)
        // Seleciona primeira clínica como default
        if (clinicas.length > 0) {
          setCurrentClinica(clinicas[0])
          storeClinica(clinicas[0])
        }
      })
      toast.success('Cadastro realizado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer cadastro')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const response = await apiService.resetPassword(email)
      toast.success(response.message || 'Email de recuperação enviado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha')
      throw error
    }
  }, [])

  const selectClinica = useCallback((clinicaId: string) => {
    const clinica = clinicas.find(c => c.id === clinicaId)
    if (clinica) {
      setCurrentClinica(clinica)
      toast.success(`Clínica alterada para ${clinica.name}`)
    }
  }, [clinicas])

  // Função para recarregar dados do usuário (usado após atualizar perfil)
  const refreshUser = useCallback(async () => {
    try {
      const result = await fetchUserWithClinics()
      if (result) {
        setUser(result.user)
        setClinicas(result.clinicas)
      }
    } catch (error) {
      logger.error('Auth', 'Erro ao atualizar dados do usuário:', error)
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    clinicas,
    currentClinica,
    login,
    loginWithGoogle,
    loginWithApple,
    logout,
    register,
    resetPassword,
    selectClinica,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
