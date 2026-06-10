import { parseISO } from 'date-fns'

/** 安全解析 ISO 日期，无效时返回 null（避免仪表盘整页崩溃） */
export function safeParseISO(value: string | null | undefined): Date | null {
  if (!value) return null
  try {
    const date = parseISO(value)
    if (Number.isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}
