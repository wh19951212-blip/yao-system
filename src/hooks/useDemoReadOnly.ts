import { useEffect, useState } from 'react'
import {
  isDemoDataActive,
  isDemoId,
  subscribeDemoData,
} from '@/lib/demoData'
import { isGuestReadOnly } from '@/lib/writeGuard'
import { useAuth } from '@/contexts/AuthContext'

/** 演示模式、访客模式或演示记录 ID 时为只读 */
export function useDemoReadOnly(entityId?: string) {
  const { isGuest } = useAuth()
  const [demoActive, setDemoActive] = useState(isDemoDataActive())

  useEffect(() => subscribeDemoData(setDemoActive), [])

  const isDemoRecord = entityId ? isDemoId(entityId) : false

  return {
    demoActive,
    isDemoRecord,
    readOnly: isGuest || isGuestReadOnly() || demoActive || isDemoRecord,
  }
}
