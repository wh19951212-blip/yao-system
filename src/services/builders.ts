import { supabase } from '@/lib/supabase'
import { resolveDemoList, assertDemoWritable } from '@/lib/demoData'
import { DEMO_BUILDERS, getDemoBuilderById } from '@/data/demoFixtures'
import { formatAmountWan, formatDisplayDate } from '@/utils/formatDisplay'
import type {
  Builder,
  BuilderInsert,
  BuilderQuote,
  BuilderQuoteInsert,
  BuilderUpdate,
  LandQuoteStats,
} from '@/types/database'
import type { BuilderTier } from '@/config/app'

export async function fetchBuilders(tier?: BuilderTier | 'all') {
  try {
    let query = supabase
      .from('builders')
      .select('*')
      .order('updated_at', { ascending: false })

    if (tier && tier !== 'all') {
      query = query.eq('tier', tier)
    }

    const { data, error } = await query
    if (error) throw error
    const rows = (data ?? []) as Builder[]
    return resolveDemoList(rows, () => {
      if (!tier || tier === 'all') return [...DEMO_BUILDERS]
      return DEMO_BUILDERS.filter((row) => row.tier === tier)
    })
  } catch {
    return resolveDemoList([], () => [...DEMO_BUILDERS])
  }
}

export async function fetchBuilderById(id: string) {
  const demo = getDemoBuilderById(id)
  const { data, error } = await supabase
    .from('builders')
    .select('*')
    .eq('id', id)
    .single()

  if (!error && data) return data as Builder
  if (demo) {
    const { markDemoDataActive } = await import('@/lib/demoData')
    markDemoDataActive()
    return demo
  }
  if (error) throw error
  throw new Error('建筑商不存在')
}

export async function createBuilder(payload: BuilderInsert) {
  assertDemoWritable()
  const { data, error } = await supabase
    .from('builders')
    .insert({
      ...payload,
      tier: payload.tier ?? 'B',
      capacity_status: payload.capacity_status ?? '空闲',
    })
    .select()
    .single()

  if (error) throw error
  return data as Builder
}

export async function updateBuilder(id: string, payload: BuilderUpdate) {
  assertDemoWritable(id)
  const { data, error } = await supabase
    .from('builders')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Builder
}

export async function fetchBuilderQuotes(builderId: string) {
  const { data, error } = await supabase
    .from('builder_quotes')
    .select(
      `
      id,
      builder_id,
      land_id,
      quote_amount_wan,
      quote_date,
      status,
      notes,
      created_at,
      lands ( name, location )
    `,
    )
    .eq('builder_id', builderId)
    .order('quote_date', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const landRaw = row.lands as
      | { name: string; location: string | null }
      | { name: string; location: string | null }[]
      | null
    const land = Array.isArray(landRaw) ? landRaw[0] : landRaw

    return {
      id: row.id as string,
      builder_id: row.builder_id as string,
      land_id: row.land_id as string | null,
      quote_amount_wan: row.quote_amount_wan as number | null,
      quote_date: row.quote_date as string | null,
      status: row.status as string,
      notes: row.notes as string | null,
      created_at: row.created_at as string,
      land: land ?? null,
    }
  }) as BuilderQuote[]
}

function mapLandQuoteRow(row: Record<string, unknown>): BuilderQuote {
  const builderRaw = row.builders as
    | { company_name: string; tier: string }
    | { company_name: string; tier: string }[]
    | null
  const builder = Array.isArray(builderRaw) ? builderRaw[0] : builderRaw

  return {
    id: row.id as string,
    builder_id: row.builder_id as string,
    land_id: row.land_id as string | null,
    quote_amount_wan: row.quote_amount_wan as number | null,
    quote_date: row.quote_date as string | null,
    status: row.status as string,
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    builder: builder ?? null,
  }
}

export async function fetchLandQuotes(landId: string) {
  const { data, error } = await supabase
    .from('builder_quotes')
    .select(
      `
      id,
      builder_id,
      land_id,
      quote_amount_wan,
      quote_date,
      status,
      notes,
      created_at,
      builders ( company_name, tier )
    `,
    )
    .eq('land_id', landId)
    .order('quote_amount_wan', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) =>
    mapLandQuoteRow(row as Record<string, unknown>),
  )
}

export async function createLandQuote(payload: BuilderQuoteInsert) {
  const { data, error } = await supabase
    .from('builder_quotes')
    .insert({
      builder_id: payload.builder_id,
      land_id: payload.land_id,
      quote_amount_wan: payload.quote_amount_wan,
      quote_date: payload.quote_date,
      notes: payload.notes ?? null,
      status: payload.status ?? '待确认',
    })
    .select(
      `
      id,
      builder_id,
      land_id,
      quote_amount_wan,
      quote_date,
      status,
      notes,
      created_at,
      builders ( company_name, tier )
    `,
    )
    .single()

  if (error) throw error
  return mapLandQuoteRow(data as Record<string, unknown>)
}

export function computeLandQuoteStats(quotes: BuilderQuote[]): LandQuoteStats {
  const amounts = quotes
    .map((q) => q.quote_amount_wan)
    .filter((v): v is number => v != null && v > 0)

  if (amounts.length === 0) {
    return { min: null, max: null, avg: null, bestId: null }
  }

  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  const avg =
    Math.round((amounts.reduce((s, v) => s + v, 0) / amounts.length) * 100) /
    100
  const bestQuote = quotes.find((q) => q.quote_amount_wan === min)

  return {
    min,
    max,
    avg,
    bestId: bestQuote?.id ?? null,
  }
}

export function formatPriceRange(min: number | null, max: number | null) {
  if (min == null && max == null) return '—'
  if (min != null && max != null) {
    return `${min.toLocaleString('zh-CN')} – ${max.toLocaleString('zh-CN')} 万/㎡`
  }
  return `${(min ?? max)?.toLocaleString('zh-CN')} 万/㎡`
}

export function formatQuoteAmount(value: number | null) {
  return formatAmountWan(value)
}

export function formatDate(value: string | null) {
  return formatDisplayDate(value)
}
