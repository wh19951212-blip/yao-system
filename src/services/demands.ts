import { supabase } from '@/lib/supabase'
import { resolveDemoList, assertDemoWritable, markDemoDataActive } from '@/lib/demoData'
import {
  DEMO_DEMANDS,
  getDemoDemandById,
} from '@/data/demoFixtures'
import type {
  DemandStatus,
  InvestorDemand,
  InvestorDemandInsert,
  InvestorDemandUpdate,
} from '@/types/database'

export function mapDemandRow(row: Record<string, unknown>): InvestorDemand {
  return {
    id: row.id as string,
    source: row.source as InvestorDemand['source'],
    portal_user_id: (row.portal_user_id as string) ?? null,
    investor_id: (row.investor_id as string) ?? null,
    buyer_id: (row.buyer_id as string) ?? null,
    channel_id: (row.channel_id as string) ?? null,
    submitted_by: (row.submitted_by as string) ?? null,
    intent_type: row.intent_type as InvestorDemand['intent_type'],
    budget_min_wan: row.budget_min_wan != null ? Number(row.budget_min_wan) : null,
    budget_max_wan: row.budget_max_wan != null ? Number(row.budget_max_wan) : null,
    preferred_regions: (row.preferred_regions as string[]) ?? [],
    preferred_types: (row.preferred_types as string[]) ?? [],
    min_roi_percent:
      row.min_roi_percent != null ? Number(row.min_roi_percent) : null,
    risk_tolerance: (row.risk_tolerance as string) ?? null,
    timeline: (row.timeline as string) ?? null,
    raw_description: (row.raw_description as string) ?? null,
    parsed_criteria: (row.parsed_criteria as Record<string, unknown>) ?? null,
    parse_confidence:
      row.parse_confidence != null ? Number(row.parse_confidence) : null,
    status: row.status as DemandStatus,
    owner: (row.owner as string) ?? null,
    notes: (row.notes as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    investor: row.investor as InvestorDemand['investor'],
    buyer: row.buyer as InvestorDemand['buyer'],
  }
}

export async function fetchDemands(
  status?: DemandStatus | 'all',
  ownerEmail?: string | null,
): Promise<InvestorDemand[]> {
  try {
    let query = supabase
      .from('investor_demands')
      .select(
        `
        *,
        investor:investor_id ( id, name ),
        buyer:buyer_id ( id, name )
      `,
      )
      .order('updated_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (ownerEmail) {
      query = query.eq('owner', ownerEmail)
    }

    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []).map((row) => mapDemandRow(row as Record<string, unknown>))
    return resolveDemoList(rows, () => {
      let demo = [...DEMO_DEMANDS]
      if (status && status !== 'all') {
        demo = demo.filter((d) => d.status === status)
      }
      if (ownerEmail) {
        demo = demo.filter((d) => d.owner === ownerEmail)
      }
      return demo
    })
  } catch {
    return resolveDemoList([], () => [...DEMO_DEMANDS])
  }
}

export async function fetchDemandById(id: string): Promise<InvestorDemand | null> {
  const demo = getDemoDemandById(id)
  try {
    const { data, error } = await supabase
      .from('investor_demands')
      .select(
        `
        *,
        investor:investor_id ( id, name ),
        buyer:buyer_id ( id, name )
      `,
      )
      .eq('id', id)
      .maybeSingle()

    if (!error && data) {
      return mapDemandRow(data as Record<string, unknown>)
    }
    if (demo) {
      markDemoDataActive()
      return demo
    }
    if (error) throw error
    return null
  } catch {
    if (demo) {
      markDemoDataActive()
      return demo
    }
    return null
  }
}

export async function fetchDemandsByInvestor(
  investorId: string,
): Promise<InvestorDemand[]> {
  try {
    const { data, error } = await supabase
      .from('investor_demands')
      .select('*')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const rows = (data ?? []).map((row) => mapDemandRow(row as Record<string, unknown>))
    if (rows.length > 0) return rows
    markDemoDataActive()
    return DEMO_DEMANDS.filter((d) => d.investor_id === investorId)
  } catch {
    markDemoDataActive()
    return DEMO_DEMANDS.filter((d) => d.investor_id === investorId)
  }
}

export async function createDemand(payload: InvestorDemandInsert) {
  assertDemoWritable()
  const { data, error } = await supabase
    .from('investor_demands')
    .insert({
      ...payload,
      source: payload.source ?? 'staff',
      preferred_regions: payload.preferred_regions ?? [],
      preferred_types: payload.preferred_types ?? [],
      status: payload.status ?? 'submitted',
    })
    .select(
      `
      *,
      investor:investor_id ( id, name ),
      buyer:buyer_id ( id, name )
    `,
    )
    .single()
  if (error) throw error
  return mapDemandRow(data as Record<string, unknown>)
}

export async function updateDemand(id: string, payload: InvestorDemandUpdate) {
  assertDemoWritable()
  const { data, error } = await supabase
    .from('investor_demands')
    .update(payload)
    .eq('id', id)
    .select(
      `
      *,
      investor:investor_id ( id, name ),
      buyer:buyer_id ( id, name )
    `,
    )
    .single()
  if (error) throw error
  return mapDemandRow(data as Record<string, unknown>)
}

export async function fetchDemandsByBuyer(
  buyerId: string,
): Promise<InvestorDemand[]> {
  try {
    const { data, error } = await supabase
      .from('investor_demands')
      .select(`*, investor:investor_id ( id, name ), buyer:buyer_id ( id, name )`)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []).map((row) => mapDemandRow(row as Record<string, unknown>))
    if (rows.length > 0) return rows
    markDemoDataActive()
    return DEMO_DEMANDS.filter((d) => d.buyer_id === buyerId)
  } catch {
    markDemoDataActive()
    return DEMO_DEMANDS.filter((d) => d.buyer_id === buyerId)
  }
}

export function formatDemandTitle(demand: InvestorDemand): string {
  const regions =
    demand.preferred_regions.length > 0
      ? demand.preferred_regions.slice(0, 2).join('/')
      : '不限区域'
  const budget =
    demand.budget_max_wan != null
      ? `${demand.budget_min_wan ?? 0}-${demand.budget_max_wan}万`
      : '预算待定'
  const client =
    demand.investor?.name ?? demand.buyer?.name ?? '独立需求'
  return `${client} · ${regions} · ${budget}`
}
