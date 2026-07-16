-- ================================================
-- YAO 投资管理系统 — 生产环境 RLS 策略（推荐）
-- 在 Supabase SQL Editor 中运行，替换 fix_permissions 中的 allow all
--
-- 策略说明：
--   • authenticated 用户可读全部业务数据
--   • staff 只能写入 owner = 自己邮箱 的记录
--   • admin（users.role = 'admin'）可读写全部
--   • anon 仅可读（配合前端访客模式 + 演示数据）
-- ================================================

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

-- 通用：启用 RLS 并清理旧策略
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'investors','lands','properties','buyers','builders','hotels',
    'contracts','media_assets','channels','channel_commissions',
    'follow_up_logs','land_approval_nodes',
    'builder_quotes','investor_property_matches','investor_stage_logs',
    'operation_logs','app_settings'
  ]
  loop
    execute format('alter table %I enable row level security', tbl);
    execute format('drop policy if exists "allow all" on %I', tbl);
    execute format('drop policy if exists "prod read" on %I', tbl);
    execute format('drop policy if exists "prod insert" on %I', tbl);
    execute format('drop policy if exists "prod update" on %I', tbl);
    execute format('drop policy if exists "prod delete" on %I', tbl);
    execute format('drop policy if exists "anon read" on %I', tbl);
  end loop;
end $$;

-- 投资人
create policy "anon read" on investors for select to anon using (true);
create policy "prod read" on investors for select to authenticated using (true);
create policy "prod insert" on investors for insert to authenticated
  with check (public.is_app_admin() or owner = public.current_user_email());
create policy "prod update" on investors for update to authenticated
  using (public.is_app_admin() or owner = public.current_user_email())
  with check (public.is_app_admin() or owner = public.current_user_email());
create policy "prod delete" on investors for delete to authenticated
  using (public.is_app_admin() or owner = public.current_user_email());

-- 土地
create policy "anon read" on lands for select to anon using (true);
create policy "prod read" on lands for select to authenticated using (true);
create policy "prod insert" on lands for insert to authenticated
  with check (public.is_app_admin() or owner = public.current_user_email());
create policy "prod update" on lands for update to authenticated
  using (public.is_app_admin() or owner = public.current_user_email())
  with check (public.is_app_admin() or owner = public.current_user_email());
create policy "prod delete" on lands for delete to authenticated
  using (public.is_app_admin() or owner = public.current_user_email());

-- 物件 / 买家 / 建筑商 / 酒店 / 合同 / 素材（结构相同）
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'properties','buyers','builders','hotels','contracts','media_assets'
  ]
  loop
    execute format(
      'create policy "anon read" on %I for select to anon using (true)', tbl);
    execute format(
      'create policy "prod read" on %I for select to authenticated using (true)', tbl);
    execute format($p$
      create policy "prod insert" on %I for insert to authenticated
        with check (public.is_app_admin() or owner = public.current_user_email())
    $p$, tbl);
    execute format($p$
      create policy "prod update" on %I for update to authenticated
        using (public.is_app_admin() or owner = public.current_user_email())
        with check (public.is_app_admin() or owner = public.current_user_email())
    $p$, tbl);
    execute format($p$
      create policy "prod delete" on %I for delete to authenticated
        using (public.is_app_admin() or owner = public.current_user_email())
    $p$, tbl);
  end loop;
end $$;

-- users 表：仅 authenticated 可读，本人或 admin 可改
alter table users enable row level security;
drop policy if exists "allow all" on users;
create policy "users read" on users for select to authenticated using (true);
create policy "users insert" on users for insert to authenticated with check (true);
create policy "users update" on users for update to authenticated
  using (public.is_app_admin() or email = public.current_user_email());

-- 渠道 / 佣金（结构相同）
do $$
declare
  tbl text;
begin
  foreach tbl in array array['channels','channel_commissions']
  loop
    execute format(
      'create policy "anon read" on %I for select to anon using (true)', tbl);
    execute format(
      'create policy "prod read" on %I for select to authenticated using (true)', tbl);
    execute format($p$
      create policy "prod insert" on %I for insert to authenticated
        with check (public.is_app_admin() or owner = public.current_user_email())
    $p$, tbl);
    execute format($p$
      create policy "prod update" on %I for update to authenticated
        using (public.is_app_admin() or owner = public.current_user_email())
        with check (public.is_app_admin() or owner = public.current_user_email())
    $p$, tbl);
    execute format($p$
      create policy "prod delete" on %I for delete to authenticated
        using (public.is_app_admin() or owner = public.current_user_email())
    $p$, tbl);
  end loop;
end $$;

-- 子表：通过 investor_id / land_id 关联校验（authenticated 可读，admin 或关联 owner 可写）
-- follow_up_logs, land_approval_nodes 等保持 authenticated 读写（由应用层 owner 校验）
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'follow_up_logs','land_approval_nodes','builder_quotes',
    'investor_property_matches','investor_stage_logs','operation_logs'
  ]
  loop
    execute format('create policy "anon read" on %I for select to anon using (true)', tbl);
    execute format('create policy "prod read" on %I for select to authenticated using (true)', tbl);
    execute format('create policy "prod insert" on %I for insert to authenticated with check (true)', tbl);
    execute format('create policy "prod update" on %I for update to authenticated using (true) with check (true)', tbl);
    execute format('create policy "prod delete" on %I for delete to authenticated using (true)', tbl);
  end loop;
end $$;

-- app_settings：authenticated 可读，仅 admin 可写
create policy "anon read" on app_settings for select to anon using (true);
create policy "prod read" on app_settings for select to authenticated using (true);
create policy "prod insert" on app_settings for insert to authenticated
  with check (public.is_app_admin());
create policy "prod update" on app_settings for update to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());
