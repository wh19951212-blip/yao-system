import { createClient } from '@supabase/supabase-js'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const DEFAULT_PROXY_URL = 'https://simon-system.vercel.app/api/supabase'

/** 生产环境优先走同源/代理，避免 GitHub Pages 直连 supabase.co 被网络拦截 */
export function resolveSupabaseUrl(): string {
  if (import.meta.env.DEV) {
    return envSupabaseUrl || PLACEHOLDER_URL
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location

    if (hostname.endsWith('.vercel.app')) {
      return `${origin}/api/supabase`
    }

    if (hostname.endsWith('github.io')) {
      const proxy =
        import.meta.env.VITE_SUPABASE_PROXY_URL?.trim() || DEFAULT_PROXY_URL
      return proxy.replace(/\/$/, '')
    }
  }

  return envSupabaseUrl || PLACEHOLDER_URL
}

export function isSupabaseConfigured(): boolean {
  const url = resolveSupabaseUrl()
  return Boolean(
    url &&
      supabaseAnonKey &&
      url !== PLACEHOLDER_URL &&
      !url.includes('your-project-id') &&
      !supabaseAnonKey.includes('your-supabase-anon-key'),
  )
}

export function getSupabaseConfigHint(): string | null {
  const url = resolveSupabaseUrl()
  if (!url || url.includes('your-project-id')) {
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
  const url = resolveSupabaseUrl()
  return {
    url,
    keyPreview: maskKey(supabaseAnonKey),
    keyLength: supabaseAnonKey.length,
    configured: isSupabaseConfigured(),
    hint: getSupabaseConfigHint(),
    isPublishableKey: supabaseAnonKey.startsWith('sb_publishable_'),
    usesProxy: url.includes('/api/supabase'),
  }
}

if (import.meta.env.DEV || import.meta.env.PROD) {
  const url = resolveSupabaseUrl()
  console.log('[Supabase] URL =', url || '(空)')
  console.log(
    '[Supabase] ANON_KEY =',
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
  resolveSupabaseUrl(),
  supabaseAnonKey || 'placeholder-key',
)
