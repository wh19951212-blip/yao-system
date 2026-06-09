export function mergeRecognizedFields<T extends Record<string, string>>(
  prev: T,
  data: Record<string, string>,
): T {
  const next = { ...prev }
  for (const key of Object.keys(prev)) {
    const value = data[key]
    if (value !== undefined && value !== '') {
      next[key as keyof T] = value as T[keyof T]
    }
  }
  return next
}
