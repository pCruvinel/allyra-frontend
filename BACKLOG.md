# BACKLOG - Allyra

Backlog consolidado de funcionalidades, melhorias e questões técnicas pendentes.

---

## 🔴 CRÍTICO - Autenticação & Onboarding

### 1. Fluxo de Cadastro Público (Sign Up) & Sistema de Convites

**Status:** ⚠️ BLOQUEADO - `VITE_ALLOW_SIGNUP=false`

**Problema Identificado:**

Atualmente, quando um usuário se cadastra via `/login` (sign up público):

1. ✅ Usuário é criado em `auth.users` pelo Supabase Auth
2. ⚠️ Trigger `handle_new_user()` cria registro em `public.usuarios` com dados **incompletos**
3. ❌ Usuário NÃO é vinculado a nenhuma clínica em `usuarios_clinicas`
4. ❌ Usuário fica "órfão" sem poder acessar nada (RLS bloqueia)

**Dados faltantes no sign up público:**
- `cpf` (obrigatório para identificação)
- `telefone` (obrigatório para contato)
- `data_nascimento` (pode ser obrigatório dependendo do negócio)
- `endereco_completo`, `cidade`, `estado`, `cep` (dados cadastrais)
- `perfil_tipo` (sempre cai em 'secretaria' por padrão)
- **Vínculo à clínica** (CRÍTICO - sem isso, usuário não acessa nada!)

**Cenários a implementar:**

#### Cenário A: Cadastro de nova clínica (self-service)
**Fluxo:**
1. Usuário acessa `/login` e clica em "Criar conta"
2. Preenche formulário com:
   - Email, senha
   - Nome completo, CPF, telefone
   - **Dados da clínica:** nome, CNPJ, endereço
3. Sistema cria:
   - Usuário em `auth.users` + `public.usuarios`
   - **Nova clínica** em `clinicas`
   - Vínculo em `usuarios_clinicas` com `perfil_tipo = 'administrador_total'`
4. Usuário é redirecionado para onboarding da clínica

**Arquivos afetados:**
- `src/pages/Login/LoginPage.tsx` - Adicionar formulário de cadastro completo
- `src/services/auth.service.ts` - Criar `signUpWithClinic()`
- Supabase Edge Function (novo) - `create-clinic-with-admin.ts`
- Migration - Atualizar `handle_new_user()` trigger

#### Cenário B: Convite de usuário para clínica existente ⭐ RECOMENDADO
**Fluxo:**
1. Admin da clínica acessa "Configurações → Usuários"
2. Clica em "Convidar usuário"
3. Preenche modal:
   - Email do convidado
   - **Perfil/tipo de acesso:** admin_total, secretaria, administrativo, profissional
   - **Permissões específicas** (opcional): `{ visualizar_financeiro: false, editar_agenda: true }`
4. Sistema envia email com link de convite único
5. Usuário clica no link, preenche dados cadastrais básicos
6. Sistema cria:
   - Usuário em `auth.users` + `public.usuarios`
   - Vínculo em `usuarios_clinicas` com perfil/permissões pré-definidas
7. Usuário faz login e já tem acesso à clínica

**Arquivos afetados:**
- `src/pages/Configuracoes/tabs/PermissoesTab.tsx` - Adicionar botão "Convidar usuário"
- `src/components/modals/InviteUserModal.tsx` (novo)
- `src/services/invites.service.ts` (novo)
- `supabase/functions/send-invite/index.ts` (novo Edge Function)
- Migration - Criar tabela `user_invites`

**Tabela `user_invites` proposta:**
```sql
CREATE TABLE user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid REFERENCES clinicas(id) NOT NULL,
  invited_by uuid REFERENCES usuarios(id) NOT NULL,
  email text NOT NULL,
  perfil_tipo perfil_tipo NOT NULL,
  permissoes jsonb DEFAULT '{}'::jsonb,
  token text UNIQUE NOT NULL, -- token único do convite
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_user_invites_token ON user_invites(token);
CREATE INDEX idx_user_invites_email ON user_invites(email);
CREATE INDEX idx_user_invites_expires_at ON user_invites(expires_at);
```

---

### 2. Sistema de Permissões Granulares

**Status:** 📋 PLANEJADO

**Problema Atual:**

O campo `usuarios_clinicas.permissoes` existe mas não está sendo usado. Atualmente, o controle de acesso é apenas por `perfil_tipo`:

- `admin_master` → acesso total global
- `administrador_total` → acesso total na clínica
- `secretaria` → acesso operacional
- `administrativo` → visualização
- `profissional` → agenda + prontuário próprio

**Necessidade:**

Permitir permissões customizadas por usuário. Exemplos:

```json
{
  "agenda": {
    "visualizar": true,
    "criar": true,
    "editar": true,
    "deletar": false
  },
  "pacientes": {
    "visualizar": true,
    "criar": true,
    "editar": false,
    "deletar": false
  },
  "financeiro": {
    "visualizar": false,
    "criar": false,
    "editar": false,
    "deletar": false
  },
  "prontuario": {
    "visualizar_todos": false,
    "visualizar_proprios": true,
    "editar": true
  }
}
```

**Arquivos afetados:**
- `src/types/permissions.ts` (novo) - TypeScript interfaces
- `src/hooks/usePermissions.ts` (novo) - Hook para verificar permissões
- `src/contexts/PermissionsContext.tsx` (novo)
- Todas as páginas - Adicionar verificações de permissão antes de renderizar ações
- RLS policies - Adicionar validação de `permissoes` JSONB

**Exemplo de uso:**
```tsx
const { can } = usePermissions()

// No componente
{can('financeiro', 'visualizar') && (
  <Link to="/financeiro">Financeiro</Link>
)}

// No handler
const handleDelete = () => {
  if (!can('pacientes', 'deletar')) {
    toast.error('Você não tem permissão para deletar pacientes')
    return
  }
  // ...
}
```

---

### 3. Atualizar Trigger `handle_new_user()`

**Status:** 📋 PLANEJADO

**Problema:**

O trigger atual assume dados completos do sign up, mas o Supabase Auth só fornece email/nome por padrão.

**Solução proposta:**

Modificar o trigger para:
1. Verificar se existe convite pendente para o email
2. Se SIM: usar dados do convite (perfil, permissões, vínculo à clínica)
3. Se NÃO: criar usuário "pendente de configuração" sem vínculos

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- Verificar se existe convite pendente
  SELECT * INTO v_invite
  FROM user_invites
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > NOW()
  LIMIT 1;

  -- Inserir em public.usuarios
  INSERT INTO public.usuarios (
    id,
    email,
    senha_hash,
    nome_completo,
    perfil_tipo,
    ativo,
    is_test_data
  ) VALUES (
    NEW.id,
    NEW.email,
    'managed_by_supabase_auth',
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(v_invite.perfil_tipo, 'secretaria'::perfil_tipo),
    true,
    false
  );

  -- Se veio de convite, criar vínculo à clínica
  IF v_invite IS NOT NULL THEN
    INSERT INTO usuarios_clinicas (usuario_id, clinica_id, ativo, permissoes)
    VALUES (NEW.id, v_invite.clinica_id, true, v_invite.permissoes);

    -- Marcar convite como aceito
    UPDATE user_invites
    SET accepted_at = NOW()
    WHERE id = v_invite.id;
  END IF;

  RETURN NEW;
END;
$$;
```

---

### 4. Limpeza de Usuários Órfãos (Sem Auth)

**Status:** 🔴 URGENTE - Dados inconsistentes detectados

**Problema:**

Análise revelou **12 usuários órfãos** em `public.usuarios` sem correspondente em `auth.users`:

| Grupo | Quantidade | Ação Recomendada |
|-------|------------|------------------|
| DEMO (30000001-*) | 8 usuários | ❌ Deletar |
| LEGACY (20000001-*) | 4 usuários | ❌ Deletar |
| MODELO (outros) | 0 usuários | - |

**Usuários a deletar:**

**Grupo DEMO:**
1. admin.master@allyra.com.br (admin_master)
2. admin@clinicademo.com.br (administrador_total)
3. socio@clinicademo.com.br (profissional)
4. profissional@clinicademo.com.br (profissional)
5. secretaria@clinicademo.com.br (secretaria)
6. administrativo@clinicademo.com.br (secretaria)
7. financeiro@clinicademo.com.br (financeiro)
8. faturamento@clinicademo.com.br (financeiro)

**Grupo LEGACY:**
1. paulo@vidanova.com.br (administrador_total, INATIVO)
2. juliana@hospitalesperanca.com.br (administrador_total)
3. drsilva@consultorio.com.br (administrador_total, INATIVO)
4. luciana@clinicabemestar.com.br (secretaria)

**Usuários validados nos testes RLS (MANTER):**
1. ✅ anderson@clinicabemestar.com.br - Admin CLIN-001
2. ✅ maria@clinicabemestar.com.br - Secretaria CLIN-001
3. ✅ carlos@clinicabemestar.com.br - Secretaria CLIN-001
4. ✅ ana@clinicabemestar.com.br - Administrativo CLIN-001 (INATIVO)
5. ✅ roberto@saudetotal.com.br - Admin CLIN-002
6. ✅ fernanda@saudetotal.com.br - Secretaria CLIN-002

**Script de limpeza:**
```sql
-- Deletar usuários órfãos do grupo DEMO
DELETE FROM usuarios_clinicas
WHERE usuario_id IN (
  SELECT id FROM usuarios
  WHERE id LIKE '30000001-%'
  AND is_test_data = true
);

DELETE FROM usuarios
WHERE id LIKE '30000001-%'
AND is_test_data = true;

-- Deletar usuários órfãos do grupo LEGACY
DELETE FROM usuarios_clinicas
WHERE usuario_id IN (
  '20000001-0000-4000-a000-000000000007',
  '20000001-0000-4000-a000-000000000008',
  '20000001-0000-4000-a000-000000000009',
  '20000001-0000-4000-a000-000000000010'
);

DELETE FROM usuarios
WHERE id IN (
  '20000001-0000-4000-a000-000000000007',
  '20000001-0000-4000-a000-000000000008',
  '20000001-0000-4000-a000-000000000009',
  '20000001-0000-4000-a000-000000000010'
);
```

---

## 📊 Priorização

| Item | Prioridade | Complexidade | Impacto | Estimativa |
|------|------------|--------------|---------|------------|
| **Limpeza usuários órfãos** | 🔴 CRÍTICA | Baixa | Alto | 1h |
| Sistema de convites | 🔴 ALTA | Alta | Crítico | 2-3 dias |
| Tabela `user_invites` | 🔴 ALTA | Baixa | Crítico | 2h |
| Atualizar trigger `handle_new_user()` | 🔴 ALTA | Média | Crítico | 4h |
| Cadastro público com clínica | 🟡 MÉDIA | Alta | Alto | 3-4 dias |
| Sistema de permissões granulares | 🟡 MÉDIA | Muito Alta | Alto | 5-7 dias |
| Hook `usePermissions()` | 🟡 MÉDIA | Média | Alto | 1 dia |

---

## ✅ Critérios de Aceitação

### Para Limpeza de Usuários Órfãos:
- [ ] Backup dos dados antes de deletar
- [ ] Script SQL executado com sucesso
- [ ] Verificar que apenas 6 usuários de teste permanecem
- [ ] Testes RLS continuam passando (11/11)

### Para Sistema de Convites:
- [ ] Admin consegue enviar convite via email
- [ ] Email contém link único com token
- [ ] Token expira em 7 dias
- [ ] Usuário preenche dados cadastrais ao aceitar
- [ ] Usuário é criado com perfil/permissões do convite
- [ ] Usuário já entra logado após aceitar convite
- [ ] Convite usado/expirado mostra erro amigável

### Para Cadastro Público:
- [ ] Formulário coleta dados completos (CPF, telefone, etc.)
- [ ] Cria nova clínica automaticamente
- [ ] Usuário vira admin da clínica criada
- [ ] Redirecionamento para onboarding pós-cadastro

### Para Sistema de Permissões:
- [ ] Hook `usePermissions()` retorna `can(modulo, acao)`
- [ ] RLS valida permissões JSONB
- [ ] UI esconde elementos sem permissão
- [ ] Toast de erro ao tentar ação não permitida

---

## 🟡 Média Prioridade

### 5. Integração Real com Supabase RPC

**Status:** Parcialmente implementado

**Problema:** Várias funcionalidades usam dados mock em vez de chamar RPCs do Supabase.

**Locais com mock:**
- `AuthContext.tsx`: `mockClinicas` em vez de buscar via RPC
- Seleção de clínica não chama `rpc_set_current_clinica`

**Arquivos relacionados:**
- `src/contexts/AuthContext.tsx`
- `supabase/functions/`

---

### 6. Upload de Avatar no MeuPerfil

**Status:** Não implementado

**Problema:** A foto de perfil só é salva localmente (preview), não persiste no banco.

**Implementação necessária:**
- Usar Supabase Storage para upload
- Salvar URL na coluna `foto_url` da tabela `usuarios`
- Atualizar contexto após upload

---

### 7. Filtros Avançados no Dashboard

**Status:** Não implementado

**Problema:** O botão "Filtrar" apenas faz `console.log()`.

**Implementação necessária:**
- Criar `FilterModal.tsx` com opções de filtro
- Filtros: data, profissional, convênio, status
- Integrar com `DashboardPage.tsx`

---

### 8. Configurar SMTP Gmail/Google

**Status:** Não implementado

**Descrição:** Configurar Supabase para enviar emails via SMTP do Google.

**Implementação necessária:**
- Configurar SMTP no Supabase Dashboard > Settings > Auth
- Testar envio de email de confirmação
- Testar envio de email de recuperação de senha

---

## 🔵 Em Progresso

### 9. Implementação de Handlers CRUD (Console.log → API)

**Status:** Em implementação (Fase 1 e 2 Sprint 3 concluídas)

**Descrição:** O projeto possui 48 handlers que fazem apenas `console.log()` ao invés de salvar dados no Supabase.

**Documento de análise:** [`docs/architecture/analise-handlers-console-log.md`](./docs/architecture/analise-handlers-console-log.md)

**Progresso:**
- **Fase 1 Sprint 1:** ✅ GlobalModals + Agenda
  - `handleConfirmArrival`, `handleCreateAppointment`, `handleConfirmAbsence`
  - `handleStartAttendance`, `handleCancelWaiting`, `handleReschedule`
- **Fase 1 Sprint 2:** ✅ Clientes + Usuários
  - `createClient()`, `updateClient()` no service e hook
  - `createUser()` no service e hook
  - `handleNovoClienteSubmit`, `handleNovoUsuarioSubmit`
- **Fase 2 Sprint 3:** ✅ Dados do Paciente
  - `DadosPessoaisTab.handleSave`, `ContatosTab.handleSave`, `EnderecoTab.handleSave`
  - `AgendamentosSection.handleAppointmentCreate`
- **Fase 2 Sprint 4:** 🔄 Prontuário (pendente)
- **Fase 3 Sprint 5:** 🔄 Configurações (pendente)
- **Fase 3 Sprint 6:** 🔄 Documentos e Storage (pendente)

**Resumo atualizado:**
- **48 handlers** identificados inicialmente
- **~60%** já implementados com API
- **~40%** ainda fazem apenas `console.log()`

**Áreas restantes:**
- Faturamento (5 handlers) - detalhes, falta, finalizar, deletar, alterar
- Financeiro (3 handlers) - boleto, reenviar, bloquear
- Paciente Prontuário (10 handlers) - anamnese, evolução, anexos
- Configurações (7 handlers) - todas as abas
- Documentos/Storage (upload, download, delete)

---

### 10. Migração para Monorepo + API Fastify

**Status:** Análise concluída

**Descrição:** Proposta de migrar o projeto para arquitetura monorepo com API Fastify intermediária.

**Documento de análise:** [`docs/architecture/analise-monorepo-fastify-api.md`](./docs/architecture/analise-monorepo-fastify-api.md)

**Resumo da proposta:**
- Converter projeto para monorepo usando **Turborepo + pnpm**
- Criar API intermediária com **Fastify**
- Compartilhar types e schemas entre frontend e API
- Melhorar segurança (credenciais server-side only)
- Preparar para mobile/partners no futuro

**Estrutura proposta:**
```
allyra/
├── apps/
│   └── web/              # React + Vite atual
├── packages/
│   ├── api/              # Fastify API
│   ├── shared-types/     # Types compartilhados
│   ├── schemas/          # Zod schemas
│   └── api-client/       # Cliente HTTP tipado
└── supabase/             # Migrations
```

**Timeline estimado:** 6-8 semanas

**Decisões pendentes:**
- [ ] Aprovação da equipe para iniciar migração
- [ ] Definir prioridade vs outras features
- [ ] Escolher hosting para API (Railway, Fly.io, etc.)

---

## 🟢 Baixa Prioridade

### 11. Trocar Nome por Logo

**Status:** Preparado

**Local:** `src/pages/Login/LoginPage.tsx` linha 130

**Descrição:** O texto "Allyra" pode ser substituído por uma imagem de logo quando disponível.

---

## ✅ Concluído

### ~~12. Página de Callback OAuth~~
**Status:** ✅ Implementado
- `src/pages/Auth/AuthCallbackPage.tsx`
- Rota `/auth/callback` configurada

### ~~13. Página de Reset de Senha~~
**Status:** ✅ Implementado
- `src/pages/Auth/ResetPasswordPage.tsx`
- Rota `/auth/reset-password` configurada

### ~~14. Code Splitting~~
**Status:** ✅ Implementado
- Lazy loading em todas as páginas
- Manual chunks para vendors
- Bundle reduzido de ~958KB para chunks otimizados

### ~~15. Hook useAppointments~~
**Status:** ✅ Implementado
- `useAppointments`, `useAppointmentOptions` criados
- Modal de agendamento usa dados reais

### ~~16. Cadastro Rápido de Paciente~~
**Status:** ✅ Implementado
- Modal com tabs (Agendamento / Cadastro Rápido)
- Salva paciente no Supabase

### ~~17. Dark Mode~~
**Status:** ✅ Implementado
- ThemeContext criado
- Toggle no sidebar
- Preferência em localStorage

### ~~18. Empty States~~
**Status:** ✅ Implementado
- Componente `EmptyState` reutilizável
- Integrado ao DataTable

### ~~19. Skeletons de Loading~~
**Status:** ✅ Implementado
- 5 variantes de Skeleton
- Integrado ao DataTable

### ~~20. Notificações por Usuário (RLS)~~
**Status:** ✅ Implementado
- Migration RLS criada
- Service + Hook implementados
- Seeds por usuário de teste

---

## 📝 Notas Técnicas

### Segurança
- ⚠️ Validar token de convite no backend (Edge Function), nunca no frontend
- ⚠️ Verificar se email já existe antes de enviar convite
- ⚠️ Rate limiting em envio de convites (max 10/hora por admin)
- ⚠️ Sanitizar inputs de formulário (CPF, email, telefone)

### UX
- Mostrar status do convite: "Pendente", "Aceito", "Expirado"
- Permitir reenviar convite expirado com novo token
- Permitir revogar convite pendente
- Loading states em todos os formulários

### Performance
- Indexar `user_invites.email` e `user_invites.token`
- Cleanup automático de convites expirados (cron job)

---

## 🔗 Dependências Externas

- **Resend.com** ou **SendGrid** para envio de emails
- **Supabase Edge Functions** para lógica de backend
- **Zod** para validação de schemas (já instalado)

---

## 📚 Referências

- [Supabase Auth Triggers](https://supabase.com/docs/guides/auth/auth-hooks/auth-hooks-triggers)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Análise de Handlers CRUD](./docs/architecture/analise-handlers-console-log.md)
- [Análise Monorepo + Fastify](./docs/architecture/analise-monorepo-fastify-api.md)

---

## ⏳ Backlog Futuro - Módulos Não Prioritários

> Funcionalidades planejadas mas **não serão implementadas agora**. Mantidas para referência futura.

### Faturamento Avançado
- [ ] TISS/XML para convênios
- [ ] Geração de guias TUSS
- [ ] Integração NFe (Notas Fiscais)
- [ ] Geração de boletos

### Financeiro Avançado
- [ ] Acordos de pagamento
- [ ] Régua de cobrança automática

### M5 - Portal do Paciente (Módulo Completo)
- [ ] Login do paciente/responsável
- [ ] Agendamento online
- [ ] Visualização de agendamentos
- [ ] Acesso a histórico médico autorizado
- [ ] Download de documentos/receitas
- [ ] Dados pessoais

### Integrações Externas
- [ ] WhatsApp (envio real via API)
- [ ] SMS (envio real via provedor)
- [ ] Teleatendimento (videochamada)

### Relatórios Avançados
- [ ] Relatórios salvos/favoritos

---

## Histórico

| Data | Item | Ação |
|------|------|------|
| 2026-01-10 | Usuários órfãos detectados | Análise e script de limpeza criados |
| 2026-01-10 | Sistema de convites | Adicionado ao backlog crítico |
| 2026-01-10 | Trigger handle_new_user | Proposta de atualização documentada |
| 2026-01-10 | Dark Mode | Implementado (ThemeContext + toggle) |
| 2026-01-10 | Empty States | Implementado (componente + DataTable) |
| 2026-01-10 | Skeletons | Implementado (5 variantes) |
| 2026-01-10 | Notificações RLS | Implementado (migration + service) |
| 2026-01-11 | Seeds Notificações | Implementado (25 notificações distribuídas) |
| 2026-01-09 | Handlers CRUD Fase 2 Sprint 3 | Implementado (Dados do Paciente) |
| 2026-01-09 | Modal Agendamento Reais | Implementado (useAppointmentOptions) |
| 2026-01-09 | Cadastro Rápido Integrado | Implementado (salva no Supabase) |
| 2026-01-08 | Fluxo de Cadastro | Documentado como pendente |
| 2026-01-07 | Code Splitting | Implementado (lazy loading + chunks) |
| 2026-01-20 | Backlog Futuro | Adicionados módulos não prioritários (TISS, Portal Paciente, WhatsApp, etc.) |
