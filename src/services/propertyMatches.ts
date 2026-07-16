import { supabase } from '@/lib/supabase'
import { mapInvestorFromRow } from '@/services/investors'
import type {
  InvestorRow,
  Property,
  PropertyInvestorMatch,
} from '@/types/database'

export function isBudgetMatch(investorBudget: number, propertyPrice: number | null) {
  if (!propertyPrice || propertyPrice <= 0) return investorBudget > 0
  return investorBudget >= propertyPrice
}

export async function fetchPropertyInvestorMatches(
  property: Property,
  ownerEmail?: string | null,
): Promise<PropertyInvestorMatch[]> {
  let query = supabase.from('investors').select('*')
  if (ownerEmail) query = query.eq('owner', ownerEmail)

  const { data: investors, error: invError } = await query
  if (invError) throw invError

  const { data: matches, error: matchError } = await supabase
    .from('investor_property_matches')
    .select('*')
    .eq('property_id', property.id)

  if (matchError && matchError.code !== '42P01' && matchError.code !== 'PGRST205') {
    throw matchError
  }

  const matchMap = new Map(
    (matches ?? []).map((m) => [
      m.investor_id as string,
      {
        id: m.id as string,
        isRecommended: Boolean(m.is_recommended),
      },
    ]),
  )

  const price = property.price_wan

  return ((investors ?? []) as InvestorRow[])
    .map(mapInvestorFromRow)
    .filter(
      (inv) =>
        isBudgetMatch(inv.budget, price) || matchMap.get(inv.id)?.isRecommended,
    )
    .map((investor) => {
      const match = matchMap.get(investor.id)
      return {
        matchId: match?.id ?? null,
        investor,
        isRecommended: match?.isRecommended ?? false,
        budgetMatch: isBudgetMatch(investor.budget, price),
      }
    })
    .sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) {
        return a.isRecommended ? -1 : 1
      }
      return b.investor.budget - a.investor.budget
    })
}

export async function setInvestorRecommended(
  propertyId: string,
  investorId: string,
  isRecommended: boolean,
) {
  const { data: existing } = await supabase
    .from('investor_property_matches')
    .select('id')
    .eq('property_id', propertyId)
    .eq('investor_id', investorId)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('investor_property_matches')
      .update({ is_recommended: isRecommended })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('investor_property_matches').insert({
    property_id: propertyId,
    investor_id: investorId,
    is_recommended: isRecommended,
  })
  if (error) throw error
}
