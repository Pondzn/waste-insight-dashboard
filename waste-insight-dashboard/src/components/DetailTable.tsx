import { useState, useMemo } from 'react'
import type { WasteRow, Dataset } from '../types'

const PAGE_SIZE = 50

function fmtVal(v: number | null) {
  if (v === null || v === undefined) return '—'
  if (v >= 1_000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return String(v)
}

interface Props {
  rows:    WasteRow[]
  dataset: Dataset
}

export function DetailTable({ rows, dataset }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const isReplan = dataset === 'Replan'

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.trim().toLowerCase()
    return rows.filter(r =>
      (r.SearchText ?? '').toLowerCase().includes(q) ||
      (r.JO ?? '').toLowerCase().includes(q) ||
      (r.Cause ?? '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header + search */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 shrink-0">Detail Records</h3>
        <span className="text-xs text-gray-400">{filtered.length.toLocaleString()} rows</span>
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search JO, cause, machine…"
          className="ml-auto border border-gray-200 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 w-52"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-gray-500 border-b border-gray-200">
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Dept</th>
              <th className="text-left px-3 py-2">JO</th>
              <th className="text-left px-3 py-2">Code</th>
              {isReplan && <th className="text-left px-3 py-2">Component</th>}
              <th className="text-left px-3 py-2">Machine</th>
              <th className="text-left px-3 py-2">Cause</th>
              <th className="text-right px-3 py-2">Value</th>
              {isReplan && <th className="text-right px-3 py-2">QtyBx</th>}
              <th className="text-right px-3 py-2">QtySheet</th>
              <th className="text-left px-3 py-2">Site</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={isReplan ? 11 : 9} className="text-center py-10 text-gray-400">
                  No records found
                </td>
              </tr>
            ) : pageRows.map((r, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{r.Date ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-700">{r.Dept}</td>
                <td className="px-3 py-1.5 font-mono text-gray-600">{r.JO}</td>
                <td className="px-3 py-1.5 text-gray-600">{r.Code}</td>
                {isReplan && <td className="px-3 py-1.5 text-gray-600">{r.Component || '—'}</td>}
                <td className="px-3 py-1.5 text-gray-600">{r.Machine}</td>
                <td className="px-3 py-1.5 text-gray-700 max-w-[160px] truncate" title={r.Cause}>
                  {r.Cause}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-gray-700">{fmtVal(r.Value)}</td>
                {isReplan && <td className="px-3 py-1.5 text-right font-mono text-gray-500">{fmtVal(r.QtyBx)}</td>}
                <td className="px-3 py-1.5 text-right font-mono text-gray-500">{fmtVal(r.QtySheet)}</td>
                <td className="px-3 py-1.5 text-gray-400">{r.FactorySite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
            >‹ Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
            >Next ›</button>
          </div>
        </div>
      )}
    </div>
  )
}
