import { supabase } from '@/lib/supabase'
import { DEFAULT_LAND_APPROVAL_NODES } from '@/config/app'
import type { LandApprovalNode, LandApprovalNodeUpdate } from '@/types/database'

export async function fetchLandApprovalNodes(
  landId: string,
): Promise<LandApprovalNode[]> {
  const { data, error } = await supabase
    .from('land_approval_nodes')
    .select('*')
    .eq('land_id', landId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  if (!data?.length) {
    return seedDefaultNodes(landId)
  }

  return data as LandApprovalNode[]
}

async function seedDefaultNodes(landId: string): Promise<LandApprovalNode[]> {
  const rows = DEFAULT_LAND_APPROVAL_NODES.map((name, index) => ({
    land_id: landId,
    node_name: name,
    is_custom: false,
    status: '待提交',
    sort_order: index,
  }))

  const { data, error } = await supabase
    .from('land_approval_nodes')
    .insert(rows)
    .select()

  if (error) throw error
  return (data ?? []) as LandApprovalNode[]
}

export async function updateLandApprovalNode(
  id: string,
  payload: LandApprovalNodeUpdate,
) {
  const { data, error } = await supabase
    .from('land_approval_nodes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as LandApprovalNode
}

export async function createCustomApprovalNode(
  landId: string,
  nodeName: string,
  sortOrder: number,
) {
  const { data, error } = await supabase
    .from('land_approval_nodes')
    .insert({
      land_id: landId,
      node_name: nodeName,
      is_custom: true,
      status: '待提交',
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error) throw error
  return data as LandApprovalNode
}

export async function deleteApprovalNode(id: string) {
  const { error } = await supabase
    .from('land_approval_nodes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}
