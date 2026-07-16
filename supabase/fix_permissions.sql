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
