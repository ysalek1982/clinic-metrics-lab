-- SaaS subscription plans, entitlements and time-limited courtesy subscriptions.
-- Incremental local migration. Do not apply remotely without explicit authorization.

insert into public.permissions (id, resource, action, scope, description) values
  ('plans.read', 'subscription_plans', 'read', 'platform', 'Leer planes y beneficios SaaS.'),
  ('plans.manage', 'subscription_plans', 'manage', 'platform', 'Gestionar planes y beneficios SaaS.'),
  ('subscriptions.read', 'tenant_subscriptions', 'read', 'tenant', 'Leer estado de suscripcion del tenant.'),
  ('subscriptions.manage', 'tenant_subscriptions', 'manage', 'platform', 'Gestionar suscripciones, trials y cortesias.')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

with platform_role as (
  select id as role_id
  from public.roles
  where tenant_id is null
    and code = 'platform_superadmin'
  limit 1
),
target_permissions as (
  select id as permission_id
  from public.permissions
  where id in (
    'plans.read',
    'plans.manage',
    'subscriptions.read',
    'subscriptions.manage',
    'saas.manage',
    'platform.manage',
    'audit.read'
  )
)
insert into public.role_permissions (role_id, permission_id)
select platform_role.role_id, target_permissions.permission_id
from platform_role
cross join target_permissions
on conflict (role_id, permission_id) do nothing;

alter table public.subscription_plans
  add column if not exists code text,
  add column if not exists description text,
  add column if not exists monthly_price numeric(10,2),
  add column if not exists currency text not null default 'BOB',
  add column if not exists is_paid boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists max_users integer,
  add column if not exists max_patients integer,
  add column if not exists max_storage_mb integer;

update public.subscription_plans
set code = id
where code is null;

create unique index if not exists idx_subscription_plans_code_unique
  on public.subscription_plans(code)
  where code is not null;

insert into public.subscription_plans (
  id,
  code,
  name,
  market_position,
  description,
  monthly_price_usd,
  monthly_price,
  currency,
  is_paid,
  is_active,
  included_users,
  active_patient_limit,
  max_users,
  max_patients,
  max_storage_mb,
  branch_limit,
  enabled_pack_limit,
  ai_enabled,
  white_label_enabled,
  features
) values
  ('free', 'free', 'Free', 'Cuenta gratuita basica', 'Acceso basico para revisar el sistema sin modulos premium.', 0, 0, 'BOB', false, true, 1, 25, 1, 25, 256, 1, 2, false, false, '["Dashboard basico","Pacientes limitados","Antropometria basica","Agenda basica"]'::jsonb),
  ('courtesy', 'courtesy', 'Cortesia', 'Cortesia administrada', 'Membresia temporal otorgada manualmente por plataforma.', 0, 0, 'BOB', false, true, 5, 250, 5, 250, 1024, 1, 5, true, false, '["Acceso temporal","Reportes limitados","Copilot contextual","Packs segun rol"]'::jsonb),
  ('trial', 'trial', 'Trial', 'Prueba evaluable', 'Prueba temporal para validacion institucional antes de contratar.', 0, 0, 'BOB', false, true, 8, 500, 8, 500, 2048, 2, 6, true, false, '["Prueba temporal","Reportes","Copilot contextual","Packs seleccionados"]'::jsonb),
  ('professional', 'professional', 'Professional', 'Clinicas y centros', 'Plan profesional para equipos clinicos y nutricion operativa.', 249, 1720, 'BOB', true, true, 12, 1500, 12, 1500, 40960, 3, 8, true, false, '["Packs configurables","Reportes","Copilot contextual","Auditoria"]'::jsonb),
  ('clinic', 'clinic', 'Clinic', 'Clinica ambulatoria', 'Plan para consulta clinica, agenda, planes y nutricion operativa.', 179, 1240, 'BOB', true, true, 8, 800, 8, 800, 20480, 2, 5, true, false, '["Pacientes","Agenda","Planes","Recetas","Reportes"]'::jsonb),
  ('hospital', 'hospital', 'Hospital', 'Hospital y soporte nutricional', 'Plan hospitalario para enteral, parenteral basico y laboratorios.', 599, 4140, 'BOB', true, true, 40, 5000, 40, 5000, 102400, 6, 10, true, true, '["Enteral","Parenteral basico","Labs","Alertas","Reportes"]'::jsonb),
  ('enterprise', 'enterprise', 'Enterprise', 'Red institucional', 'Plan empresarial para multiples sedes, auditoria y soporte avanzado.', 799, 5520, 'BOB', true, true, null, null, null, null, null, null, null, true, true, '["Multi-sede","Roles granulares","Auditoria avanzada","Dashboards ejecutivos"]'::jsonb)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  market_position = excluded.market_position,
  description = excluded.description,
  monthly_price_usd = excluded.monthly_price_usd,
  monthly_price = excluded.monthly_price,
  currency = excluded.currency,
  is_paid = excluded.is_paid,
  is_active = excluded.is_active,
  included_users = excluded.included_users,
  active_patient_limit = excluded.active_patient_limit,
  max_users = excluded.max_users,
  max_patients = excluded.max_patients,
  max_storage_mb = excluded.max_storage_mb,
  branch_limit = excluded.branch_limit,
  enabled_pack_limit = excluded.enabled_pack_limit,
  ai_enabled = excluded.ai_enabled,
  white_label_enabled = excluded.white_label_enabled,
  features = excluded.features,
  updated_at = now();

create table if not exists public.plan_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null references public.subscription_plans(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default true,
  limit_value integer,
  created_at timestamptz not null default now(),
  unique (plan_code, feature_key)
);

create index if not exists idx_plan_entitlements_plan on public.plan_entitlements(plan_code);

with entitlements(plan_code, feature_key, enabled, limit_value) as (
  values
    ('free', 'dashboard.read', true, null),
    ('free', 'patients.read', true, 25),
    ('free', 'patients.manage', true, 25),
    ('free', 'anthropometry.basic', true, null),
    ('free', 'agenda.read', true, 25),
    ('free', 'agenda.manage', true, 25),
    ('free', 'reports.read', true, 5),
    ('free', 'reports.generate', false, 0),
    ('free', 'copilot.read', false, 0),
    ('free', 'users.manage', false, 0),
    ('free', 'audit.read', false, 0),
    ('free', 'enteral.read', false, 0),
    ('free', 'parenteral.read', false, 0),
    ('free', 'sports.read', false, 0),
    ('free', 'pediatric.read', true, null),
    ('courtesy', 'dashboard.read', true, null),
    ('courtesy', 'patients.read', true, 250),
    ('courtesy', 'patients.manage', true, 250),
    ('courtesy', 'labs.read', true, null),
    ('courtesy', 'reports.read', true, 25),
    ('courtesy', 'reports.generate', true, 25),
    ('courtesy', 'copilot.read', true, 100),
    ('courtesy', 'agenda.manage', true, 100),
    ('courtesy', 'nutrition.operational', true, null),
    ('courtesy', 'enteral.read', true, null),
    ('courtesy', 'parenteral.read', true, null),
    ('courtesy', 'sports.read', true, null),
    ('courtesy', 'pediatric.read', true, null),
    ('trial', 'dashboard.read', true, null),
    ('trial', 'patients.read', true, 500),
    ('trial', 'patients.manage', true, 500),
    ('trial', 'labs.read', true, null),
    ('trial', 'reports.generate', true, 50),
    ('trial', 'copilot.read', true, 150),
    ('trial', 'agenda.manage', true, 150),
    ('trial', 'nutrition.operational', true, null),
    ('trial', 'enteral.read', true, null),
    ('trial', 'parenteral.read', true, null),
    ('trial', 'sports.read', true, null),
    ('trial', 'pediatric.read', true, null),
    ('professional', 'dashboard.read', true, null),
    ('professional', 'patients.manage', true, 1500),
    ('professional', 'labs.manage', true, null),
    ('professional', 'reports.generate', true, 250),
    ('professional', 'copilot.read', true, 1000),
    ('professional', 'agenda.manage', true, null),
    ('professional', 'nutrition.operational', true, null),
    ('professional', 'users.manage', true, 12),
    ('professional', 'audit.read', true, null),
    ('clinic', 'dashboard.read', true, null),
    ('clinic', 'patients.manage', true, 800),
    ('clinic', 'reports.generate', true, 120),
    ('clinic', 'agenda.manage', true, null),
    ('clinic', 'nutrition.operational', true, null),
    ('clinic', 'copilot.read', true, 300),
    ('hospital', 'dashboard.read', true, null),
    ('hospital', 'patients.manage', true, 5000),
    ('hospital', 'labs.manage', true, null),
    ('hospital', 'reports.generate', true, 500),
    ('hospital', 'copilot.read', true, 2000),
    ('hospital', 'agenda.manage', true, null),
    ('hospital', 'nutrition.operational', true, null),
    ('hospital', 'enteral.manage', true, null),
    ('hospital', 'parenteral.manage', true, null),
    ('hospital', 'users.manage', true, 40),
    ('hospital', 'audit.read', true, null),
    ('enterprise', 'dashboard.read', true, null),
    ('enterprise', 'patients.manage', true, null),
    ('enterprise', 'labs.manage', true, null),
    ('enterprise', 'reports.generate', true, null),
    ('enterprise', 'copilot.read', true, null),
    ('enterprise', 'agenda.manage', true, null),
    ('enterprise', 'nutrition.operational', true, null),
    ('enterprise', 'enteral.manage', true, null),
    ('enterprise', 'parenteral.manage', true, null),
    ('enterprise', 'sports.read', true, null),
    ('enterprise', 'pediatric.read', true, null),
    ('enterprise', 'users.manage', true, null),
    ('enterprise', 'audit.read', true, null),
    ('enterprise', 'saas.manage', false, 0)
)
insert into public.plan_entitlements (plan_code, feature_key, enabled, limit_value)
select plan_code, feature_key, enabled, limit_value
from entitlements
on conflict (plan_code, feature_key) do update set
  enabled = excluded.enabled,
  limit_value = excluded.limit_value;

alter table public.tenant_subscriptions
  add column if not exists plan_code text,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists courtesy_ends_at timestamptz,
  add column if not exists payment_provider text,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists granted_by uuid references auth.users(id),
  add column if not exists notes text;

update public.tenant_subscriptions
set plan_code = coalesce(plan_code, plan_id),
    starts_at = coalesce(starts_at, current_period_start, created_at)
where plan_code is null
   or starts_at is null;

create index if not exists idx_tenant_subscriptions_tenant_status
  on public.tenant_subscriptions(tenant_id, status);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  subscription_id uuid references public.tenant_subscriptions(id) on delete set null,
  event_type text not null,
  actor_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscription_events_tenant_created
  on public.subscription_events(tenant_id, created_at desc);

alter table public.plan_entitlements enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "plan entitlements readable" on public.plan_entitlements;
create policy "plan entitlements readable"
on public.plan_entitlements
for select
to anon, authenticated
using (true);

drop policy if exists "plan entitlements platform manage" on public.plan_entitlements;
create policy "plan entitlements platform manage"
on public.plan_entitlements
for all
to authenticated
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

drop policy if exists "tenant subscriptions publicly readable" on public.tenant_subscriptions;
drop policy if exists "tenant subscriptions isolated" on public.tenant_subscriptions;
drop policy if exists "tenant subscriptions own read" on public.tenant_subscriptions;
create policy "tenant subscriptions own read"
on public.tenant_subscriptions
for select
to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant subscriptions platform manage" on public.tenant_subscriptions;
create policy "tenant subscriptions platform manage"
on public.tenant_subscriptions
for all
to authenticated
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

drop policy if exists "subscription events own read" on public.subscription_events;
create policy "subscription events own read"
on public.subscription_events
for select
to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "subscription events platform insert" on public.subscription_events;
create policy "subscription events platform insert"
on public.subscription_events
for insert
to authenticated
with check (public.is_platform_superadmin());

alter table public.tenant_membership_grants
  drop constraint if exists tenant_membership_grants_plan_code_check;

alter table public.tenant_membership_grants
  add constraint tenant_membership_grants_plan_code_check
  check (plan_code in ('free', 'courtesy', 'trial', 'professional', 'clinic', 'hospital', 'enterprise', 'paid', 'internal'));

create or replace function public.admin_list_tenant_subscriptions(p_status text default null)
returns table (
  subscription_id uuid,
  tenant_id uuid,
  tenant_name text,
  plan_code text,
  plan_name text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  trial_ends_at timestamptz,
  courtesy_ends_at timestamptz,
  payment_provider text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  return query
  select
    ts.id,
    ts.tenant_id,
    t.name,
    coalesce(ts.plan_code, ts.plan_id),
    sp.name,
    ts.status,
    coalesce(ts.starts_at, ts.current_period_start, ts.created_at),
    ts.ends_at,
    ts.trial_ends_at,
    ts.courtesy_ends_at,
    ts.payment_provider,
    ts.notes,
    ts.created_at,
    ts.updated_at
  from public.tenant_subscriptions ts
  join public.tenants t on t.id = ts.tenant_id
  left join public.subscription_plans sp on sp.id = coalesce(ts.plan_code, ts.plan_id)
  where p_status is null or p_status = 'all' or ts.status = p_status
  order by ts.updated_at desc, ts.created_at desc;
end;
$$;

create or replace function public.admin_assign_tenant_plan(
  p_tenant_id uuid,
  p_plan_code text,
  p_status text default 'active',
  p_ends_at timestamptz default null,
  p_notes text default null
)
returns table (
  subscription_id uuid,
  tenant_id uuid,
  plan_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_subscription_id uuid;
  v_status text := coalesce(nullif(trim(p_status), ''), 'active');
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_tenant_id is null or nullif(trim(p_plan_code), '') is null then
    raise exception 'Tenant y plan son obligatorios.';
  end if;

  if not exists (select 1 from public.subscription_plans where id = trim(p_plan_code) and is_active) then
    raise exception 'Plan no encontrado o inactivo.';
  end if;

  if v_status not in ('active', 'trialing', 'courtesy', 'past_due', 'cancelled', 'expired') then
    raise exception 'Estado de suscripcion invalido.';
  end if;

  select id into v_subscription_id
  from public.tenant_subscriptions
  where tenant_id = p_tenant_id
  order by created_at desc
  limit 1
  for update;

  if v_subscription_id is null then
    insert into public.tenant_subscriptions (
      tenant_id,
      plan_id,
      plan_code,
      status,
      starts_at,
      current_period_start,
      current_period_end,
      ends_at,
      trial_ends_at,
      courtesy_ends_at,
      payment_provider,
      granted_by,
      notes
    )
    values (
      p_tenant_id,
      trim(p_plan_code),
      trim(p_plan_code),
      v_status,
      now(),
      now(),
      p_ends_at,
      p_ends_at,
      case when v_status = 'trialing' then p_ends_at else null end,
      case when v_status = 'courtesy' then p_ends_at else null end,
      'none',
      v_actor,
      nullif(trim(coalesce(p_notes, '')), '')
    )
    returning id into v_subscription_id;
  else
    update public.tenant_subscriptions
    set plan_id = trim(p_plan_code),
        plan_code = trim(p_plan_code),
        status = v_status,
        starts_at = coalesce(starts_at, now()),
        current_period_start = coalesce(current_period_start, now()),
        current_period_end = p_ends_at,
        ends_at = p_ends_at,
        trial_ends_at = case when v_status = 'trialing' then p_ends_at else trial_ends_at end,
        courtesy_ends_at = case when v_status = 'courtesy' then p_ends_at else courtesy_ends_at end,
        payment_provider = coalesce(payment_provider, 'none'),
        granted_by = v_actor,
        notes = nullif(trim(coalesce(p_notes, '')), ''),
        updated_at = now()
    where id = v_subscription_id;
  end if;

  update public.tenants
  set plan_id = trim(p_plan_code),
      status = case
        when v_status in ('active', 'courtesy') then 'active'
        when v_status = 'trialing' then 'trial'
        when v_status = 'past_due' then 'past_due'
        when v_status in ('cancelled', 'expired') then 'suspended'
        else status
      end,
      updated_at = now()
  where id = p_tenant_id;

  insert into public.subscription_events (tenant_id, subscription_id, event_type, actor_id, metadata)
  values (
    p_tenant_id,
    v_subscription_id,
    'subscription.assigned',
    v_actor,
    jsonb_build_object('plan_code', trim(p_plan_code), 'status', v_status, 'ends_at', p_ends_at)
  );

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    p_tenant_id,
    v_actor,
    'subscription.assigned',
    'tenant_subscription',
    v_subscription_id,
    jsonb_build_object('plan_code', trim(p_plan_code), 'status', v_status, 'ends_at', p_ends_at)
  );

  return query
  select v_subscription_id, p_tenant_id, trim(p_plan_code), v_status;
end;
$$;

create or replace function public.admin_grant_courtesy_subscription(
  p_tenant_id uuid,
  p_ends_at timestamptz,
  p_notes text default null
)
returns table (
  subscription_id uuid,
  tenant_id uuid,
  plan_code text,
  status text,
  courtesy_ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result record;
begin
  if p_ends_at is null or p_ends_at <= now() then
    raise exception 'La cortesia requiere una fecha futura.';
  end if;

  select * into v_result
  from public.admin_assign_tenant_plan(p_tenant_id, 'courtesy', 'courtesy', p_ends_at, p_notes)
  limit 1;

  insert into public.subscription_events (tenant_id, subscription_id, event_type, actor_id, metadata)
  values (
    p_tenant_id,
    v_result.subscription_id,
    'courtesy.granted',
    auth.uid(),
    jsonb_build_object('courtesy_ends_at', p_ends_at)
  );

  return query
  select v_result.subscription_id::uuid, p_tenant_id, 'courtesy'::text, 'courtesy'::text, p_ends_at;
end;
$$;

create or replace function public.admin_extend_courtesy_subscription(
  p_subscription_id uuid,
  p_ends_at timestamptz,
  p_notes text default null
)
returns table (
  subscription_id uuid,
  status text,
  courtesy_ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_subscription public.tenant_subscriptions%rowtype;
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_ends_at is null or p_ends_at <= now() then
    raise exception 'La extension requiere una fecha futura.';
  end if;

  select * into v_subscription
  from public.tenant_subscriptions
  where id = p_subscription_id
  for update;

  if v_subscription.id is null then
    raise exception 'Suscripcion no encontrada.';
  end if;

  update public.tenant_subscriptions
  set plan_id = 'courtesy',
      plan_code = 'courtesy',
      status = 'courtesy',
      courtesy_ends_at = p_ends_at,
      ends_at = p_ends_at,
      current_period_end = p_ends_at,
      notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes),
      updated_at = now()
  where id = p_subscription_id;

  insert into public.subscription_events (tenant_id, subscription_id, event_type, actor_id, metadata)
  values (
    v_subscription.tenant_id,
    p_subscription_id,
    'courtesy.extended',
    v_actor,
    jsonb_build_object('courtesy_ends_at', p_ends_at)
  );

  return query
  select p_subscription_id, 'courtesy'::text, p_ends_at;
end;
$$;

create or replace function public.admin_cancel_courtesy_subscription(
  p_subscription_id uuid,
  p_notes text default null
)
returns table (
  subscription_id uuid,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_subscription public.tenant_subscriptions%rowtype;
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  select * into v_subscription
  from public.tenant_subscriptions
  where id = p_subscription_id
  for update;

  if v_subscription.id is null then
    raise exception 'Suscripcion no encontrada.';
  end if;

  update public.tenant_subscriptions
  set plan_id = 'free',
      plan_code = 'free',
      status = 'active',
      courtesy_ends_at = v_now,
      ends_at = null,
      current_period_end = null,
      notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes),
      updated_at = v_now
  where id = p_subscription_id;

  update public.tenants
  set plan_id = 'free',
      status = 'active',
      updated_at = v_now
  where id = v_subscription.tenant_id;

  insert into public.subscription_events (tenant_id, subscription_id, event_type, actor_id, metadata)
  values (
    v_subscription.tenant_id,
    p_subscription_id,
    'courtesy.cancelled',
    v_actor,
    jsonb_build_object('fallback_plan', 'free', 'reason_set', p_notes is not null)
  );

  return query
  select p_subscription_id, 'active'::text, v_now;
end;
$$;

create or replace function public.admin_list_subscription_events(
  p_tenant_id uuid default null
)
returns table (
  event_id uuid,
  tenant_id uuid,
  tenant_name text,
  subscription_id uuid,
  event_type text,
  actor_id uuid,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  return query
  select
    se.id,
    se.tenant_id,
    t.name,
    se.subscription_id,
    se.event_type,
    se.actor_id,
    se.metadata,
    se.created_at
  from public.subscription_events se
  join public.tenants t on t.id = se.tenant_id
  where p_tenant_id is null or se.tenant_id = p_tenant_id
  order by se.created_at desc
  limit 200;
end;
$$;

create or replace function public.admin_approve_access_request(
  p_request_id uuid,
  p_tenant_id uuid,
  p_role_code text,
  p_plan_code text default 'courtesy',
  p_ends_at timestamptz default null,
  p_review_note text default null
)
returns table (
  request_id uuid,
  membership_id uuid,
  grant_id uuid,
  tenant_id uuid,
  user_id uuid,
  email text,
  role_code text,
  plan_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.access_requests%rowtype;
  v_user auth.users%rowtype;
  v_role_id uuid;
  v_membership_id uuid;
  v_grant_id uuid;
  v_profile_name text;
  v_initials text;
  v_subscription record;
  v_subscription_status text;
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_tenant_id is null or nullif(trim(p_role_code), '') is null then
    raise exception 'Tenant y rol son obligatorios.';
  end if;

  if not exists (select 1 from public.subscription_plans where id = trim(p_plan_code) and is_active) then
    raise exception 'Plan no encontrado o inactivo.';
  end if;

  select * into v_request
  from public.access_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Solicitud no encontrada.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'La solicitud ya fue revisada.';
  end if;

  select * into v_user
  from auth.users au
  where au.id = v_request.user_id
     or lower(au.email) = lower(v_request.email)
  limit 1;

  if v_user.id is null then
    raise exception 'El usuario debe existir en Supabase Auth antes de aprobar.';
  end if;

  select id into v_role_id
  from public.roles
  where code = trim(p_role_code)
    and (tenant_id is null or tenant_id = p_tenant_id)
  order by (tenant_id is null) asc
  limit 1;

  if v_role_id is null then
    raise exception 'Rol no encontrado.';
  end if;

  v_profile_name := coalesce(nullif(trim(v_request.full_name), ''), v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', v_user.email, 'Usuario');
  v_initials := upper(left(split_part(v_profile_name, ' ', 1), 1) || left(split_part(v_profile_name, ' ', 2), 1));
  v_initials := coalesce(nullif(v_initials, ''), upper(left(coalesce(v_user.email, 'US'), 2)));

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (
    v_user.id,
    v_profile_name,
    coalesce(v_user.email, v_request.email),
    v_initials,
    nullif(trim(coalesce(v_request.job_title, '')), '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    initials = excluded.initials,
    title = coalesce(excluded.title, public.user_profiles.title),
    updated_at = now();

  insert into public.tenant_memberships (tenant_id, user_id, status, title, invited_by)
  values (p_tenant_id, v_user.id, 'active', nullif(trim(coalesce(v_request.job_title, '')), ''), v_actor)
  on conflict (tenant_id, user_id) do update set
    status = 'active',
    title = coalesce(excluded.title, public.tenant_memberships.title),
    invited_by = coalesce(public.tenant_memberships.invited_by, excluded.invited_by),
    updated_at = now()
  returning id into v_membership_id;

  delete from public.membership_roles
  where membership_id = v_membership_id;

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_role_id)
  on conflict (membership_id, role_id) do nothing;

  insert into public.tenant_membership_grants (
    tenant_id,
    user_id,
    membership_id,
    plan_code,
    status,
    ends_at,
    granted_by,
    grant_reason
  )
  values (
    p_tenant_id,
    v_user.id,
    v_membership_id,
    trim(p_plan_code),
    'active',
    p_ends_at,
    v_actor,
    nullif(trim(coalesce(p_review_note, '')), '')
  )
  returning id into v_grant_id;

  v_subscription_status := case
    when trim(p_plan_code) = 'courtesy' then 'courtesy'
    when trim(p_plan_code) = 'trial' then 'trialing'
    when trim(p_plan_code) = 'free' then 'active'
    else 'active'
  end;

  select * into v_subscription
  from public.admin_assign_tenant_plan(p_tenant_id, trim(p_plan_code), v_subscription_status, p_ends_at, p_review_note)
  limit 1;

  update public.access_requests
  set status = 'approved',
      requested_tenant_id = p_tenant_id,
      reviewed_by = v_actor,
      reviewed_at = now(),
      review_note = nullif(trim(coalesce(p_review_note, '')), ''),
      updated_at = now()
  where id = p_request_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values
    (
      p_tenant_id,
      v_actor,
      'user.approved',
      'access_request',
      p_request_id,
      jsonb_build_object('email', v_request.email, 'role_code', p_role_code, 'plan_code', p_plan_code)
    ),
    (
      p_tenant_id,
      v_actor,
      'membership.granted',
      'tenant_membership',
      v_membership_id,
      jsonb_build_object('email', v_request.email, 'grant_id', v_grant_id, 'plan_code', p_plan_code)
    ),
    (
      p_tenant_id,
      v_actor,
      'subscription.granted',
      'tenant_subscription',
      v_subscription.subscription_id,
      jsonb_build_object('email', v_request.email, 'plan_code', p_plan_code, 'status', v_subscription_status)
    );

  return query
  select
    p_request_id,
    v_membership_id,
    v_grant_id,
    p_tenant_id,
    v_user.id,
    coalesce(v_user.email, v_request.email),
    trim(p_role_code),
    trim(p_plan_code),
    'approved'::text;
end;
$$;

revoke all on function public.admin_list_tenant_subscriptions(text) from public;
revoke all on function public.admin_assign_tenant_plan(uuid, text, text, timestamptz, text) from public;
revoke all on function public.admin_grant_courtesy_subscription(uuid, timestamptz, text) from public;
revoke all on function public.admin_extend_courtesy_subscription(uuid, timestamptz, text) from public;
revoke all on function public.admin_cancel_courtesy_subscription(uuid, text) from public;
revoke all on function public.admin_list_subscription_events(uuid) from public;
revoke all on function public.admin_approve_access_request(uuid, uuid, text, text, timestamptz, text) from public;

grant execute on function public.admin_list_tenant_subscriptions(text) to authenticated;
grant execute on function public.admin_assign_tenant_plan(uuid, text, text, timestamptz, text) to authenticated;
grant execute on function public.admin_grant_courtesy_subscription(uuid, timestamptz, text) to authenticated;
grant execute on function public.admin_extend_courtesy_subscription(uuid, timestamptz, text) to authenticated;
grant execute on function public.admin_cancel_courtesy_subscription(uuid, text) to authenticated;
grant execute on function public.admin_list_subscription_events(uuid) to authenticated;
grant execute on function public.admin_approve_access_request(uuid, uuid, text, text, timestamptz, text) to authenticated;
