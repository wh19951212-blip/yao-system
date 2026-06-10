import type { PostgrestError } from '@supabase/supabase-js'

export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

export function formatSupabaseError(error: unknown, context?: string): string {
  const prefix = context ? `[${context}] ` : ''

  if (error instanceof Error && !isPostgrestError(error)) {
    return `${prefix}${error.message}`
  }

  if (isPostgrestError(error)) {
    const parts = [
      `${prefix}${error.message}`,
      error.code ? `code=${error.code}` : '',
      error.details ? `details=${error.details}` : '',
      error.hint ? `hint=${error.hint}` : '',
    ].filter(Boolean)
    return parts.join(' · ')
  }

  return `${prefix}${String(error)}`
}

export class DashboardLoadError extends Error {
  step: string
  causeDetail: string
  code?: string
  details?: string
  hint?: string

  constructor(step: string, cause: unknown) {
    const detail = formatSupabaseError(cause, step)
    super(detail)
    this.name = 'DashboardLoadError'
    this.step = step
    this.causeDetail = detail

    if (isPostgrestError(cause)) {
      this.code = cause.code
      this.details = cause.details ?? undefined
      this.hint = cause.hint ?? undefined
    }
  }
}
