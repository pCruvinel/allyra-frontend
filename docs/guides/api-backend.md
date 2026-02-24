# Guia: API Backend

O Allyra suporta **dois backends intercambiáveis** para a API, permitindo flexibilidade entre desenvolvimento e produção.

## Backends Disponíveis

| Backend | Localização | Endpoints | Runtime | Uso Recomendado |
|---------|-------------|-----------|---------|-----------------|
| **API Node.js** | `./api` | 86 | Node.js + Fastify | Desenvolvimento local |
| **Edge Functions** | `supabase/functions/api-fastify` | 88 | Deno + Fastify | Produção (Supabase) |

## Alternar entre Backends

A variável `VITE_API_URL` no `.env.local` controla qual backend o frontend usa:

```bash
# Opção 1: API Node.js (desenvolvimento local)
VITE_API_URL=http://localhost:3001

# Opção 2: Edge Functions (Supabase)
VITE_API_URL=https://xxx.supabase.co/functions/v1/api-fastify

# Opção 3: API Node.js em produção (Railway/Render)
VITE_API_URL=https://api.allyra.com.br
```

## API Node.js (`./api`)

### Instalação

```bash
cd api
npm install
```

### Configuração

Crie o arquivo `api/.env`:

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
PORT=3001
NODE_ENV=development
```

### Comandos

```bash
npm run dev          # Desenvolvimento (watch mode)
npm run build        # Build TypeScript
npm run start:prod   # Produção
npm test             # Testes E2E
```

### Estrutura

```
api/
├── src/
│   ├── server.ts         # Servidor Fastify (86 endpoints)
│   └── test-api.ts       # Testes E2E
├── docs/                 # Documentação detalhada
├── package.json
└── tsconfig.json
```

### Documentação Interativa

Acesse `http://localhost:3001/docs` para a documentação Scalar UI.

## Edge Functions (Supabase)

### Servir Localmente

```bash
npx supabase functions serve api-fastify --env-file .env.local
```

### Deploy

```bash
npx supabase functions deploy api-fastify
```

### Estrutura

```
supabase/functions/api-fastify/
├── index.ts              # Entry point
├── config/cors.ts        # Headers CORS
├── lib/supabase.ts       # Helpers Supabase
└── routes/               # 88 endpoints modularizados
    ├── auth/
    ├── patients/
    ├── appointments/
    └── ...
```

## Comparativo

| Aspecto | API Node.js | Edge Functions |
|---------|-------------|----------------|
| **Hot Reload** | ✅ tsx --watch | ❌ Reinício manual |
| **Debugging** | ✅ Node.js debugger | ⚠️ Limitado |
| **Logs** | ✅ pino estruturado | ⚠️ console.log |
| **Testes** | ✅ Vitest + Supertest | ❌ N/A |
| **Custo** | ⚠️ $5/mês (Railway) | ✅ Grátis (Supabase) |
| **Cold Start** | ✅ Não | ⚠️ Possível |

## Quando Usar Cada Backend

| Cenário | Backend | Motivo |
|---------|---------|--------|
| Desenvolvimento local | API Node.js | Hot reload, debugging |
| Testes E2E | API Node.js | Execução local |
| Produção (baixo custo) | Edge Functions | Zero custo adicional |
| Produção (controle total) | Railway/Render | Logs, monitoramento |

## Deploy no Railway

### 1. Instalar CLI

```bash
npm install -g @railway/cli
railway login
```

### 2. Criar Projeto

```bash
cd api
railway init
```

### 3. Configurar Variáveis

```bash
railway variables set SUPABASE_URL=xxx
railway variables set SUPABASE_ANON_KEY=xxx
railway variables set SUPABASE_SERVICE_ROLE_KEY=xxx
railway variables set NODE_ENV=production
railway variables set PORT=3001
```

### 4. Deploy

```bash
railway up
```

### 5. Atualizar Frontend

```bash
# .env.local
VITE_API_URL=https://seu-projeto.railway.app
```

## Troubleshooting

### Porta 3001 em uso

```bash
# Windows
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Token não fornecido

Verifique se o header `Authorization: Bearer <token>` está sendo enviado.

### CORS bloqueado

A API Node.js permite `localhost:5173` e `localhost:5174` por padrão. Para produção, configure o CORS no `server.ts`.

## Referências

- [Documentação da API](../../api/docs/)
- [Análise de Migração](../architecture/api-migration-analysis.md)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
