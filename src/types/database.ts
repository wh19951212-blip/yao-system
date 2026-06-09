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
  owner: string | null
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
  owner?: string | null
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
  owner?: string | null
  notes?: string | null
}

export type BuyerUpdate = Partial<BuyerInsert>

export interface SearchResults {
  investors: { id: string; name: string; subtitle: string }[]
  lands: { id: string; name: string; subtitle: string }[]
  properties: { id: string; name: string; subtitle: string }[]
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
  investor_id: string | null
  land_id: string | null
  property_id: string | null
  amount_wan: number | null
  commission_wan: number | null
  signed_date: string | null
  status: string
  file_url: string | null
  notes: string | null
  created_at: string
  investor?: { id: string; name: string } | null
  land?: { id: string; name: string } | null
  property?: { id: string; name: string } | null
}

export type ContractInsert = {
  type: string
  investor_id?: string | null
  land_id?: string | null
  property_id?: string | null
  amount_wan?: number | null
  commission_wan?: number | null
  signed_date?: string | null
  status?: string
  file_url?: string | null
  notes?: string | null
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
