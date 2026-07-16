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
    if (error.code === '42501') {
      return `${prefix}数据库写入被拒绝（RLS 权限未开放）。请在 Supabase → SQL Editor 运行项目中的 supabase/fix_permissions.sql。`
    }
    if (error.code === 'PGRST205') {
      return `${prefix}数据库表尚未创建。请在 Supabase → SQL Editor 运行 supabase/schema.sql，再运行 supabase/fix_permissions.sql。`
    }
    if (error.code === '42703') {
      return `${prefix}数据库字段缺失。请运行 supabase/fix_permissions.sql 补全迁移字段。`
    }

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

/** 表单保存失败时的统一错误文案 */
export function getSaveErrorMessage(error: unknown, fallback = '保存失败'): string {
  const formatted = formatSupabaseError(error)
  return formatted && formatted !== 'undefined' ? formatted : fallback
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
