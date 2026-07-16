import { supabase } from '@/lib/supabase'
import { resolveDemoList, assertDemoWritable } from '@/lib/demoData'
import { DEMO_MEDIA } from '@/data/demoFixtures'
import type {
  MediaAsset,
  MediaAssetInsert,
  MediaAssetUpdate,
} from '@/types/database'
import type { MediaPlatform, MediaType } from '@/config/app'

export async function fetchMediaAssets(
  filters?: {
    type?: MediaType | 'all'
    platform?: MediaPlatform | 'all'
    createdBy?: string | null
  },
) {
  let query = supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  if (filters?.platform && filters.platform !== 'all') {
    query = query.eq('platform', filters.platform)
  }
  if (filters?.createdBy) {
    query = query.eq('created_by', filters.createdBy)
  }

  try {
    const { data, error } = await query
    if (error) throw error
    const rows = (data ?? []) as MediaAsset[]
    return resolveDemoList(rows, () => {
      let demo = [...DEMO_MEDIA]
      if (filters?.type && filters.type !== 'all') {
        demo = demo.filter((row) => row.type === filters.type)
      }
      if (filters?.platform && filters.platform !== 'all') {
        demo = demo.filter((row) => row.platform === filters.platform)
      }
      if (filters?.createdBy) {
        demo = demo.filter((row) => row.created_by === filters.createdBy)
      }
      return demo
    })
  } catch {
    return resolveDemoList([], () => [...DEMO_MEDIA])
  }
}

export async function fetchMediaAssetById(id: string) {
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as MediaAsset
}

export async function fetchMediaByRelated(
  relatedType: string,
  relatedId: string,
): Promise<MediaAsset[]> {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('related_type', relatedType)
      .eq('related_id', relatedId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []) as MediaAsset[]
    if (rows.length > 0) return rows
    return DEMO_MEDIA.filter(
      (m) => m.related_type === relatedType && m.related_id === relatedId,
    )
  } catch {
    return DEMO_MEDIA.filter(
      (m) => m.related_type === relatedType && m.related_id === relatedId,
    )
  }
}

export async function createMediaAsset(payload: MediaAssetInsert) {
  assertDemoWritable()
  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      ...payload,
      related_type: payload.related_type ?? '通用',
      status: payload.status ?? '草稿',
    })
    .select()
    .single()

  if (error) throw error
  return data as MediaAsset
}

export async function updateMediaAsset(id: string, payload: MediaAssetUpdate) {
  assertDemoWritable(id)
  const { data, error } = await supabase
    .from('media_assets')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as MediaAsset
}

export async function deleteMediaAsset(id: string) {
  assertDemoWritable(id)
  const { error } = await supabase.from('media_assets').delete().eq('id', id)
  if (error) throw error
}
