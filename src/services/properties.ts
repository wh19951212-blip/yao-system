import { supabase } from '@/lib/supabase'
import { formatAmountWan, formatRoiPercent } from '@/utils/formatDisplay'
import type { PropertyStatus } from '@/config/app'
import type { Property, PropertyInsert, PropertyUpdate } from '@/types/database'
import { normalizePropertyStatus } from '@/services/storage'

function normalizeProperty(raw: Property): Property {
  return {
    ...raw,
    status: normalizePropertyStatus(raw.status),
  }
}

export async function fetchProperties(
  status?: PropertyStatus | 'all',
  ownerEmail?: string | null,
) {
  let query = supabase
    .from('properties')
    .select('*')
    .order('updated_at', { ascending: false })

  if (status && status !== 'all') {
    const legacyValues: Record<PropertyStatus, string[]> = {
      進行中: ['進行中', '洽谈中'],
      販売中: ['販売中', '上架'],
      '終了&不合格': ['終了&不合格', '已售'],
    }
    query = query.in('status', legacyValues[status] ?? [status])
  }
  if (ownerEmail) {
    query = query.eq('owner', ownerEmail)
  }

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as Property[]).map(normalizeProperty)
}

export async function fetchPropertyById(id: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizeProperty(data as Property)
}

export async function createProperty(payload: PropertyInsert) {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...payload,
      status: payload.status ?? '進行中',
    })
    .select()
    .single()

  if (error) throw error
  return normalizeProperty(data as Property)
}

export async function updateProperty(id: string, payload: PropertyUpdate) {
  const { data, error } = await supabase
    .from('properties')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return normalizeProperty(data as Property)
}

export function formatPriceWan(value: number | null) {
  return formatAmountWan(value)
}

export function formatCommission(value: number | null) {
  return formatRoiPercent(value)
}
