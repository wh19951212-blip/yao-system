import { supabase } from '@/lib/supabase'
import { resolveDemoList, assertDemoWritable } from '@/lib/demoData'
import { DEMO_BUYERS, DEMO_PROPERTIES, getDemoBuyerById } from '@/data/demoFixtures'
import { formatAmountWan } from '@/utils/formatDisplay'
import type { Buyer, BuyerInsert, BuyerUpdate, Property } from '@/types/database'

export async function fetchBuyers(ownerEmail?: string | null) {
  try {
    let query = supabase
      .from('buyers')
      .select('*')
      .order('updated_at', { ascending: false })

    if (ownerEmail) query = query.eq('owner', ownerEmail)

    const { data, error } = await query
    if (error) throw error
    const rows = (data ?? []) as Buyer[]
    return resolveDemoList(rows, () => {
      if (!ownerEmail) return [...DEMO_BUYERS]
      return DEMO_BUYERS.filter((row) => row.owner === ownerEmail)
    })
  } catch {
    return resolveDemoList([], () => [...DEMO_BUYERS])
  }
}

export async function fetchBuyerById(id: string) {
  const demo = getDemoBuyerById(id)
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .single()

  if (!error && data) return data as Buyer
  if (demo) {
    const { markDemoDataActive } = await import('@/lib/demoData')
    markDemoDataActive()
    return demo
  }
  if (error) throw error
  throw new Error('买家不存在')
}

export async function createBuyer(payload: BuyerInsert) {
  assertDemoWritable()
  const { data, error } = await supabase
    .from('buyers')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as Buyer
}

export async function updateBuyer(id: string, payload: BuyerUpdate) {
  assertDemoWritable(id)
  const { data, error } = await supabase
    .from('buyers')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Buyer
}

export function formatBuyerBudget(value: number | null) {
  return formatAmountWan(value)
}

export async function fetchRecommendedPropertiesForBuyer(
  buyer: Buyer,
): Promise<Property[]> {
  try {
    const { data: matchRows, error: matchError } = await supabase
      .from('buyer_property_matches')
      .select('property_id, properties (*)')
      .eq('buyer_id', buyer.id)
      .eq('is_recommended', true)

    if (!matchError && matchRows && matchRows.length > 0) {
      return matchRows
        .map((row) => row.properties as unknown as Property | null)
        .filter((p): p is Property => p != null)
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('updated_at', { ascending: false })

    const source = error
      ? DEMO_PROPERTIES
      : ((data ?? []) as Property[])

    const matched = source.filter((property) => {
      const budgetOk =
        buyer.budget_wan == null ||
        buyer.budget_wan <= 0 ||
        (property.price_wan != null && property.price_wan <= buyer.budget_wan)
      const typeOk =
        !buyer.preferred_type || property.type === buyer.preferred_type
      return budgetOk && typeOk
    })

    if (matched.length > 0 && !matchError) {
      await syncBuyerPropertyMatches(buyer.id, matched.map((p) => p.id))
    }

    return matched
  } catch {
    return DEMO_PROPERTIES.filter((property) => {
      const budgetOk =
        buyer.budget_wan == null ||
        buyer.budget_wan <= 0 ||
        (property.price_wan != null && property.price_wan <= buyer.budget_wan)
      const typeOk =
        !buyer.preferred_type || property.type === buyer.preferred_type
      return budgetOk && typeOk
    })
  }
}

async function syncBuyerPropertyMatches(buyerId: string, propertyIds: string[]) {
  if (propertyIds.length === 0) return
  try {
    const rows = propertyIds.map((propertyId) => ({
      buyer_id: buyerId,
      property_id: propertyId,
      is_recommended: true,
    }))
    await supabase
      .from('buyer_property_matches')
      .upsert(rows, { onConflict: 'buyer_id,property_id' })
  } catch {
    // table may not exist yet
  }
}
