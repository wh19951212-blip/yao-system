-- 核心架构升级：owner_id + RLS 默认拒绝 + projects/tasks + contract_type + 私有 Storage
-- 在 Supabase SQL Editor 中执行（建议在 bootstrap 及后续 migration 之后）

-- ========== 辅助函数 ==========
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from users u
    where u.email = auth.jwt() ->> 'email'
      and u.role = 'admin'
  );
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'email';
$$;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id from users u
  where u.email = auth.jwt() ->> 'email'
  limit 1;
$$;

create or replace function public.can_access_owner_row(row_owner_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_app_admin()
    or row_owner_id = public.current_app_user_id();
$$;

-- ========== owner_id 列（主表） ==========
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'investors','lands','properties','buyers','builders','hotels',
    'contracts','media_assets','channels','investor_demands'
  ]
  loop
    execute format(
      'alter table %I add column if not exists owner_id uuid references users(id)', tbl);
    execute format($sql$
      update %I t
      set owner_id = u.id
      from users u
      where t.owner_id is null
        and t.owner is not null
        and u.email = t.owner
    $sql$, tbl);
  end loop;
end $$;

create index if not exists investors_owner_id_idx on investors(owner_id);
create index if not exists lands_owner_id_idx on lands(owner_id);
create index if not exists properties_owner_id_idx on properties(owner_id);
create index if not exists contracts_owner_id_idx on contracts(owner_id);

-- ========== projects 表 ==========
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  land_id uuid references lands(id) on delete set null,
  type text not null check (type in ('酒店','公寓','办公')) default '酒店',
  status text not null check (status in ('规划','设计','施工','竣工','运营')) default '规划',
  start_date date,
  expected_completion date,
  actual_completion date,
  total_budget numeric,
  notes text,
  owner_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_land_id_idx on projects(land_id);
create index if not exists projects_owner_id_idx on projects(owner_id);

-- ========== tasks 表 ==========
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  related_type text not null check (related_type in ('investor','land','project')),
  related_id uuid not null,
  due_date date,
  status text not null check (status in ('pending','in_progress','done','cancelled')) default 'pending',
  assigned_to uuid references users(id),
  created_by uuid references users(id),
  owner_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_assigned_to_idx on tasks(assigned_to);
create index if not exists tasks_owner_id_idx on tasks(owner_id);
create index if not exists tasks_status_idx on tasks(status);
create index if not exists tasks_due_date_idx on tasks(due_date);

-- ========== 关联 project_id ==========
alter table properties add column if not exists project_id uuid references projects(id) on delete set null;
alter table hotels add column if not exists project_id uuid references projects(id) on delete set null;
create index if not exists properties_project_id_idx on properties(project_id);
create index if not exists hotels_project_id_idx on hotels(project_id);

-- ========== contract_type ==========
alter table contracts add column if not exists contract_type text
  check (contract_type in ('development','broker','construction'));

update contracts
set contract_type = case
  when type = '中介' then 'broker'
  when type in ('运营','施工') then 'construction'
  else 'development'
end
where contract_type is null;

alter table contracts add column if not exists builder_id uuid references builders(id) on delete set null;

-- ========== RLS：默认拒绝 + 按 owner_id ==========
do $$
declare
  tbl text;
  pol record;
begin
  foreach tbl in array array[
    'investors','lands','properties','buyers','builders','hotels',
    'contracts','media_assets','channels','channel_commissions',
    'follow_up_logs','land_approval_nodes','builder_quotes',
    'investor_property_matches','investor_stage_logs','operation_logs',
    'app_settings','investor_demands','match_runs','match_results',
    'ai_feedback','success_cases','projects','tasks'
  ]
  loop
    execute format('alter table %I enable row level security', tbl);
    for pol in
      select policyname from pg_policies where tablename = tbl and schemaname = 'public'
    loop
      execute format('drop policy if exists %I on %I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

-- 含 owner_id 的主表策略
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'investors','lands','properties','buyers','builders','hotels',
    'contracts','media_assets','channels','investor_demands','projects'
  ]
  loop
    execute format($p$
      create policy "staff select own" on %I for select to authenticated
        using (public.is_app_admin() or owner_id = public.current_app_user_id());
      create policy "staff insert own" on %I for insert to authenticated
        with check (public.is_app_admin() or owner_id = public.current_app_user_id());
      create policy "staff update own" on %I for update to authenticated
        using (public.is_app_admin() or owner_id = public.current_app_user_id())
        with check (public.is_app_admin() or owner_id = public.current_app_user_id());
      create policy "staff delete own" on %I for delete to authenticated
        using (public.is_app_admin() or owner_id = public.current_app_user_id());
    $p$, tbl, tbl, tbl, tbl);
  end loop;
end $$;

-- tasks：assigned_to 或 owner_id 可见
create policy "staff select tasks" on tasks for select to authenticated
  using (
    public.is_app_admin()
    or owner_id = public.current_app_user_id()
    or assigned_to = public.current_app_user_id()
    or created_by = public.current_app_user_id()
  );
create policy "staff insert tasks" on tasks for insert to authenticated
  with check (
    public.is_app_admin()
    or owner_id = public.current_app_user_id()
    or created_by = public.current_app_user_id()
  );
create policy "staff update tasks" on tasks for update to authenticated
  using (
    public.is_app_admin()
    or owner_id = public.current_app_user_id()
    or assigned_to = public.current_app_user_id()
  )
  with check (
    public.is_app_admin()
    or owner_id = public.current_app_user_id()
    or assigned_to = public.current_app_user_id()
  );
create policy "staff delete tasks" on tasks for delete to authenticated
  using (public.is_app_admin() or owner_id = public.current_app_user_id());

-- users：仅 authenticated 可读；本人或 admin 可改
create policy "users select" on users for select to authenticated using (true);
create policy "users insert" on users for insert to authenticated
  with check (public.is_app_admin());
create policy "users update" on users for update to authenticated
  using (public.is_app_admin() or id = public.current_app_user_id());

-- app_settings：admin 可写，authenticated 可读
create policy "settings select" on app_settings for select to authenticated using (true);
create policy "settings write" on app_settings for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

-- 子表：通过父表 owner 校验（authenticated）
create policy "logs select" on follow_up_logs for select to authenticated using (true);
create policy "logs insert" on follow_up_logs for insert to authenticated with check (true);
create policy "logs update" on follow_up_logs for update to authenticated using (true) with check (true);
create policy "logs delete" on follow_up_logs for delete to authenticated using (public.is_app_admin());

create policy "match select" on match_runs for select to authenticated using (true);
create policy "match insert" on match_runs for insert to authenticated with check (true);
create policy "match update" on match_runs for update to authenticated using (true) with check (true);

create policy "match result select" on match_results for select to authenticated using (true);
create policy "match result insert" on match_results for insert to authenticated with check (true);
create policy "match result update" on match_results for update to authenticated using (true) with check (true);

create policy "ai feedback select" on ai_feedback for select to authenticated using (true);
create policy "ai feedback insert" on ai_feedback for insert to authenticated with check (true);

create policy "success cases select" on success_cases for select to authenticated using (true);
create policy "success cases insert" on success_cases for insert to authenticated with check (true);

-- ========== Storage：私有 bucket ==========
update storage.buckets set public = false
where id in ('property-images', 'contract-files', 'media-assets');

insert into storage.buckets (id, name, public)
values
  ('property-images', 'property-images', false),
  ('contract-files', 'contract-files', false),
  ('media-assets', 'media-assets', false)
on conflict (id) do update set public = false;

-- 删除旧的公开策略
drop policy if exists "Public read property-images" on storage.objects;
drop policy if exists "Public read contract-files" on storage.objects;
drop policy if exists "Public read media-assets" on storage.objects;
drop policy if exists "Authenticated upload property-images" on storage.objects;
drop policy if exists "Authenticated upload contract-files" on storage.objects;
drop policy if exists "Authenticated upload media-assets" on storage.objects;

-- 私有：authenticated 用户可读写自己 bucket 内文件
create policy "auth read private files" on storage.objects for select to authenticated
  using (bucket_id in ('property-images', 'contract-files', 'media-assets'));
create policy "auth upload private files" on storage.objects for insert to authenticated
  with check (bucket_id in ('property-images', 'contract-files', 'media-assets'));
create policy "auth update private files" on storage.objects for update to authenticated
  using (bucket_id in ('property-images', 'contract-files', 'media-assets'));
create policy "auth delete private files" on storage.objects for delete to authenticated
  using (bucket_id in ('property-images', 'contract-files', 'media-assets'));
