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
  toggle:      (jo: string) => Promise<void>
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

  const toggle = useCallback(async (jo: string) => {
    // Optimistic update
    const alreadyActioned = list.some(x => x.jo === jo)
    if (alreadyActioned) {
      setList(l => l.filter(x => x.jo !== jo))
    } else {
      setList(l => [...l, { jo, actionedAt: new Date().toISOString(), actionedBy: '' }])
    }
    // Write to GAS
    try {
      await fetch(`${API_URL}?action=toggle&jo=${encodeURIComponent(jo)}`)
    } catch {
      // Revert on failure
      setRev(v => v + 1)
    }
  }, [list])

  const refetch = useCallback(() => setRev(v => v + 1), [])

  const actionedJos = new Set(list.map(x => x.jo))
  return { actionedJos, loading, toggle, refetch }
}
