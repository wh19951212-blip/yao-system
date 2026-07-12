import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
export const SUPABASE_PROXY_URL =
  import.meta.env.VITE_SUPABASE_PROXY_URL?.trim() ||
  'https://simon-system.vercel.app/api/supabase'

/** 直连 Supabase；仅 GitHub Pages 走 Vercel 代理 */
export function resolveSupabaseUrl(): string {
  if (import.meta.env.DEV) {
    return envSupabaseUrl || PLACEHOLDER_URL
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location
    if (hostname.endsWith('github.io')) {
      return SUPABASE_PROXY_URL.replace(/\/$/, '')
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

export function getSupabaseEnvDebug() {
  const url = resolveSupabaseUrl()
  return {
    url,
    proxyUrl: SUPABASE_PROXY_URL,
    keyPreview: maskKey(supabaseAnonKey),
    keyLength: supabaseAnonKey.length,
    configured: isSupabaseConfigured(),
    hint: getSupabaseConfigHint(),
    isPublishableKey: supabaseAnonKey.startsWith('sb_publishable_'),
  }
}

function isNetworkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)
  return /failed to fetch|network|load failed|networkerror/i.test(message)
}

/** 直连失败时自动尝试 Vercel 代理 */
export async function withSupabaseFallback<T>(
  operation: (client: SupabaseClient) => Promise<{
    data: T | null
    error: unknown
  }>,
): Promise<T> {
  const direct = createSupabaseClient()
  const first = await operation(direct)
  if (!first.error) return first.data as T

  if (!isNetworkError(first.error)) throw first.error

  console.warn('[Supabase] 直连失败，尝试代理', SUPABASE_PROXY_URL)
  const proxy = createSupabaseClient(SUPABASE_PROXY_URL)
  const second = await operation(proxy)
  if (second.error) throw second.error
  return second.data as T
}

if (import.meta.env.DEV || import.meta.env.PROD) {
  const url = resolveSupabaseUrl()
  console.log('[Supabase] URL =', url || '(空)')
  console.log('[Supabase] PROXY =', SUPABASE_PROXY_URL)
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
