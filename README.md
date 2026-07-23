# Allyra SaaS

Frontend do Sistema de Gestão Integrado para Clínicas de Saúde.

## Repositório

```
https://github.com/pCruvinel/allyra-frontend.git
```

## Repositórios Relacionados

| Repositório | Descrição |
|-------------|-----------|
| [allyra-api](https://github.com/allyra-dizevolv/allyra-api) | Backend Node.js + Migrations |

## Sobre

Allyra é uma plataforma SaaS multi-tenant para gestão completa de clínicas de saúde, incluindo agendamentos, prontuário eletrônico, faturamento, financeiro e muito mais.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Roteamento:** TanStack Router
- **UI:** Tailwind CSS + Shadcn/ui + Radix UI
- **Ícones:** Lucide React
- **Formulários:** React Hook Form + Zod
- **Testes:** Vitest + V8 Coverage
- **Backend:** Dual - Supabase Edge Functions **ou** API Node.js (Fastify)
- **Banco de Dados:** Supabase (PostgreSQL + Auth + RLS)

## Requisitos

- Node.js 20.12.2 ou superior
- npm ou pnpm

## Instalação

```bash
# Clonar repositório
git clone https://github.com/pCruvinel/allyra-frontend.git
cd allyra-frontend

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Iniciar desenvolvimento
npm run dev
```

## API Backend

O frontend suporta **dois backends intercambiáveis** via variável `VITE_API_URL`:

| Backend | URL | Uso |
|---------|-----|-----|
| Edge Functions | `https://xxx.supabase.co/functions/v1/api-fastify` | Produção (Supabase) |
| API Node.js | `http://localhost:3001` | Desenvolvimento local |
| API Node.js | `https://api.allyra.com.br` | Produção (Railway) |

```bash
# .env.local - Escolha o backend
VITE_API_URL=http://localhost:3001              # API Node.js local
# VITE_API_URL=https://xxx.supabase.co/functions/v1/api-fastify  # Edge Functions
```

> Para rodar a API Node.js localmente, clone o repositório [allyra-api](https://github.com/allyra-dizevolv/allyra-api).

## Comandos

```bash
npm run dev          # Servidor de desenvolvimento (localhost:5173)
npm run build        # Build de produção (TypeScript + Vite)
npm run preview      # Preview do build
npm run lint         # Verificar código com ESLint
npm run test         # Executar testes
npm run test:coverage # Testes com cobertura
```

## Estrutura do Projeto

```
allyra-saas/
├── src/                    # Frontend React
│   ├── components/         # Componentes React
│   │   ├── ui/             # Componentes base (Shadcn)
│   │   ├── layout/         # Layout principal
│   │   ├── modals/         # Modais globais
│   │   ├── calendar/       # Componentes de calendário
│   │   └── chat/           # Chat interno
│   ├── contexts/           # React Contexts (Auth, Modal, Sidebar, Theme)
│   ├── pages/              # Páginas organizadas por feature
│   ├── routes/             # Configuração TanStack Router
│   ├── types/              # Tipos TypeScript
│   ├── services/           # apiService (HTTP client)
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilitários
├── supabase/
│   └── functions/          # Edge Functions (backend alternativo)
│       └── api-fastify/    # API Deno - 88 endpoints
├── docs/                   # Documentação do frontend
└── public/                 # Assets estáticos
```

## Módulos do Sistema

| # | Módulo | Descrição |
|---|--------|-----------|
| M1 | Agenda & Recepção | Agendamentos, presença, confirmação |
| M2 | Prontuário Eletrônico | Registros clínicos com assinatura digital |
| M3 | Faturamento & Repasse | Cálculo de comissões para profissionais |
| M4 | Multi-Clínica | Segregação de dados por tenant |
| M5 | Área do Paciente | Portal do paciente |
| M6 | Integrações | WhatsApp, teleatendimento, exportações |
| M7 | Relatórios | Filtros, colunas personalizáveis, export |
| M8 | Financeiro | Contas a receber/pagar, cobrança, acordos |
| M9 | Faturamento | Pré-faturamento, TISS/XML |
| M10 | Evolução Terapêutica | Planos de tratamento e metas |

## Documentação

Consulte a pasta [docs/](./docs/) para documentação detalhada:

- [Arquitetura](./docs/architecture/)
- [Regras de Negócio](./docs/business/)
- [Guias](./docs/guides/)

## Features Implementadas

- **Dark Mode**: Toggle de tema claro/escuro no sidebar (salvo em localStorage)
- **Skeleton Loading**: Componentes de loading animados para melhor UX
- **Empty States**: Estados vazios personalizáveis em listagens
- **Notificações RLS**: Políticas de segurança para notificações por usuário
- **Filtros com Badge**: Indicador visual de filtros ativos em tabelas
- **Cadastro Rápido**: Modal de agendamento com tabs para cadastro de paciente
- **Seletor de Clínicas**: Admin/Dev podem trocar entre clínicas no sidebar

## Perfis de Usuário

O sistema possui **9 perfis** com permissões diferentes:

| Perfil | Descrição | Acesso Admin |
|--------|-----------|--------------|
| `admin_master` | Administrador global do SaaS | Total |
| `desenvolvedor` | Desenvolvedor com acesso total | Total |
| `administrador_total` | Admin da clínica | Total |
| `socio_profissional` | Sócio que também atende | Limitado |
| `profissional` | Profissional de saúde | — |
| `secretaria` | Recepção e agendamentos | — |
| `administrativo` | Suporte administrativo | — |
| `financeiro` | Gestão financeira | — |
| `faturamento` | Faturamento e convênios | — |

## Banco de Dados

As migrations e seeds estão no repositório [allyra-api](https://github.com/allyra-dizevolv/allyra-api).

Para rodar migrations:

```bash
# Clone o repositório da API
git clone https://github.com/allyra-dizevolv/allyra-api.git

# Execute as migrations
cd allyra-api
npx supabase db push
```

## Status

Em desenvolvimento - Frontend funcional integrado com Supabase.

## Licença

Proprietário - Todos os direitos reservados.
