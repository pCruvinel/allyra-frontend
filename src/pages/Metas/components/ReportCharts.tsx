/**
 * ReportCharts - Gráficos de evolução para relatórios de metas
 * Usa Recharts para visualização de dados
 */

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { GoalProgressByMeta, GoalReportStatistics } from '@/types/goals'

// Cores para o gráfico de pizza
const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#6b7280']

interface EvolutionChartProps {
  data: GoalProgressByMeta[]
  className?: string
}

/**
 * Gráfico de linha mostrando evolução ao longo do tempo
 */
export function EvolutionChart({ data, className }: EvolutionChartProps) {
  const chartData = useMemo(() => {
    // Agrupa registros por data
    const dateMap = new Map<string, Record<string, number>>()

    data.forEach((metaData) => {
      const metaTitulo = metaData.meta.titulo || 'Meta'
      metaData.registros.forEach((registro) => {
        const date = new Date(registro.data).toLocaleDateString('pt-BR')
        const valor = parseFloat(registro.valor) || 0

        if (!dateMap.has(date)) {
          dateMap.set(date, {})
        }
        const existing = dateMap.get(date)!
        existing[metaTitulo] = valor
      })
    })

    // Converte para array ordenado por data
    return Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date,
        ...values,
      }))
      .sort((a, b) => {
        // Appending T00:00:00 forces JS to parse in local time, avoiding timezone day-shift bug
        const dateA = new Date(a.date.split('/').reverse().join('-') + 'T00:00:00')
        const dateB = new Date(b.date.split('/').reverse().join('-') + 'T00:00:00')
        return dateA.getTime() - dateB.getTime()
      })
  }, [data])

  const metaNames = useMemo(() => {
    return data.map((d) => d.meta.titulo || 'Meta')
  }, [data])

  // Cores para cada meta
  const lineColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F']

  if (chartData.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-muted-foreground', className)}>
        Sem dados de evolução para exibir
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          {metaNames.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={lineColors[index % lineColors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface StatusDistributionChartProps {
  statistics: GoalReportStatistics
  className?: string
}

/**
 * Gráfico de pizza mostrando distribuição de status
 */
export function StatusDistributionChart({ statistics, className }: StatusDistributionChartProps) {
  const data = useMemo(() => {
    return [
      { name: 'Atingidas', value: statistics.metasAtingidas, color: PIE_COLORS[0] },
      { name: 'Parciais', value: statistics.metasParciais, color: PIE_COLORS[1] },
      { name: 'Não Atingidas', value: statistics.metasNaoAtingidas, color: PIE_COLORS[2] },
      {
        name: 'Pendentes',
        value: statistics.totalMetas - statistics.metasAtingidas - statistics.metasParciais - statistics.metasNaoAtingidas,
        color: PIE_COLORS[3],
      },
    ].filter((item) => item.value > 0)
  }, [statistics])

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-muted-foreground', className)}>
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda customizada */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ProgressComparisonChartProps {
  data: GoalProgressByMeta[]
  className?: string
}

/**
 * Gráfico de barras comparando progresso atual vs meta
 */
export function ProgressComparisonChart({ data, className }: ProgressComparisonChartProps) {
  const chartData = useMemo(() => {
    return data.map((metaData) => {
      const meta = metaData.meta
      const ultimoRegistro = metaData.ultimoRegistro
      const valorAtual = ultimoRegistro ? parseFloat(ultimoRegistro.valor) || 0 : 0
      const valorMeta = parseFloat(meta.meta_esperada) || 0

      return {
        name: meta.titulo || 'Meta',
        atual: valorAtual,
        meta: valorMeta,
        percentual: valorMeta > 0 ? Math.round((valorAtual / valorMeta) * 100) : 0,
      }
    })
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-muted-foreground', className)}>
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string) => [
              value,
              name === 'atual' ? 'Valor Atual' : 'Meta',
            ] as [number, string]}
          />
          <Legend
            formatter={(value: string) => (value === 'atual' ? 'Valor Atual' : 'Meta Esperada')}
          />
          <Bar dataKey="atual" fill="#8884d8" name="atual" radius={[0, 4, 4, 0]} />
          <Bar dataKey="meta" fill="#82ca9d" name="meta" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TrendChartProps {
  data: { date: string; value: number }[]
  title?: string
  color?: string
  className?: string
}

/**
 * Gráfico de linha simples para tendência
 */
export function TrendChart({ data, title, color = '#8884d8', className }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-32 text-muted-foreground text-sm', className)}>
        Sem dados
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [value, 'Valor'] as [number, string]}
            labelFormatter={(label: string) => `Data: ${label}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
