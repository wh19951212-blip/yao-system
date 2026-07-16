export const TASK_RELATED_TYPES = ['investor', 'land', 'project'] as const
export type TaskRelatedType = (typeof TASK_RELATED_TYPES)[number]

export const TASK_STATUSES = ['pending', 'in_progress', 'done', 'cancelled'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待办',
  in_progress: '进行中',
  done: '已完成',
  cancelled: '已取消',
}

export const TASK_RELATED_LABELS: Record<TaskRelatedType, string> = {
  investor: '投资人',
  land: '土地',
  project: '开发项目',
}
