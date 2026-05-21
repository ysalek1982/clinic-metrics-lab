insert into public.permissions (id, resource, action, scope, description)
values
  ('alerts.read', 'alerts', 'read', 'tenant', 'Leer estados de alertas'),
  ('alerts.manage', 'alerts', 'manage', 'tenant', 'Marcar alertas como revisadas o resueltas')
on conflict (id) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.permission_id
from public.roles r
join (
  values
    ('alerts.read'),
    ('alerts.manage')
) as p(permission_id) on true
where r.code in ('platform_superadmin', 'tenant_owner', 'nutrition_director', 'clinical_nutritionist', 'sports_nutritionist')
on conflict (role_id, permission_id) do nothing;

create table if not exists public.alert_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  alert_id text not null,
  patient_id uuid references public.patients(id) on delete cascade,
  status text not null default 'reviewed' check (status in ('reviewed', 'resolved')),
  note text,
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz not null default now(),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, alert_id)
);

create index if not exists idx_alert_ack_tenant_status on public.alert_acknowledgements(tenant_id, status, updated_at desc);
create index if not exists idx_alert_ack_tenant_patient on public.alert_acknowledgements(tenant_id, patient_id);

alter table public.alert_acknowledgements enable row level security;

drop policy if exists "alert ack read permitted" on public.alert_acknowledgements;
drop policy if exists "alert ack insert permitted" on public.alert_acknowledgements;
drop policy if exists "alert ack update permitted" on public.alert_acknowledgements;
drop policy if exists "alert ack delete permitted" on public.alert_acknowledgements;

create policy "alert ack read permitted" on public.alert_acknowledgements
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'alerts.read') or public.has_tenant_permission(tenant_id, 'alerts.manage'));

create policy "alert ack insert permitted" on public.alert_acknowledgements
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'alerts.manage'));

create policy "alert ack update permitted" on public.alert_acknowledgements
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'alerts.manage'))
with check (public.has_tenant_permission(tenant_id, 'alerts.manage'));

create policy "alert ack delete permitted" on public.alert_acknowledgements
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'alerts.manage'));
