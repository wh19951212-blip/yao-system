import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
export const SUPABASE_PROXY_URL =
  import.meta.env.VITE_SUPABASE_PROXY_URL?.trim() ||
  'https://simon-system.vercel.app/api/supabase'

function productionProxyUrl(): string {
  if (typeof window === 'undefined') return SUPABASE_PROXY_URL
  return SUPABASE_PROXY_URL.replace(/\/$/, '')
}

/** Vercel 直连 Supabase；GitHub Pages 走 Vercel 代理 */
export function resolveSupabaseUrl(): string {
  if (import.meta.env.DEV) {
    return envSupabaseUrl || PLACEHOLDER_URL
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location
    if (hostname.endsWith('github.io')) {
      return productionProxyUrl()
    }
  }

  return envSupabaseUrl || PLACEHOLDER_URL
}

export function createSupabaseClient(url?: string): SupabaseClient {
  return createClient(
    (url ?? resolveSupabaseUrl()).replace(/\/$/, ''),
    supabaseAnonKey || 'placeholder-key',
  )
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseAnonKey &&
      !supabaseAnonKey.includes('your-supabase-anon-key') &&
      (import.meta.env.DEV
        ? envSupabaseUrl && !envSupabaseUrl.includes('your-project-id')
        : true),
  )
}

export function getSupabaseConfigHint(): string | null {
  if (!supabaseAnonKey || supabaseAnonKey.includes('your-supabase-anon-key')) {
    return '缺少 VITE_SUPABASE_ANON_KEY。请在 .env 或 Vercel 环境变量中配置，并重新构建部署。'
  }
  if (
    import.meta.env.DEV &&
    (!envSupabaseUrl || envSupabaseUrl.includes('your-project-id'))
  ) {
    return '缺少 VITE_SUPABASE_URL。请在 .env 中配置。'
  }
  return null
}

function maskKey(key: string): string {
  if (!key) return '(空)'
  if (key.length <= 12) return '***'
  return `${key.slice(0, 8)}…${key.slice(-4)}`
}

export function getSupabaseEnvDebug() {
  const url = resolveSupabaseUrl()
  return {
    url,
    proxyUrl: productionProxyUrl(),
    keyPreview: maskKey(supabaseAnonKey),
    keyLength: supabaseAnonKey.length,
    configured: isSupabaseConfigured(),
    hint: getSupabaseConfigHint(),
    isPublishableKey: supabaseAnonKey.startsWith('sb_publishable_'),
  }
}

function shouldRetryWithDirect(error: unknown): boolean {
  if (import.meta.env.DEV) return false
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)
  return /404|502|503|504|proxy|fetch|network|failed|not found/i.test(message)
}

/** 生产环境优先代理；代理异常时回退直连 */
export async function withSupabaseFallback<T>(
  operation: (client: SupabaseClient) => Promise<{
    data: T | null
    error: unknown
  }>,
): Promise<T> {
  const primary = createSupabaseClient()
  const first = await operation(primary)
  if (!first.error) return first.data as T

  if (import.meta.env.DEV || !shouldRetryWithDirect(first.error)) {
    throw first.error
  }

  console.warn('[Supabase] 代理失败，尝试直连', envSupabaseUrl)
  const direct = createSupabaseClient(envSupabaseUrl)
  const second = await operation(direct)
  if (second.error) throw second.error
  return second.data as T
}

if (import.meta.env.DEV || import.meta.env.PROD) {
  console.log('[Supabase] URL =', resolveSupabaseUrl() || '(空)')
  console.log('[Supabase] PROXY =', productionProxyUrl())
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

export const supabase = createSupabaseClient()
