import { useMemo } from 'react'
import { useWasteData } from '../hooks/useWasteData'
import { useFilters }   from '../hooks/useFilters'
import { KpiCard }      from '../components/KpiCard'
import { FilterBar }    from '../components/FilterBar'
import { MonthlyChart } from '../components/MonthlyChart'
import { DeptChart }    from '../components/DeptChart'
import { Top10Table }   from '../components/Top10Table'
import { ParetoChart }  from '../components/ParetoChart'
import { DetailTable }  from '../components/DetailTable'

function Skeleton({ h = 'h-48' }: { h?: string }) {
  return <div className={`${h} bg-gray-100 rounded-lg animate-pulse`} />
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      ⚠ {msg}
    </div>
  )
}

function fmtBig(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString()
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

// ─────────────────────────────────────────────────────────────

export function ReplanPage() {
  const monthly = useWasteData('Replan', 'MONTHLY')
  const dept    = useWasteData('Replan', 'DEPT')
  const detail  = useWasteData('Replan', 'DETAIL')

  // Derive filter options from all rows combined
  const allRows = useMemo(
    () => [...monthly.rows, ...dept.rows, ...detail.rows],
    [monthly.rows, dept.rows, detail.rows]
  )

  const {
    years, depts, setYears, setDepts,
    availableYears, availableDepts, filterRows,
  } = useFilters(allRows)

  const filteredMonthly = useMemo(() => filterRows(monthly.rows), [filterRows, monthly.rows])
  const filteredDept    = useMemo(() => filterRows(dept.rows),    [filterRows, dept.rows])
  const filteredDetail  = useMemo(() => filterRows(detail.rows),  [filterRows, detail.rows])

  // KPI: aggregate from filtered MONTHLY rows
  const kpi = useMemo(() => {
    if (filteredMonthly.length === 0) return null
    const totalActual  = filteredMonthly.reduce((s, r) => s + (r.Actual ?? 0), 0)
    const totalTarget  = filteredMonthly.reduce((s, r) => s + (r.Target ?? 0), 0)
    const totalPrevAvg = filteredMonthly.reduce((s, r) => s + (r.PrevAvg ?? 0), 0)
    const achPct       = totalTarget > 0 ? totalActual / totalTarget : 0
    const vsAvg        = totalPrevAvg > 0 ? (totalActual - totalPrevAvg) / totalPrevAvg : 0
    return { totalActual, totalTarget, achPct, vsAvg }
  }, [filteredMonthly])

  const anyLoading = monthly.loading || dept.loading
  const anyError   = monthly.error ?? dept.error ?? detail.error

  const handleRefresh = () => {
    monthly.refetch()
    dept.refetch()
    detail.refetch()
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <FilterBar
        availableYears={availableYears}
        availableDepts={availableDepts}
        years={years}
        depts={depts}
        onYearsChange={setYears}
        onDeptsChange={setDepts}
        onRefresh={handleRefresh}
      />

      {anyError && <ErrorBox msg={anyError} />}

      {/* KPI Cards */}
      {anyLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0,1,2,3].map(i => <Skeleton key={i} h="h-20" />)}
        </div>
      ) : kpi ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total Actual"   value={fmtBig(kpi.totalActual)}  color="blue" />
          <KpiCard label="Annual Target"  value={fmtBig(kpi.totalTarget)}  color="blue"
            sub="sum of monthly targets" />
          <KpiCard
            label="Achievement %"
            value={fmtPct(kpi.achPct)}
            color={kpi.achPct <= 1 ? 'green' : 'red'}
            sub={kpi.achPct <= 1 ? 'Under target ✓' : 'Over target ✗'}
          />
          <KpiCard
            label="vs Prev Avg"
            value={`${kpi.vsAvg >= 0 ? '+' : ''}${fmtPct(kpi.vsAvg)}`}
            color={kpi.vsAvg <= 0 ? 'green' : 'red'}
          />
        </div>
      ) : null}

      {/* Monthly + Dept side by side */}
      {anyLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton h="h-72" /><Skeleton h="h-72" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MonthlyChart rows={filteredMonthly} />
          <DeptChart    rows={filteredDept}    />
        </div>
      )}

      {/* Top 10 side by side */}
      {anyLoading || detail.loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton h="h-56" /><Skeleton h="h-56" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Top10Table
            rows={filteredDetail}
            groupBy="Cause"
            metricBy="Value"
            title="Top 10 Causes — by Value"
          />
          <Top10Table
            rows={filteredDetail}
            groupBy="Machine"
            metricBy="Count"
            title="Top 10 Machines — by Count"
          />
        </div>
      )}

      {/* Pareto */}
      {detail.loading ? (
        <Skeleton h="h-64" />
      ) : (
        <ParetoChart rows={filteredDetail} groupBy="Cause" />
      )}

      {/* Detail table */}
      {detail.loading ? (
        <Skeleton h="h-64" />
      ) : (
        <DetailTable rows={filteredDetail} dataset="Replan" />
      )}
    </div>
  )
}
