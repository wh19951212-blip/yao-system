-- ================================================
-- 渠道中介模块 — 表结构 + 关联字段
-- 在 Supabase SQL Editor 中运行（可重复执行）
-- ================================================

-- 渠道中介档案
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entity_type text not null check (entity_type in ('公司','个人')) default '公司',
  contact_name text,
  contact_wechat text,
  contact_phone text,
  region text,
  tier text check (tier in ('S','A','B','C')) default 'B',
  cooperation_types text[] not null default array['全渠道']::text[],
  default_commission_rate numeric,
  status text check (status in ('合作中','暂停','终止')) default '合作中',
  owner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists channels_updated_at on channels;
create trigger channels_updated_at
  before update on channels for each row execute function update_updated_at();

-- 渠道佣金结算
create table if not exists channel_commissions (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  contract_id uuid references contracts(id) on delete set null,
  related_type text check (related_type in ('investor','buyer','property','contract')),
  related_id uuid,
  title text,
  amount_wan numeric,
  commission_wan numeric not null default 0,
  status text check (status in ('待结算','已结算')) default '待结算',
  settled_at timestamptz,
  notes text,
  owner text,
  created_at timestamptz not null default now()
);

create index if not exists channel_commissions_channel_id_idx on channel_commissions(channel_id);
create index if not exists channel_commissions_status_idx on channel_commissions(status);

-- 关联到现有业务表
alter table investors add column if not exists channel_id uuid references channels(id);
alter table buyers add column if not exists channel_id uuid references channels(id);
alter table properties add column if not exists channel_id uuid references channels(id);
alter table contracts add column if not exists channel_id uuid references channels(id);

create index if not exists investors_channel_id_idx on investors(channel_id);
create index if not exists buyers_channel_id_idx on buyers(channel_id);
create index if not exists properties_channel_id_idx on properties(channel_id);
create index if not exists contracts_channel_id_idx on contracts(channel_id);

-- RLS（开发/演示：开放读写；生产请运行 rls_production.sql）
alter table channels enable row level security;
alter table channel_commissions enable row level security;

drop policy if exists "allow all" on channels;
drop policy if exists "allow all" on channel_commissions;
create policy "allow all" on channels for all using (true) with check (true);
create policy "allow all" on channel_commissions for all using (true) with check (true);
