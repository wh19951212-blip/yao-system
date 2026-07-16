import { supabase } from '@/lib/supabase'
import { markDemoDataActive, resolveDemoList } from '@/lib/demoData'
import {
  DEMO_BUYERS,
  DEMO_CONTRACTS,
  DEMO_HOTELS,
  DEMO_INVESTORS,
  DEMO_PROPERTIES,
} from '@/data/demoFixtures'
import type {
  Contract,
  Hotel,
  InvestorDemand,
  MatchResult,
  Property,
} from '@/types/database'
import { mapContractRow } from '@/services/contracts'

const CONTRACT_SELECT = `
  *,
  investors:investor_id ( id, name ),
  buyers:buyer_id ( id, name ),
  lands:land_id ( id, name ),
  properties:property_id ( id, name ),
  channels:channel_id ( id, name )
`

export async function fetchContractsByInvestor(
  investorId: string,
): Promise<Contract[]> {
  return fetchContractsWhere('investor_id', investorId, (c) => c.investor_id === investorId)
}

export async function fetchContractsByBuyer(buyerId: string): Promise<Contract[]> {
  return fetchContractsWhere('buyer_id', buyerId, (c) => c.buyer_id === buyerId)
}

export async function fetchContractsByLand(landId: string): Promise<Contract[]> {
  return fetchContractsWhere('land_id', landId, (c) => c.land_id === landId)
}

export async function fetchContractsByProperty(
  propertyId: string,
): Promise<Contract[]> {
  return fetchContractsWhere(
    'property_id',
    propertyId,
    (c) => c.property_id === propertyId,
  )
}

async function fetchContractsWhere(
  column: string,
  value: string,
  demoFilter: (c: Contract) => boolean,
): Promise<Contract[]> {
  try {
    let { data, error } = await supabase
      .from('contracts')
      .select(CONTRACT_SELECT)
      .eq(column, value)
      .order('created_at', { ascending: false })

    if (error?.message?.includes('buyer_id') || error?.code === 'PGRST200') {
      ;({ data, error } = await supabase
        .from('contracts')
        .select(
          `*, investors:investor_id ( id, name ), lands:land_id ( id, name ), properties:property_id ( id, name ), channels:channel_id ( id, name )`,
        )
        .eq(column, value)
        .order('created_at', { ascending: false }))
    }

    if (error) throw error
    const rows = (data ?? []).map((row) =>
      mapContractRowExtended(row as Record<string, unknown>),
    )
    if (rows.length > 0) return rows
    markDemoDataActive()
    return DEMO_CONTRACTS.filter(demoFilter)
  } catch {
    markDemoDataActive()
    return DEMO_CONTRACTS.filter(demoFilter)
  }
}

function mapContractRowExtended(row: Record<string, unknown>): Contract {
  const base = mapContractRow(row)
  const buyerRaw = row.buyers as { id: string; name: string } | null
  return { ...base, buyer: buyerRaw ?? null }
}

export async function fetchPropertiesByLandId(landId: string): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('land_id', landId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []) as Property[]
    if (rows.length > 0) return rows
    markDemoDataActive()
    return DEMO_PROPERTIES.filter((p) => p.land_id === landId)
  } catch {
    markDemoDataActive()
    return DEMO_PROPERTIES.filter((p) => p.land_id === landId)
  }
}

export async function fetchHotelsByLandId(landId: string): Promise<Hotel[]> {
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('land_id', landId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []) as Hotel[]
    if (rows.length > 0) return rows
    markDemoDataActive()
    return DEMO_HOTELS.filter((h) => h.land_id === landId)
  } catch {
    markDemoDataActive()
    return DEMO_HOTELS.filter((h) => h.land_id === landId)
  }
}

export { fetchDemandsByBuyer } from '@/services/demands'

export function resolveRelatedEntityPath(
  relatedType: string | null,
  relatedId: string | null,
): string | null {
  if (!relatedType || !relatedId) return null
  const map: Record<string, string> = {
    investor: `/investors/${relatedId}`,
    buyer: `/buyers/${relatedId}`,
    property: `/properties/${relatedId}`,
    contract: `/contracts/${relatedId}`,
    land: `/lands/${relatedId}`,
    hotel: `/hotels/${relatedId}`,
    channel: `/channels/${relatedId}`,
  }
  return map[relatedType] ?? null
}

export function buildContractPrefillUrl(
  demand: InvestorDemand,
  result: MatchResult,
): string {
  const params = new URLSearchParams()
  if (demand.investor_id) params.set('investorId', demand.investor_id)
  if (demand.buyer_id) params.set('buyerId', demand.buyer_id)
  if (demand.channel_id) params.set('channelId', demand.channel_id)

  if (demand.intent_type === 'buy_property') {
    params.set('type', '中介')
  } else if (result.target_type === 'land') {
    params.set('type', '开发')
  } else if (result.target_type === 'hotel') {
    params.set('type', '运营')
  } else {
    params.set('type', demand.intent_type === 'invest_hotel' ? '运营' : '开发')
  }

  if (result.target_type === 'land') {
    params.set('relatedKind', 'land')
    params.set('landId', result.target_id)
  } else if (result.target_type === 'property') {
    params.set('relatedKind', 'property')
    params.set('propertyId', result.target_id)
  }

  return `/contracts/new?${params.toString()}`
}

export function contractToLinkItem(contract: Contract) {
  const subtitle = [
    contract.type,
    contract.status,
    contract.amount_wan != null ? `${contract.amount_wan}万` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return {
    id: contract.id,
    label: `${contract.type}合同`,
    path: `/contracts/${contract.id}`,
    subtitle,
  }
}

export async function fetchInvestorsForPicker() {
  try {
    const { data, error } = await supabase
      .from('investors')
      .select('id, name, level, grade, stage')
      .order('name')
    if (error) throw error
    const rows = data ?? []
    if (rows.length > 0) return rows
    markDemoDataActive()
    return DEMO_INVESTORS.map((i) => ({
      id: i.id,
      name: i.name,
      level: i.grade,
      grade: i.grade,
      stage: i.stage,
    }))
  } catch {
    markDemoDataActive()
    return DEMO_INVESTORS.map((i) => ({
      id: i.id,
      name: i.name,
      level: i.grade,
      grade: i.grade,
      stage: i.stage,
    }))
  }
}

export async function fetchBuyersForPicker() {
  try {
    const { data, error } = await supabase
      .from('buyers')
      .select('id, name, preferred_type')
      .order('name')
    if (error) throw error
    const rows = data ?? []
    return resolveDemoList(rows, () =>
      DEMO_BUYERS.map((b) => ({
        id: b.id,
        name: b.name,
        preferred_type: b.preferred_type,
      })),
    )
  } catch {
    return DEMO_BUYERS.map((b) => ({
      id: b.id,
      name: b.name,
      preferred_type: b.preferred_type,
    }))
  }
}
