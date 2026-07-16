import { supabase } from '@/lib/supabase'
import { assertDemoWritable, markDemoDataActive } from '@/lib/demoData'
import { getDemoMatchResults, getDemoMatchRuns } from '@/data/demoFixtures'
import { MATCH_ENGINE_VERSION, MATCH_WEIGHTS } from '@/config/matching'
import { fetchLands } from '@/services/lands'
import { fetchProperties } from '@/services/properties'
import { fetchHotels } from '@/services/hotels'
import { fetchBuilders } from '@/services/builders'
import { fetchChannels } from '@/services/channels'
import type {
  Builder,
  Channel,
  Hotel,
  InvestorDemand,
  Land,
  MatchResult,
  MatchRun,
  MatchResultUpdate,
  Property,
} from '@/types/database'
import type { MatchTargetType } from '@/config/matching'

export interface ScoredCandidate {
  target_type: MatchTargetType
  target_id: string
  target_name: string
  target_summary: string
  score_total: number
  score_breakdown: Record<string, number>
  match_reasons: string[]
}

const UNAVAILABLE_LAND = ['已放弃']
const UNAVAILABLE_PROPERTY = ['終了&不合格', '已售']
const UNAVAILABLE_HOTEL = ['已结束']

function regionScore(
  location: string | null | undefined,
  regions: string[],
): { score: number; reason?: string } {
  if (!regions.length) {
    return { score: Math.round(MATCH_WEIGHTS.region * 0.6) }
  }
  const loc = location ?? ''
  const hit = regions.find((r) => loc.includes(r))
  if (hit) return { score: MATCH_WEIGHTS.region, reason: `${hit}区域` }
  return { score: 0 }
}

function budgetScore(
  price: number | null | undefined,
  min: number | null,
  max: number | null,
): { score: number; reason?: string } {
  if (price == null || price <= 0) {
    return { score: Math.round(MATCH_WEIGHTS.budget * 0.5), reason: '价格待定' }
  }
  const lo = min ?? 0
  const hi = max ?? Infinity
  if (price >= lo && price <= hi) {
    return { score: MATCH_WEIGHTS.budget, reason: '预算匹配' }
  }
  if (price <= hi * 1.1 && price > hi) {
    return {
      score: Math.round(MATCH_WEIGHTS.budget * 0.7),
      reason: '略超预算',
    }
  }
  if (price < lo) {
    return { score: Math.round(MATCH_WEIGHTS.budget * 0.8), reason: '低于预算下限' }
  }
  return { score: 0 }
}

function typeScore(
  type: string | null | undefined,
  preferred: string[],
): { score: number; reason?: string } {
  if (!preferred.length) {
    return { score: Math.round(MATCH_WEIGHTS.type * 0.5) }
  }
  if (type && preferred.some((t) => type.includes(t) || t.includes(type))) {
    return { score: MATCH_WEIGHTS.type, reason: `${type}类型` }
  }
  return { score: 0 }
}

function roiScore(
  roi: number | null | undefined,
  minRoi: number | null,
): { score: number; reason?: string } {
  if (minRoi == null) {
    return { score: Math.round(MATCH_WEIGHTS.roi * 0.5) }
  }
  if (roi == null) return { score: 0 }
  if (roi >= minRoi) {
    return { score: MATCH_WEIGHTS.roi, reason: `ROI ${roi}% 达标` }
  }
  const ratio = roi / minRoi
  return {
    score: Math.round(MATCH_WEIGHTS.roi * Math.max(ratio, 0)),
    reason: roi > 0 ? `ROI ${roi}%` : undefined,
  }
}

function statusScore(
  status: string,
  unavailable: string[],
): { score: number; reason?: string } {
  if (unavailable.includes(status)) return { score: 0 }
  return { score: MATCH_WEIGHTS.status, reason: '状态可用' }
}

function buildScore(
  parts: { score: number; reason?: string }[],
): Pick<ScoredCandidate, 'score_total' | 'score_breakdown' | 'match_reasons'> {
  const keys = ['budget', 'region', 'type', 'roi', 'status'] as const
  const score_breakdown: Record<string, number> = {}
  const match_reasons: string[] = []
  let score_total = 0
  parts.forEach((part, i) => {
    score_breakdown[keys[i]] = part.score
    score_total += part.score
    if (part.reason) match_reasons.push(part.reason)
  })
  return { score_total, score_breakdown, match_reasons }
}

export function scoreLand(demand: InvestorDemand, land: Land): ScoredCandidate {
  const parts = [
    budgetScore(land.price_wan, demand.budget_min_wan, demand.budget_max_wan),
    regionScore(land.location, demand.preferred_regions),
    typeScore('土地', demand.preferred_types),
    roiScore(land.roi_percent, demand.min_roi_percent),
    statusScore(land.status, UNAVAILABLE_LAND),
  ]
  const scored = buildScore(parts)
  return {
    target_type: 'land',
    target_id: land.id,
    target_name: land.name,
    target_summary: `${land.location} · ${land.area_sqm}㎡ · ${land.price_wan}万${land.roi_percent ? ` · ROI ${land.roi_percent}%` : ''}`,
    ...scored,
  }
}

export function scoreProperty(
  demand: InvestorDemand,
  property: Property,
): ScoredCandidate {
  const parts = [
    budgetScore(property.price_wan, demand.budget_min_wan, demand.budget_max_wan),
    regionScore(property.location, demand.preferred_regions),
    typeScore(property.type, demand.preferred_types),
    { score: Math.round(MATCH_WEIGHTS.roi * 0.5) },
    statusScore(property.status, UNAVAILABLE_PROPERTY),
  ]
  const scored = buildScore(parts)
  return {
    target_type: 'property',
    target_id: property.id,
    target_name: property.name,
    target_summary: `${property.type} · ${property.location ?? '—'} · ${property.price_wan ?? '—'}万`,
    ...scored,
  }
}

export function scoreHotel(demand: InvestorDemand, hotel: Hotel): ScoredCandidate {
  const parts = [
    { score: Math.round(MATCH_WEIGHTS.budget * 0.5), reason: '运营项目' },
    regionScore(hotel.location, demand.preferred_regions),
    typeScore('酒店', demand.preferred_types),
    { score: Math.round(MATCH_WEIGHTS.roi * 0.5) },
    statusScore(hotel.status, UNAVAILABLE_HOTEL),
  ]
  const scored = buildScore(parts)
  return {
    target_type: 'hotel',
    target_id: hotel.id,
    target_name: hotel.name,
    target_summary: `酒店 · ${hotel.location ?? '—'} · ${hotel.status}`,
    ...scored,
  }
}

export function scoreBuilder(
  demand: InvestorDemand,
  builder: Builder,
): ScoredCandidate {
  const parts = [
    { score: Math.round(MATCH_WEIGHTS.budget * 0.6), reason: '施工服务' },
    regionScore(builder.region, demand.preferred_regions),
    typeScore(builder.specialty, demand.preferred_types),
    {
      score:
        builder.tier === 'A'
          ? MATCH_WEIGHTS.roi
          : builder.tier === 'B'
            ? Math.round(MATCH_WEIGHTS.roi * 0.7)
            : Math.round(MATCH_WEIGHTS.roi * 0.4),
      reason: `${builder.tier} 级建筑商`,
    },
    {
      score: builder.capacity_status !== '满' ? MATCH_WEIGHTS.status : 3,
      reason: builder.capacity_status === '满' ? undefined : '可承接',
    },
  ]
  const scored = buildScore(parts)
  return {
    target_type: 'builder',
    target_id: builder.id,
    target_name: builder.company_name,
    target_summary: `${builder.tier} 级 · ${builder.region ?? '—'} · ${builder.specialty ?? '综合'}`,
    ...scored,
  }
}

export function scoreChannel(
  demand: InvestorDemand,
  channel: Channel,
): ScoredCandidate {
  const parts = [
    { score: Math.round(MATCH_WEIGHTS.budget * 0.5), reason: '渠道服务' },
    regionScore(channel.region, demand.preferred_regions),
    {
      score: MATCH_WEIGHTS.type,
      reason: channel.cooperation_types.join('、') || '全渠道',
    },
    {
      score:
        channel.tier === 'S'
          ? MATCH_WEIGHTS.roi
          : Math.round(MATCH_WEIGHTS.roi * 0.6),
      reason: `${channel.tier} 级渠道`,
    },
    {
      score: channel.status === '合作中' ? MATCH_WEIGHTS.status : 0,
      reason: channel.status === '合作中' ? '合作中' : undefined,
    },
  ]
  const scored = buildScore(parts)
  return {
    target_type: 'channel',
    target_id: channel.id,
    target_name: channel.name,
    target_summary: `${channel.tier} 级 · ${channel.entity_type} · ${channel.region ?? '—'}`,
    ...scored,
  }
}

export async function collectCandidates(
  demand: InvestorDemand,
  ownerEmail?: string | null,
): Promise<ScoredCandidate[]> {
  const intent = demand.intent_type
  const candidates: ScoredCandidate[] = []

  const includeLands =
    intent === 'invest_dev' || intent === 'invest_hotel' || intent === 'general'
  const includeProperties =
    intent === 'buy_property' || intent === 'invest_dev' || intent === 'general'
  const includeHotels =
    intent === 'invest_hotel' || intent === 'invest_dev' || intent === 'general'
  const includeBuilders = intent === 'invest_dev' || intent === 'general'
  const includeChannels = true

  const [lands, properties, hotels, builders, channels] = await Promise.all([
    includeLands ? fetchLands(ownerEmail) : Promise.resolve([]),
    includeProperties
      ? fetchProperties('all', ownerEmail)
      : Promise.resolve([]),
    includeHotels ? fetchHotels() : Promise.resolve([]),
    includeBuilders ? fetchBuilders() : Promise.resolve([]),
    includeChannels ? fetchChannels('all') : Promise.resolve([]),
  ])

  for (const land of lands) {
    const scored = scoreLand(demand, land)
    if (scored.score_total >= 30) candidates.push(scored)
  }
  for (const property of properties) {
    const scored = scoreProperty(demand, property)
    if (scored.score_total >= 30) candidates.push(scored)
  }
  for (const hotel of hotels) {
    const scored = scoreHotel(demand, hotel)
    if (scored.score_total >= 30) candidates.push(scored)
  }
  for (const builder of builders) {
    const scored = scoreBuilder(demand, builder)
    if (scored.score_total >= 25) candidates.push(scored)
  }
  for (const channel of channels) {
    const scored = scoreChannel(demand, channel)
    if (scored.score_total >= 25) candidates.push(scored)
  }

  return candidates
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, 20)
}

export async function fetchMatchRuns(demandId: string): Promise<MatchRun[]> {
  try {
    const { data, error } = await supabase
      .from('match_runs')
      .select('*')
      .eq('demand_id', demandId)
      .order('started_at', { ascending: false })

    if (error) throw error
    const rows = (data ?? []) as MatchRun[]
    if (rows.length > 0) return rows
    markDemoDataActive()
    return getDemoMatchRuns(demandId)
  } catch {
    markDemoDataActive()
    return getDemoMatchRuns(demandId)
  }
}

export async function fetchMatchResults(demandId: string): Promise<MatchResult[]> {
  try {
    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('demand_id', demandId)
      .order('rank', { ascending: true })

    if (error) throw error
    const rows = (data ?? []) as MatchResult[]
    if (rows.length > 0) return enrichResults(rows)
    markDemoDataActive()
    return getDemoMatchResults(demandId)
  } catch {
    markDemoDataActive()
    return getDemoMatchResults(demandId)
  }
}

async function enrichResults(rows: MatchResult[]): Promise<MatchResult[]> {
  return rows.map((row) => row)
}

function buildInMemoryMatch(
  demand: InvestorDemand,
  candidates: ScoredCandidate[],
  reviewedBy?: string | null,
): { run: MatchRun; results: MatchResult[] } {
  const run: MatchRun = {
    id: `demo-run-${Date.now()}`,
    demand_id: demand.id,
    engine_version: MATCH_ENGINE_VERSION,
    rule_config: { weights: MATCH_WEIGHTS },
    ai_enabled: false,
    status: 'completed',
    result_count: candidates.length,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }
  const results: MatchResult[] = candidates.map((c, index) => ({
    id: `demo-result-${Date.now()}-${index}`,
    run_id: run.id,
    demand_id: demand.id,
    target_type: c.target_type,
    target_id: c.target_id,
    score_total: c.score_total,
    score_breakdown: c.score_breakdown,
    match_reasons: c.match_reasons,
    ai_explanation: null,
    review_status: c.score_total >= 80 ? 'approved' : 'pending',
    reviewed_by: c.score_total >= 80 ? reviewedBy ?? null : null,
    reviewed_at: c.score_total >= 80 ? new Date().toISOString() : null,
    rank: index + 1,
    investor_status: null,
    investor_note: null,
    created_at: new Date().toISOString(),
    target_name: c.target_name,
    target_summary: c.target_summary,
  }))
  return { run, results }
}

export async function runMatch(
  demand: InvestorDemand,
  ownerEmail?: string | null,
  reviewedBy?: string | null,
): Promise<{ run: MatchRun; results: MatchResult[] }> {
  const candidates = await collectCandidates(demand, ownerEmail)

  let canPersist = true
  try {
    assertDemoWritable()
  } catch {
    canPersist = false
  }

  if (!canPersist) {
    markDemoDataActive()
    return buildInMemoryMatch(demand, candidates, reviewedBy)
  }

  try {
    const { data: runRow, error: runError } = await supabase
      .from('match_runs')
      .insert({
        demand_id: demand.id,
        engine_version: MATCH_ENGINE_VERSION,
        rule_config: { weights: MATCH_WEIGHTS },
        ai_enabled: false,
        status: 'running',
      })
      .select()
      .single()

    if (runError) throw runError
    const run = runRow as MatchRun

    const resultRows = candidates.map((c, index) => ({
      run_id: run.id,
      demand_id: demand.id,
      target_type: c.target_type,
      target_id: c.target_id,
      score_total: c.score_total,
      score_breakdown: c.score_breakdown,
      match_reasons: c.match_reasons,
      review_status: c.score_total >= 80 ? 'approved' : 'pending',
      reviewed_by: c.score_total >= 80 ? reviewedBy : null,
      reviewed_at: c.score_total >= 80 ? new Date().toISOString() : null,
      rank: index + 1,
    }))

    let results: MatchResult[] = []
    if (resultRows.length > 0) {
      const { data, error } = await supabase
        .from('match_results')
        .insert(resultRows)
        .select()
      if (error) throw error
      results = (data ?? []) as MatchResult[]
      results = results.map((row, i) => ({
        ...row,
        target_name: candidates[i]?.target_name,
        target_summary: candidates[i]?.target_summary,
      }))
    }

    await supabase
      .from('match_runs')
      .update({
        status: 'completed',
        result_count: results.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id)

    await supabase
      .from('investor_demands')
      .update({ status: results.length > 0 ? 'matched' : 'submitted' })
      .eq('id', demand.id)

    return {
      run: {
        ...run,
        status: 'completed',
        result_count: results.length,
        completed_at: new Date().toISOString(),
      },
      results,
    }
  } catch (err) {
    console.error('[matching] DB persist failed, using in-memory:', err)
    markDemoDataActive()
    return buildInMemoryMatch(demand, candidates, reviewedBy)
  }
}

// removed duplicate old runMatch body below

export async function updateMatchResultReview(
  resultId: string,
  update: MatchResultUpdate,
) {
  assertDemoWritable()
  const payload: Record<string, unknown> = { ...update }
  if (update.review_status && update.review_status !== 'pending') {
    payload.reviewed_at = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from('match_results')
    .update(payload)
    .eq('id', resultId)
    .select()
    .single()
  if (error) throw error
  return data as MatchResult
}

export async function approveHighScoreResults(
  demandId: string,
  reviewedBy: string,
  minScore = 80,
) {
  assertDemoWritable()
  const { error } = await supabase
    .from('match_results')
    .update({
      review_status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('demand_id', demandId)
    .eq('review_status', 'pending')
    .gte('score_total', minScore)
  if (error) throw error
}

export function getTargetPath(result: MatchResult): string {
  switch (result.target_type) {
    case 'land':
      return `/lands/${result.target_id}`
    case 'property':
      return `/properties/${result.target_id}`
    case 'hotel':
      return `/hotels/${result.target_id}`
    case 'builder':
      return `/builders/${result.target_id}`
    case 'channel':
      return `/channels/${result.target_id}`
    default:
      return '/dashboard'
  }
}

export async function saveMatchAiAnalysis(
  runId: string,
  items: { resultId: string; explanation: string }[],
) {
  assertDemoWritable()
  await Promise.all(
    items.map(({ resultId, explanation }) =>
      supabase
        .from('match_results')
        .update({ ai_explanation: explanation })
        .eq('id', resultId),
    ),
  )
  await supabase
    .from('match_runs')
    .update({ ai_enabled: true })
    .eq('id', runId)
}

export async function runMatchByDemandId(
  demandId: string,
  ownerEmail?: string | null,
  reviewedBy?: string | null,
) {
  const { fetchDemandById } = await import('@/services/demands')
  const demand = await fetchDemandById(demandId)
  if (!demand) throw new Error('需求单不存在')
  return runMatch(demand, ownerEmail, reviewedBy)
}
