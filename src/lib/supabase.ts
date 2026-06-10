import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== PLACEHOLDER_URL &&
      !supabaseUrl.includes('your-project-id'),
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

if (!isSupabaseConfigured()) {
  console.error(
    '[Supabase] 环境变量未正确配置。',
    getSupabaseConfigHint(),
    '当前 URL:',
    supabaseUrl || '(空)',
  )
}

export const supabase = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || 'placeholder-key',
)
