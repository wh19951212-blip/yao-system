import { useCallback, useEffect, useState } from 'react'
import {
  getStoredBusinessLine,
  setStoredBusinessLine,
  type BusinessLine,
} from '@/config/navigation'

export function useBusinessLine() {
  const [line, setLine] = useState<BusinessLine>(() => getStoredBusinessLine() ?? 'all')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<BusinessLine>).detail
      if (detail) setLine(detail)
    }
    window.addEventListener('yao-business-line-change', handler)
    return () => window.removeEventListener('yao-business-line-change', handler)
  }, [])

  const updateLine = useCallback((next: BusinessLine) => {
    setStoredBusinessLine(next)
    setLine(next)
  }, [])

  return { businessLine: line, setBusinessLine: updateLine }
}
