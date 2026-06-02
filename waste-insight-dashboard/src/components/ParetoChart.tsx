import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { WasteRow } from '../types'

function fmtVal(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}

interface Props {
  rows:    WasteRow[]
  groupBy?: 'Cause' | 'Machine'
}

export function ParetoChart({ rows, groupBy = 'Cause' }: Props) {
  // Aggregate by groupBy key, sort descending, compute cumulative %
  const aggMap = new Map<string, number>()
  rows.forEach(r => {
    const key = (r[groupBy] as string) || '(blank)'
    aggMap.set(key, (aggMap.get(key) ?? 0) + (r.Value ?? 0))
  })

  const sorted = Array.from(aggMap.entries())
    .sort((a, b) => b[1] - a[1])

  const grandTotal = sorted.reduce((s, [, v]) => s + v, 0)

  let cumulative = 0
  const data = sorted.map(([key, value]) => {
    cumulative += value
    return {
      name:    key.length > 16 ? key.slice(0, 15) + '…' : key,
      fullName: key,
      value,
      cumPct: grandTotal > 0 ? (cumulative / grandTotal) * 100 : 0,
    }
  })

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Pareto — {groupBy}</h3>
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Pareto — {groupBy}
        <span className="ml-2 text-xs text-gray-400 font-normal">by Value</span>
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 48, bottom: 56, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#57606a' }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          {/* Left Y: value */}
          <YAxis
            yAxisId="left"
            tickFormatter={fmtVal}
            tick={{ fontSize: 10, fill: '#57606a' }}
            width={48}
          />
          {/* Right Y: cumulative % */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#8250df' }}
            width={40}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, name: any) =>
              name === 'cumPct' ? [`${Number(v).toFixed(1)}%`, 'Cumulative %'] : [fmtVal(Number(v)), 'Value']
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={(_: any, payload: any) =>
              payload?.[0]?.payload?.fullName ?? ''
            }
          />
          {/* 80% reference line */}
          <ReferenceLine yAxisId="right" y={80} stroke="#d4a017" strokeDasharray="4 3"
            label={{ value: '80%', position: 'right', fontSize: 10, fill: '#d4a017' }}
          />
          <Bar yAxisId="left" dataKey="value" name="Value" fill="#1f6feb" opacity={0.75} maxBarSize={40} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumPct"
            name="cumPct"
            stroke="#8250df"
            strokeWidth={2}
            dot={{ r: 2, fill: '#8250df' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
