import { supabase } from '@/lib/supabase'
import { formatSupabaseError } from '@/utils/supabaseError'

export type TableDiagnostic = {
  table: string
  ok: boolean
  count?: number
  error?: string
  code?: string
}

const DASHBOARD_TABLES = [
  'investors',
  'lands',
  'follow_up_logs',
  'properties',
  'contracts',
  'investor_stage_logs',
] as const

export async function diagnoseDashboardTables(): Promise<TableDiagnostic[]> {
  const results: TableDiagnostic[] = []

  for (const table of DASHBOARD_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      results.push({
        table,
        ok: false,
        error: formatSupabaseError(error, table),
        code: error.code,
      })
    } else {
      results.push({ table, ok: true, count: count ?? 0 })
    }
  }

  return results
}
