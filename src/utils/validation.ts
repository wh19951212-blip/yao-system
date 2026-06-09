export function requireTrimmed(value: string, label: string): string | null {
  if (!value.trim()) return `${label}不能为空`
  return null
}

export function requirePositiveNumber(
  value: string,
  label: string,
): string | null {
  const num = Number(value)
  if (!value.trim() || Number.isNaN(num) || num <= 0) {
    return `${label}必须为大于 0 的数字`
  }
  return null
}

export function requireNonNegativeNumber(
  value: string,
  label: string,
): string | null {
  if (!value.trim()) return null
  const num = Number(value)
  if (Number.isNaN(num) || num < 0) {
    return `${label}不能为负数`
  }
  return null
}

export function firstError(...errors: (string | null | undefined)[]): string {
  return errors.find(Boolean) ?? ''
}
