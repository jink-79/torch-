import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { listCategories, subscribe } from './api'
import { currentMonth } from './dates'
import type { Category } from './types'

interface ApiState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
}

/**
 * Minimal data hook: runs `fn` when deps change, and again whenever the API reports a write.
 * Keeps the previous data while reloading so screens don't flash.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<ApiState<T>>({ data: undefined, error: undefined, loading: true })
  const [tick, setTick] = useState(0)

  useEffect(() => subscribe(() => setTick((t) => t + 1)), [])

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    fn().then(
      (data) => alive && setState({ data, error: undefined, loading: false }),
      (error: Error) => alive && setState((s) => ({ ...s, error, loading: false })),
    )
    return () => {
      alive = false
    }
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}

export function useCategories() {
  const { data } = useApi(listCategories, [])
  return useMemo(() => {
    const list: Category[] = data ?? []
    const byId = new Map(list.map((c) => [c.id, c]))
    return { list, byId, name: (id: string | null) => (id ? byId.get(id)?.name ?? 'Unknown' : '') }
  }, [data])
}

/** Selected month lives in the URL (?m=2026-11) so refresh and back/forward keep it. */
export function useMonth(): [string, (m: string) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('m')
  const month = raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : currentMonth()
  const setMonth = useCallback(
    (m: string) =>
      setParams(
        (p) => {
          const next = new URLSearchParams(p)
          next.set('m', m)
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  return [month, setMonth]
}
