/** 数据库无数据或不可读时，自动启用内置演示案例 */

let demoDataActive = false
const listeners = new Set<(active: boolean) => void>()

export function isDemoDataActive() {
  return demoDataActive
}

export function markDemoDataActive() {
  if (demoDataActive) return
  demoDataActive = true
  listeners.forEach((listener) => listener(true))
}

export function resetDemoDataActive() {
  demoDataActive = false
  listeners.forEach((listener) => listener(false))
}

export function subscribeDemoData(listener: (active: boolean) => void) {
  listeners.add(listener)
  listener(demoDataActive)
  return () => {
    listeners.delete(listener)
  }
}

export function resolveDemoList<T>(rows: T[], getDemo: () => T[]): T[] {
  if (rows.length > 0) return rows
  markDemoDataActive()
  return getDemo()
}

export function filterByOwner<T extends { owner?: string | null }>(
  rows: T[],
  ownerEmail?: string | null,
) {
  if (!ownerEmail) return rows
  return rows.filter((row) => row.owner === ownerEmail)
}

export function isDemoId(id: string) {
  return /^(a000000|b000000|c000000|d000000|e000000|f000000|g000000|h000000|i000000|j000000|k000000|l000000)/.test(id)
}

import { assertWritable as guardWritable } from '@/lib/writeGuard'

export const DEMO_WRITE_BLOCKED_MSG =
  '当前为演示案例模式，数据只读。请在 Supabase SQL Editor 运行 supabase/seed_demo.sql 写入真实数据后再编辑。'

/** @deprecated 使用 writeGuard.assertWritable */
export function assertDemoWritable(recordId?: string) {
  guardWritable(recordId)
}
