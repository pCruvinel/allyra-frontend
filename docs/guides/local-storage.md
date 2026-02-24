# Padrão de LocalStorage - Allyra

Este documento define o padrão de uso do LocalStorage no projeto Allyra.

## Prefixo

Todas as chaves devem usar o prefixo `allyra_` para evitar conflitos com outros apps.

## Chaves Utilizadas

| Chave | Tipo | Descrição | Limpeza no Logout |
|-------|------|-----------|-------------------|
| `allyra_user` | JSON | Dados do usuário logado (cache) | Sim |
| `allyra_clinica` | UUID | ID da clínica atual selecionada | Sim |
| `allyra_theme` | string | Tema da interface (`light` ou `dark`) | Não |
| `allyra_sidebar_collapsed` | boolean | Estado do sidebar (colapsado/expandido) | Não |

## Regras

1. **Prefixo obrigatório**: Sempre usar `allyra_` antes do nome da chave
2. **Logout limpa dados de sessão**: Exceto preferências de UI (tema, sidebar)
3. **Sincronização com banco**: Dados críticos devem ser sincronizados com o Supabase
4. **Validação de tipo**: Sempre validar o tipo de dado ao ler do localStorage

## Implementação de Referência

### Salvar dados

```typescript
// Salvar objeto
localStorage.setItem('allyra_user', JSON.stringify(userData))

// Salvar string simples
localStorage.setItem('allyra_theme', 'dark')

// Salvar booleano
localStorage.setItem('allyra_sidebar_collapsed', 'true')
```

### Ler dados

```typescript
// Ler objeto com validação
const userStr = localStorage.getItem('allyra_user')
const user = userStr ? JSON.parse(userStr) : null

// Ler string com fallback
const theme = localStorage.getItem('allyra_theme') || 'light'

// Ler booleano
const isCollapsed = localStorage.getItem('allyra_sidebar_collapsed') === 'true'
```

### Limpar no logout

```typescript
// Limpar dados de sessão (preserva preferências)
const logout = () => {
  localStorage.removeItem('allyra_user')
  localStorage.removeItem('allyra_clinica')
  // NÃO limpar: allyra_theme, allyra_sidebar_collapsed
}
```

## Contextos que usam localStorage

| Contexto | Chave | Uso |
|----------|-------|-----|
| `AuthContext` | `allyra_user`, `allyra_clinica` | Cache do usuário e clínica |
| `SidebarContext` | `allyra_sidebar_collapsed` | Estado do sidebar |
| (futuro) `ThemeContext` | `allyra_theme` | Preferência de tema |

## Segurança

- **Nunca armazenar** tokens de acesso no localStorage (Supabase gerencia internamente)
- **Nunca armazenar** dados sensíveis como senhas, CPFs completos, etc.
- Os dados em localStorage são apenas cache - a fonte de verdade é o Supabase
