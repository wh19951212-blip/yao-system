import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== PLACEHOLDER_URL &&
      !supabaseUrl.includes('your-project-id') &&
      !supabaseAnonKey.includes('your-supabase-anon-key'),
  )
}

export function getSupabaseConfigHint(): string | null {
  if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
    return '缺少 VITE_SUPABASE_URL。请在 .env 或 Vercel 环境变量中配置，并重新构建部署。'
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes('your-supabase-anon-key')) {
    return '缺少 VITE_SUPABASE_ANON_KEY。请在 .env 或 Vercel 环境变量中配置，并重新构建部署。'
  }
  return null
}

function maskKey(key: string): string {
  if (!key) return '(空)'
  if (key.length <= 12) return '***'
  return `${key.slice(0, 8)}…${key.slice(-4)}`
}

/** 供仪表盘错误页展示的环境诊断信息 */
export function getSupabaseEnvDebug() {
  return {
    url: supabaseUrl || '(空)',
    keyPreview: maskKey(supabaseAnonKey),
    keyLength: supabaseAnonKey.length,
    configured: isSupabaseConfigured(),
    hint: getSupabaseConfigHint(),
    isPublishableKey: supabaseAnonKey.startsWith('sb_publishable_'),
  }
}

if (import.meta.env.DEV || import.meta.env.PROD) {
  console.log('[Supabase] VITE_SUPABASE_URL =', supabaseUrl || '(空)')
  console.log(
    '[Supabase] VITE_SUPABASE_ANON_KEY =',
    maskKey(supabaseAnonKey),
    `(length ${supabaseAnonKey.length})`,
  )
  console.log('[Supabase] configured =', isSupabaseConfigured())
}

if (!isSupabaseConfigured()) {
  console.error(
    '[Supabase] 环境变量未正确配置。',
    getSupabaseConfigHint(),
  )
}

export const supabase = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || 'placeholder-key',
)
