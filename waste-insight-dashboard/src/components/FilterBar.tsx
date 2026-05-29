import { useRef, useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// Generic multi-select dropdown
// ─────────────────────────────────────────────────────────────

interface MultiSelectProps<T extends string | number> {
  label:     string
  options:   T[]
  selected:  T[]
  onChange:  (v: T[]) => void
  formatter?: (v: T) => string
}

function MultiSelect<T extends string | number>({
  label, options, selected, onChange, formatter,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (v: T) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }

  const displayLabel = selected.length === 0
    ? `${label}: All`
    : `${label}: ${selected.map(v => formatter ? formatter(v) : String(v)).join(', ')}`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:border-blue-500 focus:outline-none focus:border-blue-600 text-gray-700 whitespace-nowrap"
      >
        <span>{displayLabel}</span>
        <svg className="w-3 h-3 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-full bg-white border border-gray-200 rounded-md shadow-lg py-1 max-h-56 overflow-auto">
          {/* Select All / Clear */}
          <div className="flex gap-2 px-3 py-1 border-b border-gray-100">
            <button
              onClick={() => onChange(options.slice())}
              className="text-xs text-blue-600 hover:underline"
            >All</button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => onChange([])}
              className="text-xs text-gray-500 hover:underline"
            >Clear</button>
          </div>

          {options.map(opt => (
            <label
              key={String(opt)}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-blue-600"
              />
              {formatter ? formatter(opt) : String(opt)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FilterBar
// ─────────────────────────────────────────────────────────────

interface FilterBarProps {
  availableYears: number[]
  availableDepts: string[]
  years:          number[]
  depts:          string[]
  onYearsChange:  (v: number[]) => void
  onDeptsChange:  (v: string[]) => void
  onRefresh?:     () => void
  lastUpdated?:   string
}

export function FilterBar({
  availableYears, availableDepts,
  years, depts, onYearsChange, onDeptsChange,
  onRefresh, lastUpdated,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Filter</span>

      <MultiSelect<number>
        label="Year"
        options={availableYears}
        selected={years}
        onChange={onYearsChange}
      />

      <MultiSelect<string>
        label="Dept"
        options={availableDepts}
        selected={depts}
        onChange={onDeptsChange}
      />

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50"
          title="Reload data from GAS"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      )}

      {lastUpdated && (
        <span className="text-xs text-gray-400 ml-1">Updated {lastUpdated}</span>
      )}
    </div>
  )
}
