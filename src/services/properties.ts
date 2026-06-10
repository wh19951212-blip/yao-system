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
  const runQuery = (orderColumn: 'updated_at' | 'created_at' | null) => {
    let query = supabase.from('properties').select('*')
    if (orderColumn) {
      query = query.order(orderColumn, { ascending: false })
    }
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
    return query
  }

  let { data, error } = await runQuery('updated_at')
  if (
    error &&
    (error.code === '42703' || error.message.includes('updated_at'))
  ) {
    ;({ data, error } = await runQuery('created_at'))
  }
  if (error) {
    ;({ data, error } = await runQuery(null))
  }

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
