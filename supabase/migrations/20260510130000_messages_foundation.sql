insert into public.permissions (id, resource, action, scope, description)
values
  ('messages.read', 'messages', 'read', 'tenant', 'Leer hilos y mensajes clínicos del tenant'),
  ('messages.create', 'messages', 'create', 'tenant', 'Crear hilos y mensajes clínicos del tenant'),
  ('messages.update', 'messages', 'update', 'tenant', 'Actualizar hilos de mensajería clínica'),
  ('messages.close', 'messages', 'close', 'tenant', 'Cerrar hilos de mensajería clínica'),
  ('messages.assign', 'messages', 'assign', 'tenant', 'Asignar hilos de mensajería clínica')
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
    ('platform_superadmin', 'messages.read'),
    ('platform_superadmin', 'messages.create'),
    ('platform_superadmin', 'messages.update'),
    ('platform_superadmin', 'messages.close'),
    ('platform_superadmin', 'messages.assign'),
    ('tenant_owner', 'messages.read'),
    ('tenant_owner', 'messages.create'),
    ('tenant_owner', 'messages.update'),
    ('tenant_owner', 'messages.close'),
    ('tenant_owner', 'messages.assign'),
    ('nutrition_director', 'messages.read'),
    ('nutrition_director', 'messages.create'),
    ('nutrition_director', 'messages.update'),
    ('nutrition_director', 'messages.close'),
    ('nutrition_director', 'messages.assign'),
    ('clinical_nutritionist', 'messages.read'),
    ('clinical_nutritionist', 'messages.create'),
    ('clinical_nutritionist', 'messages.update'),
    ('clinical_nutritionist', 'messages.close'),
    ('sports_nutritionist', 'messages.read'),
    ('sports_nutritionist', 'messages.create'),
    ('sports_nutritionist', 'messages.update'),
    ('sports_nutritionist', 'messages.close')
) as p(role_code, permission_id) on p.role_code = r.code
on conflict do nothing;

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  channel text not null default 'internal' check (channel in ('internal', 'patient', 'clinical_team')),
  last_message_at timestamptz,
  created_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  sender_user_id uuid references auth.users(id),
  sender_display_name text,
  body text not null,
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.message_read_receipts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  user_id uuid not null references auth.users(id),
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (thread_id, user_id)
);

create index if not exists idx_message_threads_tenant_last on public.message_threads(tenant_id, last_message_at desc) where deleted_at is null;
create index if not exists idx_message_threads_patient on public.message_threads(tenant_id, patient_id) where deleted_at is null;
create index if not exists idx_message_threads_status on public.message_threads(tenant_id, status) where deleted_at is null;
create index if not exists idx_messages_thread_created on public.messages(tenant_id, thread_id, created_at) where deleted_at is null;
create index if not exists idx_messages_patient_created on public.messages(tenant_id, patient_id, created_at desc) where deleted_at is null;
create index if not exists idx_message_read_receipts_user on public.message_read_receipts(tenant_id, user_id, thread_id);

alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.message_read_receipts enable row level security;

drop policy if exists "message threads read permitted" on public.message_threads;
drop policy if exists "message threads insert permitted" on public.message_threads;
drop policy if exists "message threads update permitted" on public.message_threads;
drop policy if exists "messages read permitted" on public.messages;
drop policy if exists "messages insert permitted" on public.messages;
drop policy if exists "message read receipts read permitted" on public.message_read_receipts;
drop policy if exists "message read receipts insert permitted" on public.message_read_receipts;
drop policy if exists "message read receipts update permitted" on public.message_read_receipts;

create policy "message threads read permitted" on public.message_threads
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'messages.read'));

create policy "message threads insert permitted" on public.message_threads
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'messages.create'));

create policy "message threads update permitted" on public.message_threads
for update to authenticated
using (
  public.has_tenant_permission(tenant_id, 'messages.update')
  or public.has_tenant_permission(tenant_id, 'messages.close')
  or public.has_tenant_permission(tenant_id, 'messages.assign')
)
with check (
  public.has_tenant_permission(tenant_id, 'messages.update')
  or public.has_tenant_permission(tenant_id, 'messages.close')
  or public.has_tenant_permission(tenant_id, 'messages.assign')
);

create policy "messages read permitted" on public.messages
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'messages.read'));

create policy "messages insert permitted" on public.messages
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'messages.create'));

create policy "message read receipts read permitted" on public.message_read_receipts
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'messages.read') and user_id = auth.uid());

create policy "message read receipts insert permitted" on public.message_read_receipts
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'messages.read') and user_id = auth.uid());

create policy "message read receipts update permitted" on public.message_read_receipts
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'messages.read') and user_id = auth.uid())
with check (public.has_tenant_permission(tenant_id, 'messages.read') and user_id = auth.uid());
