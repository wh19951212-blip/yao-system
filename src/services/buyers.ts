import { supabase } from '@/lib/supabase'
import { formatAmountWan } from '@/utils/formatDisplay'
import type { Buyer, BuyerInsert, BuyerUpdate, Property } from '@/types/database'

export async function fetchBuyers(ownerEmail?: string | null) {
  let query = supabase
    .from('buyers')
    .select('*')
    .order('updated_at', { ascending: false })

  if (ownerEmail) query = query.eq('owner', ownerEmail)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Buyer[]
}

export async function fetchBuyerById(id: string) {
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Buyer
}

export async function createBuyer(payload: BuyerInsert) {
  const { data, error } = await supabase
    .from('buyers')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as Buyer
}

export async function updateBuyer(id: string, payload: BuyerUpdate) {
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
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as Property[]).filter((property) => {
    const budgetOk =
      buyer.budget_wan == null ||
      buyer.budget_wan <= 0 ||
      (property.price_wan != null && property.price_wan <= buyer.budget_wan)
    const typeOk =
      !buyer.preferred_type || property.type === buyer.preferred_type
    return budgetOk && typeOk
  })
}
