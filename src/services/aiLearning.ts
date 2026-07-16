import { supabase } from '@/lib/supabase'
import { GUEST_WRITE_MSG, isGuestReadOnly } from '@/lib/writeGuard'
import { markDemoDataActive, resolveDemoList } from '@/lib/demoData'
import { DEMO_SUCCESS_CASES } from '@/data/demoFixtures'
import type {
  AiFeedback,
  AiFeedbackInsert,
  Contract,
  Investor,
  InvestorDemand,
  SuccessCase,
  SuccessCaseInsert,
} from '@/types/database'

const demoFeedback: AiFeedback[] = []
const demoSuccessCases: SuccessCase[] = [...DEMO_SUCCESS_CASES]

function assertLearningWritable() {
  if (isGuestReadOnly()) throw new Error(GUEST_WRITE_MSG)
}

export type SuccessCaseQuery = {
  intent_type?: string | null
  regions?: string[]
  budget_min_wan?: number | null
  budget_max_wan?: number | null
  target_type?: string | null
  limit?: number
}

function scoreCase(query: SuccessCaseQuery, item: SuccessCase): number {
  let score = 0
  if (query.intent_type && item.intent_type === query.intent_type) score += 5
  if (query.target_type && item.target_type === query.target_type) score += 2
  const regions = query.regions ?? []
  if (regions.length && item.regions.length) {
    const overlap = regions.filter((r) => item.regions.some((x) => x.includes(r) || r.includes(x)))
    score += overlap.length * 3
  }
  const lo = query.budget_min_wan ?? 0
  const hi = query.budget_max_wan ?? Infinity
  const caseLo = item.budget_min_wan ?? 0
  const caseHi = item.budget_max_wan ?? Infinity
  if (caseLo <= hi && caseHi >= lo) score += 2
  return score
}

function rankCases(query: SuccessCaseQuery, cases: SuccessCase[]): SuccessCase[] {
  const limit = query.limit ?? 3
  return [...cases]
    .map((item) => ({ item, score: scoreCase(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.item.created_at.localeCompare(a.item.created_at))
    .slice(0, limit)
    .map(({ item }) => item)
}

export function formatSuccessCasesForPrompt(cases: SuccessCase[]): string {
  if (!cases.length) return '暂无类似历史成交案例。'
  return cases
    .map(
      (c, i) =>
        `${i + 1}. ${c.title}\n   意图：${c.intent_type ?? '—'} · 区域：${c.regions.join('/') || '—'} · 预算：${c.budget_min_wan ?? 0}-${c.budget_max_wan ?? '∞'}万\n   标的：${c.target_type ?? '—'} ${c.target_name ?? ''}\n   结果：${c.summary}`,
    )
    .join('\n\n')
}

export async function fetchSimilarSuccessCases(
  query: SuccessCaseQuery,
): Promise<SuccessCase[]> {
  try {
    const { data, error } = await supabase
      .from('success_cases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error
    const rows = (data ?? []) as SuccessCase[]
    const resolved = resolveDemoList(rows, () => [...demoSuccessCases])
    return rankCases(query, resolved)
  } catch {
    markDemoDataActive()
    return rankCases(query, [...demoSuccessCases])
  }
}

export function buildSuccessCaseQueryFromDemand(demand: InvestorDemand): SuccessCaseQuery {
  return {
    intent_type: demand.intent_type,
    regions: demand.preferred_regions,
    budget_min_wan: demand.budget_min_wan,
    budget_max_wan: demand.budget_max_wan,
    limit: 3,
  }
}

export function buildSuccessCaseQueryFromInvestor(
  investor: Investor,
  demands: InvestorDemand[] = [],
): SuccessCaseQuery {
  const regions = [...new Set(demands.flatMap((d) => d.preferred_regions))]
  const intent = demands[0]?.intent_type ?? null
  const budgetMin = demands.reduce<number | null>(
    (min, d) => (d.budget_min_wan != null ? Math.min(min ?? d.budget_min_wan, d.budget_min_wan) : min),
    null,
  )
  const budgetMax = demands.reduce<number | null>(
    (max, d) => (d.budget_max_wan != null ? Math.max(max ?? d.budget_max_wan, d.budget_max_wan) : max),
    null,
  )
  return {
    intent_type: intent,
    regions,
    budget_min_wan: budgetMin ?? Math.round((investor.budget ?? 0) / 10000),
    budget_max_wan: budgetMax,
    limit: 3,
  }
}

export async function submitAiFeedback(
  payload: AiFeedbackInsert,
): Promise<AiFeedback> {
  assertLearningWritable()
  const row = {
    context_type: payload.context_type,
    entity_type: payload.entity_type ?? null,
    entity_id: payload.entity_id ?? null,
    rating: payload.rating,
    comment: payload.comment ?? null,
    created_by: payload.created_by ?? null,
  }

  try {
    const { data, error } = await supabase
      .from('ai_feedback')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data as AiFeedback
  } catch {
    markDemoDataActive()
    const item: AiFeedback = {
      id: `fb-${Date.now()}`,
      ...row,
      created_at: new Date().toISOString(),
    }
    demoFeedback.unshift(item)
    return item
  }
}

export async function createSuccessCase(payload: SuccessCaseInsert): Promise<SuccessCase> {
  assertLearningWritable()
  const row = {
    title: payload.title,
    summary: payload.summary,
    case_type: payload.case_type ?? 'match',
    intent_type: payload.intent_type ?? null,
    client_type: payload.client_type ?? null,
    regions: payload.regions ?? [],
    budget_min_wan: payload.budget_min_wan ?? null,
    budget_max_wan: payload.budget_max_wan ?? null,
    target_type: payload.target_type ?? null,
    target_name: payload.target_name ?? null,
    target_id: payload.target_id ?? null,
    contract_id: payload.contract_id ?? null,
    demand_id: payload.demand_id ?? null,
    outcome: payload.outcome ?? 'closed',
    created_by: payload.created_by ?? null,
  }

  try {
    if (row.contract_id) {
      const { data: existing } = await supabase
        .from('success_cases')
        .select('id')
        .eq('contract_id', row.contract_id)
        .maybeSingle()
      if (existing) return existing as SuccessCase
    }

    const { data, error } = await supabase
      .from('success_cases')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data as SuccessCase
  } catch {
    markDemoDataActive()
    if (row.contract_id && demoSuccessCases.some((c) => c.contract_id === row.contract_id)) {
      return demoSuccessCases.find((c) => c.contract_id === row.contract_id)!
    }
    const item: SuccessCase = {
      id: `sc-${Date.now()}`,
      ...row,
      created_at: new Date().toISOString(),
    }
    demoSuccessCases.unshift(item)
    return item
  }
}

export async function syncSuccessCaseFromContract(
  contract: Contract,
  operator?: string | null,
): Promise<SuccessCase | null> {
  const signed = Boolean(contract.signed_date) || contract.status === '已完成'
  if (!signed) return null

  const clientName = contract.investor?.name ?? contract.buyer?.name ?? '客户'
  const targetName =
    contract.land?.name ?? contract.property?.name ?? contract.type
  const targetType = contract.land_id ? 'land' : contract.property_id ? 'property' : null
  const targetId = contract.land_id ?? contract.property_id ?? null

  return createSuccessCase({
    title: `${clientName} · ${targetName}`,
    summary: `${contract.type}合同已签署，金额 ${contract.amount_wan ?? '—'} 万。${contract.notes ? contract.notes.slice(0, 120) : ''}`.trim(),
    intent_type: contract.buyer_id ? 'buy_property' : 'invest_dev',
    client_type: contract.buyer_id ? 'buyer' : 'investor',
    regions: [],
    budget_min_wan: contract.amount_wan,
    budget_max_wan: contract.amount_wan,
    target_type: targetType,
    target_name: targetName,
    target_id: targetId,
    contract_id: contract.id,
    created_by: operator ?? null,
  })
}
