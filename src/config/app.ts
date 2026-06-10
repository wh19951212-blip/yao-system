/** 修改此处即可全局更换系统名称 */
export const appConfig = {
  name: 'YAO 投资管理系统',
  shortName: 'YAO',
  copyright: 'YAO Real Estate Investment',
}

export const INVESTOR_GRADES = ['S', 'A', 'B', 'C'] as const
export type InvestorGrade = (typeof INVESTOR_GRADES)[number]

export const INVESTOR_STAGES = [
  '认知阶段',
  '信任阶段',
  '评估阶段',
  '决策阶段',
  '成交阶段',
] as const
export type InvestorStage = (typeof INVESTOR_STAGES)[number]

export const DECISION_TYPES = ['独立', '夫妻', '合伙', '家族'] as const
export type DecisionType = (typeof DECISION_TYPES)[number]

export const FOLLOW_UP_TYPES = ['微信', '电话', '见面', '其他'] as const
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number]

export const GRADE_COLORS: Record<
  InvestorGrade,
  { bg: string; text: string; border: string; bar: string; accent: string }
> = {
  S: {
    bg: 'bg-[#C9A84C]/10',
    text: 'text-[#C9A84C]',
    border: 'border-[#C9A84C]/30',
    bar: 'bg-[#C9A84C]',
    accent: 'border-l-[#C9A84C]',
  },
  A: {
    bg: 'bg-blue-50',
    text: 'text-blue-500',
    border: 'border-blue-200',
    bar: 'bg-blue-500',
    accent: 'border-l-blue-500',
  },
  B: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-500',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    accent: 'border-l-emerald-500',
  },
  C: {
    bg: 'bg-gray-50',
    text: 'text-gray-400',
    border: 'border-gray-200',
    bar: 'bg-gray-400',
    accent: 'border-l-gray-400',
  },
}

export const BUYER_PREFERRED_TYPES = ['酒店', '住宅', '商业'] as const
export type BuyerPreferredType = (typeof BUYER_PREFERRED_TYPES)[number]

export const NAV_ITEMS = [
  { path: '/dashboard', label: '仪表盘', icon: 'LayoutDashboard' },
  { path: '/investors', label: '投资人', icon: 'Users' },
  { path: '/lands', label: '土地', icon: 'Map' },
  { path: '/properties', label: '物件', icon: 'Building2' },
  { path: '/buyers', label: '买家', icon: 'ShoppingBag' },
  { path: '/builders', label: '建筑商', icon: 'HardHat' },
  { path: '/hotels', label: '酒店', icon: 'Hotel' },
  { path: '/contracts', label: '合同', icon: 'FileText' },
  { path: '/media', label: '素材库', icon: 'FolderOpen' },
  { path: '/settings', label: '设置', icon: 'Settings' },
] as const

export const LAND_STATUSES = [
  '分析中',
  '待审批',
  '已审批',
  '已完工',
  '已放弃',
] as const
export type LandStatus = (typeof LAND_STATUSES)[number]

export const LAND_ABANDON_REASONS = [
  '回报率不达标',
  '法律问题',
  '价格谈不拢',
  '建筑商报价太高',
  '投资人不感兴趣',
  '其他',
] as const
export type LandAbandonReason = (typeof LAND_ABANDON_REASONS)[number]

export const AFTER_SALES_REMINDER_DAYS = 30

export const LAND_STATUS_COLORS: Record<
  LandStatus,
  { bg: string; text: string; border: string }
> = {
  分析中: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  待审批: {
    bg: 'bg-[#C9A84C]/10',
    text: 'text-[#C9A84C]',
    border: 'border-[#C9A84C]/30',
  },
  已审批: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  已完工: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-200',
  },
  已放弃: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
}

export const PROPERTY_TYPES = ['酒店', '住宅', '商业'] as const
export type PropertyType = (typeof PROPERTY_TYPES)[number]

export const PROPERTY_SOURCE_TYPES = ['自开发', '代理'] as const
export type PropertySourceType = (typeof PROPERTY_SOURCE_TYPES)[number]

export const PROPERTY_STATUSES = ['進行中', '販売中', '終了&不合格'] as const
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number]

export const PROPERTY_TABS = [
  { key: 'all', label: '全部' },
  { key: '進行中', label: '進行中' },
  { key: '販売中', label: '販売中' },
  { key: '終了&不合格', label: '終了&不合格' },
] as const

export const PROPERTY_STATUS_COLORS: Record<
  PropertyStatus,
  { bg: string; text: string; border: string }
> = {
  進行中: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  販売中: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  '終了&不合格': {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
}

export const BUILDER_TIERS = ['A', 'B', 'C'] as const
export type BuilderTier = (typeof BUILDER_TIERS)[number]

export const CAPACITY_STATUSES = ['空闲', '饱和', '满'] as const
export type CapacityStatus = (typeof CAPACITY_STATUSES)[number]

export const CAPACITY_COLORS: Record<
  CapacityStatus,
  { bg: string; text: string; border: string }
> = {
  空闲: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  饱和: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  满: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
}

export const HOTEL_STATUSES = ['运营中', '筹备中', '已结束'] as const
export type HotelStatus = (typeof HOTEL_STATUSES)[number]

export const HOTEL_STATUS_COLORS: Record<
  HotelStatus,
  { bg: string; text: string; border: string }
> = {
  运营中: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  筹备中: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  已结束: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
}

export const QUOTE_STATUSES = ['待确认', '已接受', '已拒绝'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export const CONTRACT_TYPES = ['开发', '中介', '运营'] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]

export const CONTRACT_STATUSES = ['进行中', '已完成'] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export const CONTRACT_STATUS_COLORS: Record<
  ContractStatus,
  { bg: string; text: string; border: string }
> = {
  进行中: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  已完成: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
}

export const APPROVAL_STATUSES = ['待提交', '审批中', '已通过', '已拒绝'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export const DEFAULT_LAND_APPROVAL_NODES = [
  '建築確認申請（建筑许可）',
  '旅館業許可（旅馆执照）',
  '消防检查',
] as const

export const APPROVAL_STATUS_COLORS: Record<
  ApprovalStatus,
  { bg: string; text: string; border: string }
> = {
  待提交: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
  审批中: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  已通过: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  已拒绝: {
    bg: 'bg-red-50',
    text: 'text-red-500',
    border: 'border-red-200',
  },
}

export const MEDIA_TYPES = ['图片', '视频', '文案'] as const
export type MediaType = (typeof MEDIA_TYPES)[number]

export const MEDIA_PLATFORMS = ['小红书', '微信', '其他'] as const
export type MediaPlatform = (typeof MEDIA_PLATFORMS)[number]

export const MEDIA_RELATED_TYPES = ['土地', '项目', '酒店', '通用'] as const
export type MediaRelatedType = (typeof MEDIA_RELATED_TYPES)[number]
