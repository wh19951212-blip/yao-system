/** 智能匹配 — 需求单与结果状态枚举 */

export const DEMAND_SOURCES = ['portal', 'staff', 'channel'] as const
export type DemandSource = (typeof DEMAND_SOURCES)[number]

export const DEMAND_INTENT_TYPES = [
  'invest_dev',
  'invest_hotel',
  'buy_property',
  'general',
] as const
export type DemandIntentType = (typeof DEMAND_INTENT_TYPES)[number]

export const DEMAND_INTENT_LABELS: Record<DemandIntentType, string> = {
  invest_dev: '开发投资',
  invest_hotel: '酒店投资/运营',
  buy_property: '购买物件',
  general: '综合咨询',
}

export const DEMAND_STATUSES = [
  'draft',
  'submitted',
  'matching',
  'matched',
  'in_progress',
  'closed',
  'cancelled',
] as const
export type DemandStatus = (typeof DEMAND_STATUSES)[number]

export const DEMAND_STATUS_LABELS: Record<DemandStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  matching: '匹配中',
  matched: '已匹配',
  in_progress: '跟进中',
  closed: '已成交',
  cancelled: '已取消',
}

export const RISK_TOLERANCE_OPTIONS = ['保守', '平衡', '激进'] as const
export type RiskTolerance = (typeof RISK_TOLERANCE_OPTIONS)[number]

export const MATCH_TARGET_TYPES = [
  'land',
  'property',
  'hotel',
  'builder',
  'channel',
] as const
export type MatchTargetType = (typeof MATCH_TARGET_TYPES)[number]

export const MATCH_TARGET_LABELS: Record<MatchTargetType, string> = {
  land: '土地',
  property: '物件',
  hotel: '酒店',
  builder: '建筑商',
  channel: '渠道',
}

export const MATCH_REVIEW_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'shown_to_investor',
] as const
export type MatchReviewStatus = (typeof MATCH_REVIEW_STATUSES)[number]

export const MATCH_REVIEW_LABELS: Record<MatchReviewStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  shown_to_investor: '已推送',
}

export const PREFERRED_REGIONS = [
  '涩谷',
  '新宿',
  '港区',
  '品川',
  '横滨',
  '大阪',
] as const

export const MATCH_ENGINE_VERSION = 'v1'

/** 打分权重（满分 100） */
export const MATCH_WEIGHTS = {
  budget: 30,
  region: 25,
  type: 20,
  roi: 15,
  status: 10,
} as const
