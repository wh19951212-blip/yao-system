import {
  DEMO_WRITE_BLOCKED_MSG,
  isDemoDataActive,
  isDemoId,
} from '@/lib/demoData'

let guestReadOnly = false

export function setGuestReadOnly(active: boolean) {
  guestReadOnly = active
}

export function isGuestReadOnly() {
  return guestReadOnly
}

export const GUEST_WRITE_MSG =
  '访客模式为只读，请使用邮箱登录后再创建或修改数据。'

/** 演示模式或访客模式下禁止写入 */
export function assertWritable(recordId?: string) {
  if (guestReadOnly) {
    throw new Error(GUEST_WRITE_MSG)
  }
  if (isDemoDataActive()) {
    throw new Error(DEMO_WRITE_BLOCKED_MSG)
  }
  if (recordId && isDemoId(recordId)) {
    throw new Error('演示案例数据不可修改或删除。')
  }
}
