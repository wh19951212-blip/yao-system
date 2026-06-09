import { supabase } from '@/lib/supabase'
import type { SearchResults } from '@/types/database'

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of items) map.set(item.id, item)
  return Array.from(map.values())
}

export async function globalSearch(
  query: string,
  ownerEmail?: string | null,
): Promise<SearchResults> {
  const q = query.trim()
  if (!q) return { investors: [], lands: [], properties: [] }

  const pattern = `%${q}%`

  let investorQuery = supabase
    .from('investors')
    .select('id, name, stage, level')
    .ilike('name', pattern)
    .limit(8)
  if (ownerEmail) investorQuery = investorQuery.eq('owner', ownerEmail)

  let landNameQuery = supabase
    .from('lands')
    .select('id, name, location')
    .ilike('name', pattern)
    .limit(8)
  let landLocQuery = supabase
    .from('lands')
    .select('id, name, location')
    .ilike('location', pattern)
    .limit(8)
  if (ownerEmail) {
    landNameQuery = landNameQuery.eq('owner', ownerEmail)
    landLocQuery = landLocQuery.eq('owner', ownerEmail)
  }

  let propNameQuery = supabase
    .from('properties')
    .select('id, name, location, type')
    .ilike('name', pattern)
    .limit(8)
  let propLocQuery = supabase
    .from('properties')
    .select('id, name, location, type')
    .ilike('location', pattern)
    .limit(8)
  if (ownerEmail) {
    propNameQuery = propNameQuery.eq('owner', ownerEmail)
    propLocQuery = propLocQuery.eq('owner', ownerEmail)
  }

  const [investorsRes, landNameRes, landLocRes, propNameRes, propLocRes] =
    await Promise.all([
      investorQuery,
      landNameQuery,
      landLocQuery,
      propNameQuery,
      propLocQuery,
    ])

  if (investorsRes.error) throw investorsRes.error
  if (landNameRes.error) throw landNameRes.error
  if (landLocRes.error) throw landLocRes.error
  if (propNameRes.error) throw propNameRes.error
  if (propLocRes.error) throw propLocRes.error

  const lands = dedupeById([
    ...(landNameRes.data ?? []),
    ...(landLocRes.data ?? []),
  ]).slice(0, 8) as { id: string; name: string; location: string | null }[]

  const properties = dedupeById([
    ...(propNameRes.data ?? []),
    ...(propLocRes.data ?? []),
  ]).slice(0, 8) as {
    id: string
    name: string
    location: string | null
    type: string
  }[]

  return {
    investors: (investorsRes.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      subtitle: `${row.level ?? 'C'}级 · ${row.stage ?? ''}`,
    })),
    lands: lands.map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: row.location || '—',
    })),
    properties: properties.map((row) => ({
      id: row.id,
      name: row.name,
      subtitle: [row.type, row.location].filter(Boolean).join(' · ') || '—',
    })),
  }
}
