import type { ContractKind } from '@/config/app'
import { supabase } from '@/lib/supabase'
import { resolveDemoList, assertDemoWritable, markDemoDataActive } from '@/lib/demoData'
import { DEMO_CONTRACTS, getDemoContractById } from '@/data/demoFixtures'
import { logOperation } from '@/services/operationLogs'
import type { Contract, ContractInsert } from '@/types/database'

function mapContractRow(row: Record<string, unknown>): Contract {
  return {
    id: row.id as string,
    type: row.type as string,
    contract_type: (row.contract_type as ContractKind | null) ?? null,
    investor_id: (row.investor_id as string | null) ?? null,
    buyer_id: (row.buyer_id as string | null) ?? null,
    land_id: (row.land_id as string | null) ?? null,
    property_id: (row.property_id as string | null) ?? null,
    channel_id: (row.channel_id as string | null) ?? null,
    builder_id: (row.builder_id as string | null) ?? null,
    amount_wan: row.amount_wan as number | null,
    commission_wan: row.commission_wan as number | null,
    signed_date: (row.signed_date as string | null) ?? null,
    status: row.status as string,
    file_url: (row.file_url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    owner_id: (row.owner_id as string | null) ?? null,
    created_at: row.created_at as string,
    investor: row.investors as { id: string; name: string } | null,
    buyer: row.buyers as { id: string; name: string } | null,
    land: row.lands as { id: string; name: string } | null,
    property: row.properties as { id: string; name: string } | null,
    channel: row.channels as { id: string; name: string } | null,
    builder: row.builders
      ? {
          id: (row.builders as { id: string; name?: string; company_name?: string }).id,
          name:
            (row.builders as { name?: string; company_name?: string }).name ??
            (row.builders as { company_name?: string }).company_name ??
            '建筑商',
        }
      : null,
  }
}

export { mapContractRow }

const FULL_SELECT = `
  *,
  investors:investor_id ( id, name ),
  buyers:buyer_id ( id, name ),
  lands:land_id ( id, name ),
  properties:property_id ( id, name ),
  channels:channel_id ( id, name ),
  builders:builder_id ( id, name:company_name )
`

const BASIC_SELECT = `
  *,
  investors:investor_id ( id, name )
`

export async function fetchContracts(investorIds?: string[] | null) {
  try {
    let { data, error } = await supabase
      .from('contracts')
      .select(FULL_SELECT)
      .order('created_at', { ascending: false })

    if (
      error &&
      (error.code === 'PGRST200' ||
        error.message.includes('relationship') ||
        error.message.includes('land_id') ||
        error.message.includes('property_id'))
    ) {
      ;({ data, error } = await supabase
        .from('contracts')
        .select(BASIC_SELECT)
        .order('created_at', { ascending: false }))
    }

    if (error) {
      const fallback = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })

      if (fallback.error) throw fallback.error

      const rows = filterContractsByInvestors(
        (fallback.data ?? []).map((row) =>
          mapContractRow(row as Record<string, unknown>),
        ),
        investorIds,
      )
      return resolveDemoList(rows, () =>
        filterContractsByInvestors([...DEMO_CONTRACTS], investorIds),
      )
    }

    const rows = filterContractsByInvestors(
      (data ?? []).map((row) => mapContractRow(row as Record<string, unknown>)),
      investorIds,
    )
    return resolveDemoList(rows, () =>
      filterContractsByInvestors([...DEMO_CONTRACTS], investorIds),
    )
  } catch {
    return resolveDemoList([], () =>
      filterContractsByInvestors([...DEMO_CONTRACTS], investorIds),
    )
  }
}

function filterContractsByInvestors(
  contracts: Contract[],
  investorIds?: string[] | null,
) {
  if (!investorIds || investorIds.length === 0) return contracts
  const allowed = new Set(investorIds)
  return contracts.filter(
    (item) => item.investor_id && allowed.has(item.investor_id),
  )
}

export async function fetchContractById(id: string) {
  const demo = getDemoContractById(id)

  let { data, error } = await supabase
    .from('contracts')
    .select(FULL_SELECT)
    .eq('id', id)
    .single()

  if (
    error &&
    (error.code === 'PGRST200' ||
      String(error.message).includes('relationship'))
  ) {
    ;({ data, error } = await supabase
      .from('contracts')
      .select(BASIC_SELECT)
      .eq('id', id)
      .single())
  }

  if (error) {
    const fallback = await supabase.from('contracts').select('*').eq('id', id).single()
    if (!fallback.error && fallback.data) {
      return mapContractRow(fallback.data as Record<string, unknown>)
    }
    if (demo) {
      markDemoDataActive()
      return demo
    }
    throw error
  }

  return mapContractRow(data as Record<string, unknown>)
}

function stripOptionalColumns(payload: Record<string, unknown>) {
  const row = { ...payload }
  if (row.land_id === null || row.land_id === '') delete row.land_id
  if (row.property_id === null || row.property_id === '') delete row.property_id
  if (row.channel_id === null || row.channel_id === '') delete row.channel_id
  if (row.buyer_id === null || row.buyer_id === '') delete row.buyer_id
  if (row.builder_id === null || row.builder_id === '') delete row.builder_id
  if (row.file_url === null || row.file_url === '') delete row.file_url
  return row
}

export async function createContract(
  payload: ContractInsert,
  operator?: string | null,
) {
  assertDemoWritable()
  const row = stripOptionalColumns({
    ...payload,
    status: payload.status ?? '进行中',
  })

  let { data, error } = await supabase
    .from('contracts')
    .insert(row)
    .select()
    .single()

  if (
    error &&
    (error.message.includes('land_id') ||
      error.message.includes('property_id') ||
      error.message.includes('buyer_id') ||
      error.message.includes('file_url'))
  ) {
    const { land_id: _l, property_id: _p, buyer_id: _b, file_url: _f, ...base } = row
    ;({ data, error } = await supabase
      .from('contracts')
      .insert(base)
      .select()
      .single())
  }

  if (error) throw error
  const contract = mapContractRow(data as Record<string, unknown>)

  await import('@/services/channels').then(({ syncChannelCommissionFromContract }) =>
    syncChannelCommissionFromContract(contract, operator),
  )

  if (operator) {
    await logOperation({
      operator,
      action: 'create',
      entityType: 'contract',
      entityId: contract.id,
      summary: `新增合同（${contract.type}）`,
    })
    if (contract.signed_date || contract.status === '已完成') {
      await logOperation({
        operator,
        action: 'contract_signed',
        entityType: 'contract',
        entityId: contract.id,
        summary: `合同签署（${contract.type}）`,
      })
      await import('@/services/aiLearning').then(({ syncSuccessCaseFromContract }) =>
        syncSuccessCaseFromContract(contract, operator),
      )
    }
  }

  return contract
}

export async function updateContract(
  id: string,
  payload: Partial<ContractInsert>,
  operator?: string | null,
) {
  assertDemoWritable(id)
  const existing = await fetchContractById(id)
  const row = stripOptionalColumns({ ...payload })

  let { data, error } = await supabase
    .from('contracts')
    .update(row)
    .eq('id', id)
    .select()
    .single()

  if (
    error &&
    (error.message.includes('land_id') ||
      error.message.includes('property_id') ||
      error.message.includes('buyer_id') ||
      error.message.includes('file_url'))
  ) {
    const { land_id: _l, property_id: _p, buyer_id: _b, file_url: _f, ...base } = row
    ;({ data, error } = await supabase
      .from('contracts')
      .update(base)
      .eq('id', id)
      .select()
      .single())
  }

  if (error) throw error
  const contract = mapContractRow(data as Record<string, unknown>)

  await import('@/services/channels').then(({ syncChannelCommissionFromContract }) =>
    syncChannelCommissionFromContract(contract, operator),
  )

  if (operator) {
    await logOperation({
      operator,
      action: 'update',
      entityType: 'contract',
      entityId: id,
      summary: `修改合同（${contract.type}）`,
    })
    const wasSigned =
      (payload.signed_date && !existing.signed_date) ||
      (payload.status === '已完成' && existing.status !== '已完成')
    if (wasSigned) {
      await logOperation({
        operator,
        action: 'contract_signed',
        entityType: 'contract',
        entityId: id,
        summary: `合同签署（${contract.type}）`,
      })
      await import('@/services/aiLearning').then(({ syncSuccessCaseFromContract }) =>
        syncSuccessCaseFromContract(contract, operator),
      )
    }
  }

  return contract
}

import { formatAmountWan, formatDisplayDate } from '@/utils/formatDisplay'

export function formatAmount(value: number | null) {
  return formatAmountWan(value)
}

export function formatDate(value: string | null) {
  return formatDisplayDate(value)
}
