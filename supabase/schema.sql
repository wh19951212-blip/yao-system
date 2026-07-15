-- Supabase 数据库表结构（投资人模块）

create extension if not exists "pgcrypto";

-- ========== 用户权限 ==========
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text check (role in ('admin','staff')) default 'staff',
  created_at timestamptz not null default now()
);

alter table users enable row level security;

create policy "Authenticated users can read users"
  on users for select to authenticated using (true);
create policy "Authenticated users can insert users"
  on users for insert to authenticated with check (true);
create policy "Authenticated users can update users"
  on users for update to authenticated using (true);

-- ========== 投资人 ==========
create table if not exists investors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null check (level in ('S', 'A', 'B', 'C')) default 'C',
  stage text not null check (stage in ('认知阶段','信任阶段','评估阶段','决策阶段','成交阶段')) default '认知阶段',
  budget_wan integer not null default 0,
  confirmed_wan integer not null default 0,
  motivation text,
  decision_type text check (decision_type in ('独立','夫妻','合伙','家族')),
  source text,
  owner text,
  next_action text,
  deadline date,
  last_contact_at timestamptz,
  notes text,
  is_closed_client boolean not null default false,
  after_sales_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== 跟进记录 ==========
create table if not exists follow_up_logs (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investors(id) on delete cascade,
  content text not null,
  action_type text not null check (action_type in ('微信','电话','见面','邮件','其他')) default '其他',
  logged_by text,
  logged_at timestamptz not null default now()
);

create index if not exists follow_up_logs_investor_id_idx on follow_up_logs(investor_id);

-- ========== 投资人阶段变化记录 ==========
create table if not exists investor_stage_logs (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investors(id) on delete cascade,
  from_stage text not null,
  to_stage text not null,
  changed_by text,
  changed_at timestamptz not null default now()
);

create index if not exists investor_stage_logs_investor_id_idx on investor_stage_logs(investor_id);
create index if not exists investor_stage_logs_changed_at_idx on investor_stage_logs(changed_at);

-- ========== 操作日志 ==========
create table if not exists operation_logs (
  id uuid primary key default gen_random_uuid(),
  operator text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists operation_logs_created_at_idx on operation_logs(created_at desc);

-- ========== 土地 ==========
create table if not exists lands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  area_sqm numeric not null default 0,
  price_wan numeric not null default 0,
  expected_rent_wan numeric default 0,
  roi_percent numeric,
  status text not null default '分析中',
  legal_status text,
  description text,
  abandon_reason text,
  abandon_reason_note text,
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 已有 lands 表时追加 owner 列
-- alter table lands add column if not exists owner text;

create table if not exists investor_land_matches (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references lands(id) on delete cascade,
  investor_id uuid not null references investors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (land_id, investor_id)
);

-- ========== 自动更新 updated_at ==========
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists investors_updated_at on investors;
create trigger investors_updated_at
  before update on investors for each row execute function update_updated_at();

-- ========== RLS ==========
alter table investors enable row level security;
alter table follow_up_logs enable row level security;
alter table lands enable row level security;
alter table investor_land_matches enable row level security;

create policy "Authenticated users can read investors"
  on investors for select to authenticated using (true);
create policy "Authenticated users can insert investors"
  on investors for insert to authenticated with check (true);
create policy "Authenticated users can update investors"
  on investors for update to authenticated using (true);

create policy "Authenticated users can read follow_up_logs"
  on follow_up_logs for select to authenticated using (true);
create policy "Authenticated users can insert follow_up_logs"
  on follow_up_logs for insert to authenticated with check (true);

alter table investor_stage_logs enable row level security;
create policy "Authenticated users can read investor_stage_logs"
  on investor_stage_logs for select to authenticated using (true);
create policy "Authenticated users can insert investor_stage_logs"
  on investor_stage_logs for insert to authenticated with check (true);

alter table operation_logs enable row level security;
create policy "Authenticated users can read operation_logs"
  on operation_logs for select to authenticated using (true);
create policy "Authenticated users can insert operation_logs"
  on operation_logs for insert to authenticated with check (true);

create policy "Authenticated users can read lands"
  on lands for select to authenticated using (true);
create policy "Authenticated users can insert lands"
  on lands for insert to authenticated with check (true);
create policy "Authenticated users can update lands"
  on lands for update to authenticated using (true);

create policy "Authenticated users can read investor_land_matches"
  on investor_land_matches for select to authenticated using (true);
create policy "Authenticated users can insert investor_land_matches"
  on investor_land_matches for insert to authenticated with check (true);

-- ========== 从旧 schema 迁移（如已存在旧表，在 SQL Editor 中按需执行）==========
-- alter table investors rename column grade to level;
-- alter table investors rename column budget to budget_wan;
-- alter table investors rename column confirmed_amount to confirmed_wan;
-- alter table investors add column if not exists motivation text;
-- alter table investors add column if not exists decision_type text;
-- alter table investors add column if not exists source text;
-- alter table investors add column if not exists owner text;
-- alter table investors add column if not exists next_action text;
-- alter table investors add column if not exists deadline date;

-- ========== 物件 ==========
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  type text check (type in ('酒店','住宅','商业')) default '酒店',
  source_type text check (source_type in ('自开发','代理')) default '代理',
  price_wan integer,
  commission_rate numeric(4,2),
  status text check (status in ('進行中','販売中','終了&不合格','上架','洽谈中','已售')) default '進行中',
  description text,
  image_url text,
  land_id uuid references lands(id),
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== 建筑商 ==========
create table if not exists builders (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_wechat text,
  contact_phone text,
  specialty text,
  region text,
  tier text check (tier in ('A','B','C')) default 'B',
  price_per_sqm_min integer,
  price_per_sqm_max integer,
  typical_timeline_months integer,
  overall_rating numeric(2,1),
  capacity_status text check (capacity_status in ('空闲','饱和','满')) default '空闲',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists builder_quotes (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid references builders(id) on delete cascade,
  land_id uuid references lands(id) on delete cascade,
  quote_amount_wan integer,
  quote_date date,
  status text check (status in ('待确认','已接受','已拒绝')) default '待确认',
  notes text,
  created_at timestamptz not null default now()
);

-- ========== 酒店 ==========
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  room_count integer,
  owner_investor_id uuid references investors(id),
  management_fee_rate numeric(4,2),
  contract_start date,
  contract_end date,
  status text check (status in ('运营中','筹备中','已结束')) default '筹备中',
  notes text,
  land_id uuid references lands(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hotel_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  occupancy_rate numeric(5,2),
  revenue_wan numeric(10,2),
  expense_wan numeric(10,2),
  ai_report text,
  created_at timestamptz not null default now(),
  unique(hotel_id, year, month)
);

drop trigger if exists properties_updated_at on properties;
create trigger properties_updated_at
  before update on properties for each row execute function update_updated_at();
drop trigger if exists builders_updated_at on builders;
create trigger builders_updated_at
  before update on builders for each row execute function update_updated_at();
drop trigger if exists hotels_updated_at on hotels;
create trigger hotels_updated_at
  before update on hotels for each row execute function update_updated_at();

alter table properties enable row level security;
alter table builders enable row level security;
alter table builder_quotes enable row level security;
alter table hotels enable row level security;
alter table hotel_monthly_reports enable row level security;

create policy "Authenticated users can read properties"
  on properties for select to authenticated using (true);
create policy "Authenticated users can insert properties"
  on properties for insert to authenticated with check (true);
create policy "Authenticated users can update properties"
  on properties for update to authenticated using (true);

create policy "Authenticated users can read builders"
  on builders for select to authenticated using (true);
create policy "Authenticated users can insert builders"
  on builders for insert to authenticated with check (true);
create policy "Authenticated users can update builders"
  on builders for update to authenticated using (true);

create policy "Authenticated users can read builder_quotes"
  on builder_quotes for select to authenticated using (true);
create policy "Authenticated users can insert builder_quotes"
  on builder_quotes for insert to authenticated with check (true);

create policy "Authenticated users can read hotels"
  on hotels for select to authenticated using (true);
create policy "Authenticated users can insert hotels"
  on hotels for insert to authenticated with check (true);
create policy "Authenticated users can update hotels"
  on hotels for update to authenticated using (true);

create policy "Authenticated users can read hotel_monthly_reports"
  on hotel_monthly_reports for select to authenticated using (true);
create policy "Authenticated users can insert hotel_monthly_reports"
  on hotel_monthly_reports for insert to authenticated with check (true);
create policy "Authenticated users can update hotel_monthly_reports"
  on hotel_monthly_reports for update to authenticated using (true);

-- ========== 物件图片 Storage（在 Dashboard > Storage 创建 bucket 后执行）==========
-- insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true);
-- create policy "Authenticated upload property images"
--   on storage.objects for insert to authenticated with check (bucket_id = 'property-images');
-- create policy "Public read property images"
--   on storage.objects for select using (bucket_id = 'property-images');

-- ========== 已有 properties 表时追加 image_url 并更新 status 约束 ==========
-- alter table properties add column if not exists image_url text;
-- alter table properties drop constraint if exists properties_status_check;
-- alter table properties add constraint properties_status_check
--   check (status in ('進行中','販売中','終了&不合格','上架','洽谈中','已售'));

-- ========== 合同 ==========
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('开发','中介','运营')),
  investor_id uuid references investors(id),
  land_id uuid references lands(id),
  property_id uuid references properties(id),
  amount_wan numeric(10,2),
  commission_wan numeric(10,2),
  signed_date date,
  status text check (status in ('进行中','已完成')) default '进行中',
  file_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- ========== 土地审批节点 ==========
create table if not exists land_approval_nodes (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references lands(id) on delete cascade,
  node_name text not null,
  is_custom boolean not null default false,
  status text not null check (status in ('待提交','审批中','已通过','已拒绝')) default '待提交',
  owner text,
  deadline date,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists land_approval_nodes_land_id_idx on land_approval_nodes(land_id);

drop trigger if exists land_approval_nodes_updated_at on land_approval_nodes;
create trigger land_approval_nodes_updated_at
  before update on land_approval_nodes for each row execute function update_updated_at();

-- ========== 素材库 ==========
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text check (type in ('图片','视频','文案')) default '文案',
  related_type text check (related_type in ('土地','项目','酒店','通用')) default '通用',
  related_id uuid,
  content text,
  file_url text,
  platform text check (platform in ('小红书','微信','其他')) default '小红书',
  status text check (status in ('草稿','已发布')) default '草稿',
  publish_date date,
  created_by text,
  created_at timestamptz not null default now()
);

alter table contracts enable row level security;
alter table land_approval_nodes enable row level security;
alter table media_assets enable row level security;

create policy "Authenticated users can read contracts"
  on contracts for select to authenticated using (true);
create policy "Authenticated users can insert contracts"
  on contracts for insert to authenticated with check (true);
create policy "Authenticated users can update contracts"
  on contracts for update to authenticated using (true);

create policy "Authenticated users can read land_approval_nodes"
  on land_approval_nodes for select to authenticated using (true);
create policy "Authenticated users can insert land_approval_nodes"
  on land_approval_nodes for insert to authenticated with check (true);
create policy "Authenticated users can update land_approval_nodes"
  on land_approval_nodes for update to authenticated using (true);
create policy "Authenticated users can delete land_approval_nodes"
  on land_approval_nodes for delete to authenticated using (true);

create policy "Authenticated users can read media_assets"
  on media_assets for select to authenticated using (true);
create policy "Authenticated users can insert media_assets"
  on media_assets for insert to authenticated with check (true);
create policy "Authenticated users can update media_assets"
  on media_assets for update to authenticated using (true);
create policy "Authenticated users can delete media_assets"
  on media_assets for delete to authenticated using (true);

-- ========== 买家（中介线）==========
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

drop trigger if exists buyers_updated_at on buyers;
create trigger buyers_updated_at
  before update on buyers for each row execute function update_updated_at();

-- ========== 投资人↔物件匹配 ==========
create table if not exists investor_property_matches (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investors(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  is_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (investor_id, property_id)
);

create index if not exists investor_property_matches_property_id_idx
  on investor_property_matches(property_id);

alter table buyers enable row level security;
alter table investor_property_matches enable row level security;

create policy "Authenticated users can read buyers"
  on buyers for select to authenticated using (true);
create policy "Authenticated users can insert buyers"
  on buyers for insert to authenticated with check (true);
create policy "Authenticated users can update buyers"
  on buyers for update to authenticated using (true);
create policy "Authenticated users can delete buyers"
  on buyers for delete to authenticated using (true);

create policy "Authenticated users can read investor_property_matches"
  on investor_property_matches for select to authenticated using (true);
create policy "Authenticated users can insert investor_property_matches"
  on investor_property_matches for insert to authenticated with check (true);
create policy "Authenticated users can update investor_property_matches"
  on investor_property_matches for update to authenticated using (true);
create policy "Authenticated users can delete investor_property_matches"
  on investor_property_matches for delete to authenticated using (true);

-- ========== 系统设置（单例行）==========
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

create policy "Authenticated users can read app_settings"
  on app_settings for select to authenticated using (true);
create policy "Authenticated users can update app_settings"
  on app_settings for update to authenticated using (true);
create policy "Authenticated users can insert app_settings"
  on app_settings for insert to authenticated with check (true);

-- ========== Storage buckets（按需创建）==========
-- insert into storage.buckets (id, name, public) values ('contract-files', 'contract-files', true);
-- insert into storage.buckets (id, name, public) values ('media-assets', 'media-assets', true);

-- ========== 已有 contracts 表迁移 ==========
-- alter table contracts add column if not exists land_id uuid references lands(id);
-- alter table contracts add column if not exists property_id uuid references properties(id);
-- alter table contracts add column if not exists file_url text;
