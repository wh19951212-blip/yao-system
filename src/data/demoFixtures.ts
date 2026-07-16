import type {
  Builder,
  Buyer,
  Channel,
  ChannelCommission,
  Contract,
  FollowUp,
  Hotel,
  HotelMonthlyReport,
  Investor,
  Land,
  MediaAsset,
  OperationLog,
  Property,
} from '@/types/database'
import type { InvestorGrade } from '@/config/app'
import type { AppUser } from '@/services/users'

function ts(daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function dateOnly(daysFromNow = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

export const DEMO_USER_IDS = {
  admin: 'd0000005-0000-4000-8000-000000000001',
  staff: 'd0000005-0000-4000-8000-000000000002',
} as const

export const DEMO_IDS = {
  invWang: 'a0000001-0000-4000-8000-000000000001',
  invLi: 'a0000002-0000-4000-8000-000000000002',
  invZhang: 'a0000003-0000-4000-8000-000000000003',
  invChen: 'a0000004-0000-4000-8000-000000000004',
  invLiu: 'a0000005-0000-4000-8000-000000000005',
  landShibuya: 'b0000001-0000-4000-8000-000000000001',
  landShinjuku: 'b0000002-0000-4000-8000-000000000002',
  landMinato: 'b0000003-0000-4000-8000-000000000003',
  propHotel: 'c0000001-0000-4000-8000-000000000001',
  propRes: 'c0000002-0000-4000-8000-000000000002',
  propBiz: 'c0000003-0000-4000-8000-000000000003',
  builderTokyo: 'c0000004-0000-4000-8000-000000000001',
  builderShinjuku: 'c0000005-0000-4000-8000-000000000002',
  buyerTanaka: 'c0000006-0000-4000-8000-000000000001',
  buyerSato: 'c0000007-0000-4000-8000-000000000002',
  hotelA: 'c0000008-0000-4000-8000-000000000001',
  hotelB: 'c0000009-0000-4000-8000-000000000002',
  contractDev: 'c000000a-0000-4000-8000-000000000001',
  contractBroker: 'c000000b-0000-4000-8000-000000000001',
  projectShibuya: 'k0000001-0000-4000-8000-000000000001',
  channelTokyo: 'e0000001-0000-4000-8000-000000000001',
  channelTanaka: 'e0000002-0000-4000-8000-000000000002',
  channelYokohama: 'e0000003-0000-4000-8000-000000000003',
  commBroker: 'f0000001-0000-4000-8000-000000000001',
} as const

export const DEMO_INVESTORS: Investor[] = [
  {
    id: DEMO_IDS.invWang,
    name: '王总',
    grade: 'S',
    stage: '决策阶段',
    budget: 5000,
    confirmed_amount: 2000,
    motivation: '稳定收益 · 资产配置',
    decision_type: '独立',
    source: '赵总介绍',
    channel_id: DEMO_IDS.channelTanaka,
    owner: 'YAO',
    next_action: '安排贷款经理沟通',
    deadline: dateOnly(7),
    last_contact_at: ts(3),
    notes: '对涩谷区地块A兴趣较高，关注 ROI 与贷款方案。',
    is_closed_client: false,
    after_sales_mode: false,
    created_at: ts(120),
    updated_at: ts(3),
  },
  {
    id: DEMO_IDS.invLi,
    name: '李女士',
    grade: 'A',
    stage: '评估阶段',
    budget: 3000,
    confirmed_amount: 1000,
    motivation: '做资产管理',
    decision_type: '夫妻',
    source: '直接来访',
    channel_id: null,
    owner: 'YAO',
    next_action: '发送项目资料包',
    deadline: dateOnly(12),
    last_contact_at: ts(8),
    notes: '偏好酒店类物件，预算弹性约 ±10%。',
    is_closed_client: false,
    after_sales_mode: false,
    created_at: ts(90),
    updated_at: ts(8),
  },
  {
    id: DEMO_IDS.invZhang,
    name: '张先生',
    grade: 'B',
    stage: '信任阶段',
    budget: 5000,
    confirmed_amount: 500,
    motivation: '身份规划 + 长期持有',
    decision_type: '合伙',
    source: '朋友介绍',
    channel_id: null,
    owner: 'YAO',
    next_action: '微信跟进 · 分享案例',
    deadline: dateOnly(18),
    last_contact_at: ts(2),
    notes: null,
    is_closed_client: false,
    after_sales_mode: false,
    created_at: ts(60),
    updated_at: ts(2),
  },
  {
    id: DEMO_IDS.invChen,
    name: '陈总',
    grade: 'C',
    stage: '认知阶段',
    budget: 3500,
    confirmed_amount: 0,
    motivation: '了解日本不动产投资',
    decision_type: '家族',
    source: '线上咨询',
    channel_id: null,
    owner: 'YAO',
    next_action: '初次需求访谈',
    deadline: dateOnly(25),
    last_contact_at: ts(12),
    notes: '尚未确定投资时间表。',
    is_closed_client: false,
    after_sales_mode: false,
    created_at: ts(30),
    updated_at: ts(12),
  },
  {
    id: DEMO_IDS.invLiu,
    name: '刘社长',
    grade: 'A',
    stage: '成交阶段',
    budget: 8000,
    confirmed_amount: 8000,
    motivation: '酒店运营 · 被动收入',
    decision_type: '独立',
    source: '展会',
    channel_id: null,
    owner: 'YAO',
    next_action: '售后回访 · 运营月报',
    deadline: null,
    last_contact_at: ts(45),
    notes: '已签约港区精品酒店项目，进入售后跟进。',
    is_closed_client: true,
    after_sales_mode: true,
    created_at: ts(200),
    updated_at: ts(45),
  },
]

export const DEMO_LANDS: Land[] = [
  {
    id: DEMO_IDS.landShibuya,
    name: '涩谷区地块 A',
    location: '东京都涩谷区',
    area_sqm: 120,
    price_wan: 8000,
    expected_rent_wan: 1480,
    roi_percent: 18.5,
    status: '分析中',
    legal_status: '商业地域',
    description: '站步行 8 分钟，适合精品酒店开发。',
    abandon_reason: null,
    abandon_reason_note: null,
    owner: 'YAO',
    created_at: ts(40),
    updated_at: ts(5),
  },
  {
    id: DEMO_IDS.landShinjuku,
    name: '新宿区地块 B',
    location: '东京都新宿区',
    area_sqm: 85,
    price_wan: 5500,
    expected_rent_wan: 1215,
    roi_percent: 22.1,
    status: '待审批',
    legal_status: '近商地域',
    description: '角地，已收到 2 份建筑商报价。',
    abandon_reason: null,
    abandon_reason_note: null,
    owner: 'YAO',
    created_at: ts(35),
    updated_at: ts(4),
  },
  {
    id: DEMO_IDS.landMinato,
    name: '港区地块 C',
    location: '东京都港区',
    area_sqm: 200,
    price_wan: 15000,
    expected_rent_wan: 2370,
    roi_percent: 15.8,
    status: '已放弃',
    legal_status: '商业地域',
    description: '地价超出当前资金池上限。',
    abandon_reason: '价格过高',
    abandon_reason_note: '待下一轮资金到位后再评估',
    owner: 'YAO',
    created_at: ts(80),
    updated_at: ts(20),
  },
]

export const DEMO_PROPERTIES: Property[] = [
  {
    id: DEMO_IDS.propHotel,
    name: '涩谷精品酒店（代售）',
    location: '东京都涩谷区',
    type: '酒店',
    source_type: '代理',
    price_wan: 6800,
    commission_rate: 3.5,
    status: '販売中',
    description: '28 间客房，含运营权转让，适合王总级别投资人。',
    image_url: null,
    land_id: DEMO_IDS.landShibuya,
    project_id: DEMO_IDS.projectShibuya,
    owner: 'YAO',
    channel_id: DEMO_IDS.channelTokyo,
    created_at: ts(25),
    updated_at: ts(6),
  },
  {
    id: DEMO_IDS.propRes,
    name: '新宿区收益型公寓',
    location: '东京都新宿区',
    type: '住宅',
    source_type: '代理',
    price_wan: 3200,
    commission_rate: 2.8,
    status: '進行中',
    description: '整栋 12 户，当前出租率 96%。',
    image_url: null,
    land_id: null,
    project_id: null,
    owner: 'YAO',
    channel_id: DEMO_IDS.channelYokohama,
    created_at: ts(22),
    updated_at: ts(7),
  },
  {
    id: DEMO_IDS.propBiz,
    name: '港区商业整层',
    location: '东京都港区',
    type: '商业',
    source_type: '自开发',
    price_wan: 9500,
    commission_rate: null,
    status: '進行中',
    description: '与刘社长成交项目关联，已进入运营准备。',
    image_url: null,
    land_id: DEMO_IDS.landMinato,
    project_id: null,
    owner: 'YAO',
    channel_id: null,
    created_at: ts(50),
    updated_at: ts(10),
  },
]

export const DEMO_BUILDERS: Builder[] = [
  {
    id: DEMO_IDS.builderTokyo,
    company_name: '东京建设株式会社',
    contact_name: '田中',
    contact_wechat: 'tanaka_tokyo',
    contact_phone: '+81-90-1234-5678',
    specialty: '酒店 / 商业',
    region: '东京',
    tier: 'A',
    price_per_sqm_min: 80,
    price_per_sqm_max: 120,
    typical_timeline_months: 14,
    overall_rating: 4.5,
    capacity_status: '空闲',
    notes: '擅长精品酒店，曾完成 3 个涩谷区项目。',
    created_at: ts(100),
    updated_at: ts(15),
  },
  {
    id: DEMO_IDS.builderShinjuku,
    company_name: '新宿工务店',
    contact_name: '佐藤',
    contact_wechat: 'sato_shinjuku',
    contact_phone: '+81-80-9876-5432',
    specialty: '住宅 / 小型酒店',
    region: '东京',
    tier: 'B',
    price_per_sqm_min: 60,
    price_per_sqm_max: 90,
    typical_timeline_months: 10,
    overall_rating: 3.8,
    capacity_status: '饱和',
    notes: '报价响应快，适合中小体量项目。',
    created_at: ts(95),
    updated_at: ts(18),
  },
]

export const DEMO_BUYERS: Buyer[] = [
  {
    id: DEMO_IDS.buyerTanaka,
    name: '田中一郎',
    budget_wan: 4000,
    preferred_type: '酒店',
    motivation: '自主经营 · 移民配套',
    contact_wechat: 'tanaka_buyer',
    contact_phone: '+81-70-1111-2222',
    source: '小红书',
    channel_id: DEMO_IDS.channelYokohama,
    owner: 'YAO',
    notes: '希望 2026 年内完成购入。',
    created_at: ts(14),
    updated_at: ts(3),
  },
  {
    id: DEMO_IDS.buyerSato,
    name: '佐藤花子',
    budget_wan: 2500,
    preferred_type: '住宅',
    motivation: '子女留学陪读',
    contact_wechat: 'sato_buyer',
    contact_phone: null,
    source: '微信社群',
    channel_id: null,
    owner: 'YAO',
    notes: null,
    created_at: ts(10),
    updated_at: ts(5),
  },
]

export const DEMO_HOTELS: Hotel[] = [
  {
    id: DEMO_IDS.hotelA,
    name: 'YAO 涩谷精品酒店',
    location: '东京都涩谷区',
    room_count: 28,
    owner_investor_id: DEMO_IDS.invLiu,
    owner_investor: { id: DEMO_IDS.invLiu, name: '刘社长' },
    management_fee_rate: 8,
    contract_start: '2025-03-01',
    contract_end: '2030-02-28',
    status: '运营中',
    notes: '首年目标入住率 78%。',
    land_id: DEMO_IDS.landShibuya,
    project_id: DEMO_IDS.projectShibuya,
    created_at: ts(180),
    updated_at: ts(9),
  },
  {
    id: DEMO_IDS.hotelB,
    name: '新宿商务酒店（筹备）',
    location: '东京都新宿区',
    room_count: 42,
    owner_investor_id: DEMO_IDS.invWang,
    owner_investor: { id: DEMO_IDS.invWang, name: '王总' },
    management_fee_rate: 7.5,
    contract_start: '2026-01-01',
    contract_end: '2031-12-31',
    status: '筹备中',
    notes: '待土地审批完成后启动装修。',
    land_id: DEMO_IDS.landShinjuku,
    project_id: null,
    created_at: ts(45),
    updated_at: ts(6),
  },
]

export const DEMO_HOTEL_REPORTS: HotelMonthlyReport[] = [
  {
    id: 'd0000001-0000-4000-8000-000000000001',
    hotel_id: DEMO_IDS.hotelA,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    occupancy_rate: 76.5,
    revenue_wan: 185,
    expense_wan: 92,
    ai_report: '本月入住率略低于目标，建议加强 OTA 渠道投放。',
    created_at: ts(2),
  },
]

export const DEMO_CONTRACTS: Contract[] = [
  {
    id: DEMO_IDS.contractDev,
    type: '开发',
    contract_type: 'development',
    investor_id: DEMO_IDS.invLiu,
    buyer_id: null,
    land_id: DEMO_IDS.landShibuya,
    property_id: DEMO_IDS.propBiz,
    channel_id: null,
    builder_id: null,
    amount_wan: 8000,
    commission_wan: 240,
    signed_date: '2025-03-15',
    status: '进行中',
    file_url: null,
    notes: '含酒店开发总包与运营委托。',
    owner_id: DEMO_USER_IDS.admin,
    created_at: ts(150),
    investor: { id: DEMO_IDS.invLiu, name: '刘社长' },
    land: { id: DEMO_IDS.landShibuya, name: '涩谷区地块 A' },
    property: { id: DEMO_IDS.propBiz, name: '港区商业整层' },
  },
  {
    id: DEMO_IDS.contractBroker,
    type: '中介',
    contract_type: 'broker',
    investor_id: DEMO_IDS.invWang,
    buyer_id: DEMO_IDS.buyerTanaka,
    land_id: null,
    property_id: DEMO_IDS.propHotel,
    channel_id: DEMO_IDS.channelTokyo,
    builder_id: null,
    amount_wan: 6800,
    commission_wan: 238,
    signed_date: '2025-05-01',
    status: '进行中',
    file_url: null,
    notes: '代售协议，佣金 3.5%。',
    owner_id: DEMO_USER_IDS.admin,
    created_at: ts(20),
    investor: { id: DEMO_IDS.invWang, name: '王总' },
    buyer: { id: DEMO_IDS.buyerTanaka, name: '田中先生' },
    land: null,
    property: { id: DEMO_IDS.propHotel, name: '涩谷精品酒店（代售）' },
    channel: { id: DEMO_IDS.channelTokyo, name: '东京不动产株式会社' },
  },
]

export const DEMO_PROJECTS: import('@/types/database').Project[] = [
  {
    id: DEMO_IDS.projectShibuya,
    name: '涩谷精品酒店开发',
    land_id: DEMO_IDS.landShibuya,
    type: '酒店',
    status: '施工',
    start_date: '2025-01-10',
    expected_completion: '2026-06-30',
    actual_completion: null,
    total_budget: 8000,
    notes: '含 120 间客房与商业配套。',
    owner_id: DEMO_USER_IDS.admin,
    created_at: ts(120),
    updated_at: ts(3),
    land: { id: DEMO_IDS.landShibuya, name: '涩谷区地块 A' },
  },
]

export const DEMO_TASKS: import('@/types/database').Task[] = [
  {
    id: 'l0000001-0000-4000-8000-000000000001',
    title: '联系王总确认涩谷地块意向',
    related_type: 'investor',
    related_id: DEMO_IDS.invWang,
    due_date: dateOnly(2),
    status: 'pending',
    assigned_to: DEMO_USER_IDS.admin,
    created_by: DEMO_USER_IDS.admin,
    owner_id: DEMO_USER_IDS.admin,
    created_at: ts(1),
    updated_at: ts(1),
  },
  {
    id: 'l0000002-0000-4000-8000-000000000002',
    title: '跟进涩谷酒店项目施工进度',
    related_type: 'project',
    related_id: DEMO_IDS.projectShibuya,
    due_date: dateOnly(5),
    status: 'pending',
    assigned_to: DEMO_USER_IDS.admin,
    created_by: DEMO_USER_IDS.admin,
    owner_id: DEMO_USER_IDS.admin,
    created_at: ts(2),
    updated_at: ts(2),
  },
]

export function getDemoProjectById(id: string) {
  return DEMO_PROJECTS.find((row) => row.id === id)
}

export const DEMO_CHANNELS: Channel[] = [
  {
    id: DEMO_IDS.channelTokyo,
    name: '东京不动产株式会社',
    entity_type: '公司',
    contact_name: '山本',
    contact_wechat: 'yamamoto_re',
    contact_phone: '+81-3-5555-0101',
    region: '东京',
    tier: 'S',
    cooperation_types: ['全渠道'],
    default_commission_rate: 3.5,
    status: '合作中',
    owner: 'YAO',
    notes: '长期合作，物件与投资人双向引荐。',
    created_at: ts(300),
    updated_at: ts(5),
  },
  {
    id: DEMO_IDS.channelTanaka,
    name: '田中一郎',
    entity_type: '个人',
    contact_name: '田中一郎',
    contact_wechat: 'tanaka_channel',
    contact_phone: '+81-90-8888-9999',
    region: '关东',
    tier: 'A',
    cooperation_types: ['投资人介绍'],
    default_commission_rate: 2,
    status: '合作中',
    owner: 'YAO',
    notes: '高净值客户介绍为主。',
    created_at: ts(180),
    updated_at: ts(8),
  },
  {
    id: DEMO_IDS.channelYokohama,
    name: '横滨渠道联盟',
    entity_type: '公司',
    contact_name: '铃木',
    contact_wechat: 'yokohama_alliance',
    contact_phone: null,
    region: '神奈川',
    tier: 'B',
    cooperation_types: ['买家介绍', '物件介绍'],
    default_commission_rate: 3,
    status: '合作中',
    owner: 'YAO',
    notes: null,
    created_at: ts(120),
    updated_at: ts(12),
  },
]

export const DEMO_CHANNEL_COMMISSIONS: ChannelCommission[] = [
  {
    id: DEMO_IDS.commBroker,
    channel_id: DEMO_IDS.channelTokyo,
    contract_id: DEMO_IDS.contractBroker,
    related_type: 'contract',
    related_id: DEMO_IDS.contractBroker,
    title: '中介合同佣金',
    amount_wan: 6800,
    commission_wan: 238,
    status: '待结算',
    settled_at: null,
    notes: '涩谷精品酒店代售',
    owner: 'YAO',
    created_at: ts(20),
    channel: { id: DEMO_IDS.channelTokyo, name: '东京不动产株式会社' },
  },
]

export const DEMO_MEDIA: MediaAsset[] = [
  {
    id: 'd0000002-0000-4000-8000-000000000001',
    title: '涩谷酒店 ROI 拆解',
    type: '文案',
    related_type: '土地',
    related_id: DEMO_IDS.landShibuya,
    content: '18.5% 年化回报怎么算？3 分钟讲清楚…',
    file_url: null,
    platform: '小红书',
    status: '已发布',
    publish_date: dateOnly(-10),
    created_by: 'YAO',
    created_at: ts(10),
  },
  {
    id: 'd0000002-0000-4000-8000-000000000002',
    title: '东京买地避坑指南',
    type: '文案',
    related_type: '通用',
    related_id: null,
    content: '法务、建筑、贷款三大环节注意事项…',
    file_url: null,
    platform: '微信',
    status: '草稿',
    publish_date: null,
    created_by: 'YAO',
    created_at: ts(5),
  },
  {
    id: 'd0000002-0000-4000-8000-000000000003',
    title: '新宿地块航拍',
    type: '视频',
    related_type: '土地',
    related_id: DEMO_IDS.landShinjuku,
    content: null,
    file_url: null,
    platform: '小红书',
    status: '已发布',
    publish_date: dateOnly(-3),
    created_by: 'YAO',
    created_at: ts(3),
  },
]

export const DEMO_OPERATION_LOGS: OperationLog[] = [
  {
    id: 'd0000003-0000-4000-8000-000000000001',
    operator: 'YAO',
    action: 'create',
    entity_type: 'investor',
    entity_id: DEMO_IDS.invWang,
    summary: '新增投资人「王总」',
    created_at: ts(120),
  },
  {
    id: 'd0000003-0000-4000-8000-000000000002',
    operator: 'YAO',
    action: 'stage_change',
    entity_type: 'investor',
    entity_id: DEMO_IDS.invLi,
    summary: '投资人「李女士」阶段：信任阶段 → 评估阶段',
    created_at: ts(15),
  },
  {
    id: 'd0000003-0000-4000-8000-000000000003',
    operator: 'YAO',
    action: 'create',
    entity_type: 'land',
    entity_id: DEMO_IDS.landShibuya,
    summary: '新增土地「涩谷区地块 A」',
    created_at: ts(40),
  },
  {
    id: 'd0000003-0000-4000-8000-000000000004',
    operator: 'YAO',
    action: 'contract_signed',
    entity_type: 'contract',
    entity_id: DEMO_IDS.contractDev,
    summary: '刘社长签署开发合同',
    created_at: ts(150),
  },
  {
    id: 'd0000003-0000-4000-8000-000000000005',
    operator: 'YAO',
    action: 'land_abandon',
    entity_type: 'land',
    entity_id: DEMO_IDS.landMinato,
    summary: '土地「港区地块 C」标记为已放弃',
    created_at: ts(20),
  },
]

export const DEMO_FOLLOW_UPS: FollowUp[] = [
  {
    id: 'd0000004-0000-4000-8000-000000000001',
    investor_id: DEMO_IDS.invWang,
    content: '电话沟通贷款预审批进度，对方希望下周见面。',
    contact_type: '电话',
    created_at: ts(3),
    created_by: 'YAO',
  },
  {
    id: 'd0000004-0000-4000-8000-000000000002',
    investor_id: DEMO_IDS.invLi,
    content: '已发送酒店项目 PDF 资料包。',
    contact_type: '微信',
    created_at: ts(8),
    created_by: 'YAO',
  },
]

export const DEMO_USERS: AppUser[] = [
  {
    id: 'd0000005-0000-4000-8000-000000000001',
    email: 'admin@yao.local',
    name: 'YAO 管理员',
    role: 'admin',
    created_at: ts(365),
  },
  {
    id: 'd0000005-0000-4000-8000-000000000002',
    email: 'staff@yao.local',
    name: '业务专员',
    role: 'staff',
    created_at: ts(200),
  },
]

export function getDemoChannelById(id: string) {
  return DEMO_CHANNELS.find((row) => row.id === id)
}

export function getDemoInvestors(
  grade?: InvestorGrade | 'all',
  ownerEmail?: string | null,
) {
  let rows = [...DEMO_INVESTORS]
  if (grade && grade !== 'all') {
    rows = rows.filter((row) => row.grade === grade)
  }
  if (ownerEmail) {
    rows = rows.filter((row) => row.owner === ownerEmail)
  }
  return rows
}

export function getDemoInvestorById(id: string) {
  return DEMO_INVESTORS.find((row) => row.id === id)
}

export function getDemoLandById(id: string) {
  return DEMO_LANDS.find((row) => row.id === id)
}

export function getDemoPropertyById(id: string) {
  return DEMO_PROPERTIES.find((row) => row.id === id)
}

export function getDemoBuilderById(id: string) {
  return DEMO_BUILDERS.find((row) => row.id === id)
}

export function getDemoBuyerById(id: string) {
  return DEMO_BUYERS.find((row) => row.id === id)
}

export function getDemoHotelById(id: string) {
  return DEMO_HOTELS.find((row) => row.id === id)
}

export function getDemoContractById(id: string) {
  return DEMO_CONTRACTS.find((row) => row.id === id)
}

export function getDemoFollowUps(investorId: string) {
  return DEMO_FOLLOW_UPS.filter((row) => row.investor_id === investorId)
}

export const DEMO_IDS_MATCH = {
  demandWang: 'g0000001-0000-4000-8000-000000000001',
  demandBroker: 'g0000002-0000-4000-8000-000000000002',
  runWang: 'h0000001-0000-4000-8000-000000000001',
} as const

export const DEMO_DEMANDS: import('@/types/database').InvestorDemand[] = [
  {
    id: DEMO_IDS_MATCH.demandWang,
    source: 'staff',
    portal_user_id: null,
    investor_id: DEMO_IDS.invWang,
    buyer_id: null,
    channel_id: DEMO_IDS.channelTanaka,
    submitted_by: 'YAO',
    intent_type: 'invest_dev',
    budget_min_wan: 3000,
    budget_max_wan: 5000,
    preferred_regions: ['涩谷', '港区'],
    preferred_types: ['酒店'],
    min_roi_percent: 5,
    risk_tolerance: '平衡',
    timeline: '半年内',
    raw_description: '希望在东京核心区域找稳定收益的酒店开发项目，ROI 不低于 5%。',
    parsed_criteria: null,
    parse_confidence: null,
    status: 'matched',
    owner: 'YAO',
    notes: null,
    created_at: ts(14),
    updated_at: ts(2),
    investor: { id: DEMO_IDS.invWang, name: '王总' },
  },
  {
    id: DEMO_IDS_MATCH.demandBroker,
    source: 'staff',
    portal_user_id: null,
    investor_id: null,
    buyer_id: DEMO_IDS.buyerTanaka,
    channel_id: DEMO_IDS.channelTokyo,
    submitted_by: 'YAO',
    intent_type: 'buy_property',
    budget_min_wan: 2000,
    budget_max_wan: 3500,
    preferred_regions: ['涩谷'],
    preferred_types: ['酒店', '住宅'],
    min_roi_percent: null,
    risk_tolerance: '保守',
    timeline: '3个月内',
    raw_description: '买家希望涩谷区域在售物件，预算 3500 万以内。',
    parsed_criteria: null,
    parse_confidence: null,
    status: 'submitted',
    owner: 'YAO',
    notes: null,
    created_at: ts(5),
    updated_at: ts(5),
    buyer: { id: DEMO_IDS.buyerTanaka, name: '田中先生' },
  },
]

export const DEMO_MATCH_RUNS: import('@/types/database').MatchRun[] = [
  {
    id: DEMO_IDS_MATCH.runWang,
    demand_id: DEMO_IDS_MATCH.demandWang,
    engine_version: 'v1',
    rule_config: null,
    ai_enabled: false,
    status: 'completed',
    result_count: 4,
    started_at: ts(2),
    completed_at: ts(2),
  },
]

export const DEMO_MATCH_RESULTS: import('@/types/database').MatchResult[] = [
  {
    id: 'i0000001-0000-4000-8000-000000000001',
    run_id: DEMO_IDS_MATCH.runWang,
    demand_id: DEMO_IDS_MATCH.demandWang,
    target_type: 'land',
    target_id: DEMO_IDS.landShibuya,
    score_total: 92,
    score_breakdown: { budget: 30, region: 25, type: 15, roi: 15, status: 7 },
    match_reasons: ['预算匹配', '涩谷区域', 'ROI 6.2% 达标'],
    ai_explanation: null,
    review_status: 'approved',
    reviewed_by: 'YAO',
    reviewed_at: ts(2),
    rank: 1,
    investor_status: null,
    investor_note: null,
    created_at: ts(2),
    target_name: '涩谷区地块 A',
    target_summary: '涩谷 · 1200㎡ · 4200万 · ROI 6.2%',
  },
  {
    id: 'i0000002-0000-4000-8000-000000000002',
    run_id: DEMO_IDS_MATCH.runWang,
    demand_id: DEMO_IDS_MATCH.demandWang,
    target_type: 'property',
    target_id: DEMO_IDS.propHotel,
    score_total: 85,
    score_breakdown: { budget: 28, region: 25, type: 20, roi: 7, status: 5 },
    match_reasons: ['预算匹配', '酒店类型', '涩谷区域'],
    ai_explanation: null,
    review_status: 'approved',
    reviewed_by: 'YAO',
    reviewed_at: ts(2),
    rank: 2,
    investor_status: null,
    investor_note: null,
    created_at: ts(2),
    target_name: '涩谷精品酒店项目',
    target_summary: '酒店 · 涩谷 · 3800万',
  },
  {
    id: 'i0000003-0000-4000-8000-000000000003',
    run_id: DEMO_IDS_MATCH.runWang,
    demand_id: DEMO_IDS_MATCH.demandWang,
    target_type: 'builder',
    target_id: DEMO_IDS.builderTokyo,
    score_total: 78,
    score_breakdown: { budget: 20, region: 25, type: 18, roi: 10, status: 5 },
    match_reasons: ['东京区域施工', 'A 级建筑商', '酒店施工经验'],
    ai_explanation: null,
    review_status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    rank: 3,
    investor_status: null,
    investor_note: null,
    created_at: ts(2),
    target_name: '东京建工株式会社',
    target_summary: 'A 级 · 东京 · 酒店/商业',
  },
  {
    id: 'i0000004-0000-4000-8000-000000000004',
    run_id: DEMO_IDS_MATCH.runWang,
    demand_id: DEMO_IDS_MATCH.demandWang,
    target_type: 'channel',
    target_id: DEMO_IDS.channelTanaka,
    score_total: 72,
    score_breakdown: { budget: 15, region: 20, type: 20, roi: 12, status: 5 },
    match_reasons: ['已引荐该投资人', '投资人介绍专长'],
    ai_explanation: null,
    review_status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    rank: 4,
    investor_status: null,
    investor_note: null,
    created_at: ts(2),
    target_name: '田中渠道（个人）',
    target_summary: 'S 级 · 投资人介绍',
  },
]

export function getDemoDemandById(id: string) {
  return DEMO_DEMANDS.find((row) => row.id === id) ?? null
}

export const DEMO_SUCCESS_CASES: import('@/types/database').SuccessCase[] = [
  {
    id: 'j0000001-0000-4000-8000-000000000001',
    title: '王总 · 涩谷区地块 A',
    summary:
      '投资人偏好涩谷/港区酒店开发，预算 3000-5000 万，最终锁定涩谷区地块 A（4200 万，ROI 6.2%），规则匹配得分 92，签约后进入开发阶段。',
    case_type: 'match',
    intent_type: 'invest_dev',
    client_type: 'investor',
    regions: ['涩谷', '港区'],
    budget_min_wan: 3000,
    budget_max_wan: 5000,
    target_type: 'land',
    target_name: '涩谷区地块 A',
    target_id: DEMO_IDS.landShibuya,
    contract_id: DEMO_IDS.contractDev,
    demand_id: DEMO_IDS_MATCH.demandWang,
    outcome: 'closed',
    created_by: 'YAO',
    created_at: ts(140),
  },
  {
    id: 'j0000002-0000-4000-8000-000000000002',
    title: '田中先生 · 涩谷精品酒店（代售）',
    summary:
      '买家预算 3500 万以内，聚焦涩谷在售酒店物件，通过渠道东京不动产引荐，以 6800 万代售协议成交（含佣金 3.5%）。',
    case_type: 'match',
    intent_type: 'buy_property',
    client_type: 'buyer',
    regions: ['涩谷'],
    budget_min_wan: 2000,
    budget_max_wan: 3500,
    target_type: 'property',
    target_name: '涩谷精品酒店（代售）',
    target_id: DEMO_IDS.propHotel,
    contract_id: DEMO_IDS.contractBroker,
    demand_id: DEMO_IDS_MATCH.demandBroker,
    outcome: 'closed',
    created_by: 'YAO',
    created_at: ts(15),
  },
  {
    id: 'j0000003-0000-4000-8000-000000000003',
    title: '刘社长 · 港区商业整层',
    summary:
      '高净值投资人关注港区核心商业资产，与上游土地开发联动，以 8000 万开发合同锁定港区商业整层及配套酒店开发路径。',
    case_type: 'match',
    intent_type: 'invest_dev',
    client_type: 'investor',
    regions: ['港区'],
    budget_min_wan: 5000,
    budget_max_wan: 10000,
    target_type: 'property',
    target_name: '港区商业整层',
    target_id: DEMO_IDS.propBiz,
    contract_id: DEMO_IDS.contractDev,
    demand_id: null,
    outcome: 'closed',
    created_by: 'YAO',
    created_at: ts(145),
  },
]

export function getDemoMatchRuns(demandId: string) {
  return DEMO_MATCH_RUNS.filter((row) => row.demand_id === demandId)
}

export function getDemoMatchResults(demandId: string) {
  return DEMO_MATCH_RESULTS.filter((row) => row.demand_id === demandId)
}
