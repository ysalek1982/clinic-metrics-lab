insert into public.permissions (id, resource, action, scope, description)
values
  ('appointments.read', 'appointments', 'read', 'tenant', 'Leer agenda y citas del tenant'),
  ('appointments.create', 'appointments', 'create', 'tenant', 'Crear citas clínicas del tenant'),
  ('appointments.update', 'appointments', 'update', 'tenant', 'Editar citas clínicas del tenant'),
  ('appointments.cancel', 'appointments', 'cancel', 'tenant', 'Cancelar citas clínicas del tenant'),
  ('appointments.complete', 'appointments', 'complete', 'tenant', 'Marcar citas clínicas como completadas')
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
    ('platform_superadmin', 'appointments.read'),
    ('platform_superadmin', 'appointments.create'),
    ('platform_superadmin', 'appointments.update'),
    ('platform_superadmin', 'appointments.cancel'),
    ('platform_superadmin', 'appointments.complete'),
    ('tenant_owner', 'appointments.read'),
    ('tenant_owner', 'appointments.create'),
    ('tenant_owner', 'appointments.update'),
    ('tenant_owner', 'appointments.cancel'),
    ('tenant_owner', 'appointments.complete'),
    ('nutrition_director', 'appointments.read'),
    ('nutrition_director', 'appointments.create'),
    ('nutrition_director', 'appointments.update'),
    ('nutrition_director', 'appointments.cancel'),
    ('nutrition_director', 'appointments.complete'),
    ('clinical_nutritionist', 'appointments.read'),
    ('clinical_nutritionist', 'appointments.create'),
    ('clinical_nutritionist', 'appointments.update'),
    ('clinical_nutritionist', 'appointments.cancel'),
    ('clinical_nutritionist', 'appointments.complete'),
    ('sports_nutritionist', 'appointments.read'),
    ('sports_nutritionist', 'appointments.create'),
    ('sports_nutritionist', 'appointments.update'),
    ('sports_nutritionist', 'appointments.cancel'),
    ('sports_nutritionist', 'appointments.complete')
) as p(role_code, permission_id) on p.role_code = r.code
on conflict do nothing;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_user_id uuid references auth.users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  appointment_type text not null check (appointment_type in ('consulta', 'antropometria', 'educacion', 'telemedicina', 'seguimiento', 'control_labs', 'otro')),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  modality text,
  location text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint appointments_valid_time check (ends_at > starts_at)
);

create index if not exists idx_appointments_tenant_starts on public.appointments(tenant_id, starts_at) where deleted_at is null;
create index if not exists idx_appointments_tenant_status on public.appointments(tenant_id, status) where deleted_at is null;
create index if not exists idx_appointments_patient_starts on public.appointments(tenant_id, patient_id, starts_at) where deleted_at is null;
create index if not exists idx_appointments_professional_starts on public.appointments(tenant_id, professional_user_id, starts_at) where deleted_at is null;

alter table public.appointments enable row level security;

drop policy if exists "appointments read permitted" on public.appointments;
drop policy if exists "appointments insert permitted" on public.appointments;
drop policy if exists "appointments update permitted" on public.appointments;

create policy "appointments read permitted" on public.appointments
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'appointments.read'));

create policy "appointments insert permitted" on public.appointments
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'appointments.create'));

create policy "appointments update permitted" on public.appointments
for update to authenticated
using (
  public.has_tenant_permission(tenant_id, 'appointments.update')
  or public.has_tenant_permission(tenant_id, 'appointments.cancel')
  or public.has_tenant_permission(tenant_id, 'appointments.complete')
)
with check (
  public.has_tenant_permission(tenant_id, 'appointments.update')
  or public.has_tenant_permission(tenant_id, 'appointments.cancel')
  or public.has_tenant_permission(tenant_id, 'appointments.complete')
);
