/**
 * ResetPasswordPage - Página de redefinição de senha
 *
 * O usuário chega aqui após clicar no link de recuperação no email.
 * A URL contém o token de reset que o Supabase processa automaticamente.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Lock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const resetSchema = z.object({
  password: z.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type ResetFormData = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: 'onSubmit',
  })

  // Verifica se há uma sessão válida (token de reset)
  useEffect(() => {
    async function checkSession() {
      if (!isSupabaseConfigured || !supabase) {
        toast.error('Supabase não configurado')
        navigate({ to: '/login' })
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setHasSession(true)
      } else {
        toast.error('Link de recuperação inválido ou expirado')
        navigate({ to: '/login' })
      }
    }

    checkSession()
  }, [navigate])

  const onSubmit = async (data: ResetFormData) => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error('Supabase não configurado')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) throw error

      setIsSuccess(true)
      toast.success('Senha alterada com sucesso!')

      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate({ to: '/login' })
      }, 2000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Senha alterada!</h1>
            <p className="text-muted-foreground mb-4">
              Sua senha foi alterada com sucesso. Você será redirecionado para o login.
            </p>
            <Button onClick={() => navigate({ to: '/login' })} className="w-full">
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
          {/* Header */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Nova Senha</h1>
          <p className="text-muted-foreground text-center mb-6">
            Digite sua nova senha abaixo. Ela deve ter no mínimo 8 caracteres.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Senha */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Nova Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua nova senha"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirmar Senha
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirme sua nova senha"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="text-sm text-primary hover:underline"
            >
              Voltar para o Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
