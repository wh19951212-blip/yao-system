import type {
  DecisionType,
  InvestorGrade,
  InvestorStage,
} from '@/config/app'

export interface Investor {
  id: string
  name: string
  grade: InvestorGrade
  stage: InvestorStage | string
  budget: number
  confirmed_amount: number
  motivation: string | null
  decision_type: DecisionType | string | null
  source: string | null
  channel_id: string | null
  owner: string | null
  next_action: string | null
  deadline: string | null
  last_contact_at: string | null
  notes: string | null
  is_closed_client: boolean
  after_sales_mode: boolean
  created_at: string
  updated_at: string
}

export interface FollowUp {
  id: string
  investor_id: string
  content: string
  contact_type: string
  created_at: string
  created_by: string | null
}

export interface GradePoolStats {
  grade: InvestorGrade
  count: number
  totalBudget: number
  confirmedAmount: number
  progress: number
}

export interface DashboardData {
  pools: GradePoolStats[]
  overdueInvestors: Investor[]
  upcomingDeadlineInvestors: Investor[]
  afterSalesOverdueInvestors: Investor[]
  totals: {
    investors: number
    totalBudget: number
    confirmedAmount: number
    confirmRate: number
  }
  stats: DashboardStats
}

export interface StageDistribution {
  stage: string
  count: number
}

export interface PoolTrendPoint {
  month: string
  totalBudget: number
  confirmedAmount: number
}

export interface DashboardStats {
  newInvestorsThisMonth: number
  newPropertiesThisMonth: number
  closedContractsThisMonth: number
  stageDistribution: StageDistribution[]
  poolTrend: PoolTrendPoint[]
  stageUpgradesThisMonth: StageDistribution[]
  abandonReasonStats: StageDistribution[]
}

export type InvestorInsert = Omit<
  Investor,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'confirmed_amount'
  | 'is_closed_client'
  | 'after_sales_mode'
> & {
  confirmed_amount?: number
  is_closed_client?: boolean
  after_sales_mode?: boolean
}

export type InvestorUpdate = Partial<
  Omit<Investor, 'id' | 'created_at' | 'updated_at'>
>

/** Supabase investors 表原始行（支持新旧字段名） */
export interface InvestorRow {
  id: string
  name: string
  level?: string
  grade?: string
  stage: string
  budget_wan?: number
  budget?: number
  confirmed_wan?: number
  confirmed_amount?: number
  motivation?: string | null
  decision_type?: string | null
  source?: string | null
  channel_id?: string | null
  owner?: string | null
  next_action?: string | null
  deadline?: string | null
  last_contact_at?: string | null
  notes?: string | null
  is_closed_client?: boolean
  after_sales_mode?: boolean
  investment_focus?: string | null
  risk_tolerance?: string | null
  created_at: string
  updated_at: string
}

export interface InvestorStageLog {
  id: string
  investor_id: string
  from_stage: string
  to_stage: string
  changed_by: string | null
  changed_at: string
}

export interface OperationLog {
  id: string
  operator: string
  action: string
  entity_type: string
  entity_id: string | null
  summary: string
  created_at: string
}

export interface Land {
  id: string
  name: string
  location: string
  area_sqm: number
  price_wan: number
  expected_rent_wan: number | null
  roi_percent: number | null
  status: string
  legal_status: string | null
  description: string | null
  abandon_reason: string | null
  abandon_reason_note: string | null
  owner: string | null
  created_at: string
  updated_at: string
}

export type LandInsert = {
  name: string
  location: string
  area_sqm: number
  price_wan: number
  expected_rent_wan: number
  roi_percent: number | null
  legal_status: string | null
  description: string | null
  status?: string
  abandon_reason?: string | null
  abandon_reason_note?: string | null
  owner?: string | null
}

export type LandUpdate = Partial<LandInsert>

export interface MatchedInvestor {
  matchId: string
  investor: Investor
}

export interface Property {
  id: string
  name: string
  location: string | null
  type: string
  source_type: string
  price_wan: number | null
  commission_rate: number | null
  status: string
  description: string | null
  image_url: string | null
  land_id: string | null
  project_id: string | null
  owner: string | null
  channel_id: string | null
  created_at: string
  updated_at: string
}

export type PropertyInsert = {
  name: string
  location?: string | null
  type: string
  source_type: string
  price_wan?: number | null
  commission_rate?: number | null
  status?: string
  description?: string | null
  image_url?: string | null
  land_id?: string | null
  project_id?: string | null
  owner?: string | null
  channel_id?: string | null
}

export type PropertyUpdate = Partial<PropertyInsert>

export interface Builder {
  id: string
  company_name: string
  contact_name: string | null
  contact_wechat: string | null
  contact_phone: string | null
  specialty: string | null
  region: string | null
  tier: string
  price_per_sqm_min: number | null
  price_per_sqm_max: number | null
  typical_timeline_months: number | null
  overall_rating: number | null
  capacity_status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type BuilderInsert = {
  company_name: string
  contact_name?: string | null
  contact_wechat?: string | null
  contact_phone?: string | null
  specialty?: string | null
  region?: string | null
  tier?: string
  price_per_sqm_min?: number | null
  price_per_sqm_max?: number | null
  typical_timeline_months?: number | null
  capacity_status?: string
  notes?: string | null
}

export type BuilderUpdate = Partial<BuilderInsert>

export interface BuilderQuote {
  id: string
  builder_id: string
  land_id: string | null
  quote_amount_wan: number | null
  quote_date: string | null
  status: string
  notes: string | null
  created_at: string
  land?: { name: string; location: string | null } | null
  builder?: { company_name: string; tier: string } | null
}

export type BuilderQuoteInsert = {
  builder_id: string
  land_id: string
  quote_amount_wan: number
  quote_date: string
  notes?: string | null
  status?: string
}

export interface LandQuoteStats {
  min: number | null
  max: number | null
  avg: number | null
  bestId: string | null
}

export interface PropertyInvestorMatch {
  matchId: string | null
  investor: Investor
  isRecommended: boolean
  budgetMatch: boolean
}

export interface Buyer {
  id: string
  name: string
  budget_wan: number | null
  preferred_type: string | null
  motivation: string | null
  contact_wechat: string | null
  contact_phone: string | null
  source: string | null
  channel_id: string | null
  owner: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type BuyerInsert = {
  name: string
  budget_wan?: number | null
  preferred_type?: string | null
  motivation?: string | null
  contact_wechat?: string | null
  contact_phone?: string | null
  source?: string | null
  channel_id?: string | null
  owner?: string | null
  notes?: string | null
}

export type BuyerUpdate = Partial<BuyerInsert>

export interface SearchResults {
  investors: { id: string; name: string; subtitle: string }[]
  lands: { id: string; name: string; subtitle: string }[]
  properties: { id: string; name: string; subtitle: string }[]
  buyers: { id: string; name: string; subtitle: string }[]
  channels: { id: string; name: string; subtitle: string }[]
  contracts: { id: string; name: string; subtitle: string }[]
  demands: { id: string; name: string; subtitle: string }[]
}

export interface Hotel {
  id: string
  name: string
  location: string | null
  room_count: number | null
  owner_investor_id: string | null
  management_fee_rate: number | null
  contract_start: string | null
  contract_end: string | null
  status: string
  notes: string | null
  land_id: string | null
  project_id: string | null
  created_at: string
  updated_at: string
  owner_investor?: { id: string; name: string } | null
}

export type HotelInsert = {
  name: string
  location?: string | null
  room_count?: number | null
  owner_investor_id?: string | null
  management_fee_rate?: number | null
  contract_start?: string | null
  contract_end?: string | null
  status?: string
  notes?: string | null
  land_id?: string | null
  project_id?: string | null
}

export type HotelUpdate = Partial<HotelInsert>

export interface HotelMonthlyReport {
  id: string
  hotel_id: string
  year: number
  month: number
  occupancy_rate: number | null
  revenue_wan: number | null
  expense_wan: number | null
  ai_report: string | null
  created_at: string
}

export type HotelMonthlyReportInsert = {
  hotel_id: string
  year: number
  month: number
  occupancy_rate?: number | null
  revenue_wan?: number | null
  expense_wan?: number | null
}

export interface Contract {
  id: string
  type: string
  contract_type: ContractKind | null
  investor_id: string | null
  buyer_id: string | null
  land_id: string | null
  property_id: string | null
  channel_id: string | null
  builder_id: string | null
  amount_wan: number | null
  commission_wan: number | null
  signed_date: string | null
  status: string
  file_url: string | null
  notes: string | null
  owner_id: string | null
  created_at: string
  investor?: { id: string; name: string } | null
  buyer?: { id: string; name: string } | null
  land?: { id: string; name: string } | null
  property?: { id: string; name: string } | null
  channel?: { id: string; name: string } | null
  builder?: { id: string; name: string } | null
}

export type ContractKind = import('@/config/app').ContractKind

export type ContractInsert = {
  type: string
  contract_type?: ContractKind | null
  investor_id?: string | null
  buyer_id?: string | null
  land_id?: string | null
  property_id?: string | null
  channel_id?: string | null
  builder_id?: string | null
  amount_wan?: number | null
  commission_wan?: number | null
  signed_date?: string | null
  status?: string
  file_url?: string | null
  notes?: string | null
  owner_id?: string | null
}

export interface Project {
  id: string
  name: string
  land_id: string | null
  type: import('@/config/projects').ProjectType
  status: import('@/config/projects').ProjectStatus
  start_date: string | null
  expected_completion: string | null
  actual_completion: string | null
  total_budget: number | null
  notes: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
  land?: { id: string; name: string } | null
}

export type ProjectInsert = {
  name: string
  land_id?: string | null
  type?: import('@/config/projects').ProjectType
  status?: import('@/config/projects').ProjectStatus
  start_date?: string | null
  expected_completion?: string | null
  actual_completion?: string | null
  total_budget?: number | null
  notes?: string | null
  owner_id?: string | null
}

export interface Task {
  id: string
  title: string
  related_type: import('@/config/tasks').TaskRelatedType
  related_id: string
  due_date: string | null
  status: import('@/config/tasks').TaskStatus
  assigned_to: string | null
  created_by: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
  assignee?: { id: string; name: string; email: string } | null
}

export type TaskInsert = {
  title: string
  related_type: import('@/config/tasks').TaskRelatedType
  related_id: string
  due_date?: string | null
  status?: import('@/config/tasks').TaskStatus
  assigned_to?: string | null
  created_by?: string | null
  owner_id?: string | null
}

export interface BuyerPropertyMatch {
  id: string
  buyer_id: string
  property_id: string
  is_recommended: boolean
  notes: string | null
  created_at: string
}

export interface Channel {
  id: string
  name: string
  entity_type: string
  contact_name: string | null
  contact_wechat: string | null
  contact_phone: string | null
  region: string | null
  tier: string
  cooperation_types: string[]
  default_commission_rate: number | null
  status: string
  owner: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ChannelInsert = {
  name: string
  entity_type: string
  contact_name?: string | null
  contact_wechat?: string | null
  contact_phone?: string | null
  region?: string | null
  tier?: string
  cooperation_types?: string[]
  default_commission_rate?: number | null
  status?: string
  owner?: string | null
  notes?: string | null
}

export type ChannelUpdate = Partial<ChannelInsert>

export interface ChannelCommission {
  id: string
  channel_id: string
  contract_id: string | null
  related_type: string | null
  related_id: string | null
  title: string | null
  amount_wan: number | null
  commission_wan: number
  status: string
  settled_at: string | null
  notes: string | null
  owner: string | null
  created_at: string
  channel?: { id: string; name: string } | null
}

export type ChannelCommissionInsert = {
  channel_id: string
  contract_id?: string | null
  related_type?: string | null
  related_id?: string | null
  title?: string | null
  amount_wan?: number | null
  commission_wan: number
  status?: string
  notes?: string | null
  owner?: string | null
}

export interface ChannelStats {
  investorCount: number
  buyerCount: number
  propertyCount: number
  contractCount: number
  pendingCommissionWan: number
  settledCommissionWan: number
}

export interface ChannelReferrals {
  investors: Investor[]
  buyers: Buyer[]
  properties: Property[]
  contracts: Contract[]
}

export interface LandApprovalNode {
  id: string
  land_id: string
  node_name: string
  is_custom: boolean
  status: string
  owner: string | null
  deadline: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type LandApprovalNodeUpdate = {
  node_name?: string
  status?: string
  owner?: string | null
  deadline?: string | null
  notes?: string | null
}

export interface MediaAsset {
  id: string
  title: string
  type: string
  related_type: string
  related_id: string | null
  content: string | null
  file_url: string | null
  platform: string
  status: string
  publish_date: string | null
  created_by: string | null
  created_at: string
}

export type MediaAssetInsert = {
  title: string
  type: string
  platform: string
  related_type?: string
  related_id?: string | null
  content?: string | null
  file_url?: string | null
  status?: string
  created_by?: string | null
}

export type MediaAssetUpdate = Partial<MediaAssetInsert>

export type DemandSource = 'portal' | 'staff' | 'channel'
export type DemandIntentType =
  | 'invest_dev'
  | 'invest_hotel'
  | 'buy_property'
  | 'general'
export type DemandStatus =
  | 'draft'
  | 'submitted'
  | 'matching'
  | 'matched'
  | 'in_progress'
  | 'closed'
  | 'cancelled'
export type MatchTargetType =
  | 'land'
  | 'property'
  | 'hotel'
  | 'builder'
  | 'channel'
export type MatchReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'shown_to_investor'

export interface InvestorDemand {
  id: string
  source: DemandSource
  portal_user_id: string | null
  investor_id: string | null
  buyer_id: string | null
  channel_id: string | null
  submitted_by: string | null
  intent_type: DemandIntentType
  budget_min_wan: number | null
  budget_max_wan: number | null
  preferred_regions: string[]
  preferred_types: string[]
  min_roi_percent: number | null
  risk_tolerance: string | null
  timeline: string | null
  raw_description: string | null
  parsed_criteria: Record<string, unknown> | null
  parse_confidence: number | null
  status: DemandStatus
  owner: string | null
  notes: string | null
  created_at: string
  updated_at: string
  investor?: { id: string; name: string } | null
  buyer?: { id: string; name: string } | null
}

export type InvestorDemandInsert = {
  source?: DemandSource
  investor_id?: string | null
  buyer_id?: string | null
  channel_id?: string | null
  submitted_by?: string | null
  intent_type: DemandIntentType
  budget_min_wan?: number | null
  budget_max_wan?: number | null
  preferred_regions?: string[]
  preferred_types?: string[]
  min_roi_percent?: number | null
  risk_tolerance?: string | null
  timeline?: string | null
  raw_description?: string | null
  status?: DemandStatus
  owner?: string | null
  notes?: string | null
}

export type InvestorDemandUpdate = Partial<InvestorDemandInsert>

export interface MatchRun {
  id: string
  demand_id: string
  engine_version: string
  rule_config: Record<string, unknown> | null
  ai_enabled: boolean
  status: 'running' | 'completed' | 'failed'
  result_count: number
  started_at: string
  completed_at: string | null
}

export interface MatchResult {
  id: string
  run_id: string
  demand_id: string
  target_type: MatchTargetType
  target_id: string
  score_total: number
  score_breakdown: Record<string, number> | null
  match_reasons: string[]
  ai_explanation: string | null
  review_status: MatchReviewStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rank: number
  investor_status: string | null
  investor_note: string | null
  created_at: string
  /** 展示用，非 DB 字段 */
  target_name?: string
  target_summary?: string
}

export type MatchResultUpdate = {
  review_status?: MatchReviewStatus
  reviewed_by?: string | null
  investor_status?: string | null
  investor_note?: string | null
}

export type AiFeedbackRating = 'helpful' | 'not_helpful'

export interface AiFeedback {
  id: string
  context_type: string
  entity_type: string | null
  entity_id: string | null
  rating: AiFeedbackRating
  comment: string | null
  created_by: string | null
  created_at: string
}

export type AiFeedbackInsert = {
  context_type: string
  entity_type?: string | null
  entity_id?: string | null
  rating: AiFeedbackRating
  comment?: string | null
  created_by?: string | null
}

export interface SuccessCase {
  id: string
  title: string
  summary: string
  case_type: string
  intent_type: string | null
  client_type: string | null
  regions: string[]
  budget_min_wan: number | null
  budget_max_wan: number | null
  target_type: string | null
  target_name: string | null
  target_id: string | null
  contract_id: string | null
  demand_id: string | null
  outcome: string
  created_by: string | null
  created_at: string
}

export type SuccessCaseInsert = {
  title: string
  summary: string
  case_type?: string
  intent_type?: string | null
  client_type?: string | null
  regions?: string[]
  budget_min_wan?: number | null
  budget_max_wan?: number | null
  target_type?: string | null
  target_name?: string | null
  target_id?: string | null
  contract_id?: string | null
  demand_id?: string | null
  outcome?: string
  created_by?: string | null
}
