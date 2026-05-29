import type { WasteRow } from '../types'

function fmtVal(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString()
}

type GroupBy = 'Cause' | 'Machine'
type MetricBy = 'Value' | 'Count'

interface Props {
  rows:     WasteRow[]
  groupBy:  GroupBy
  metricBy: MetricBy
  title:    string
}

export function Top10Table({ rows, groupBy, metricBy, title }: Props) {
  // Aggregate
  const aggMap = new Map<string, { value: number; count: number }>()

  rows.forEach(r => {
    const key = (r[groupBy] as string) || '(blank)'
    const existing = aggMap.get(key) ?? { value: 0, count: 0 }
    aggMap.set(key, {
      value: existing.value + (r.Value ?? 0),
      count: existing.count + 1,
    })
  })

  const sorted = Array.from(aggMap.entries())
    .map(([key, { value, count }]) => ({ key, value, count }))
    .sort((a, b) =>
      metricBy === 'Value' ? b.value - a.value : b.count - a.count
    )
    .slice(0, 10)

  const total = sorted.reduce((s, r) => s + (metricBy === 'Value' ? r.value : r.count), 0)

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500">
            <th className="text-left py-1 w-6">#</th>
            <th className="text-left py-1">{groupBy}</th>
            <th className="text-right py-1">{metricBy === 'Value' ? 'Value' : 'Count'}</th>
            <th className="text-right py-1 w-12">%</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const metric = metricBy === 'Value' ? row.value : row.count
            const pct    = total > 0 ? (metric / total) * 100 : 0
            return (
              <tr key={row.key} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-1 text-gray-400">{i + 1}</td>
                <td className="py-1 text-gray-700 max-w-[160px] truncate" title={row.key}>
                  {row.key}
                </td>
                <td className="py-1 text-right font-mono text-gray-700">
                  {metricBy === 'Value' ? fmtVal(metric) : metric.toLocaleString()}
                </td>
                <td className="py-1 text-right text-gray-400">{pct.toFixed(1)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
