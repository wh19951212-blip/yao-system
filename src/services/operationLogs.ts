import { supabase } from '@/lib/supabase'
import { resolveDemoList } from '@/lib/demoData'
import { DEMO_OPERATION_LOGS } from '@/data/demoFixtures'
import type { OperationLog } from '@/types/database'

export type OperationAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'stage_change'
  | 'contract_signed'
  | 'land_abandon'
  | 'land_complete'

export type OperationEntity = 'investor' | 'land' | 'contract'

function mapRow(row: Record<string, unknown>): OperationLog {
  return {
    id: row.id as string,
    operator: row.operator as string,
    action: row.action as string,
    entity_type: row.entity_type as string,
    entity_id: (row.entity_id as string | null) ?? null,
    summary: row.summary as string,
    created_at: row.created_at as string,
  }
}

export async function logOperation(params: {
  operator: string
  action: OperationAction | string
  entityType: OperationEntity | string
  entityId?: string | null
  summary: string
}) {
  const { error } = await supabase.from('operation_logs').insert({
    operator: params.operator,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    summary: params.summary,
  })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.warn('操作日志写入失败:', error.message)
  }
}

export async function fetchOperationLogs(limit = 100): Promise<OperationLog[]> {
  try {
    const { data, error } = await supabase
      .from('operation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return resolveDemoList([], () => DEMO_OPERATION_LOGS.slice(0, limit))
      }
      throw error
    }

    const rows = (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
    return resolveDemoList(rows, () => DEMO_OPERATION_LOGS.slice(0, limit))
  } catch {
    return resolveDemoList([], () => DEMO_OPERATION_LOGS.slice(0, limit))
  }
}

export function formatOperationAction(action: string) {
  const labels: Record<string, string> = {
    create: '新增',
    update: '修改',
    delete: '删除',
    stage_change: '阶段变化',
    contract_signed: '合同签署',
    land_abandon: '土地放弃',
    land_complete: '项目完工',
  }
  return labels[action] ?? action
}
