import { supabase } from '@/lib/supabase'
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

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as MediaAsset[]
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

export async function createMediaAsset(payload: MediaAssetInsert) {
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
  const { error } = await supabase.from('media_assets').delete().eq('id', id)
  if (error) throw error
}
