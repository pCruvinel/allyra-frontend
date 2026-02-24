import { useEffect, useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search, Copy, Check, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiService } from '@/services/api.service'

// Determinar URL da API baseado no ambiente
function getApiUrl(): string {
  const isProduction = import.meta.env.VITE_IS_PRODUCTION === 'true'
  const appEnv = import.meta.env.VITE_APP_ENV

  // Se está em produção, usar API do Railway
  if (isProduction || appEnv === 'production') {
    return 'https://api.allyra.com.br'
  }

  // Desenvolvimento: usar API local
  return import.meta.env.VITE_API_URL || 'http://localhost:3001'
}

const API_URL = getApiUrl()

// Helper para obter token do usuário logado
function getUserToken(): string | null {
  const token = apiService.getToken()
  if (token) return token
  return localStorage.getItem('allyra_access_token')
}

// Tipo para grupos de tags (x-tagGroups)
interface TagGroup {
  name: string
  tags: string[]
}

// Tipos OpenAPI
interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    description?: string
    version: string
  }
  servers?: Array<{ url: string; description?: string }>
  tags?: Array<{ name: string; description?: string }>
  paths: Record<string, Record<string, OpenAPIOperation>>
  'x-tagGroups'?: TagGroup[]
}

interface OpenAPIOperation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: {
    required?: boolean
    content?: Record<string, { schema?: object }>
  }
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: object }> }>
}

interface OpenAPIParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required?: boolean
  description?: string
  schema?: { type?: string; default?: unknown }
}

interface EndpointInfo {
  path: string
  method: string
  operation: OpenAPIOperation
  tag: string
}

// Cores por método HTTP
const METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  POST: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  PUT: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  PATCH: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
}

// Badge do método HTTP
function MethodBadge({ method }: { method: string }) {
  const colors = METHOD_COLORS[method.toUpperCase()] || METHOD_COLORS.GET
  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-bold rounded uppercase',
      colors.bg, colors.text
    )}>
      {method}
    </span>
  )
}

// Botão de copiar
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </button>
  )
}

// Componente de parâmetros
function ParametersList({ parameters }: { parameters?: OpenAPIParameter[] }) {
  if (!parameters || parameters.length === 0) return null

  const queryParams = parameters.filter(p => p.in === 'query')
  const pathParams = parameters.filter(p => p.in === 'path')
  const headerParams = parameters.filter(p => p.in === 'header')

  const renderParams = (params: OpenAPIParameter[], title: string) => {
    if (params.length === 0) return null
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
        <div className="space-y-2">
          {params.map(param => (
            <div key={param.name} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
              <code className="text-sm font-mono text-primary">{param.name}</code>
              {param.required && <span className="text-xs text-red-500">required</span>}
              <span className="text-xs text-muted-foreground">{param.schema?.type || 'string'}</span>
              {param.description && (
                <span className="text-sm text-muted-foreground ml-auto">{param.description}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-3">Parameters</h3>
      {renderParams(pathParams, 'Path Parameters')}
      {renderParams(queryParams, 'Query Parameters')}
      {renderParams(headerParams, 'Header Parameters')}
    </div>
  )
}

// Componente de respostas
function ResponsesList({ responses }: { responses?: Record<string, { description?: string }> }) {
  if (!responses) return null

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-3">Responses</h3>
      <div className="space-y-2">
        {Object.entries(responses).map(([code, response]) => (
          <div key={code} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
            <span className={cn(
              'px-2 py-0.5 text-xs font-bold rounded',
              code.startsWith('2') ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              code.startsWith('4') ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
              code.startsWith('5') ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
              'bg-muted text-muted-foreground'
            )}>
              {code}
            </span>
            <span className="text-sm text-muted-foreground">{response.description || 'Response'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente Try It Out
function TryItOut({ endpoint, baseUrl }: { endpoint: EndpointInfo; baseUrl: string }) {
  const [params, setParams] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)

  const buildUrl = () => {
    let url = `${baseUrl}${endpoint.path}`
    // Substituir path params
    endpoint.operation.parameters?.filter(p => p.in === 'path').forEach(param => {
      url = url.replace(`{${param.name}}`, params[param.name] || `{${param.name}}`)
    })
    // Adicionar query params
    const queryParams = endpoint.operation.parameters?.filter(p => p.in === 'query' && params[p.name])
    if (queryParams && queryParams.length > 0) {
      const searchParams = new URLSearchParams()
      queryParams.forEach(param => {
        if (params[param.name]) searchParams.append(param.name, params[param.name])
      })
      url += `?${searchParams.toString()}`
    }
    return url
  }

  const executeRequest = async () => {
    setLoading(true)
    setResponse(null)
    setResponseStatus(null)

    try {
      const url = buildUrl()
      const token = getUserToken()

      if (!token) {
        setResponse(JSON.stringify({ error: 'Usuário não autenticado. Faça login para testar os endpoints.' }, null, 2))
        setResponseStatus(401)
        return
      }

      const res = await fetch(url, {
        method: endpoint.method.toUpperCase(),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setResponseStatus(res.status)
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setResponse(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }, null, 2))
      setResponseStatus(500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <h3 className="font-semibold">Try it out</h3>
        <button
          onClick={executeRequest}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
        >
          <Play className="h-4 w-4" />
          {loading ? 'Enviando...' : 'Send Request'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* URL Preview */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">Request URL</label>
          <div className="mt-1 flex items-center gap-2 p-2 bg-muted rounded-md font-mono text-sm">
            <MethodBadge method={endpoint.method} />
            <span className="flex-1 overflow-x-auto">{buildUrl()}</span>
            <CopyButton text={buildUrl()} />
          </div>
        </div>

        {/* Parâmetros editáveis */}
        {endpoint.operation.parameters && endpoint.operation.parameters.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Parameters</label>
            <div className="mt-1 space-y-2">
              {endpoint.operation.parameters.map(param => (
                <div key={param.name} className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded min-w-[120px]">{param.name}</code>
                  <input
                    type="text"
                    placeholder={param.schema?.default?.toString() || param.description || param.name}
                    value={params[param.name] || ''}
                    onChange={e => setParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {param.required && <span className="text-xs text-red-500">*</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response */}
        {response && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-muted-foreground">Response</label>
              {responseStatus && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-bold rounded',
                  responseStatus >= 200 && responseStatus < 300 ? 'bg-green-500/20 text-green-600' :
                  'bg-red-500/20 text-red-600'
                )}>
                  {responseStatus}
                </span>
              )}
            </div>
            <pre className="p-3 bg-zinc-900 text-zinc-100 rounded-md overflow-x-auto text-sm font-mono max-h-96">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente principal do endpoint
function EndpointView({ endpoint, baseUrl }: { endpoint: EndpointInfo; baseUrl: string }) {
  const colors = METHOD_COLORS[endpoint.method.toUpperCase()] || METHOD_COLORS.GET
  const curlCommand = `curl -X ${endpoint.method.toUpperCase()} '${baseUrl}${endpoint.path}' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json'`

  return (
    <div className="p-6">
      {/* Header */}
      <div className={cn('p-4 rounded-lg border', colors.bg, colors.border)}>
        <div className="flex items-center gap-3 mb-2">
          <MethodBadge method={endpoint.method} />
          <code className="text-lg font-mono font-semibold">{endpoint.path}</code>
        </div>
        {endpoint.operation.summary && (
          <p className="text-sm text-muted-foreground">{endpoint.operation.summary}</p>
        )}
      </div>

      {/* Descrição */}
      {endpoint.operation.description && (
        <div className="mt-4">
          <p className="text-muted-foreground">{endpoint.operation.description}</p>
        </div>
      )}

      {/* Código de exemplo */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Example Request</h3>
          <CopyButton text={curlCommand} />
        </div>
        <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg overflow-x-auto text-sm font-mono">
          {curlCommand}
        </pre>
      </div>

      {/* Parâmetros */}
      <ParametersList parameters={endpoint.operation.parameters} />

      {/* Respostas */}
      <ResponsesList responses={endpoint.operation.responses} />

      {/* Try it out */}
      <TryItOut endpoint={endpoint} baseUrl={baseUrl} />
    </div>
  )
}

// Sidebar com suporte a grupos hierárquicos (x-tagGroups)
function Sidebar({
  spec,
  endpoints,
  selectedEndpoint,
  onSelectEndpoint,
  searchQuery,
  onSearchChange
}: {
  spec: OpenAPISpec
  endpoints: EndpointInfo[]
  selectedEndpoint: EndpointInfo | null
  onSelectEndpoint: (endpoint: EndpointInfo) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set())

  // Verificar se tem grupos hierárquicos
  const hasTagGroups = spec['x-tagGroups'] && spec['x-tagGroups'].length > 0

  // Agrupar endpoints por tag
  const endpointsByTag = useMemo(() => {
    const grouped: Record<string, EndpointInfo[]> = {}
    endpoints.forEach(endpoint => {
      const tag = endpoint.tag || 'default'
      if (!grouped[tag]) grouped[tag] = []
      grouped[tag].push(endpoint)
    })
    return grouped
  }, [endpoints])

  // Filtrar tags por busca
  const filterTagsBySearch = (tags: string[]) => {
    if (!searchQuery) return tags
    const query = searchQuery.toLowerCase()
    return tags.filter(tag => {
      const tagMatch = tag.toLowerCase().includes(query)
      const tagEndpoints = endpointsByTag[tag] || []
      const endpointMatch = tagEndpoints.some(
        e => e.path.toLowerCase().includes(query) ||
             e.operation.summary?.toLowerCase().includes(query)
      )
      return tagMatch || endpointMatch
    })
  }

  // Filtrar grupos por busca
  const filteredGroups = useMemo(() => {
    if (!hasTagGroups) return []
    return spec['x-tagGroups']!.filter(group => {
      const filteredTags = filterTagsBySearch(group.tags)
      return filteredTags.length > 0
    })
  }, [spec, searchQuery, endpointsByTag, hasTagGroups])

  // Tags sem grupo (fallback)
  const ungroupedTags = useMemo(() => {
    if (hasTagGroups) {
      const groupedTags = new Set(spec['x-tagGroups']!.flatMap(g => g.tags))
      return Object.keys(endpointsByTag).filter(tag => !groupedTags.has(tag))
    }
    return Object.keys(endpointsByTag)
  }, [spec, endpointsByTag, hasTagGroups])

  const filteredUngroupedTags = useMemo(() => {
    return filterTagsBySearch(ungroupedTags)
  }, [ungroupedTags, searchQuery])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) next.delete(groupName)
      else next.add(groupName)
      return next
    })
  }

  const toggleTag = (tag: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  // Expandir grupo e tag do endpoint selecionado
  useEffect(() => {
    if (selectedEndpoint && hasTagGroups) {
      // Encontrar grupo da tag
      const group = spec['x-tagGroups']!.find(g => g.tags.includes(selectedEndpoint.tag))
      if (group) {
        setExpandedGroups(prev => new Set([...prev, group.name]))
      }
      setExpandedTags(prev => new Set([...prev, selectedEndpoint.tag]))
    } else if (selectedEndpoint) {
      setExpandedTags(prev => new Set([...prev, selectedEndpoint.tag]))
    }
  }, [selectedEndpoint, hasTagGroups, spec])

  // Renderizar lista de endpoints de uma tag
  const renderEndpoints = (tag: string) => {
    const tagEndpoints = endpointsByTag[tag] || []
    if (tagEndpoints.length === 0) return null

    return (
      <div className="pb-1">
        {tagEndpoints.map((endpoint, idx) => {
          const isSelected = selectedEndpoint?.path === endpoint.path &&
                            selectedEndpoint?.method === endpoint.method
          const colors = METHOD_COLORS[endpoint.method.toUpperCase()] || METHOD_COLORS.GET

          return (
            <button
              key={`${endpoint.method}-${endpoint.path}-${idx}`}
              onClick={() => onSelectEndpoint(endpoint)}
              className={cn(
                'w-full flex items-center gap-2 pl-8 pr-4 py-1.5 text-left text-sm transition-colors',
                isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'
              )}
            >
              <span className={cn('text-xs font-bold uppercase w-12 shrink-0', colors.text)}>
                {endpoint.method}
              </span>
              <span className="truncate font-mono text-xs">{endpoint.path}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Renderizar uma tag com seus endpoints
  const renderTag = (tag: string, indentLevel: number = 0) => {
    const tagEndpoints = endpointsByTag[tag] || []
    const isExpanded = expandedTags.has(tag)
    const paddingLeft = indentLevel > 0 ? 'pl-6' : 'pl-4'

    if (tagEndpoints.length === 0) return null

    return (
      <div key={tag}>
        <button
          onClick={() => toggleTag(tag)}
          className={cn(
            'w-full flex items-center gap-2 pr-4 py-2 hover:bg-muted/50 transition-colors text-left',
            paddingLeft
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{tag}</span>
            <span className="ml-2 text-xs text-muted-foreground">({tagEndpoints.length})</span>
          </div>
        </button>
        {isExpanded && renderEndpoints(tag)}
      </div>
    )
  }

  return (
    <div className="w-80 bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">{spec.info.title}</h2>
        <p className="text-xs text-muted-foreground">v{spec.info.version}</p>
      </div>

      {/* Busca */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar endpoints..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Lista hierárquica: Grupos → Tags → Endpoints */}
      <div className="flex-1 overflow-y-auto">
        {/* Renderizar grupos (se existirem) */}
        {hasTagGroups && filteredGroups.map(group => {
          const isGroupExpanded = expandedGroups.has(group.name)
          const filteredTagsInGroup = filterTagsBySearch(group.tags)
          const totalEndpoints = filteredTagsInGroup.reduce(
            (sum, tag) => sum + (endpointsByTag[tag]?.length || 0), 0
          )

          return (
            <div key={group.name} className="border-b last:border-b-0">
              {/* Cabeçalho do grupo */}
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors text-left bg-muted/20"
              >
                {isGroupExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-primary">{group.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">({totalEndpoints})</span>
                </div>
              </button>

              {/* Tags dentro do grupo */}
              {isGroupExpanded && (
                <div className="bg-background">
                  {filteredTagsInGroup.map(tag => renderTag(tag, 1))}
                </div>
              )}
            </div>
          )
        })}

        {/* Renderizar tags sem grupo (ou todas se não houver grupos) */}
        {filteredUngroupedTags.length > 0 && (
          <>
            {hasTagGroups && filteredUngroupedTags.length > 0 && (
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted/20 border-b">
                Outros
              </div>
            )}
            {filteredUngroupedTags.map(tag => renderTag(tag, 0))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-muted-foreground text-center">
        OpenAPI {spec.openapi} {hasTagGroups && `• ${spec['x-tagGroups']!.length} grupos`}
      </div>
    </div>
  )
}

// Página principal
export function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointInfo | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch do OpenAPI spec - tenta múltiplos endpoints possíveis
  useEffect(() => {
    const fetchSpec = async () => {
      // Endpoints possíveis do @fastify/swagger
      const possibleEndpoints = [
        `${API_URL}/documentation/json`,
        `${API_URL}/docs/openapi.json`,
        `${API_URL}/docs/json`,
      ]

      try {
        setLoading(true)

        let data: OpenAPISpec | null = null
        let lastError: Error | null = null

        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`[ApiDocs] Tentando: ${endpoint}`)
            const response = await fetch(endpoint)

            if (response.ok) {
              data = await response.json()
              console.log(`[ApiDocs] Sucesso: ${endpoint}`)
              break
            }
          } catch (e) {
            lastError = e instanceof Error ? e : new Error('Erro desconhecido')
            console.log(`[ApiDocs] Falha em ${endpoint}:`, e)
          }
        }

        if (data) {
          setSpec(data)
        } else {
          throw lastError || new Error('Nenhum endpoint de documentação disponível')
        }
      } catch (err) {
        console.error('[ApiDocs] Erro ao carregar spec:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchSpec()
  }, [])

  // Extrair endpoints do spec
  const endpoints = useMemo(() => {
    if (!spec?.paths) return []

    const result: EndpointInfo[] = []
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        if (typeof operation === 'object' && operation !== null) {
          result.push({
            path,
            method: method.toUpperCase(),
            operation: operation as OpenAPIOperation,
            tag: (operation as OpenAPIOperation).tags?.[0] || 'default'
          })
        }
      })
    })

    return result
  }, [spec])

  // Selecionar primeiro endpoint por padrão
  useEffect(() => {
    if (endpoints.length > 0 && !selectedEndpoint) {
      setSelectedEndpoint(endpoints[0])
    }
  }, [endpoints, selectedEndpoint])

  const baseUrl = spec?.servers?.[0]?.url || API_URL

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando documentação da API...</p>
        </div>
      </div>
    )
  }

  if (error || !spec) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md bg-card rounded-xl border border-border p-8">
          <div className="text-destructive text-6xl mb-4">!</div>
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar API Docs</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Sidebar */}
      <div className="rounded-xl overflow-hidden border border-border shadow-sm shrink-0">
        <Sidebar
          spec={spec}
          endpoints={endpoints}
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={setSelectedEndpoint}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Content */}
      <div className="flex-1 bg-card rounded-xl border border-border overflow-y-auto shadow-sm">
        {selectedEndpoint ? (
          <EndpointView endpoint={selectedEndpoint} baseUrl={baseUrl} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Selecione um endpoint na sidebar
          </div>
        )}
      </div>
    </div>
  )
}
