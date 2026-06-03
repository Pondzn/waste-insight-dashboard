import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL as string

export interface ActionedJob {
  jo:         string
  actionedAt: string
  actionedBy: string
}

interface UseActionedJobsResult {
  actionedJos: Set<string>
  loading:     boolean
  toggle:      (jo: string) => void
  refetch:     () => void
}

export function useActionedJobs(): UseActionedJobsResult {
  const [list, setList]       = useState<ActionedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [rev, setRev]         = useState(0)

  useEffect(() => {
    if (!API_URL) { setLoading(false); return }
    setLoading(true)
    fetch(`${API_URL}?sheet=actioned`)
      .then(r => r.json())
      .then(d => { setList(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [rev])

  const toggle = useCallback((jo: string) => {
    // Optimistic update — immediate
    setList(l => {
      const has = l.some(x => x.jo === jo)
      return has
        ? l.filter(x => x.jo !== jo)
        : [...l, { jo, actionedAt: new Date().toISOString(), actionedBy: '' }]
    })
    // Fire-and-forget write to GAS
    fetch(`${API_URL}?action=toggle&jo=${encodeURIComponent(jo)}`).catch(() => {})
    // Auto-sync: รอ GAS commit แล้ว refetch (8s + retry 15s เผื่อ GAS ช้า)
    setTimeout(() => setRev(v => v + 1), 8000)
    setTimeout(() => setRev(v => v + 1), 15000)
  }, [])

  const refetch = useCallback(() => setRev(v => v + 1), [])

  const actionedJos = new Set(list.map(x => x.jo))
  return { actionedJos, loading, toggle, refetch }
}
