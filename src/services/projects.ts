import { supabase } from '@/lib/supabase'
import { assertDemoWritable, markDemoDataActive, resolveDemoList } from '@/lib/demoData'
import { DEMO_PROJECTS, getDemoProjectById } from '@/data/demoFixtures'
import type { Project, ProjectInsert } from '@/types/database'

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    land_id: (row.land_id as string | null) ?? null,
    type: row.type as Project['type'],
    status: row.status as Project['status'],
    start_date: (row.start_date as string | null) ?? null,
    expected_completion: (row.expected_completion as string | null) ?? null,
    actual_completion: (row.actual_completion as string | null) ?? null,
    total_budget: row.total_budget != null ? Number(row.total_budget) : null,
    notes: (row.notes as string | null) ?? null,
    owner_id: (row.owner_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    land: row.lands as { id: string; name: string } | null,
  }
}

export async function fetchProjects(ownerId?: string | null) {
  try {
    let query = supabase
      .from('projects')
      .select('*, lands:land_id ( id, name )')
      .order('updated_at', { ascending: false })
    if (ownerId) query = query.eq('owner_id', ownerId)

    const { data, error } = await query
    if (error) throw error
    const rows = (data ?? []).map((row) => mapProject(row as Record<string, unknown>))
    return resolveDemoList(rows, () => {
      let demo = [...DEMO_PROJECTS]
      if (ownerId) demo = demo.filter((p) => p.owner_id === ownerId)
      return demo
    })
  } catch {
    markDemoDataActive()
    let demo = [...DEMO_PROJECTS]
    if (ownerId) demo = demo.filter((p) => p.owner_id === ownerId)
    return demo
  }
}

export async function fetchProjectsByLandId(landId: string) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, lands:land_id ( id, name )')
      .eq('land_id', landId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []).map((row) => mapProject(row as Record<string, unknown>))
    return resolveDemoList(rows, () =>
      DEMO_PROJECTS.filter((p) => p.land_id === landId),
    )
  } catch {
    markDemoDataActive()
    return DEMO_PROJECTS.filter((p) => p.land_id === landId)
  }
}

export async function fetchProjectById(id: string) {
  if (getDemoProjectById(id)) {
    markDemoDataActive()
    return getDemoProjectById(id)!
  }
  const { data, error } = await supabase
    .from('projects')
    .select('*, lands:land_id ( id, name )')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapProject(data as Record<string, unknown>) : null
}

export async function createProject(payload: ProjectInsert) {
  assertDemoWritable()
  const row = {
    ...payload,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('projects').insert(row).select().single()
  if (error) throw error
  return mapProject(data as Record<string, unknown>)
}

export async function updateProject(id: string, payload: Partial<ProjectInsert>) {
  assertDemoWritable(id)
  const { data, error } = await supabase
    .from('projects')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapProject(data as Record<string, unknown>)
}
