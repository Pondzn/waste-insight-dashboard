import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { WasteRow } from '../types'

function achColor(achPct: number): string {
  if (achPct <= 0.75) return '#1a7f37'
  if (achPct <= 0.90) return '#2da44e'
  if (achPct <= 1.00) return '#d4a017'
  if (achPct <= 1.10) return '#e16b2d'
  return '#cf222e'
}

function fmtVal(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return String(v)
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

interface Props {
  rows: WasteRow[]
}

export function DeptChart({ rows }: Props) {
  // Aggregate by dept: sum Actual and Target across filtered months
  const deptMap = new Map<string, { actual: number; target: number }>()

  rows.forEach(r => {
    if (!r.Dept) return
    const existing = deptMap.get(r.Dept) ?? { actual: 0, target: 0 }
    deptMap.set(r.Dept, {
      actual: existing.actual + (r.Actual ?? 0),
      target: existing.target + (r.Target ?? 0),
    })
  })

  const data = Array.from(deptMap.entries())
    .map(([dept, { actual, target }]) => ({
      dept,
      actual,
      target,
      achPct: target > 0 ? actual / target : 0,
    }))
    .sort((a, b) => b.actual - a.actual)

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Waste by Department</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 64, bottom: 4, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={fmtVal}
            tick={{ fontSize: 10, fill: '#57606a' }}
          />
          <YAxis
            type="category"
            dataKey="dept"
            tick={{ fontSize: 11, fill: '#57606a' }}
            width={72}
          />
          <Tooltip
            formatter={(v: number, name: string) => [fmtVal(v), name]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="actual" name="Actual" maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell key={i} fill={achColor(entry.achPct)} />
            ))}
            <LabelList
              dataKey="achPct"
              position="right"
              formatter={fmtPct}
              style={{ fontSize: 10, fill: '#57606a' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
