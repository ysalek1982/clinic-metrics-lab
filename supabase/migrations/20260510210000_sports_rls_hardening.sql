alter table if exists public.sports_profiles enable row level security;
alter table if exists public.sports_bodycomp_snapshots enable row level security;

alter table if exists public.sports_profiles force row level security;
alter table if exists public.sports_bodycomp_snapshots force row level security;

drop policy if exists "sports profiles isolated" on public.sports_profiles;
drop policy if exists "sports profiles readable by tenant" on public.sports_profiles;
drop policy if exists "sports profiles insert by permission" on public.sports_profiles;
drop policy if exists "sports profiles update by permission" on public.sports_profiles;
drop policy if exists "sports profiles delete by permission" on public.sports_profiles;

drop policy if exists "sports snapshots isolated" on public.sports_bodycomp_snapshots;
drop policy if exists "sports snapshots readable by tenant" on public.sports_bodycomp_snapshots;
drop policy if exists "sports snapshots insert by permission" on public.sports_bodycomp_snapshots;
drop policy if exists "sports snapshots update by permission" on public.sports_bodycomp_snapshots;
drop policy if exists "sports snapshots delete by permission" on public.sports_bodycomp_snapshots;

create policy "sports profiles read by active tenant"
on public.sports_profiles
for select
to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "sports profiles insert by sports permission"
on public.sports_profiles
for insert
to authenticated
with check (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports profiles update by sports permission"
on public.sports_profiles
for update
to authenticated
using (public.has_tenant_permission(tenant_id, 'sports.manage'))
with check (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports profiles delete by sports permission"
on public.sports_profiles
for delete
to authenticated
using (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports snapshots read by active tenant"
on public.sports_bodycomp_snapshots
for select
to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "sports snapshots insert by sports permission"
on public.sports_bodycomp_snapshots
for insert
to authenticated
with check (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports snapshots update by sports permission"
on public.sports_bodycomp_snapshots
for update
to authenticated
using (public.has_tenant_permission(tenant_id, 'sports.manage'))
with check (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports snapshots delete by sports permission"
on public.sports_bodycomp_snapshots
for delete
to authenticated
using (public.has_tenant_permission(tenant_id, 'sports.manage'));

notify pgrst, 'reload schema';
