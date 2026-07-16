import { supabase } from '@/lib/supabase'
import { assertDemoWritable, markDemoDataActive, resolveDemoList } from '@/lib/demoData'
import { callClaude } from '@/services/ai'
import { DEMO_TASKS } from '@/data/demoFixtures'
import type { Task, TaskInsert } from '@/types/database'
import type { TaskRelatedType } from '@/config/tasks'

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    related_type: row.related_type as Task['related_type'],
    related_id: row.related_id as string,
    due_date: (row.due_date as string | null) ?? null,
    status: row.status as Task['status'],
    assigned_to: (row.assigned_to as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    owner_id: (row.owner_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    assignee: row.assignee as Task['assignee'],
  }
}

export async function fetchMyTasks(userId: string | null, ownerId?: string | null) {
  return fetchUserTasks(userId, { statuses: ['pending', 'in_progress'], ownerId })
}

export async function fetchUserTasks(
  userId: string | null,
  options?: {
    statuses?: Task['status'][]
    ownerId?: string | null
  },
) {
  const statuses = options?.statuses
  if (!userId && !options?.ownerId) {
    return resolveDemoList([], () => {
      let demo = [...DEMO_TASKS]
      if (statuses?.length) demo = demo.filter((t) => statuses.includes(t.status))
      return demo
    })
  }
  try {
    let query = supabase.from('tasks').select('*').order('due_date', {
      ascending: true,
      nullsFirst: false,
    })

    if (statuses?.length) query = query.in('status', statuses)

    if (userId) {
      query = query.or(`assigned_to.eq.${userId},owner_id.eq.${userId}`)
    } else if (options?.ownerId) {
      query = query.eq('owner_id', options.ownerId)
    }

    const { data, error } = await query
    if (error) throw error
    const rows = (data ?? []).map((row) => mapTask(row as Record<string, unknown>))
    return resolveDemoList(rows, () => {
      let demo = [...DEMO_TASKS]
      if (statuses?.length) demo = demo.filter((t) => statuses.includes(t.status))
      return demo
    })
  } catch {
    markDemoDataActive()
    let demo = [...DEMO_TASKS]
    if (statuses?.length) demo = demo.filter((t) => statuses.includes(t.status))
    return demo
  }
}

export async function createTask(payload: TaskInsert) {
  assertDemoWritable()
  const row = {
    ...payload,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('tasks').insert(row).select().single()
  if (error) throw error
  return mapTask(data as Record<string, unknown>)
}

export async function updateTaskStatus(
  id: string,
  status: Task['status'],
) {
  assertDemoWritable(id)
  const { data, error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapTask(data as Record<string, unknown>)
}

export type SuggestedTask = { title: string; dueInDays?: number }

export async function suggestTasksFromAnalysis(
  analysisText: string,
  relatedType: TaskRelatedType,
  relatedId: string,
): Promise<SuggestedTask[]> {
  const prompt = `根据以下 AI 分析文本，提取 2-3 条可执行的下一步任务（简短中文标题，每条不超过 30 字）。

分析内容：
${analysisText.slice(0, 2000)}

请仅输出 JSON 数组，格式：
[{"title":"任务标题","dueInDays":3}]
不要 markdown。`

  try {
    const raw = await callClaude(prompt, 600)
    const jsonText = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(jsonText) as SuggestedTask[]
    return parsed.filter((t) => t.title?.trim()).slice(0, 3)
  } catch {
    const lines = analysisText
      .split('\n')
      .filter((l) => /^[\d\-•]/.test(l.trim()) || l.includes('建议') || l.includes('行动'))
      .slice(0, 3)
    if (lines.length) {
      return lines.map((l) => ({
        title: l.replace(/^[\d\-•.\s]+/, '').slice(0, 40),
        dueInDays: 7,
      }))
    }
    return [{ title: `跟进${relatedType}：${relatedId.slice(0, 8)}`, dueInDays: 7 }]
  }
}

export function buildTaskDueDate(days?: number) {
  const d = new Date()
  d.setDate(d.getDate() + (days ?? 7))
  return d.toISOString().slice(0, 10)
}

export function getTaskRelatedPath(task: Task) {
  switch (task.related_type) {
    case 'investor':
      return `/investors/${task.related_id}`
    case 'land':
      return `/lands/${task.related_id}`
    case 'project':
      return `/projects/${task.related_id}`
    default:
      return '/dashboard'
  }
}
