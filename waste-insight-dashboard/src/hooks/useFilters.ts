import { useMemo, useState } from 'react'
import type { WasteRow } from '../types'

export interface UseFiltersResult {
  years:          number[]
  depts:          string[]
  setYears:       (v: number[]) => void
  setDepts:       (v: string[]) => void
  availableYears: number[]
  availableDepts: string[]
  filterRows:     (rows: WasteRow[]) => WasteRow[]
}

/**
 * Shared filter state for a single page (Replan or Addpaper).
 * Pass ALL rows (any RecordType mix) to derive available options;
 * call filterRows() to apply the active selection.
 */
export function useFilters(allRows: WasteRow[]): UseFiltersResult {
  const [years, setYears] = useState<number[]>([])
  const [depts, setDepts] = useState<string[]>([])

  const availableYears = useMemo(() => {
    const s = new Set<number>()
    allRows.forEach(r => { if (r.CalendarYear) s.add(r.CalendarYear) })
    return Array.from(s).sort((a, b) => a - b)
  }, [allRows])

  const availableDepts = useMemo(() => {
    const s = new Set<string>()
    allRows.forEach(r => { if (r.Dept) s.add(r.Dept) })
    return Array.from(s).sort()
  }, [allRows])

  const filterRows = useMemo(() => {
    return (rows: WasteRow[]) =>
      rows.filter(r => {
        const yearOk = years.length === 0 || years.includes(r.CalendarYear)
        const deptOk = depts.length === 0 || r.Dept === '' || depts.includes(r.Dept)
        return yearOk && deptOk
      })
  }, [years, depts])

  return { years, depts, setYears, setDepts, availableYears, availableDepts, filterRows }
}
