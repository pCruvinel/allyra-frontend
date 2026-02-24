# Início Rápido

## Requisitos

- Node.js 20.12.2 ou superior
- npm ou pnpm
- Git

## Instalação

### 1. Clonar Repositório

```bash
# Via SSH (recomendado)
git clone git@github-allyra:dizevolv/allyra.git

# Via HTTPS
git clone https://github.com/dizevolv/allyra.git

cd allyra
```

### 2. Instalar Dependências

```bash
# Frontend
npm install

# API Node.js (opcional, mas recomendado para desenvolvimento)
cd api && npm install && cd ..
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env.local

# Editar .env.local com suas credenciais:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_API_URL (escolha o backend)
```

### 4. Escolher Backend da API

O projeto suporta dois backends intercambiáveis:

```bash
# Opção A: API Node.js (recomendado para desenvolvimento)
VITE_API_URL=http://localhost:3001

# Opção B: Edge Functions (Supabase)
VITE_API_URL=https://xxx.supabase.co/functions/v1/api-fastify
```

### 5. Iniciar Servidores

**Com API Node.js (recomendado):**
```bash
# Terminal 1 - API
cd api && npm run dev

# Terminal 2 - Frontend
npm run dev
```

**Com Edge Functions:**
```bash
# Terminal 1 - Edge Functions
npx supabase functions serve api-fastify --env-file .env.local

# Terminal 2 - Frontend
npm run dev
```

Acesse: http://localhost:5173

## Comandos Disponíveis

### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (localhost:5173) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Verificar código |
| `npm run test` | Executar testes |
| `npm run test:coverage` | Testes com cobertura |

### API Node.js (pasta `./api`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor API (localhost:3001) |
| `npm run build` | Build TypeScript |
| `npm run start:prod` | Produção |
| `npm test` | Testes E2E |

## Estrutura do Projeto

```
allyra/
├── src/                    # Frontend React
│   ├── components/         # Componentes React
│   ├── contexts/           # React Contexts
│   ├── pages/              # Páginas
│   ├── routes/             # Rotas
│   ├── services/           # apiService (HTTP client)
│   ├── types/              # TypeScript
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilitários
├── api/                    # API Node.js (Fastify)
│   ├── src/server.ts       # 86 endpoints
│   └── docs/               # Documentação da API
├── supabase/
│   ├── functions/          # Edge Functions (Deno)
│   │   └── api-fastify/    # 88 endpoints
│   └── migrations/         # SQL migrations
├── docs/                   # Documentação
└── package.json
```

## Credenciais de Teste

O sistema usa autenticação real via Supabase Auth:

| Email | Senha | Perfil |
|-------|-------|--------|
| admin.master@allyra.com.br | senha123 | admin_master |
| admin@clinicademo.com.br | senha123 | administrador_total |
| profissional@clinicademo.com.br | senha123 | profissional |
| secretaria@clinicademo.com.br | senha123 | secretaria |

## Próximos Passos

1. Leia a [Arquitetura](../architecture/overview.md)
2. Entenda os [Módulos](../architecture/modules.md)
3. Configure o [Backend da API](./api-backend.md)
4. Consulte as [Regras de Negócio](../business/rules.md)

## Configuração SSH (Multi-conta)

Se você trabalha com múltiplas contas GitHub:

```bash
# Ver guia completo
cat .backups/.ssh/GUIA-SSH-MULTIPLAS-CONTAS.md
```

Aliases disponíveis:
- `github-imdouglas`
- `github-gabriel`
- `github-fappssh`
- `github-moradigna`
- `github-adriano`

## Troubleshooting

### Porta 5173 em uso

```bash
# Linux/Mac
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Erro de dependências

```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro de TypeScript

```bash
# Verificar tipos
npx tsc --noEmit
```
