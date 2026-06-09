import { parseISO } from 'date-fns'

/** 金额：1,000万 */
export function formatAmountWan(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toLocaleString('zh-CN')}万`
}

/** 回报率：18.50% */
export function formatRoiPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(2)}%`
}

/** 日期：2026年6月9日 */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/** 日期时间：2026年6月9日 14:30 */
export function formatDisplayDateTime(
  value: string | Date | null | undefined,
  emptyLabel = '—',
): string {
  if (!value) return emptyLabel
  const date = typeof value === 'string' ? parseISO(value) : value
  if (Number.isNaN(date.getTime())) return emptyLabel
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** 超长文字截断 */
export function truncateText(
  text: string | null | undefined,
  maxLength = 24,
): string {
  if (!text) return '—'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

/** 解析带千分位的数字字符串 */
export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, '').trim()
  if (!cleaned) return 0
  const num = Number(cleaned)
  return Number.isNaN(num) ? 0 : num
}

/** 格式化为千分位显示（不含单位） */
export function formatThousandsInput(value: string | number): string {
  if (value === '' || value === null || value === undefined) return ''
  const num =
    typeof value === 'number' ? value : parseFormattedNumber(String(value))
  if (!num && String(value).trim() === '') return ''
  return num.toLocaleString('zh-CN')
}
