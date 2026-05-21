insert into public.permissions (id, resource, action, scope, description) values
  ('gineco.manage', 'gineco', 'manage', 'specialty_pack', 'Crear y mantener controles gineco-obstetricos del tenant.'),
  ('enteral.manage', 'enteral', 'manage', 'specialty_pack', 'Crear y mantener planes y controles de nutricion enteral.'),
  ('sports.manage', 'sports', 'manage', 'specialty_pack', 'Crear y mantener perfiles deportivos y composicion corporal.')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.permission_id
from public.roles r
join (
  values
    ('platform_superadmin', 'gineco.manage'),
    ('platform_superadmin', 'enteral.manage'),
    ('platform_superadmin', 'sports.manage'),
    ('tenant_owner', 'gineco.manage'),
    ('tenant_owner', 'enteral.manage'),
    ('tenant_owner', 'sports.manage'),
    ('nutrition_director', 'gineco.manage'),
    ('nutrition_director', 'enteral.manage'),
    ('nutrition_director', 'sports.manage'),
    ('clinical_nutritionist', 'gineco.manage'),
    ('clinical_nutritionist', 'enteral.manage'),
    ('sports_nutritionist', 'sports.manage')
) as p(role_code, permission_id) on p.role_code = r.code
on conflict do nothing;

drop policy if exists "pregnancy records isolated" on public.pregnancy_records;
drop policy if exists "enteral plans isolated" on public.enteral_plans;
drop policy if exists "enteral logs isolated" on public.enteral_daily_logs;
drop policy if exists "sports profiles isolated" on public.sports_profiles;
drop policy if exists "sports snapshots isolated" on public.sports_bodycomp_snapshots;

create policy "pregnancy records readable by tenant" on public.pregnancy_records
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "pregnancy records insert by permission" on public.pregnancy_records
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'gineco.manage'));

create policy "pregnancy records update by permission" on public.pregnancy_records
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'gineco.manage'))
with check (public.has_tenant_permission(tenant_id, 'gineco.manage'));

create policy "pregnancy records delete by permission" on public.pregnancy_records
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'gineco.manage'));

create policy "enteral plans readable by tenant" on public.enteral_plans
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "enteral plans insert by permission" on public.enteral_plans
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'enteral.manage'));

create policy "enteral plans update by permission" on public.enteral_plans
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'enteral.manage'))
with check (public.has_tenant_permission(tenant_id, 'enteral.manage'));

create policy "enteral plans delete by permission" on public.enteral_plans
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'enteral.manage'));

create policy "enteral logs readable by tenant" on public.enteral_daily_logs
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "enteral logs insert by permission" on public.enteral_daily_logs
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'enteral.manage'));

create policy "enteral logs update by permission" on public.enteral_daily_logs
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'enteral.manage'))
with check (public.has_tenant_permission(tenant_id, 'enteral.manage'));

create policy "enteral logs delete by permission" on public.enteral_daily_logs
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'enteral.manage'));

create policy "sports profiles readable by tenant" on public.sports_profiles
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "sports profiles insert by permission" on public.sports_profiles
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports profiles update by permission" on public.sports_profiles
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'sports.manage'))
with check (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports profiles delete by permission" on public.sports_profiles
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports snapshots readable by tenant" on public.sports_bodycomp_snapshots
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "sports snapshots insert by permission" on public.sports_bodycomp_snapshots
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports snapshots update by permission" on public.sports_bodycomp_snapshots
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'sports.manage'))
with check (public.has_tenant_permission(tenant_id, 'sports.manage'));

create policy "sports snapshots delete by permission" on public.sports_bodycomp_snapshots
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'sports.manage'));
