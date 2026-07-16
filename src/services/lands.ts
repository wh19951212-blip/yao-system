import { supabase } from '@/lib/supabase'
import { resolveDemoList, assertDemoWritable } from '@/lib/demoData'
import {
  DEMO_LANDS,
  getDemoLandById,
} from '@/data/demoFixtures'
import { createHotel } from '@/services/hotels'
import { logOperation } from '@/services/operationLogs'
import { createProperty } from '@/services/properties'
import { mapInvestorFromRow } from '@/services/investors'
import type {
  InvestorRow,
  Land,
  LandInsert,
  LandUpdate,
  MatchedInvestor,
} from '@/types/database'
import type { LandAbandonReason } from '@/config/app'

const RENT_TAG = /\[预期租金:\s*([\d.]+)\s*万\/年\]/

export function calculateRoiPercent(
  priceWan: number,
  expectedRentWan: number,
): number | null {
  if (!priceWan || priceWan <= 0) return null
  return Math.round((expectedRentWan / priceWan) * 10000) / 100
}

export function formatPercent(value: number | null) {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(2)}%`
}

export function formatArea(value: number) {
  return `${value.toLocaleString('zh-CN')} ㎡`
}

function parseRentFromDescription(description: string | null): number | null {
  if (!description) return null
  const match = description.match(RENT_TAG)
  return match ? Number(match[1]) : null
}

function buildDescription(notes: string | null, expectedRentWan: number) {
  const cleanNotes = notes?.replace(RENT_TAG, '').trim() || ''
  const rentTag = `[预期租金: ${expectedRentWan}万/年]`
  return cleanNotes ? `${cleanNotes}\n${rentTag}` : rentTag
}

function normalizeLand(raw: Land): Land {
  let expected_rent_wan = raw.expected_rent_wan
  let description = raw.description

  if (expected_rent_wan == null) {
    expected_rent_wan = parseRentFromDescription(raw.description)
    if (expected_rent_wan != null && description) {
      description = description.replace(RENT_TAG, '').trim() || null
    }
  }

  if (expected_rent_wan == null && raw.roi_percent && raw.price_wan) {
    expected_rent_wan =
      Math.round(((raw.roi_percent * raw.price_wan) / 100) * 100) / 100
  }

  return { ...raw, expected_rent_wan, description, owner: raw.owner ?? null, abandon_reason: raw.abandon_reason ?? null, abandon_reason_note: raw.abandon_reason_note ?? null }
}

function mapLandUpdate(payload: LandUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.name !== undefined) row.name = payload.name
  if (payload.location !== undefined) row.location = payload.location
  if (payload.area_sqm !== undefined) row.area_sqm = payload.area_sqm
  if (payload.price_wan !== undefined) row.price_wan = payload.price_wan
  if (payload.expected_rent_wan !== undefined) {
    row.expected_rent_wan = payload.expected_rent_wan
  }
  if (payload.roi_percent !== undefined) row.roi_percent = payload.roi_percent
  if (payload.legal_status !== undefined) row.legal_status = payload.legal_status
  if (payload.description !== undefined) row.description = payload.description
  if (payload.status !== undefined) row.status = payload.status
  if (payload.abandon_reason !== undefined) row.abandon_reason = payload.abandon_reason
  if (payload.abandon_reason_note !== undefined) {
    row.abandon_reason_note = payload.abandon_reason_note
  }
  if (payload.owner !== undefined) row.owner = payload.owner
  return row
}

export async function fetchLands(ownerEmail?: string | null) {
  const getDemo = () => {
    let rows = [...DEMO_LANDS]
    if (ownerEmail) rows = rows.filter((row) => row.owner === ownerEmail)
    return rows.map(normalizeLand)
  }

  try {
    const runQuery = (orderColumn: 'updated_at' | 'created_at' | null) => {
      let query = supabase.from('lands').select('*')
      if (orderColumn) {
        query = query.order(orderColumn, { ascending: false })
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
    const rows = ((data ?? []) as Land[]).map(normalizeLand)
    return resolveDemoList(rows, getDemo)
  } catch {
    return resolveDemoList([], getDemo)
  }
}

export async function fetchLandById(id: string) {
  const demo = getDemoLandById(id)
  const { data, error } = await supabase
    .from('lands')
    .select('*')
    .eq('id', id)
    .single()

  if (!error && data) return normalizeLand(data as Land)
  if (demo) {
    const { markDemoDataActive } = await import('@/lib/demoData')
    markDemoDataActive()
    return normalizeLand(demo)
  }
  if (error) throw error
  throw new Error('土地不存在')
}

export async function updateLand(
  id: string,
  payload: LandUpdate,
  operator?: string | null,
) {
  assertDemoWritable(id)
  const row = mapLandUpdate(payload)

  const { data, error } = await supabase
    .from('lands')
    .update(row)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  const land = normalizeLand(data as Land)

  if (operator) {
    await logOperation({
      operator,
      action: 'update',
      entityType: 'land',
      entityId: id,
      summary: `修改土地「${land.name}」`,
    })
  }

  return land
}

export async function abandonLand(
  id: string,
  reason: LandAbandonReason,
  note: string | null,
  operator?: string | null,
) {
  const { data, error } = await supabase
    .from('lands')
    .update(
      mapLandUpdate({
        status: '已放弃',
        abandon_reason: reason,
        abandon_reason_note: reason === '其他' ? note : note || null,
      }),
    )
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  const land = normalizeLand(data as Land)

  if (operator) {
    await logOperation({
      operator,
      action: 'land_abandon',
      entityType: 'land',
      entityId: id,
      summary: `土地「${land.name}」已放弃，原因：${reason}${note ? `（${note}）` : ''}`,
    })
  }

  return land
}

export async function completeLandToProperty(
  landId: string,
  operator?: string | null,
) {
  const land = await fetchLandById(landId)
  const property = await createProperty({
    name: land.name,
    location: land.location,
    type: '酒店',
    source_type: '自开发',
    price_wan: land.price_wan,
    status: '販売中',
    description: land.description,
    land_id: landId,
    owner: land.owner,
  })

  const updatedLand = await updateLand(landId, { status: '已完工' })

  if (operator) {
    await logOperation({
      operator,
      action: 'land_complete',
      entityType: 'land',
      entityId: landId,
      summary: `土地「${land.name}」完工转化 → 物件「${property.name}」`,
    })
  }

  return { land: updatedLand, property }
}

export async function completeLandToHotel(
  landId: string,
  operator?: string | null,
) {
  const land = await fetchLandById(landId)
  const hotel = await createHotel({
    name: land.name,
    location: land.location,
    status: '筹备中',
    notes: land.description,
    land_id: landId,
  })

  const updatedLand = await updateLand(landId, { status: '已完工' })

  if (operator) {
    await logOperation({
      operator,
      action: 'land_complete',
      entityType: 'land',
      entityId: landId,
      summary: `土地「${land.name}」完工转化 → 酒店「${hotel.name}」`,
    })
  }

  return { land: updatedLand, hotel }
}

export async function createLand(
  payload: LandInsert,
  operator?: string | null,
) {
  assertDemoWritable()
  const row = {
    name: payload.name,
    location: payload.location,
    area_sqm: payload.area_sqm,
    price_wan: payload.price_wan,
    roi_percent: payload.roi_percent,
    legal_status: payload.legal_status,
    status: payload.status ?? '分析中',
    updated_at: new Date().toISOString(),
  }

  const withRent: Record<string, unknown> = {
    ...row,
    expected_rent_wan: payload.expected_rent_wan,
    description: payload.description,
  }
  if (payload.owner) withRent.owner = payload.owner

  let { data, error } = await supabase
    .from('lands')
    .insert(withRent)
    .select()
    .single()

  if (error?.message?.includes('expected_rent_wan')) {
    ;({ data, error } = await supabase
      .from('lands')
      .insert({
        ...row,
        description: buildDescription(
          payload.description,
          payload.expected_rent_wan,
        ),
      })
      .select()
      .single())
  }

  if (error) throw error
  const land = normalizeLand(data as Land)

  if (operator) {
    await logOperation({
      operator,
      action: 'create',
      entityType: 'land',
      entityId: land.id,
      summary: `新增土地「${land.name}」`,
    })
  }

  return land
}

export async function fetchMatchedInvestors(
  landId: string,
): Promise<MatchedInvestor[]> {
  const { data, error } = await supabase
    .from('investor_land_matches')
    .select(
      `
      id,
      investor_id,
      investors (
        id,
        name,
        level,
        stage,
        budget_wan,
        confirmed_wan,
        motivation,
        decision_type,
        source,
        owner,
        next_action,
        deadline,
        last_contact_at,
        notes,
        created_at,
        updated_at
      )
    `,
    )
    .eq('land_id', landId)

  if (error) throw error

  return (data ?? [])
    .filter((row) => row.investors)
    .map((row) => ({
      matchId: row.id as string,
      investor: mapInvestorFromRow(row.investors as unknown as InvestorRow),
    }))
}

export async function addInvestorLandMatch(landId: string, investorId: string) {
  assertDemoWritable()
  const { data, error } = await supabase
    .from('investor_land_matches')
    .insert({ land_id: landId, investor_id: investorId })
    .select('id')
    .single()
  if (error) throw error
  return data as { id: string }
}

export async function removeInvestorLandMatch(matchId: string) {
  assertDemoWritable(matchId)
  const { error } = await supabase
    .from('investor_land_matches')
    .delete()
    .eq('id', matchId)
  if (error) throw error
}
