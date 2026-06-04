import { useState, useMemo, useRef, useEffect } from 'react'
import type { WasteRow, Dataset } from '../types'

const PAGE_SIZE = 20

function fmtK(v: number | null) {
  if (!v && v !== 0) return '—'
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v/1_000).toFixed(1)}k`
  return v.toLocaleString()
}
function fmtFull(v: number | null) {
  if (!v && v !== 0) return '—'
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
}
function fmtDate(s: string | null) {
  if (!s) return '—'
  const p = s.split('-')
  return p.length >= 3 ? `${p[0]}-${p[1]}-${p[2].slice(2)}` : s
}

type SortKey = 'Date' | 'JO' | 'Dept' | 'Value'
type SortDir  = 'asc' | 'desc'

// ── Column filter dropdown ─────────────────────────────────────
interface ColFilterProps {
  colKey:   string
  values:   string[]
  selected: string[]
  onChange: (v: string[]) => void
}

function ColFilter({ colKey, values, selected, onChange }: ColFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const active = selected.length > 0
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])

  return (
    <div ref={ref} className="relative inline-block ml-1">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title={`Filter ${colKey}`}
        className={`text-[10px] px-1 rounded transition-colors ${active ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-500'}`}>
        {active ? `▼(${selected.length})` : '▼'}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 min-w-[160px] max-w-[240px] bg-white border border-slate-200 rounded-lg shadow-xl py-1 max-h-60 overflow-auto"
          onClick={e => e.stopPropagation()}>
          {/* All / Clear */}
          <div className="flex gap-2 px-3 py-1.5 border-b border-slate-100">
            <button onClick={() => onChange([])} className="text-xs text-blue-600 hover:underline">All</button>
            <span className="text-slate-200">|</span>
            <button onClick={() => onChange(values)} className="text-xs text-slate-400 hover:underline">Select all</button>
          </div>
          {values.slice(0, 200).map(v => (
            <label key={v} className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-slate-50 text-xs text-slate-700">
              <input type="checkbox" checked={selected.includes(v)} onChange={() => toggle(v)} className="accent-blue-600 w-3 h-3"/>
              <span className="truncate" title={v}>{v || '(blank)'}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
interface Props { rows: WasteRow[]; dataset: Dataset }

export function DetailTable({ rows, dataset }: Props) {
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('Date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [tooltip, setTooltip] = useState<{ row: WasteRow; x: number; y: number } | null>(null)
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({})

  const isReplan = dataset === 'Replan'

  // Unique values per column (for filter dropdown)
  const uniqueVals = useMemo(() => {
    const get = (fn: (r: WasteRow) => string) =>
      Array.from(new Set(rows.map(fn).filter(Boolean))).sort()
    return {
      Date:    get(r => fmtDate(r.Date)),
      JO:      get(r => String(r.JO ?? '')),
      Comp:    get(r => r.Component || r.Code || ''),
      Machine: get(r => r.Machine || ''),
      Problem: get(r => r.Problem || r.Cause || ''),
      Dept:    get(r => r.Dept || ''),
      JORef:   get(r => String(r.JORef || '')),
    }
  }, [rows])

  const setFilter = (col: string, vals: string[]) =>
    setColFilters(f => ({ ...f, [col]: vals }))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      // text search
      if (q && !(r.SearchText??'').toLowerCase().includes(q) && !String(r.JO??'').toLowerCase().includes(q)) return false
      // column filters
      if (colFilters.Date?.length    && !colFilters.Date.includes(fmtDate(r.Date)))            return false
      if (colFilters.JO?.length      && !colFilters.JO.includes(String(r.JO??'')))             return false
      if (colFilters.Comp?.length    && !colFilters.Comp.includes(r.Component||r.Code||''))    return false
      if (colFilters.Machine?.length && !colFilters.Machine.includes(r.Machine||''))           return false
      if (colFilters.Problem?.length && !colFilters.Problem.includes(r.Problem||r.Cause||'')) return false
      if (colFilters.Dept?.length    && !colFilters.Dept.includes(r.Dept||''))                 return false
      if (colFilters.JORef?.length   && !colFilters.JORef.includes(String(r.JORef||'')))       return false
      return true
    })
  }, [rows, search, colFilters])

  const sorted = useMemo(() => [...filtered].sort((a,b) => {
    let d = 0
    if (sortKey==='Date')  d = (a.Date??'').localeCompare(b.Date??'')
    if (sortKey==='JO')    d = String(a.JO??'').localeCompare(String(b.JO??''))
    if (sortKey==='Dept')  d = (a.Dept??'').localeCompare(b.Dept??'')
    if (sortKey==='Value') d = (a.Value??0) - (b.Value??0)
    return sortDir==='desc' ? -d : d
  }), [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const curPage    = Math.min(page, totalPages)
  const pageRows   = sorted.slice((curPage-1)*PAGE_SIZE, curPage*PAGE_SIZE)
  const totalValue = filtered.reduce((s,r) => s + (r.Value??0), 0)
  const activeFilterCount = Object.values(colFilters).filter(v => v.length > 0).length

  const toggleSort = (k: SortKey) => {
    if (sortKey===k) setSortDir(d => d==='desc'?'asc':'desc')
    else { setSortKey(k); setSortDir('desc') }
    setPage(1)
  }
  const thSort = (k: SortKey) => `cursor-pointer select-none hover:text-blue-600 ${sortKey===k ? 'text-blue-600' : ''}`

  const clearAllFilters = () => setColFilters({})

  // Th helper: sort + col filter
  const Th = ({ label, sortK, colK, vals }: { label: string; sortK?: SortKey; colK?: string; vals?: string[] }) => (
    <th className="px-3 py-2 text-left whitespace-nowrap">
      <div className="flex items-center gap-0.5">
        {sortK ? (
          <span className={`${thSort(sortK)}`} onClick={() => toggleSort(sortK)}>
            {label} {sortKey===sortK ? (sortDir==='desc'?'↓':'↑') : ''}
          </span>
        ) : (
          <span className="text-slate-400">{label}</span>
        )}
        {colK && vals && (
          <ColFilter
            colKey={colK}
            values={vals}
            selected={colFilters[colK] ?? []}
            onChange={v => { setFilter(colK, v); setPage(1) }}
          />
        )}
      </div>
    </th>
  )

  return (
    <div className="card min-h-[200px] relative" onMouseLeave={() => setTooltip(null)}>
      {/* Color legend */}
      <div className="flex items-center gap-3 px-4 pt-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-200 inline-block"/>Value ≥ 5,000</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-100 border border-yellow-200 inline-block"/>เพิ่มใหม่ 7 วัน</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <h3 className="card-title shrink-0">Detail Records</h3>
        <span className="text-xs text-slate-400">{filtered.length.toLocaleString()} rows</span>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters}
            className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50">
            ✕ Clear {activeFilterCount} column filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search JO, cause, machine…"
          className="ml-auto w-52 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-slate-50"/>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr className="text-slate-500 border-b border-slate-200">
              <th className="px-3 py-2 text-left w-6">#</th>
              <Th label="Date"    sortK="Date"  colK="Date"    vals={uniqueVals.Date}/>
              <Th label="JO"      sortK="JO"    colK="JO"      vals={uniqueVals.JO}/>
              <Th label="Comp"                  colK="Comp"    vals={uniqueVals.Comp}/>
              {isReplan && <Th label="JO Ref"   colK="JORef"   vals={uniqueVals.JORef}/>}
              <Th label="Machine"               colK="Machine" vals={uniqueVals.Machine}/>
              <Th label="Problem"               colK="Problem" vals={uniqueVals.Problem}/>
              <Th label="Dept"    sortK="Dept"  colK="Dept"    vals={uniqueVals.Dept}/>
              <Th label="Value"   sortK="Value"/>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={isReplan?9:8} className="text-center py-10 text-slate-400">No records</td></tr>
            ) : pageRows.map((r,i) => {
              const isNew = (() => {
                if (!r.Date) return false
                const p = r.Date.split('-')
                const MONTH_IDX: Record<string,number> = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11}
                const d = new Date(Number(p[2]), MONTH_IDX[p[1]]??0, Number(p[0]))
                return (Date.now() - d.getTime()) <= 7*24*60*60*1000
              })()
              const isBig = (r.Value ?? 0) >= 5000
              const rowBg = isNew ? 'bg-yellow-50 hover:bg-yellow-100/60' : isBig ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-blue-50/40'
              return (
                <tr key={i} className={`border-b border-slate-50 transition-colors ${rowBg}`}
                  onMouseEnter={ev => {
                    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
                    setTooltip({ row: r, x: rect.right, y: rect.top })
                  }}
                >
                  <td className="px-3 py-1.5 text-slate-300">{(curPage-1)*PAGE_SIZE+i+1}</td>
                  <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">{fmtDate(r.Date)}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-600">{String(r.JO ?? '')}</td>
                  <td className="px-3 py-1.5 text-slate-700 max-w-[100px] truncate" title={r.Component||r.Code}>{r.Component||r.Code}</td>
                  {isReplan && <td className="px-3 py-1.5 text-slate-400">{r.JORef||'—'}</td>}
                  <td className="px-3 py-1.5 text-slate-600">{r.Machine}</td>
                  <td className="px-3 py-1.5 text-slate-700 max-w-[140px] truncate" title={r.Problem||r.Cause}>{r.Problem||r.Cause}</td>
                  <td className="px-3 py-1.5 text-slate-600">{r.Dept}</td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    <span title={fmtFull(r.Value)} className={isBig ? 'text-red-600 font-semibold' : 'text-slate-800'}>
                      {fmtK(r.Value)}
                    </span>
                    {isNew && <span className="ml-1 text-[9px] bg-yellow-200 text-yellow-800 px-1 rounded font-medium">NEW</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-xs text-slate-700">
              <td colSpan={isReplan?8:7} className="px-3 py-2 text-slate-500">
                Total ({filtered.length.toLocaleString()} rows)
              </td>
              <td className="px-3 py-2 text-right font-mono">
                <span title={fmtFull(totalValue)}>{fmtK(totalValue)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
          <span>Page {curPage} / {totalPages}</span>
          <div className="flex gap-1">
            {[['«',1],['‹',curPage-1],['›',curPage+1],['»',totalPages]].map(([label,target],i) => (
              <button key={i}
                onClick={() => setPage(Math.max(1, Math.min(totalPages, Number(target))))}
                disabled={(i<2&&curPage===1)||(i>=2&&curPage===totalPages)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs pointer-events-none max-w-[260px]"
          style={{ top: Math.min(tooltip.y, window.innerHeight-220), left: Math.min(tooltip.x+8, window.innerWidth-276) }}>
          <div className="font-semibold text-slate-800 mb-2">{String(tooltip.row.JO ?? '')}</div>
          <div className="space-y-1 text-slate-600">
            <div><span className="text-slate-400">Date:</span> {tooltip.row.Date??'—'}</div>
            <div><span className="text-slate-400">Dept:</span> {tooltip.row.Dept}</div>
            <div><span className="text-slate-400">Comp:</span> {tooltip.row.Component||tooltip.row.Code}</div>
            {isReplan && <div><span className="text-slate-400">JO Ref:</span> {tooltip.row.JORef||'—'}</div>}
            <div><span className="text-slate-400">Machine:</span> {tooltip.row.Machine}</div>
            <div><span className="text-slate-400">Problem:</span> {tooltip.row.Problem||tooltip.row.Cause}</div>
            <div><span className="text-slate-400">Value:</span> <strong className="text-slate-800">{fmtFull(tooltip.row.Value)}</strong></div>
            <div><span className="text-slate-400">QtySheet:</span> {fmtFull(tooltip.row.QtySheet)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
