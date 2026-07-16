-- ================================================
-- 智能匹配模块 — 需求单 + 匹配任务 + 匹配结果
-- 在 Supabase SQL Editor 中运行（可重复执行）
-- ================================================

-- 需求单
create table if not exists investor_demands (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('portal','staff','channel')) default 'staff',
  portal_user_id uuid,
  investor_id uuid references investors(id) on delete set null,
  buyer_id uuid references buyers(id) on delete set null,
  channel_id uuid references channels(id) on delete set null,
  submitted_by text,
  intent_type text not null check (intent_type in ('invest_dev','invest_hotel','buy_property','general')) default 'general',
  budget_min_wan numeric,
  budget_max_wan numeric,
  preferred_regions text[] not null default array[]::text[],
  preferred_types text[] not null default array[]::text[],
  min_roi_percent numeric,
  risk_tolerance text check (risk_tolerance in ('保守','平衡','激进')),
  timeline text,
  raw_description text,
  parsed_criteria jsonb,
  parse_confidence numeric,
  status text not null check (status in ('draft','submitted','matching','matched','in_progress','closed','cancelled')) default 'draft',
  owner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists investor_demands_updated_at on investor_demands;
create trigger investor_demands_updated_at
  before update on investor_demands for each row execute function update_updated_at();

create index if not exists investor_demands_investor_id_idx on investor_demands(investor_id);
create index if not exists investor_demands_status_idx on investor_demands(status);
create index if not exists investor_demands_owner_idx on investor_demands(owner);

-- 匹配任务
create table if not exists match_runs (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references investor_demands(id) on delete cascade,
  engine_version text not null default 'v1',
  rule_config jsonb,
  ai_enabled boolean not null default false,
  status text not null check (status in ('running','completed','failed')) default 'running',
  result_count int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists match_runs_demand_id_idx on match_runs(demand_id);

-- 匹配结果
create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references match_runs(id) on delete cascade,
  demand_id uuid not null references investor_demands(id) on delete cascade,
  target_type text not null check (target_type in ('land','property','hotel','builder','channel')),
  target_id uuid not null,
  score_total numeric not null default 0,
  score_breakdown jsonb,
  match_reasons text[] not null default array[]::text[],
  ai_explanation text,
  review_status text not null check (review_status in ('pending','approved','rejected','shown_to_investor')) default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  rank int not null default 0,
  investor_status text check (investor_status in ('interested','passed','contacted')),
  investor_note text,
  created_at timestamptz not null default now()
);

create index if not exists match_results_demand_id_idx on match_results(demand_id);
create index if not exists match_results_run_id_idx on match_results(run_id);
create index if not exists match_results_review_status_idx on match_results(review_status);

-- RLS（开发/演示：开放读写）
alter table investor_demands enable row level security;
alter table match_runs enable row level security;
alter table match_results enable row level security;

drop policy if exists "allow all" on investor_demands;
drop policy if exists "allow all" on match_runs;
drop policy if exists "allow all" on match_results;
create policy "allow all" on investor_demands for all using (true) with check (true);
create policy "allow all" on match_runs for all using (true) with check (true);
create policy "allow all" on match_results for all using (true) with check (true);
