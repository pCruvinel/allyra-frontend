// Formulário de login extraído da LoginPage
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, Chrome } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { cn } from '@/lib/utils'

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// Controle de cadastro via variável de ambiente
const ALLOW_SIGNUP = import.meta.env.VITE_ALLOW_SIGNUP === 'true'

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const { login, register: registerUser, loginWithGoogle, isLoading } = useAuth()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  })

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onSubmit',
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      // Redirect é feito automaticamente pelo PublicRoute quando isAuthenticated muda
    } catch {
      // Error is handled in AuthContext
    }
  }

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.name, data.email, data.password)
      // Redirect é feito automaticamente pelo PublicRoute quando isAuthenticated muda
    } catch {
      // Error is handled in AuthContext
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    loginForm.reset()
    registerForm.reset()
  }

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    setIsSendingEmail(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Email de recuperação enviado para ${data.email}`)
      setShowForgotPasswordModal(false)
      forgotPasswordForm.reset()
    } catch {
      toast.error('Erro ao enviar email de recuperação')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const openForgotPasswordModal = () => {
    const currentEmail = loginForm.getValues('email')
    if (currentEmail) {
      forgotPasswordForm.setValue('email', currentEmail)
    }
    setShowForgotPasswordModal(true)
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false)
    forgotPasswordForm.reset()
  }

  return (
    <>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Allyra</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão de Clínicas</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
          {/* Tabs */}
          {ALLOW_SIGNUP && (
            <div className="flex mb-6 bg-muted rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                  isLogin
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                  !isLogin
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Cadastrar
              </button>
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...loginForm.register('email')}
                  className={cn(
                    loginForm.formState.errors.email && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    className={cn(
                      "pr-10",
                      loginForm.formState.errors.password && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              {/* Divider e Google Login */}
              {ALLOW_SIGNUP && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card text-muted-foreground">ou continue com</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={loginWithGoogle}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Chrome className="mr-2 h-5 w-5" />
                    Google
                  </Button>
                </>
              )}
            </form>
          ) : ALLOW_SIGNUP ? (
            /* Register Form */
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-foreground mb-1">
                  Nome completo
                </label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Seu nome"
                  {...registerForm.register('name')}
                  className={cn(
                    registerForm.formState.errors.name && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...registerForm.register('email')}
                  className={cn(
                    registerForm.formState.errors.email && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-foreground mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerForm.register('password')}
                    className={cn(
                      "pr-10",
                      registerForm.formState.errors.password && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="block text-sm font-medium text-foreground mb-1">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerForm.register('confirmPassword')}
                    className={cn(
                      "pr-10",
                      registerForm.formState.errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">ou cadastre-se com</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={loginWithGoogle}
                disabled={isLoading}
                className="w-full"
              >
                <Chrome className="mr-2 h-5 w-5" />
                Google
              </Button>
            </form>
          ) : null}

          {/* Toggle mode link */}
          {ALLOW_SIGNUP && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? (
                <>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary font-medium hover:underline"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary font-medium hover:underline"
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          &copy; {new Date().getFullYear()} Allyra. Todos os direitos reservados.
        </p>
      </div>

      {/* Modal Esqueceu a Senha */}
      <Modal
        isOpen={showForgotPasswordModal}
        onClose={closeForgotPasswordModal}
        title="Recuperar senha"
        size="sm"
      >
        <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
          <ModalBody>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                {...forgotPasswordForm.register('email')}
                className={cn(
                  forgotPasswordForm.formState.errors.email && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {forgotPasswordForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{forgotPasswordForm.formState.errors.email.message}</p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeForgotPasswordModal}
              className="rounded-full px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSendingEmail}
              className="rounded-full px-6 bg-primary hover:bg-primary/90"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link'
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  )
}
