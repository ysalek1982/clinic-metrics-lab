insert into public.permissions (id, resource, action, scope, description)
values
  ('reports.read', 'reports', 'read', 'tenant', 'Consultar reportes generados'),
  ('reports.generate', 'reports', 'generate', 'tenant', 'Generar reportes institucionales'),
  ('reports.print', 'reports', 'print', 'tenant', 'Imprimir reportes institucionales')
on conflict (id) do update
set resource = excluded.resource,
    action = excluded.action,
    scope = excluded.scope,
    description = excluded.description;

with report_permissions as (
  select
    p.id as permission_id
  from public.permissions p
  where p.id in (
    'reports.read',
    'reports.generate',
    'reports.print'
  )
),
target_roles as (
  select distinct
    r.id as role_id
  from public.roles r
  where r.code in (
    'platform_superadmin',
    'tenant_owner',
    'nutrition_director',
    'clinical_nutritionist',
    'auditor'
  )
  or exists (
    select 1
    from public.role_permissions existing_rp
    where existing_rp.role_id = r.id
      and existing_rp.permission_id = 'reports.export'
  )
)
insert into public.role_permissions (role_id, permission_id)
select distinct
  tr.role_id,
  rp.permission_id
from target_roles tr
cross join report_permissions rp
on conflict (role_id, permission_id) do nothing;

drop policy if exists "report runs read isolated" on public.report_runs;
drop policy if exists "report runs insert permitted" on public.report_runs;
drop policy if exists "report runs update permitted" on public.report_runs;
drop policy if exists "report runs delete permitted" on public.report_runs;

create policy "report runs read isolated" on public.report_runs
for select to authenticated
using (
  public.has_tenant_permission(tenant_id, 'reports.read')
  or public.has_tenant_permission(tenant_id, 'reports.export')
);

create policy "report runs insert permitted" on public.report_runs
for insert to authenticated
with check (
  public.has_tenant_permission(tenant_id, 'reports.generate')
  or public.has_tenant_permission(tenant_id, 'reports.export')
);

create policy "report runs update permitted" on public.report_runs
for update to authenticated
using (
  public.has_tenant_permission(tenant_id, 'reports.generate')
  or public.has_tenant_permission(tenant_id, 'reports.export')
)
with check (
  public.has_tenant_permission(tenant_id, 'reports.generate')
  or public.has_tenant_permission(tenant_id, 'reports.export')
);

create policy "report runs delete permitted" on public.report_runs
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'reports.export'));
