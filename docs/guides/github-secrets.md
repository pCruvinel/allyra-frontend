# Configuração de Secrets no GitHub

Este guia explica como configurar os secrets necessários para os workflows de CI/CD funcionarem corretamente.

## Secrets Necessários

### Supabase

| Secret | Descrição | Onde encontrar |
|--------|-----------|----------------|
| `SUPABASE_ACCESS_TOKEN` | Token de acesso da CLI | [Account Settings > Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | Referência do projeto | URL do dashboard: `https://supabase.com/dashboard/project/<PROJECT_REF>` |
| `SUPABASE_DB_PASSWORD` | Senha do banco de dados | [Project Settings > Database](https://supabase.com/dashboard/project/_/settings/database) |
| `VITE_SUPABASE_URL` | URL do projeto | [Project Settings > API](https://supabase.com/dashboard/project/_/settings/api) |
| `VITE_SUPABASE_ANON_KEY` | Chave anon/public | [Project Settings > API](https://supabase.com/dashboard/project/_/settings/api) |

### Cloudflare (Opcional - para deploy)

| Secret | Descrição | Onde encontrar |
|--------|-----------|----------------|
| `CLOUDFLARE_API_TOKEN` | Token da API | [API Tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | ID da conta | URL do dashboard ou [Overview](https://dash.cloudflare.com) |

### Variables (Repositório)

| Variable | Descrição | Valor |
|----------|-----------|-------|
| `DEPLOY_TO_CLOUDFLARE` | Ativar deploy Cloudflare | `true` ou `false` |

## Como Configurar

### Passo 1: Acessar Configurações do Repositório

1. Vá para o repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** > **Actions**

### Passo 2: Adicionar Secrets

1. Clique em **New repository secret**
2. Nome: Digite o nome exato do secret (ex: `SUPABASE_ACCESS_TOKEN`)
3. Valor: Cole o valor do secret
4. Clique em **Add secret**

### Passo 3: Obter Tokens do Supabase

#### Access Token (CLI)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Clique no seu avatar > **Account preferences**
3. Vá para **Access Tokens**
4. Clique em **Generate new token**
5. Dê um nome (ex: "GitHub Actions - Allyra")
6. Copie o token gerado (só aparece uma vez!)

#### Project Ref

O Project Ref é o ID único do seu projeto:
- URL do dashboard: `https://supabase.com/dashboard/project/zmauhpjprcxszjrahoqb`
- Neste caso: `zmauhpjprcxszjrahoqb`

#### Database Password

1. No dashboard do projeto
2. **Settings** > **Database**
3. Seção **Connection info**
4. A senha é definida na criação do projeto

### Passo 4: Verificar Configuração

Após configurar todos os secrets:

1. Faça um commit na branch `dev`
2. Crie um PR de `dev` para `main`
3. Verifique se o workflow de test passa
4. Faça merge para `main`
5. Verifique se o workflow de deploy executa corretamente

## Estrutura dos Workflows

```
.github/workflows/
├── test.yml    # Executa em PRs e pushes para dev
└── deploy.yml  # Executa apenas em pushes para main
```

### test.yml

- **Trigger:** PRs para dev/main, pushes para dev
- **Jobs:**
  - `lint-and-type-check`: ESLint + TypeScript
  - `test`: Vitest
  - `build`: Build de verificação

### deploy.yml

- **Trigger:** Push para main (merge de PR)
- **Jobs:**
  - `test`: Gate de qualidade
  - `migrate`: Aplica migrations no Supabase
  - `build`: Build de produção
  - `deploy-cloudflare`: Deploy (se habilitado)
  - `notify`: Resumo do deploy

## Troubleshooting

### Erro: "Supabase CLI not authenticated"

Verifique se `SUPABASE_ACCESS_TOKEN` está configurado corretamente.

### Erro: "Project not found"

Verifique se `SUPABASE_PROJECT_REF` está correto.

### Erro: "Migration failed"

1. Verifique o log do erro
2. Acesse o SQL Editor no Supabase Dashboard
3. Execute a migration manualmente para debug

### Workflow não executa

- Verifique se está na branch correta
- Verifique se os arquivos YAML estão em `.github/workflows/`
- Verifique se os triggers estão corretos
