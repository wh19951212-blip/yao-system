-- ================================================
-- YAO 投资管理系统 — 权限修复 + 展示案例数据
-- 在 Supabase Dashboard > SQL Editor 中粘贴全部内容并 Run
-- 可重复运行（会先清理同 ID 的演示数据再插入）
-- ================================================


-- ================================================
-- 修复 RLS 权限 + contracts 表缺失字段
-- 在 Supabase Dashboard > SQL Editor 中粘贴并 Run
--
-- ⚠️ 若使用「访客登录」或 anon key 访问，必须运行本脚本！
--    否则只能读空数据，创建/修改会报 42501 权限错误。
-- 新建项目也可直接运行 supabase/bootstrap.sql（schema + 本文件）
-- ================================================

-- 0. 投资人 / 土地 / 跟进（仪表盘 fetchInvestors 依赖 investors 表读权限）
alter table investors enable row level security;
drop policy if exists "allow all" on investors;
drop policy if exists "Authenticated users can read investors" on investors;
drop policy if exists "Authenticated users can insert investors" on investors;
drop policy if exists "Authenticated users can update investors" on investors;
create policy "allow all" on investors for all using (true) with check (true);

alter table lands enable row level security;
drop policy if exists "allow all" on lands;
drop policy if exists "Authenticated users can read lands" on lands;
drop policy if exists "Authenticated users can insert lands" on lands;
drop policy if exists "Authenticated users can update lands" on lands;
create policy "allow all" on lands for all using (true) with check (true);

-- 1. contracts 表补充字段（解决 join 查询失败）
alter table contracts add column if not exists land_id uuid references lands(id);
alter table contracts add column if not exists property_id uuid references properties(id);
alter table contracts add column if not exists file_url text;

-- 2. 开放读写权限（按用户要求）
-- contracts
alter table contracts enable row level security;
drop policy if exists "allow all" on contracts;
drop policy if exists "Authenticated users can read contracts" on contracts;
drop policy if exists "Authenticated users can insert contracts" on contracts;
drop policy if exists "Authenticated users can update contracts" on contracts;
create policy "allow all" on contracts for all using (true) with check (true);

-- properties
alter table properties enable row level security;
drop policy if exists "allow all" on properties;
drop policy if exists "Authenticated users can read properties" on properties;
drop policy if exists "Authenticated users can insert properties" on properties;
drop policy if exists "Authenticated users can update properties" on properties;
create policy "allow all" on properties for all using (true) with check (true);

-- builders
alter table builders enable row level security;
drop policy if exists "allow all" on builders;
drop policy if exists "Authenticated users can read builders" on builders;
drop policy if exists "Authenticated users can insert builders" on builders;
drop policy if exists "Authenticated users can update builders" on builders;
create policy "allow all" on builders for all using (true) with check (true);

-- hotels
alter table hotels enable row level security;
drop policy if exists "allow all" on hotels;
drop policy if exists "Authenticated users can read hotels" on hotels;
drop policy if exists "Authenticated users can insert hotels" on hotels;
drop policy if exists "Authenticated users can update hotels" on hotels;
create policy "allow all" on hotels for all using (true) with check (true);

-- hotel_monthly_reports
alter table hotel_monthly_reports enable row level security;
drop policy if exists "allow all" on hotel_monthly_reports;
drop policy if exists "Authenticated users can read hotel_monthly_reports" on hotel_monthly_reports;
drop policy if exists "Authenticated users can insert hotel_monthly_reports" on hotel_monthly_reports;
drop policy if exists "Authenticated users can update hotel_monthly_reports" on hotel_monthly_reports;
create policy "allow all" on hotel_monthly_reports for all using (true) with check (true);

-- media_assets
alter table media_assets enable row level security;
drop policy if exists "allow all" on media_assets;
drop policy if exists "Authenticated users can read media_assets" on media_assets;
drop policy if exists "Authenticated users can insert media_assets" on media_assets;
drop policy if exists "Authenticated users can update media_assets" on media_assets;
drop policy if exists "Authenticated users can delete media_assets" on media_assets;
create policy "allow all" on media_assets for all using (true) with check (true);

-- follow_up_logs（如使用旧表 follow_ups 请对其执行相同语句）
alter table follow_up_logs enable row level security;
drop policy if exists "allow all" on follow_up_logs;
create policy "allow all" on follow_up_logs for all using (true) with check (true);

-- investor_land_matches
alter table investor_land_matches enable row level security;
drop policy if exists "allow all" on investor_land_matches;
drop policy if exists "Authenticated users can read investor_land_matches" on investor_land_matches;
drop policy if exists "Authenticated users can insert investor_land_matches" on investor_land_matches;
create policy "allow all" on investor_land_matches for all using (true) with check (true);

-- builder_quotes
alter table builder_quotes enable row level security;
drop policy if exists "allow all" on builder_quotes;
drop policy if exists "Authenticated users can read builder_quotes" on builder_quotes;
drop policy if exists "Authenticated users can insert builder_quotes" on builder_quotes;
create policy "allow all" on builder_quotes for all using (true) with check (true);

-- land_approval_nodes（审批模块）
alter table land_approval_nodes enable row level security;
drop policy if exists "allow all" on land_approval_nodes;
create policy "allow all" on land_approval_nodes for all using (true) with check (true);

-- 3. 用户权限表 + 土地负责人字段
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text check (role in ('admin','staff')) default 'staff',
  created_at timestamptz not null default now()
);

alter table lands add column if not exists owner text;

alter table users enable row level security;
drop policy if exists "allow all" on users;
create policy "allow all" on users for all using (true) with check (true);

-- 4. 买家表 + 投资人物件匹配表
create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  budget_wan integer,
  preferred_type text check (preferred_type in ('酒店','住宅','商业')),
  motivation text,
  contact_wechat text,
  contact_phone text,
  source text,
  owner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists investor_property_matches (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investors(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  is_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (investor_id, property_id)
);

alter table buyers enable row level security;
drop policy if exists "allow all" on buyers;
create policy "allow all" on buyers for all using (true) with check (true);

alter table investor_property_matches enable row level security;
drop policy if exists "allow all" on investor_property_matches;
create policy "allow all" on investor_property_matches for all using (true) with check (true);

create table if not exists app_settings (
  id integer primary key default 1 check (id = 1),
  company_name text default '',
  contact_name text default 'YAO',
  contact_info text default '',
  follow_up_reminder_days integer default 7,
  deadline_reminder_days integer default 3,
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

alter table app_settings enable row level security;
drop policy if exists "allow all" on app_settings;
create policy "allow all" on app_settings for all using (true) with check (true);

-- ========== 新功能迁移（已有项目执行）==========
alter table investors add column if not exists is_closed_client boolean not null default false;
alter table investors add column if not exists after_sales_mode boolean not null default false;
alter table lands add column if not exists abandon_reason text;
alter table lands add column if not exists abandon_reason_note text;
alter table hotels add column if not exists land_id uuid references lands(id);

create table if not exists investor_stage_logs (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investors(id) on delete cascade,
  from_stage text not null,
  to_stage text not null,
  changed_by text,
  changed_at timestamptz not null default now()
);

create table if not exists operation_logs (
  id uuid primary key default gen_random_uuid(),
  operator text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

alter table investor_stage_logs enable row level security;
drop policy if exists "allow all" on investor_stage_logs;
create policy "allow all" on investor_stage_logs for all using (true) with check (true);

alter table operation_logs enable row level security;
drop policy if exists "allow all" on operation_logs;
create policy "allow all" on operation_logs for all using (true) with check (true);


-- ========== 展示案例数据 ==========

delete from follow_up_logs where investor_id in (
  'a0000001-0000-4000-8000-000000000001',
  'a0000002-0000-4000-8000-000000000002',
  'a0000003-0000-4000-8000-000000000003',
  'a0000004-0000-4000-8000-000000000004',
  'a0000005-0000-4000-8000-000000000005'
);
delete from investor_stage_logs where investor_id in (
  'a0000001-0000-4000-8000-000000000001',
  'a0000002-0000-4000-8000-000000000002',
  'a0000003-0000-4000-8000-000000000003',
  'a0000004-0000-4000-8000-000000000004',
  'a0000005-0000-4000-8000-000000000005'
);
delete from operation_logs where id like 'd0000003-%';
delete from hotel_monthly_reports where id like 'd0000001-%';
delete from contracts where id in (
  'c000000a-0000-4000-8000-000000000001',
  'c000000b-0000-4000-8000-000000000001'
);
delete from hotels where id in (
  'c0000008-0000-4000-8000-000000000001',
  'c0000009-0000-4000-8000-000000000002'
);
delete from media_assets where id like 'd0000002-%';
delete from investor_property_matches where investor_id like 'a000000%';
delete from investor_land_matches where investor_id like 'a000000%';
delete from builder_quotes where builder_id like 'c0000004-%';
delete from properties where id like 'c0000001-%' or id like 'c0000002-%' or id like 'c0000003-%';
delete from buyers where id like 'c0000006-%' or id like 'c0000007-%';
delete from builders where id like 'c0000004-%' or id like 'c0000005-%';
delete from lands where id like 'b000000%';
delete from investors where id like 'a000000%';
delete from users where id like 'd0000005-%';

insert into app_settings (id, company_name, contact_name, contact_info)
values (1, 'YAO Real Estate Investment', 'YAO', '微信：yao-invest')
on conflict (id) do update set
  company_name = excluded.company_name,
  contact_name = excluded.contact_name,
  contact_info = excluded.contact_info,
  updated_at = now();

insert into users (id, email, name, role) values
  ('d0000005-0000-4000-8000-000000000001', 'admin@yao.local', 'YAO 管理员', 'admin'),
  ('d0000005-0000-4000-8000-000000000002', 'staff@yao.local', '业务专员', 'staff');

insert into investors (id, name, level, stage, budget_wan, confirmed_wan, motivation, decision_type, source, owner, next_action, deadline, last_contact_at, notes, is_closed_client, after_sales_mode) values
  ('a0000001-0000-4000-8000-000000000001', '王总', 'S', '决策阶段', 5000, 2000, '稳定收益 · 资产配置', '独立', '赵总介绍', 'YAO', '安排贷款经理沟通', current_date + 7, now() - interval '3 days', '对涩谷区地块A兴趣较高', false, false),
  ('a0000002-0000-4000-8000-000000000002', '李女士', 'A', '评估阶段', 3000, 1000, '做资产管理', '夫妻', '直接来访', 'YAO', '发送项目资料包', current_date + 12, now() - interval '8 days', '偏好酒店类物件', false, false),
  ('a0000003-0000-4000-8000-000000000003', '张先生', 'B', '信任阶段', 5000, 500, '身份规划 + 长期持有', '合伙', '朋友介绍', 'YAO', '微信跟进', current_date + 18, now() - interval '2 days', null, false, false),
  ('a0000004-0000-4000-8000-000000000004', '陈总', 'C', '认知阶段', 3500, 0, '了解日本不动产投资', '家族', '线上咨询', 'YAO', '初次需求访谈', current_date + 25, now() - interval '12 days', null, false, false),
  ('a0000005-0000-4000-8000-000000000005', '刘社长', 'A', '成交阶段', 8000, 8000, '酒店运营 · 被动收入', '独立', '展会', 'YAO', '售后回访', null, now() - interval '45 days', '已签约港区项目', true, true);

insert into lands (id, name, location, area_sqm, price_wan, expected_rent_wan, roi_percent, status, legal_status, description, owner) values
  ('b0000001-0000-4000-8000-000000000001', '涩谷区地块 A', '东京都涩谷区', 120, 8000, 1480, 18.5, '分析中', '商业地域', '站步行8分钟，适合精品酒店', 'YAO'),
  ('b0000002-0000-4000-8000-000000000002', '新宿区地块 B', '东京都新宿区', 85, 5500, 1215, 22.1, '待审批', '近商地域', '角地，已收到2份报价', 'YAO'),
  ('b0000003-0000-4000-8000-000000000003', '港区地块 C', '东京都港区', 200, 15000, 2370, 15.8, '已放弃', '商业地域', '地价超出资金池上限', 'YAO');

update lands set abandon_reason = '价格过高', abandon_reason_note = '待下轮资金到位再评估' where id = 'b0000003-0000-4000-8000-000000000003';

insert into properties (id, name, location, type, source_type, price_wan, commission_rate, status, description, land_id, owner) values
  ('c0000001-0000-4000-8000-000000000001', '涩谷精品酒店（代售）', '东京都涩谷区', '酒店', '代理', 6800, 3.5, '販売中', '28间客房，含运营权转让', 'b0000001-0000-4000-8000-000000000001', 'YAO'),
  ('c0000002-0000-4000-8000-000000000002', '新宿区收益型公寓', '东京都新宿区', '住宅', '代理', 3200, 2.8, '進行中', '整栋12户，出租率96%', null, 'YAO'),
  ('c0000003-0000-4000-8000-000000000003', '港区商业整层', '东京都港区', '商业', '自开发', 9500, null, '進行中', '刘社长成交项目关联', 'b0000003-0000-4000-8000-000000000003', 'YAO');

insert into builders (id, company_name, contact_name, specialty, region, tier, price_per_sqm_min, price_per_sqm_max, overall_rating, capacity_status, notes) values
  ('c0000004-0000-4000-8000-000000000001', '东京建设株式会社', '田中', '酒店/商业', '东京', 'A', 80, 120, 4.5, '空闲', '擅长精品酒店'),
  ('c0000005-0000-4000-8000-000000000002', '新宿工务店', '佐藤', '住宅/小型酒店', '东京', 'B', 60, 90, 3.8, '饱和', '报价响应快');

insert into buyers (id, name, budget_wan, preferred_type, motivation, contact_wechat, source, owner) values
  ('c0000006-0000-4000-8000-000000000001', '田中一郎', 4000, '酒店', '自主经营', 'tanaka_buyer', '小红书', 'YAO'),
  ('c0000007-0000-4000-8000-000000000002', '佐藤花子', 2500, '住宅', '子女留学陪读', 'sato_buyer', '微信社群', 'YAO');

insert into hotels (id, name, location, room_count, owner_investor_id, management_fee_rate, contract_start, contract_end, status, notes, land_id) values
  ('c0000008-0000-4000-8000-000000000001', 'YAO 涩谷精品酒店', '东京都涩谷区', 28, 'a0000005-0000-4000-8000-000000000005', 8, '2025-03-01', '2030-02-28', '运营中', '首年目标入住率78%', 'b0000001-0000-4000-8000-000000000001'),
  ('c0000009-0000-4000-8000-000000000002', '新宿商务酒店（筹备）', '东京都新宿区', 42, 'a0000001-0000-4000-8000-000000000001', 7.5, '2026-01-01', '2031-12-31', '筹备中', '待土地审批', 'b0000002-0000-4000-8000-000000000002');

insert into hotel_monthly_reports (id, hotel_id, year, month, occupancy_rate, revenue_wan, expense_wan, ai_report) values
  ('d0000001-0000-4000-8000-000000000001', 'c0000008-0000-4000-8000-000000000001', extract(year from now())::int, extract(month from now())::int, 76.5, 185, 92, '本月入住率略低于目标，建议加强OTA投放');

insert into contracts (id, type, investor_id, land_id, property_id, amount_wan, commission_wan, signed_date, status, notes) values
  ('c000000a-0000-4000-8000-000000000001', '开发', 'a0000005-0000-4000-8000-000000000005', 'b0000001-0000-4000-8000-000000000001', 'c0000003-0000-4000-8000-000000000003', 8000, 240, '2025-03-15', '进行中', '含酒店开发总包'),
  ('c000000b-0000-4000-8000-000000000001', '中介', 'a0000001-0000-4000-8000-000000000001', null, 'c0000001-0000-4000-8000-000000000001', 6800, 238, '2025-05-01', '进行中', '代售协议3.5%');

insert into follow_up_logs (id, investor_id, content, action_type, logged_by) values
  ('d0000004-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', '电话沟通贷款预审批进度', '电话', 'YAO'),
  ('d0000004-0000-4000-8000-000000000002', 'a0000002-0000-4000-8000-000000000002', '已发送酒店项目PDF资料包', '微信', 'YAO');

insert into media_assets (id, title, type, related_type, related_id, content, platform, status, publish_date, created_by) values
  ('d0000002-0000-4000-8000-000000000001', '涩谷酒店 ROI 拆解', '文案', '土地', 'b0000001-0000-4000-8000-000000000001', '18.5%年化回报怎么算？', '小红书', '已发布', current_date - 10, 'YAO'),
  ('d0000002-0000-4000-8000-000000000002', '东京买地避坑指南', '文案', '通用', null, '法务、建筑、贷款注意事项', '微信', '草稿', null, 'YAO'),
  ('d0000002-0000-4000-8000-000000000003', '新宿地块航拍', '视频', '土地', 'b0000002-0000-4000-8000-000000000002', null, '小红书', '已发布', current_date - 3, 'YAO');

insert into operation_logs (id, operator, action, entity_type, entity_id, summary) values
  ('d0000003-0000-4000-8000-000000000001', 'YAO', 'create', 'investor', 'a0000001-0000-4000-8000-000000000001', '新增投资人「王总」'),
  ('d0000003-0000-4000-8000-000000000002', 'YAO', 'stage_change', 'investor', 'a0000002-0000-4000-8000-000000000002', '投资人「李女士」阶段：信任阶段 → 评估阶段'),
  ('d0000003-0000-4000-8000-000000000003', 'YAO', 'create', 'land', 'b0000001-0000-4000-8000-000000000001', '新增土地「涩谷区地块 A」'),
  ('d0000003-0000-4000-8000-000000000004', 'YAO', 'contract_signed', 'contract', 'c000000a-0000-4000-8000-000000000001', '刘社长签署开发合同'),
  ('d0000003-0000-4000-8000-000000000005', 'YAO', 'land_abandon', 'land', 'b0000003-0000-4000-8000-000000000003', '土地「港区地块 C」标记为已放弃');

-- ========== 渠道中介模块（若尚未建表，请先运行 supabase/channels_migration.sql）==========
insert into channels (id, name, entity_type, contact_name, contact_wechat, contact_phone, region, tier, cooperation_types, default_commission_rate, status, owner, notes) values
  ('e0000001-0000-4000-8000-000000000001', '东京不动产株式会社', '公司', '山本', 'yamamoto_re', '+81-3-5555-0101', '东京', 'S', array['全渠道']::text[], 3.5, '合作中', 'YAO', '长期合作渠道'),
  ('e0000002-0000-4000-8000-000000000002', '田中一郎', '个人', '田中一郎', 'tanaka_channel', '+81-90-8888-9999', '关东', 'A', array['投资人介绍']::text[], 2, '合作中', 'YAO', '高净值客户介绍'),
  ('e0000003-0000-4000-8000-000000000003', '横滨渠道联盟', '公司', '铃木', 'yokohama_alliance', null, '神奈川', 'B', array['买家介绍','物件介绍']::text[], 3, '合作中', 'YAO', null)
on conflict (id) do update set name = excluded.name, updated_at = now();

update investors set channel_id = 'e0000002-0000-4000-8000-000000000002' where id = 'a0000001-0000-4000-8000-000000000001';
update buyers set channel_id = 'e0000003-0000-4000-8000-000000000003' where id = 'c0000006-0000-4000-8000-000000000001';
update properties set channel_id = 'e0000001-0000-4000-8000-000000000001' where id = 'c0000001-0000-4000-8000-000000000001';
update properties set channel_id = 'e0000003-0000-4000-8000-000000000003' where id = 'c0000002-0000-4000-8000-000000000002';
update contracts set channel_id = 'e0000001-0000-4000-8000-000000000001' where id = 'c000000b-0000-4000-8000-000000000001';

insert into channel_commissions (id, channel_id, contract_id, related_type, related_id, title, amount_wan, commission_wan, status, owner) values
  ('f0000001-0000-4000-8000-000000000001', 'e0000001-0000-4000-8000-000000000001', 'c000000b-0000-4000-8000-000000000001', 'contract', 'c000000b-0000-4000-8000-000000000001', '中介合同佣金', 6800, 238, '待结算', 'YAO')
on conflict (id) do nothing;

-- ========== 智能匹配模块（若尚未建表，请先运行 supabase/matching_migration.sql）==========
insert into investor_demands (id, source, investor_id, channel_id, submitted_by, intent_type, budget_min_wan, budget_max_wan, preferred_regions, preferred_types, min_roi_percent, risk_tolerance, timeline, raw_description, status, owner) values
  ('g0000001-0000-4000-8000-000000000001', 'staff', 'a0000001-0000-4000-8000-000000000001', 'e0000002-0000-4000-8000-000000000002', 'YAO', 'invest_dev', 3000, 5000, array['涩谷','港区']::text[], array['酒店']::text[], 5, '平衡', '半年内', '希望在东京核心区域找稳定收益的酒店开发项目，ROI 不低于 5%。', 'matched', 'YAO'),
  ('g0000002-0000-4000-8000-000000000002', 'staff', null, 'e0000001-0000-4000-8000-000000000001', 'YAO', 'buy_property', 2000, 3500, array['涩谷']::text[], array['酒店','住宅']::text[], null, '保守', '3个月内', '买家希望涩谷区域在售物件，预算 3500 万以内。', 'submitted', 'YAO')
on conflict (id) do update set status = excluded.status, updated_at = now();

update investor_demands set buyer_id = 'c0000006-0000-4000-8000-000000000001' where id = 'g0000002-0000-4000-8000-000000000002';

insert into match_runs (id, demand_id, engine_version, status, result_count, started_at, completed_at) values
  ('h0000001-0000-4000-8000-000000000001', 'g0000001-0000-4000-8000-000000000001', 'v1', 'completed', 4, now() - interval '2 days', now() - interval '2 days')
on conflict (id) do nothing;

insert into match_results (id, run_id, demand_id, target_type, target_id, score_total, score_breakdown, match_reasons, review_status, reviewed_by, rank) values
  ('i0000001-0000-4000-8000-000000000001', 'h0000001-0000-4000-8000-000000000001', 'g0000001-0000-4000-8000-000000000001', 'land', 'b0000001-0000-4000-8000-000000000001', 92, '{"budget":30,"region":25,"type":15,"roi":15,"status":7}'::jsonb, array['预算匹配','涩谷区域','ROI 6.2% 达标']::text[], 'approved', 'YAO', 1),
  ('i0000002-0000-4000-8000-000000000002', 'h0000001-0000-4000-8000-000000000001', 'g0000001-0000-4000-8000-000000000001', 'property', 'c0000001-0000-4000-8000-000000000001', 85, '{"budget":28,"region":25,"type":20,"roi":7,"status":5}'::jsonb, array['预算匹配','酒店类型','涩谷区域']::text[], 'approved', 'YAO', 2),
  ('i0000003-0000-4000-8000-000000000003', 'h0000001-0000-4000-8000-000000000001', 'g0000001-0000-4000-8000-000000000001', 'builder', 'c0000004-0000-4000-8000-000000000001', 78, '{"budget":20,"region":25,"type":18,"roi":10,"status":5}'::jsonb, array['东京区域施工','A 级建筑商']::text[], 'pending', null, 3),
  ('i0000004-0000-4000-8000-000000000004', 'h0000001-0000-4000-8000-000000000001', 'g0000001-0000-4000-8000-000000000001', 'channel', 'e0000002-0000-4000-8000-000000000002', 72, '{"budget":15,"region":20,"type":20,"roi":12,"status":5}'::jsonb, array['已引荐该投资人','S 级渠道']::text[], 'pending', null, 4)
on conflict (id) do nothing;

-- 完成！刷新 yao-system.vercel.app 即可看到真实数据（若仍为空则前端会自动显示内置演示案例）
