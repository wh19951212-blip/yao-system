import { supabase } from '@/lib/supabase'
import { INVESTOR_STAGES } from '@/config/app'
import type { InvestorStageLog } from '@/types/database'
import {
  endOfMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
} from 'date-fns'

function mapRow(row: Record<string, unknown>): InvestorStageLog {
  return {
    id: row.id as string,
    investor_id: row.investor_id as string,
    from_stage: row.from_stage as string,
    to_stage: row.to_stage as string,
    changed_by: (row.changed_by as string | null) ?? null,
    changed_at: row.changed_at as string,
  }
}

export function isStageUpgrade(fromStage: string, toStage: string) {
  const fromIdx = INVESTOR_STAGES.indexOf(
    fromStage as (typeof INVESTOR_STAGES)[number],
  )
  const toIdx = INVESTOR_STAGES.indexOf(
    toStage as (typeof INVESTOR_STAGES)[number],
  )
  if (fromIdx < 0 || toIdx < 0) return false
  return toIdx > fromIdx
}

export async function recordStageChange(params: {
  investorId: string
  fromStage: string
  toStage: string
  changedBy?: string | null
}) {
  const { data, error } = await supabase
    .from('investor_stage_logs')
    .insert({
      investor_id: params.investorId,
      from_stage: params.fromStage,
      to_stage: params.toStage,
      changed_by: params.changedBy ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') return null
    throw error
  }

  return mapRow(data as Record<string, unknown>)
}

export async function fetchStageLogs(investorId: string) {
  const { data, error } = await supabase
    .from('investor_stage_logs')
    .select('*')
    .eq('investor_id', investorId)
    .order('changed_at', { ascending: false })

  if (error) {
    if (error.code === '42P01') return []
    throw error
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
}

export async function fetchStageUpgradesThisMonth(investorIds?: string[]) {
  const { data, error } = await supabase
    .from('investor_stage_logs')
    .select('*')
    .order('changed_at', { ascending: false })

  if (error) {
    if (error.code === '42P01') {
      return INVESTOR_STAGES.map((stage) => ({ stage, count: 0 }))
    }
    throw error
  }

  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  const allowed = investorIds ? new Set(investorIds) : null

  const counts = new Map<string, number>()
  for (const stage of INVESTOR_STAGES) counts.set(stage, 0)

  for (const row of data ?? []) {
    const log = mapRow(row as Record<string, unknown>)
    if (allowed && !allowed.has(log.investor_id)) continue
    if (!isStageUpgrade(log.from_stage, log.to_stage)) continue
    if (!isWithinInterval(parseISO(log.changed_at), { start, end })) continue
    counts.set(log.to_stage, (counts.get(log.to_stage) ?? 0) + 1)
  }

  return INVESTOR_STAGES.map((stage) => ({
    stage,
    count: counts.get(stage) ?? 0,
  }))
}
