# Configuração do MCP Figma para Claude Code

Este guia explica como configurar o acesso do Claude Code ao Figma via MCP (Model Context Protocol).

## Pré-requisitos

- Node.js instalado (apenas para Opção B)
- Claude Code instalado
- Conta no Figma

## Passo 1: Gerar Personal Access Token no Figma

1. Acesse [figma.com](https://figma.com)
2. Clique no seu **avatar/foto de perfil** (canto superior direito)
3. Selecione **Settings**
4. Role até a seção **Personal access tokens**
5. Clique em **Generate new token**
6. Dê um nome ao token (ex: `claude-mcp`)
7. **Copie e salve o token imediatamente** - ele só é exibido uma vez!

O token terá o formato: `figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Passo 2: Adicionar o MCP ao Claude Code

Escolha uma das opções abaixo:

### Opção A: Figma MCP Oficial (Remoto) - Recomendado

Não requer instalação de pacotes npm. Usa o servidor oficial do Figma.

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

Após adicionar, reinicie o Claude Code e use o comando `/mcp` para autenticar.

### Opção B: Framelink figma-developer-mcp (npm)

Pacote npm da comunidade com boa documentação.

**Windows (PowerShell):**
```powershell
claude mcp add-json "figma" "{\"command\":\"npx\",\"args\":[\"-y\",\"figma-developer-mcp\",\"--stdio\"],\"env\":{\"FIGMA_API_KEY\":\"SEU_TOKEN_AQUI\"}}"
```

**Linux/macOS:**
```bash
claude mcp add-json "figma" '{"command":"npx","args":["-y","figma-developer-mcp","--stdio"],"env":{"FIGMA_API_KEY":"SEU_TOKEN_AQUI"}}'
```

### Opção C: Figma Desktop (Local)

Se você tem o Figma Desktop instalado com o servidor MCP local habilitado:

```bash
claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

## Passo 3: Reiniciar o Claude Code

Após adicionar o MCP, **reinicie o Claude Code** para carregar a nova configuração.

## Verificar Configuração

Para listar os MCPs configurados:

```bash
claude mcp list
```

Para remover o MCP (se necessário):

```bash
claude mcp remove figma
```

## Uso

Após configurado, o Claude Code terá acesso aos seus arquivos do Figma. Você pode:

- Compartilhar links de arquivos Figma
- Pedir para analisar designs
- Extrair especificações (cores, fontes, espaçamentos)
- Converter designs para código

## Troubleshooting

### Token inválido
- Verifique se copiou o token completo
- Gere um novo token se necessário

### MCP não carrega
- Reinicie o Claude Code
- Verifique se o Node.js está instalado corretamente (para Opção B)
- Execute `claude mcp list` para verificar se foi adicionado

### Erro de permissão
- Certifique-se de que o token tem acesso aos arquivos que deseja usar
- Verifique se os arquivos não são restritos no Figma

## Referências

- [Figma MCP Server - Documentação Oficial](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [figma-developer-mcp - npm](https://www.npmjs.com/package/figma-developer-mcp)
- [Figma-Context-MCP - GitHub](https://github.com/GLips/Figma-Context-MCP)
