/**
 * AuthCallbackPage - Callback para OAuth
 *
 * Esta página é o destino do redirect após autenticação OAuth (Google/Apple).
 * O Supabase processa o token na URL e a sessão é automaticamente criada.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleAuthCallback() {
      // Se Supabase não está configurado, redireciona para login
      if (!isSupabaseConfigured || !supabase) {
        navigate({ to: '/login' })
        return
      }

      try {
        // O Supabase automaticamente processa o hash da URL
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AuthCallback] Error:', error)
          setError(error.message)
          // Aguarda 2s para mostrar erro e redireciona
          setTimeout(() => navigate({ to: '/login' }), 2000)
          return
        }

        if (data.session) {
          console.log('[AuthCallback] Session established:', data.session.user.email)
          // Sessão válida, redireciona para home
          navigate({ to: '/' })
        } else {
          // Sem sessão, volta para login
          navigate({ to: '/login' })
        }
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err)
        setError('Erro inesperado durante autenticação')
        setTimeout(() => navigate({ to: '/login' }), 2000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-2xl text-red-600 dark:text-red-400">!</span>
            </div>
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <p className="text-muted-foreground text-sm">Redirecionando para login...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-foreground font-medium">Autenticando...</p>
            <p className="text-muted-foreground text-sm mt-1">Aguarde um momento</p>
          </>
        )}
      </div>
    </div>
  )
}
