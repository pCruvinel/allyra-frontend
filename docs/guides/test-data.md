# Estratégia de Dados de Teste

Este documento descreve como o Allyra gerencia a separação entre dados de teste e dados de produção.

## Conceito

O sistema usa a variável de ambiente `VITE_IS_PRODUCTION` para determinar o comportamento:

| Ambiente | `VITE_IS_PRODUCTION` | `is_test_data` | Comportamento |
|----------|---------------------|----------------|---------------|
| **Desenvolvimento** | `false` | `true` | Dados marcados como teste |
| **Produção** | `true` | `false` | Dados de teste filtrados |

## Tabelas com Controle de Teste

As seguintes tabelas possuem a coluna `is_test_data`:

- `clinicas`
- `usuarios`
- `pacientes`
- `agendamentos`
- `prontuarios`
- `faturamentos`
- `contas_receber`

### Tabelas sem Controle (Dados Fixos)

Essas tabelas contêm dados de referência e não precisam de `is_test_data`:

- `perfis` (enum de perfis)
- `permissoes` (matriz de permissões)
- `especialidades` (lista fixa)
- `convenios` (planos de saúde)
- `procedimentos_tuss` (tabela TUSS)

## Como Usar

### Serviço de Dados

```typescript
import { dataService } from '@/lib/data-service'

// INSERT - is_test_data é adicionado automaticamente
await dataService.insert('pacientes', {
  nome_completo: 'João Silva',
  cpf: '12345678900',
  clinica_id: 'uuid-da-clinica'
})
// Em dev: insere com is_test_data = true
// Em prod: insere com is_test_data = false

// SELECT - filtra dados de teste em produção
const { data } = await dataService.select('pacientes')
// Em dev: retorna TODOS os dados
// Em prod: retorna apenas is_test_data != true
```

### Hook React

```typescript
import { useDataService } from '@/hooks'

function PacientesPage() {
  const { data, loading, insert, fetchAll } = useDataService<Paciente>({
    table: 'pacientes'
  })

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleCreate = async () => {
    await insert({ nome_completo: 'Maria', cpf: '...' })
    fetchAll() // Recarrega lista
  }
}
```

### Verificar Ambiente

```typescript
import { useEnvironment } from '@/hooks'

function DebugPanel() {
  const { isProduction, testDataMode } = useEnvironment()

  return (
    <div>
      Ambiente: {isProduction ? 'Produção' : 'Desenvolvimento'}
      Dados de teste: {testDataMode}
    </div>
  )
}
```

## Limpeza de Dados de Teste

Para remover todos os dados de teste (apenas em desenvolvimento):

```typescript
import { cleanupTestData } from '@/lib/supabase'

// Só funciona se VITE_IS_PRODUCTION != 'true'
const { success, error } = await cleanupTestData()
```

Ou via SQL (RPC):

```sql
SELECT rpc_cleanup_test_data();
-- Deleta em ordem: contas_receber → faturamentos → prontuarios →
--                  agendamentos → pacientes → usuarios → clinicas
```

## Cascata de Dados

Registros em tabelas SEM `is_test_data` são filtrados via `clinica_id`:

```
clinicas (is_test_data = true)
  └── salas (clinica_id → filtrado por JOIN)
  └── servicos (clinica_id → filtrado por JOIN)
  └── horarios_disponiveis (clinica_id → filtrado por JOIN)
```

## Configuração

### .env.local (Desenvolvimento)

```env
VITE_IS_PRODUCTION=false
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Produção (CI/CD)

```env
VITE_IS_PRODUCTION=true
```

## Boas Práticas

1. **Nunca altere `is_test_data` manualmente** - deixe o sistema gerenciar
2. **Use `dataService` ou `useDataService`** para operações CRUD
3. **Teste a limpeza em dev** antes de ir para produção
4. **Dados de referência** (perfis, especialidades) são compartilhados entre ambientes
