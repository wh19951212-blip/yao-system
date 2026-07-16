export const PROJECT_TYPES = ['酒店', '公寓', '办公'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export const PROJECT_STATUSES = ['规划', '设计', '施工', '竣工', '运营'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  规划: 'bg-gray-100 text-gray-600',
  设计: 'bg-blue-50 text-blue-600',
  施工: 'bg-amber-50 text-amber-600',
  竣工: 'bg-emerald-50 text-emerald-600',
  运营: 'bg-[#1B2B4B]/10 text-[#1B2B4B]',
}
