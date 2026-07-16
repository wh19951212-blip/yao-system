import { supabase } from '@/lib/supabase'
import { fetchContracts } from '@/services/contracts'
import { fetchLands } from '@/services/lands'
import { fetchProperties } from '@/services/properties'
import {
  fetchStageUpgradesThisMonth,
  recordStageChange,
} from '@/services/investorStageLogs'
import { logOperation } from '@/services/operationLogs'
import type {
  DashboardData,
  DashboardStats,
  FollowUp,
  GradePoolStats,
  Investor,
  InvestorInsert,
  InvestorRow,
  InvestorUpdate,
  PoolTrendPoint,
  StageDistribution,
} from '@/types/database'
import { INVESTOR_GRADES, INVESTOR_STAGES, AFTER_SALES_REMINDER_DAYS, type InvestorGrade } from '@/config/app'
import { getAppSettings } from '@/services/settings'
import { safeParseISO } from '@/utils/safeDate'
import { isSupabaseConfigured, withSupabaseFallback } from '@/lib/supabase'
import { resolveDemoList, markDemoDataActive, assertDemoWritable } from '@/lib/demoData'
import { getDemoInvestors, getDemoInvestorById, getDemoFollowUps } from '@/data/demoFixtures'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  differenceInDays,
  endOfMonth,
  format,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from 'date-fns'

const GRADE_COLUMN = 'level'

export type UpdateInvestorResult = {
  investor: Investor
  stageChanged: boolean
  dealClosedTriggered: boolean
}

export function mapInvestorFromRow(row: InvestorRow): Investor {
  return {
    id: row.id,
    name: row.name,
    grade: (row.level ?? row.grade ?? 'C') as Investor['grade'],
    stage: row.stage,
    budget: Number(row.budget_wan ?? row.budget ?? 0),
    confirmed_amount: Number(row.confirmed_wan ?? row.confirmed_amount ?? 0),
    motivation: row.motivation ?? row.investment_focus ?? null,
    decision_type: row.decision_type ?? row.risk_tolerance ?? null,
    source: row.source ?? null,
    channel_id: (row.channel_id as string | null) ?? null,
    owner: row.owner ?? null,
    next_action: row.next_action ?? null,
    deadline: row.deadline ?? null,
    last_contact_at: row.last_contact_at ?? null,
    notes: row.notes ?? null,
    is_closed_client: row.is_closed_client ?? false,
    after_sales_mode: row.after_sales_mode ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapInvestorToRow(
  payload: Partial<InvestorInsert & InvestorUpdate>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {}

  if (payload.name !== undefined) row.name = payload.name
  if (payload.grade !== undefined) row[GRADE_COLUMN] = payload.grade
  if (payload.stage !== undefined) row.stage = payload.stage
  if (payload.budget !== undefined) row.budget_wan = payload.budget
  if (payload.confirmed_amount !== undefined) {
    row.confirmed_wan = payload.confirmed_amount
  }
  if (payload.motivation !== undefined) row.motivation = payload.motivation
  if (payload.decision_type !== undefined) {
    row.decision_type = payload.decision_type
  }
  if (payload.source !== undefined) row.source = payload.source
  if (payload.channel_id !== undefined) row.channel_id = payload.channel_id
  if (payload.owner !== undefined) row.owner = payload.owner
  if (payload.next_action !== undefined) row.next_action = payload.next_action
  if (payload.deadline !== undefined) {
    row.deadline = payload.deadline || null
  }
  if (payload.last_contact_at !== undefined) {
    row.last_contact_at = payload.last_contact_at
  }
  if (payload.notes !== undefined) row.notes = payload.notes
  if (payload.is_closed_client !== undefined) {
    row.is_closed_client = payload.is_closed_client
  }
  if (payload.after_sales_mode !== undefined) {
    row.after_sales_mode = payload.after_sales_mode
  }

  return row
}

function mapFollowUpFromRow(row: Record<string, unknown>): FollowUp {
  return {
    id: row.id as string,
    investor_id: row.investor_id as string,
    content: row.content as string,
    contact_type:
      (row.action_type as string) ?? (row.contact_type as string) ?? '其他',
    created_at:
      (row.logged_at as string) ?? (row.created_at as string) ?? '',
    created_by:
      (row.logged_by as string) ?? (row.created_by as string) ?? null,
  }
}

export async function fetchInvestors(
  grade?: InvestorGrade | 'all',
  ownerEmail?: string | null,
) {
  const runQuery = (
    client: SupabaseClient,
    orderColumn: 'updated_at' | 'created_at' | null,
  ) => {
    let query = client.from('investors').select('*')
    if (orderColumn) {
      query = query.order(orderColumn, { ascending: false })
    }
    if (grade && grade !== 'all') {
      query = query.eq(GRADE_COLUMN, grade)
    }
    if (ownerEmail) {
      query = query.eq('owner', ownerEmail)
    }
    return query
  }

  try {
    const rows = await withSupabaseFallback(async (client) => {
      let { data, error } = await runQuery(client, 'updated_at')

      if (
        error &&
        (error.code === '42703' ||
          error.message.includes('updated_at') ||
          error.message.includes('does not exist'))
      ) {
        ;({ data, error } = await runQuery(client, 'created_at'))
      }

      if (error) {
        ;({ data, error } = await runQuery(client, null))
      }

      if (error) {
        return { data: null, error }
      }

      return {
        data: ((data ?? []) as InvestorRow[]).map(mapInvestorFromRow),
        error: null,
      }
    })

    return resolveDemoList(rows, () => getDemoInvestors(grade, ownerEmail))
  } catch {
    return resolveDemoList([], () => getDemoInvestors(grade, ownerEmail))
  }
}

export async function fetchInvestorById(id: string) {
  const demo = getDemoInvestorById(id)
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .eq('id', id)
    .single()

  if (!error && data) return mapInvestorFromRow(data as InvestorRow)
  if (demo) {
    markDemoDataActive()
    return demo
  }
  if (error) throw error
  throw new Error('投资人不存在')
}

export async function createInvestor(
  payload: InvestorInsert,
  operator?: string | null,
) {
  assertDemoWritable()
  const insertPayload = { ...payload, confirmed_amount: payload.confirmed_amount ?? 0 }
  if (insertPayload.stage === '成交阶段') {
    insertPayload.is_closed_client = true
    insertPayload.after_sales_mode = true
  }

  const row = mapInvestorToRow(insertPayload)

  const { data, error } = await supabase
    .from('investors')
    .insert(row)
    .select()
    .single()

  if (error) throw error
  const investor = mapInvestorFromRow(data as InvestorRow)

  if (operator) {
    await logOperation({
      operator,
      action: 'create',
      entityType: 'investor',
      entityId: investor.id,
      summary: `新增投资人「${investor.name}」`,
    })
  }

  return investor
}

export async function updateInvestor(
  id: string,
  payload: InvestorUpdate,
  operator?: string | null,
): Promise<UpdateInvestorResult> {
  assertDemoWritable(id)
  const current = await fetchInvestorById(id)
  let dealClosedTriggered = false
  let stageChanged = false
  const merged: InvestorUpdate = { ...payload }

  if (payload.stage !== undefined && payload.stage !== current.stage) {
    stageChanged = true
    if (operator) {
      await recordStageChange({
        investorId: id,
        fromStage: String(current.stage),
        toStage: String(payload.stage),
        changedBy: operator,
      })
      await logOperation({
        operator,
        action: 'stage_change',
        entityType: 'investor',
        entityId: id,
        summary: `投资人「${current.name}」阶段：${current.stage} → ${payload.stage}`,
      })
    }

    if (payload.stage === '成交阶段' && current.stage !== '成交阶段') {
      merged.is_closed_client = true
      merged.after_sales_mode = true
      dealClosedTriggered = true
    }
  }

  const row = {
    ...mapInvestorToRow(merged),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('investors')
    .update(row)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  const investor = mapInvestorFromRow(data as InvestorRow)

  if (operator && !stageChanged) {
    await logOperation({
      operator,
      action: 'update',
      entityType: 'investor',
      entityId: id,
      summary: `修改投资人「${investor.name}」`,
    })
  }

  return { investor, stageChanged, dealClosedTriggered }
}

export async function deleteInvestor(id: string, operator?: string | null) {
  assertDemoWritable(id)
  const current = await fetchInvestorById(id)
  const { error } = await supabase.from('investors').delete().eq('id', id)
  if (error) throw error

  if (operator) {
    await logOperation({
      operator,
      action: 'delete',
      entityType: 'investor',
      entityId: id,
      summary: `删除投资人「${current.name}」`,
    })
  }
}

export async function fetchFollowUps(investorId: string) {
  const demoRows = getDemoFollowUps(investorId)

  const logsResult = await supabase
    .from('follow_up_logs')
    .select('*')
    .eq('investor_id', investorId)
    .order('logged_at', { ascending: false })

  if (!logsResult.error) {
    const rows = (logsResult.data ?? []).map((row) =>
      mapFollowUpFromRow(row as Record<string, unknown>),
    )
    return resolveDemoList(rows, () => demoRows)
  }

  const legacyResult = await supabase
    .from('follow_ups')
    .select('*')
    .eq('investor_id', investorId)
    .order('created_at', { ascending: false })

  if (!legacyResult.error) {
    const rows = (legacyResult.data ?? []).map((row) =>
      mapFollowUpFromRow(row as Record<string, unknown>),
    )
    return resolveDemoList(rows, () => demoRows)
  }

  return resolveDemoList([], () => demoRows)
}

export async function createFollowUp(
  investorId: string,
  content: string,
  contactType: string,
  loggedBy?: string | null,
) {
  assertDemoWritable(investorId)
  const now = new Date().toISOString()

  const logsResult = await supabase
    .from('follow_up_logs')
    .insert({
      investor_id: investorId,
      content,
      action_type: contactType,
      logged_by: loggedBy ?? null,
    })
    .select()
    .single()

  let followUp: FollowUp

  if (!logsResult.error && logsResult.data) {
    followUp = mapFollowUpFromRow(logsResult.data as Record<string, unknown>)
  } else {
    const legacyResult = await supabase
      .from('follow_ups')
      .insert({
        investor_id: investorId,
        content,
        contact_type: contactType,
      })
      .select()
      .single()

    if (legacyResult.error) throw legacyResult.error
    followUp = mapFollowUpFromRow(
      legacyResult.data as Record<string, unknown>,
    )
  }

  const { error: updateError } = await supabase
    .from('investors')
    .update({ last_contact_at: now, updated_at: now })
    .eq('id', investorId)

  if (updateError) throw updateError

  return followUp
}

function buildPoolStats(investors: Investor[]): GradePoolStats[] {
  return INVESTOR_GRADES.map((grade) => {
    const group = investors.filter((i) => i.grade === grade)
    const totalBudget = group.reduce((sum, i) => sum + (i.budget ?? 0), 0)
    const confirmedAmount = group.reduce(
      (sum, i) => sum + (i.confirmed_amount ?? 0),
      0,
    )
    const progress =
      totalBudget > 0 ? Math.min((confirmedAmount / totalBudget) * 100, 100) : 0

    return {
      grade,
      count: group.length,
      totalBudget,
      confirmedAmount,
      progress,
    }
  })
}

export function getOverdueInvestors(investors: Investor[]) {
  const now = new Date()
  const limit = getAppSettings().followUpReminderDays
  return investors.filter((investor) => {
    if (investor.after_sales_mode) return false
    if (!investor.last_contact_at) return true
    const lastContact = safeParseISO(investor.last_contact_at)
    if (!lastContact) return true
    return differenceInDays(now, lastContact) > limit
  })
}

export function getAfterSalesOverdueInvestors(investors: Investor[]) {
  const now = new Date()
  return investors.filter((investor) => {
    if (!investor.after_sales_mode) return false
    if (!investor.last_contact_at) return true
    const lastContact = safeParseISO(investor.last_contact_at)
    if (!lastContact) return true
    return differenceInDays(now, lastContact) > AFTER_SALES_REMINDER_DAYS
  })
}

export function isAfterSalesOverdue(investor: Investor) {
  return getAfterSalesOverdueInvestors([investor]).length > 0
}

export type DeadlineUrgency = 'expired' | 'within3' | 'within7'

export function getDeadlineDaysLeft(deadline: string | null): {
  urgency: DeadlineUrgency
  daysLeft: number
} | null {
  if (!deadline) return null
  const deadlineDate = safeParseISO(deadline)
  if (!deadlineDate) return null
  const { followUpReminderDays, deadlineReminderDays } = getAppSettings()
  const daysLeft = differenceInDays(deadlineDate, new Date())
  if (daysLeft < 0) return { urgency: 'expired', daysLeft }
  if (daysLeft <= deadlineReminderDays) return { urgency: 'within3', daysLeft }
  if (daysLeft <= followUpReminderDays) return { urgency: 'within7', daysLeft }
  return null
}

export function getUpcomingDeadlineInvestors(investors: Investor[]) {
  return investors
    .filter((investor) => getDeadlineDaysLeft(investor.deadline) !== null)
    .sort((a, b) => {
      const da = safeParseISO(a.deadline!)?.getTime() ?? 0
      const db = safeParseISO(b.deadline!)?.getTime() ?? 0
      return da - db
    })
}

function buildStageDistribution(investors: Investor[]): StageDistribution[] {
  return INVESTOR_STAGES.map((stage) => ({
    stage,
    count: investors.filter((i) => i.stage === stage).length,
  }))
}

function buildPoolTrend(investors: Investor[]): PoolTrendPoint[] {
  const now = new Date()
  const points: PoolTrendPoint[] = []

  for (let i = 5; i >= 0; i -= 1) {
    const monthDate = subMonths(now, i)
    const monthEnd = endOfMonth(monthDate)
    const subset = investors.filter((inv) => {
      const created = safeParseISO(inv.created_at)
      return created !== null && created <= monthEnd
    })
    points.push({
      month: format(monthDate, 'M月'),
      totalBudget: subset.reduce((sum, inv) => sum + (inv.budget ?? 0), 0),
      confirmedAmount: subset.reduce(
        (sum, inv) => sum + (inv.confirmed_amount ?? 0),
        0,
      ),
    })
  }

  return points
}

function countCreatedThisMonth(dates: string[]) {
  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  return dates.filter((d) => {
    const parsed = safeParseISO(d)
    if (!parsed) return false
    return isWithinInterval(parsed, { start, end })
  }).length
}

function emptyDashboardStats(): DashboardStats {
  return {
    newInvestorsThisMonth: 0,
    newPropertiesThisMonth: 0,
    closedContractsThisMonth: 0,
    stageDistribution: INVESTOR_STAGES.map((stage) => ({ stage, count: 0 })),
    poolTrend: [],
    stageUpgradesThisMonth: INVESTOR_STAGES.map((stage) => ({
      stage,
      count: 0,
    })),
    abandonReasonStats: [],
  }
}

async function buildDashboardStats(
  investors: Investor[],
  ownerEmail?: string | null,
): Promise<DashboardStats> {
  let properties: Awaited<ReturnType<typeof fetchProperties>> = []
  let lands: Awaited<ReturnType<typeof fetchLands>> = []
  let contracts: Awaited<ReturnType<typeof fetchContracts>> = []

  try {
    properties = await fetchProperties('all', ownerEmail)
  } catch (err) {
    console.error('[Dashboard] fetchProperties failed:', err)
  }

  try {
    lands = await fetchLands(ownerEmail)
  } catch (err) {
    console.error('[Dashboard] fetchLands failed:', err)
  }

  try {
    contracts = await fetchContracts()
    if (ownerEmail) {
      const ownedIds = new Set(investors.map((i) => i.id))
      contracts = contracts.filter(
        (c) => c.investor_id && ownedIds.has(c.investor_id),
      )
    }
  } catch (err) {
    console.error('[Dashboard] fetchContracts failed:', err)
  }

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const closedContractsThisMonth = contracts.filter((c) => {
    if (c.status !== '已完成') return false
    const dateStr = c.signed_date ?? c.created_at
    if (!dateStr) return false
    const parsed = safeParseISO(dateStr)
    if (!parsed) return false
    return isWithinInterval(parsed, { start: monthStart, end: monthEnd })
  }).length

  const abandonReasonStats = buildAbandonReasonStats(lands)
  let stageUpgradesThisMonth = INVESTOR_STAGES.map((stage) => ({
    stage,
    count: 0,
  }))

  try {
    stageUpgradesThisMonth = await fetchStageUpgradesThisMonth(
      ownerEmail ? investors.map((i) => i.id) : undefined,
    )
  } catch (err) {
    console.error('[Dashboard] fetchStageUpgradesThisMonth failed:', err)
  }

  return {
    newInvestorsThisMonth: countCreatedThisMonth(
      investors.map((i) => i.created_at),
    ),
    newPropertiesThisMonth: countCreatedThisMonth(
      properties.map((p) => p.created_at),
    ),
    closedContractsThisMonth,
    stageDistribution: buildStageDistribution(investors),
    poolTrend: buildPoolTrend(investors),
    stageUpgradesThisMonth,
    abandonReasonStats,
  }
}

function buildAbandonReasonStats(lands: Awaited<ReturnType<typeof fetchLands>>) {
  const abandoned = lands.filter((l) => l.status === '已放弃' && l.abandon_reason)
  const counts = new Map<string, number>()
  for (const land of abandoned) {
    const reason = land.abandon_reason!
    counts.set(reason, (counts.get(reason) ?? 0) + 1)
  }
  return Array.from(counts.entries()).map(([stage, count]) => ({ stage, count }))
}

export async function fetchDashboardData(
  ownerEmail?: string | null,
): Promise<DashboardData> {
  let investors: Investor[]
  try {
    if (!isSupabaseConfigured()) {
      investors = getDemoInvestors('all', ownerEmail)
      markDemoDataActive()
    } else {
      investors = await fetchInvestors('all', ownerEmail)
    }
  } catch (err) {
    console.error('[Dashboard] fetchInvestors failed, using demo:', err)
    investors = getDemoInvestors('all', ownerEmail)
    markDemoDataActive()
  }

  const overdueInvestors = getOverdueInvestors(investors)
  const afterSalesOverdueInvestors = getAfterSalesOverdueInvestors(investors)
  const upcomingDeadlineInvestors = getUpcomingDeadlineInvestors(investors)
  const totalBudget = investors.reduce((sum, i) => sum + (i.budget ?? 0), 0)
  const confirmedAmount = investors.reduce(
    (sum, i) => sum + (i.confirmed_amount ?? 0),
    0,
  )

  let stats: DashboardStats
  try {
    stats = await buildDashboardStats(investors, ownerEmail)
  } catch (err) {
    console.error('[Dashboard] buildDashboardStats failed:', err)
    stats = emptyDashboardStats()
  }

  return {
    pools: buildPoolStats(investors),
    overdueInvestors,
    afterSalesOverdueInvestors,
    upcomingDeadlineInvestors,
    totals: {
      investors: investors.length,
      totalBudget,
      confirmedAmount,
      confirmRate:
        totalBudget > 0
          ? Math.min((confirmedAmount / totalBudget) * 100, 100)
          : 0,
    },
    stats,
  }
}

export function formatCurrency(value: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toLocaleString('zh-CN')}万`
}

export function formatDateTime(value: string | null) {
  if (!value) return '从未联系'
  const date = safeParseISO(value)
  if (!date) return '从未联系'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDate(value: string | null) {
  if (!value) return '—'
  const date = safeParseISO(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function daysSinceContact(value: string | null) {
  const date = safeParseISO(value)
  if (!date) return null
  return differenceInDays(new Date(), date)
}

export function isOverdueContact(value: string | null, afterSalesMode = false) {
  const days = daysSinceContact(value)
  if (afterSalesMode) {
    return days === null || days > AFTER_SALES_REMINDER_DAYS
  }
  const limit = getAppSettings().followUpReminderDays
  return days === null || days > limit
}
