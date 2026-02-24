import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  PadraoTab,
  OperacionalTab,
  ComunicacaoTab,
  FaturamentoTab,
  AparenciaTab,
  PermissoesTab,
  CadastroRapidoTab,
  SlidesLoginTab,
} from './tabs'
import { useAuth } from '@/contexts/AuthContext'

export function ConfiguracoesPage() {
  const { user } = useAuth()

  // Slides do login visível apenas para admin_master, desenvolvedor e administrador_total
  const canManageSlides =
    user?.perfil_tipo === 'admin_master' ||
    user?.perfil_tipo === 'desenvolvedor' ||
    user?.perfil_tipo === 'administrador_total'

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="padrao" className="w-full">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="padrao">Padrão</TabsTrigger>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          <TabsTrigger value="cadastro-rapido">Cadastro rápido</TabsTrigger>
          {canManageSlides && <TabsTrigger value="slides-login">Slides Login</TabsTrigger>}
        </TabsList>

        <TabsContent value="padrao">
          <PadraoTab />
        </TabsContent>

        <TabsContent value="operacional">
          <OperacionalTab />
        </TabsContent>

        <TabsContent value="comunicacao">
          <ComunicacaoTab />
        </TabsContent>

        <TabsContent value="faturamento">
          <FaturamentoTab />
        </TabsContent>

        <TabsContent value="aparencia">
          <AparenciaTab />
        </TabsContent>

        <TabsContent value="permissoes">
          <PermissoesTab />
        </TabsContent>

        <TabsContent value="cadastro-rapido">
          <CadastroRapidoTab />
        </TabsContent>

        {canManageSlides && (
          <TabsContent value="slides-login">
            <SlidesLoginTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
