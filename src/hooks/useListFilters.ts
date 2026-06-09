import { useCallback, useState } from 'react'

const PREFIX = 'list_filters_'

export function useListFilters<T extends Record<string, string>>(
  key: string,
  defaults: T,
): [T, (patch: Partial<T>) => void, () => void] {
  const storageKey = `${PREFIX}${key}`

  const [filters, setFiltersState] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) return { ...defaults, ...JSON.parse(raw) }
    } catch {
      /* ignore */
    }
    return defaults
  })

  const setFilters = useCallback(
    (patch: Partial<T>) => {
      setFiltersState((prev) => {
        const next = { ...prev, ...patch }
        sessionStorage.setItem(storageKey, JSON.stringify(next))
        return next
      })
    },
    [storageKey],
  )

  const resetFilters = useCallback(() => {
    sessionStorage.removeItem(storageKey)
    setFiltersState(defaults)
  }, [defaults, storageKey])

  return [filters, setFilters, resetFilters]
}

export function getListBackPath(key: string, basePath: string): string {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`)
    if (!raw) return basePath
    const data = JSON.parse(raw) as Record<string, string>
    const params = new URLSearchParams()
    Object.entries(data).forEach(([k, v]) => {
      if (v && v !== 'all') params.set(k, v)
    })
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  } catch {
    return basePath
  }
}
