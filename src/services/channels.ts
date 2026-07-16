import { supabase } from '@/lib/supabase'
import { resolveDemoList, assertDemoWritable, markDemoDataActive } from '@/lib/demoData'
import {
  DEMO_BUYERS,
  DEMO_CHANNEL_COMMISSIONS,
  DEMO_CHANNELS,
  DEMO_CONTRACTS,
  DEMO_INVESTORS,
  DEMO_PROPERTIES,
  getDemoChannelById,
} from '@/data/demoFixtures'
import { formatAmountWan, formatDisplayDate } from '@/utils/formatDisplay'
import type {
  Buyer,
  Channel,
  ChannelCommission,
  ChannelCommissionInsert,
  ChannelInsert,
  ChannelReferrals,
  ChannelStats,
  ChannelUpdate,
  Contract,
  Investor,
  Property,
} from '@/types/database'
import type { ChannelTier } from '@/config/app'

function mapChannelRow(row: Record<string, unknown>): Channel {
  const types = row.cooperation_types
  return {
    id: row.id as string,
    name: row.name as string,
    entity_type: row.entity_type as string,
    contact_name: (row.contact_name as string | null) ?? null,
    contact_wechat: (row.contact_wechat as string | null) ?? null,
    contact_phone: (row.contact_phone as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    tier: row.tier as string,
    cooperation_types: Array.isArray(types)
      ? (types as string[])
      : ['全渠道'],
    default_commission_rate:
      row.default_commission_rate != null
        ? Number(row.default_commission_rate)
        : null,
    status: row.status as string,
    owner: (row.owner as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

function mapCommissionRow(row: Record<string, unknown>): ChannelCommission {
  const channelRaw = row.channels as
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null
  const channel = Array.isArray(channelRaw) ? channelRaw[0] : channelRaw

  return {
    id: row.id as string,
    channel_id: row.channel_id as string,
    contract_id: (row.contract_id as string | null) ?? null,
    related_type: (row.related_type as string | null) ?? null,
    related_id: (row.related_id as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    amount_wan:
      row.amount_wan != null ? Number(row.amount_wan) : null,
    commission_wan: Number(row.commission_wan ?? 0),
    status: row.status as string,
    settled_at: (row.settled_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    owner: (row.owner as string | null) ?? null,
    created_at: row.created_at as string,
    channel: channel ?? null,
  }
}

export async function fetchChannels(tier?: ChannelTier | 'all') {
  try {
    let query = supabase
      .from('channels')
      .select('*')
      .order('updated_at', { ascending: false })

    if (tier && tier !== 'all') query = query.eq('tier', tier)

    const { data, error } = await query
    if (error) throw error
    const rows = (data ?? []).map((row) =>
      mapChannelRow(row as Record<string, unknown>),
    )
    return resolveDemoList(rows, () => {
      if (!tier || tier === 'all') return [...DEMO_CHANNELS]
      return DEMO_CHANNELS.filter((row) => row.tier === tier)
    })
  } catch {
    return resolveDemoList([], () => [...DEMO_CHANNELS])
  }
}

export async function fetchChannelById(id: string) {
  const demo = getDemoChannelById(id)
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', id)
    .single()

  if (!error && data) return mapChannelRow(data as Record<string, unknown>)
  if (demo) {
    markDemoDataActive()
    return demo
  }
  if (error) throw error
  throw new Error('渠道中介不存在')
}

export async function createChannel(payload: ChannelInsert) {
  assertDemoWritable()
  const { data, error } = await supabase
    .from('channels')
    .insert({
      ...payload,
      tier: payload.tier ?? 'B',
      status: payload.status ?? '合作中',
      cooperation_types: payload.cooperation_types?.length
        ? payload.cooperation_types
        : ['全渠道'],
    })
    .select()
    .single()

  if (error) throw error
  return mapChannelRow(data as Record<string, unknown>)
}

export async function updateChannel(id: string, payload: ChannelUpdate) {
  assertDemoWritable(id)
  const { data, error } = await supabase
    .from('channels')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapChannelRow(data as Record<string, unknown>)
}

export async function fetchChannelCommissions(channelId: string) {
  try {
    const { data, error } = await supabase
      .from('channel_commissions')
      .select('*, channels:channel_id ( id, name )')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const rows = (data ?? []).map((row) =>
      mapCommissionRow(row as Record<string, unknown>),
    )
    return resolveDemoList(rows, () =>
      DEMO_CHANNEL_COMMISSIONS.filter((row) => row.channel_id === channelId),
    )
  } catch {
    return resolveDemoList([], () =>
      DEMO_CHANNEL_COMMISSIONS.filter((row) => row.channel_id === channelId),
    )
  }
}

export async function createChannelCommission(payload: ChannelCommissionInsert) {
  assertDemoWritable()
  const { data, error } = await supabase
    .from('channel_commissions')
    .insert({
      ...payload,
      status: payload.status ?? '待结算',
    })
    .select('*, channels:channel_id ( id, name )')
    .single()

  if (error) throw error
  return mapCommissionRow(data as Record<string, unknown>)
}

export async function settleChannelCommission(id: string) {
  assertDemoWritable(id)
  const { data, error } = await supabase
    .from('channel_commissions')
    .update({
      status: '已结算',
      settled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, channels:channel_id ( id, name )')
    .single()

  if (error) throw error
  return mapCommissionRow(data as Record<string, unknown>)
}

export async function syncChannelCommissionFromContract(
  contract: Contract,
  operator?: string | null,
) {
  if (!contract.channel_id || !contract.commission_wan) return null

  try {
    const { data: existing } = await supabase
      .from('channel_commissions')
      .select('id')
      .eq('contract_id', contract.id)
      .maybeSingle()

    const payload = {
      channel_id: contract.channel_id,
      contract_id: contract.id,
      related_type: 'contract' as const,
      related_id: contract.id,
      title: `${contract.type}合同佣金`,
      amount_wan: contract.amount_wan,
      commission_wan: contract.commission_wan,
      status:
        contract.status === '已完成' ? ('已结算' as const) : ('待结算' as const),
      settled_at:
        contract.status === '已完成' ? new Date().toISOString() : null,
      owner: operator ?? null,
    }

    if (existing?.id) {
      assertDemoWritable(existing.id)
      const { data, error } = await supabase
        .from('channel_commissions')
        .update(payload)
        .eq('id', existing.id)
        .select('*, channels:channel_id ( id, name )')
        .single()
      if (error) throw error
      return mapCommissionRow(data as Record<string, unknown>)
    }

    return await createChannelCommission(payload)
  } catch {
    return null
  }
}

function filterByChannelId<T extends { channel_id?: string | null }>(
  rows: T[],
  channelId: string,
) {
  return rows.filter((row) => row.channel_id === channelId)
}

export async function fetchChannelReferrals(
  channelId: string,
): Promise<ChannelReferrals> {
  const demo = getDemoChannelById(channelId)

  try {
    const [invRes, buyerRes, propRes, contractRes] = await Promise.all([
      supabase.from('investors').select('*').eq('channel_id', channelId),
      supabase.from('buyers').select('*').eq('channel_id', channelId),
      supabase.from('properties').select('*').eq('channel_id', channelId),
      supabase.from('contracts').select('*').eq('channel_id', channelId),
    ])

    const investors = (invRes.data ?? []) as Investor[]
    const buyers = (buyerRes.data ?? []) as Buyer[]
    const properties = (propRes.data ?? []) as Property[]
    const contracts = (contractRes.data ?? []) as Contract[]

    if (
      investors.length +
        buyers.length +
        properties.length +
        contracts.length >
      0
    ) {
      return { investors, buyers, properties, contracts }
    }
  } catch {
    /* demo fallback below */
  }

  if (demo) markDemoDataActive()

  return {
    investors: filterByChannelId(DEMO_INVESTORS, channelId),
    buyers: filterByChannelId(DEMO_BUYERS, channelId),
    properties: filterByChannelId(DEMO_PROPERTIES, channelId),
    contracts: filterByChannelId(DEMO_CONTRACTS, channelId),
  }
}

export async function fetchChannelStats(
  channelId: string,
): Promise<ChannelStats> {
  const [referrals, commissions] = await Promise.all([
    fetchChannelReferrals(channelId),
    fetchChannelCommissions(channelId),
  ])

  const pendingCommissionWan = commissions
    .filter((row) => row.status === '待结算')
    .reduce((sum, row) => sum + row.commission_wan, 0)
  const settledCommissionWan = commissions
    .filter((row) => row.status === '已结算')
    .reduce((sum, row) => sum + row.commission_wan, 0)

  return {
    investorCount: referrals.investors.length,
    buyerCount: referrals.buyers.length,
    propertyCount: referrals.properties.length,
    contractCount: referrals.contracts.length,
    pendingCommissionWan,
    settledCommissionWan,
  }
}

export function computeChannelCommission(
  amountWan: number,
  ratePercent: number | null | undefined,
) {
  if (!ratePercent || amountWan <= 0) return null
  return Math.round(amountWan * ratePercent * 100) / 10000
}

export function formatCommission(value: number | null) {
  return formatAmountWan(value)
}

export function formatCooperationTypes(types: string[]) {
  if (!types.length) return '—'
  return types.join(' · ')
}

export function formatDate(value: string | null) {
  return formatDisplayDate(value)
}

export function resolveSourceWithChannel(
  channel: Channel | null | undefined,
  manualSource: string | null | undefined,
) {
  const manual = manualSource?.trim()
  if (channel && manual) return `${channel.name} · ${manual}`
  if (channel) return channel.name
  return manual || null
}
