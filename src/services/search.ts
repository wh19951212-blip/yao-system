import { supabase } from '@/lib/supabase'
import { markDemoDataActive } from '@/lib/demoData'
import {
  DEMO_BUYERS,
  DEMO_CHANNELS,
  DEMO_CONTRACTS,
  DEMO_DEMANDS,
  DEMO_INVESTORS,
  DEMO_LANDS,
  DEMO_PROPERTIES,
} from '@/data/demoFixtures'
import { formatDemandTitle } from '@/services/demands'
import type { SearchResults } from '@/types/database'
import { DEMAND_STATUS_LABELS } from '@/config/matching'

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of items) map.set(item.id, item)
  return Array.from(map.values())
}

const emptyResults: SearchResults = {
  investors: [],
  lands: [],
  properties: [],
  buyers: [],
  channels: [],
  contracts: [],
  demands: [],
}

export async function globalSearch(
  query: string,
  ownerEmail?: string | null,
): Promise<SearchResults> {
  const q = query.trim()
  if (!q) return emptyResults

  const pattern = `%${q}%`

  let investorQuery = supabase
    .from('investors')
    .select('id, name, stage, level')
    .ilike('name', pattern)
    .limit(6)
  if (ownerEmail) investorQuery = investorQuery.eq('owner', ownerEmail)

  let landNameQuery = supabase
    .from('lands')
    .select('id, name, location')
    .ilike('name', pattern)
    .limit(6)
  let landLocQuery = supabase
    .from('lands')
    .select('id, name, location')
    .ilike('location', pattern)
    .limit(6)
  if (ownerEmail) {
    landNameQuery = landNameQuery.eq('owner', ownerEmail)
    landLocQuery = landLocQuery.eq('owner', ownerEmail)
  }

  let propNameQuery = supabase
    .from('properties')
    .select('id, name, location, type')
    .ilike('name', pattern)
    .limit(6)
  let propLocQuery = supabase
    .from('properties')
    .select('id, name, location, type')
    .ilike('location', pattern)
    .limit(6)
  if (ownerEmail) {
    propNameQuery = propNameQuery.eq('owner', ownerEmail)
    propLocQuery = propLocQuery.eq('owner', ownerEmail)
  }

  let buyerQuery = supabase
    .from('buyers')
    .select('id, name, preferred_type')
    .ilike('name', pattern)
    .limit(6)
  if (ownerEmail) buyerQuery = buyerQuery.eq('owner', ownerEmail)

  let channelQuery = supabase
    .from('channels')
    .select('id, name, region')
    .ilike('name', pattern)
    .limit(6)
  if (ownerEmail) channelQuery = channelQuery.eq('owner', ownerEmail)

  const contractQuery = supabase
    .from('contracts')
    .select('id, type, status, notes')
    .ilike('type', pattern)
    .limit(6)

  let demandQuery = supabase
    .from('investor_demands')
    .select(
      'id, status, raw_description, investor:investor_id(name), buyer:buyer_id(name)',
    )
    .ilike('raw_description', pattern)
    .limit(6)
  if (ownerEmail) demandQuery = demandQuery.eq('owner', ownerEmail)

  const [
    investorsRes,
    landNameRes,
    landLocRes,
    propNameRes,
    propLocRes,
    buyersRes,
    channelsRes,
    contractsRes,
    demandsRes,
  ] = await Promise.all([
    investorQuery,
    landNameQuery,
    landLocQuery,
    propNameQuery,
    propLocQuery,
    buyerQuery,
    channelQuery,
    contractQuery,
    demandQuery,
  ])

  const hasError =
    investorsRes.error ||
    landNameRes.error ||
    landLocRes.error ||
    propNameRes.error ||
    propLocRes.error

  if (hasError) {
    markDemoDataActive()
    return searchDemoData(q, ownerEmail)
  }

  const lands = dedupeById([
    ...(landNameRes.data ?? []),
    ...(landLocRes.data ?? []),
  ]).slice(0, 6) as { id: string; name: string; location: string | null }[]

  const properties = dedupeById([
    ...(propNameRes.data ?? []),
    ...(propLocRes.data ?? []),
  ]).slice(0, 6) as {
    id: string
    name: string
    location: string | null
    type: string
  }[]

  const investors = (investorsRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    subtitle: `${row.level ?? 'C'}级 · ${row.stage ?? ''}`,
  }))

  const buyers = (buyersRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    subtitle: (row.preferred_type as string) || '买家',
  }))

  const channels = (channelsRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    subtitle: (row.region as string) || '渠道',
  }))

  const contracts = (contractsRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: `${row.type}合同`,
    subtitle: (row.status as string) || '—',
  }))

  const demands = (demandsRes.data ?? []).map((row) => {
    const investor = row.investor as unknown as { name: string } | null
    const buyer = row.buyer as unknown as { name: string } | null
    return {
      id: row.id as string,
      name: investor?.name ?? buyer?.name ?? '需求单',
      subtitle:
        DEMAND_STATUS_LABELS[row.status as keyof typeof DEMAND_STATUS_LABELS] ??
        (row.status as string),
    }
  })

  const result: SearchResults = {
    investors,
    lands: lands.map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: row.location || '—',
    })),
    properties: properties.map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: [row.type, row.location].filter(Boolean).join(' · ') || '—',
    })),
    buyers,
    channels,
    contracts,
    demands,
  }

  const total =
    result.investors.length +
    result.lands.length +
    result.properties.length +
    result.buyers.length +
    result.channels.length +
    result.contracts.length +
    result.demands.length

  if (total === 0) {
    markDemoDataActive()
    return searchDemoData(q, ownerEmail)
  }

  return result
}

function searchDemoData(query: string, ownerEmail?: string | null): SearchResults {
  const q = query.toLowerCase()
  const match = (text: string | null | undefined) =>
    text?.toLowerCase().includes(q)

  let investors = DEMO_INVESTORS.filter((row) => match(row.name))
  let lands = DEMO_LANDS.filter(
    (row) => match(row.name) || match(row.location),
  )
  let properties = DEMO_PROPERTIES.filter(
    (row) => match(row.name) || match(row.location),
  )
  let buyers = DEMO_BUYERS.filter((row) => match(row.name))
  let channels = DEMO_CHANNELS.filter((row) => match(row.name))
  let contracts = DEMO_CONTRACTS.filter(
    (row) => match(row.type) || match(row.notes),
  )
  let demands = DEMO_DEMANDS.filter(
    (row) => match(row.raw_description) || match(formatDemandTitle(row)),
  )

  if (ownerEmail) {
    investors = investors.filter((row) => row.owner === ownerEmail)
    lands = lands.filter((row) => row.owner === ownerEmail)
    properties = properties.filter((row) => row.owner === ownerEmail)
    buyers = buyers.filter((row) => row.owner === ownerEmail)
    channels = channels.filter((row) => row.owner === ownerEmail)
    demands = demands.filter((row) => row.owner === ownerEmail)
  }

  return {
    investors: investors.slice(0, 6).map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: `${row.grade}级 · ${row.stage}`,
    })),
    lands: lands.slice(0, 6).map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: row.location || '—',
    })),
    properties: properties.slice(0, 6).map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: [row.type, row.location].filter(Boolean).join(' · ') || '—',
    })),
    buyers: buyers.slice(0, 6).map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: row.preferred_type || '买家',
    })),
    channels: channels.slice(0, 6).map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: row.region || '渠道',
    })),
    contracts: contracts.slice(0, 6).map((row) => ({
      id: row.id,
      name: `${row.type}合同`,
      subtitle: row.status,
    })),
    demands: demands.slice(0, 6).map((row) => ({
      id: row.id,
      name: formatDemandTitle(row),
      subtitle: DEMAND_STATUS_LABELS[row.status],
    })),
  }
}
