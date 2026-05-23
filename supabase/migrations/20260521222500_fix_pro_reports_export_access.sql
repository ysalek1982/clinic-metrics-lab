-- Align commercial SaaS access: Pro/Courtesy/Clinic can open the reports center.
-- Free remains limited and does not get export permission.

insert into public.plan_entitlements (plan_code, feature_key, enabled, limit_value)
values
  ('free', 'reports.export', false, null),
  ('pro', 'reports.export', true, null),
  ('clinic_hospital', 'reports.export', true, null),
  ('courtesy', 'reports.export', true, null)
on conflict (plan_code, feature_key) do update set
  enabled = excluded.enabled,
  limit_value = excluded.limit_value;

with target_roles as (
  select id as role_id
  from public.roles
  where tenant_id is null
    and code in ('clinical_nutritionist', 'nutrition_director', 'tenant_owner')
),
target_permissions as (
  select id as permission_id
  from public.permissions
  where id in ('reports.read', 'reports.generate', 'reports.print', 'reports.export')
)
insert into public.role_permissions (role_id, permission_id)
select target_roles.role_id, target_permissions.permission_id
from target_roles
cross join target_permissions
on conflict (role_id, permission_id) do nothing;
