import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Line, ComposedChart, Legend,
} from 'recharts'
import type { WasteRow } from '../types'

// ─── color by achievement % (waste context: lower actual = better) ───
// AchPct = Actual / Target: >1 is bad (over target), <1 is good
function achColor(achPct: number): string {
  if (achPct <= 0.75) return '#1a7f37' // very good – dark green
  if (achPct <= 0.90) return '#2da44e' // good – green
  if (achPct <= 1.00) return '#d4a017' // on target – amber
  if (achPct <= 1.10) return '#e16b2d' // slightly over – orange
  return '#cf222e'                      // over target – red
}

function fmtVal(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return String(v)
}

interface Props {
  rows: WasteRow[]
}

export function MonthlyChart({ rows }: Props) {
  // Aggregate: one data point per (CalendarYear-MonthNo) sorted chronologically
  const monthlyMap = new Map<string, { label: string; actual: number; target: number; prevAvg: number; achPct: number }>()

  rows.forEach(r => {
    const key = `${r.CalendarYear}-${String(r.MonthNo).padStart(2, '0')}`
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        label:   `${r.MonthName} ${r.CalendarYear}`,
        actual:  r.Actual,
        target:  r.Target,
        prevAvg: r.PrevAvg,
        achPct:  r.AchPct,
      })
    }
  })

  const data = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v)

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Waste Trend</h3>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#57606a' }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={fmtVal}
            tick={{ fontSize: 10, fill: '#57606a' }}
            width={48}
          />
          <Tooltip
            formatter={(v: number, name: string) => [fmtVal(v), name]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

          {/* Bars colored by AchPct */}
          <Bar dataKey="actual" name="Actual" maxBarSize={36}>
            {data.map((entry, i) => (
              <Cell key={i} fill={achColor(entry.achPct)} />
            ))}
          </Bar>

          {/* Target — dashed reference line (single value per series via Line) */}
          <Line
            dataKey="target"
            name="Target"
            stroke="#1f6feb"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            type="monotone"
          />

          {/* Prev FY Avg — dotted */}
          <Line
            dataKey="prevAvg"
            name="Prev Avg"
            stroke="#8250df"
            strokeWidth={1.5}
            strokeDasharray="2 3"
            dot={false}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
