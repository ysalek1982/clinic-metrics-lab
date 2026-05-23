-- Commercial SaaS consolidation: Free, Pro, Clinic/Hospital and time-limited Courtesy.
-- This migration is idempotent and must be applied remotely only with explicit DB credentials.

insert into public.permissions (id, resource, action, scope, description) values
  ('plans.read', 'subscription_plans', 'read', 'platform', 'Leer planes y beneficios SaaS.'),
  ('plans.manage', 'subscription_plans', 'manage', 'platform', 'Gestionar planes y beneficios SaaS.'),
  ('subscriptions.read', 'tenant_subscriptions', 'read', 'tenant', 'Leer estado de suscripcion del tenant.'),
  ('subscriptions.manage', 'tenant_subscriptions', 'manage', 'platform', 'Gestionar suscripciones, trials y cortesias.'),
  ('roles.manage', 'roles', 'manage', 'platform', 'Gestionar roles desde plataforma.'),
  ('permissions.manage', 'permissions', 'manage', 'platform', 'Gestionar permisos desde plataforma.'),
  ('users.read', 'users', 'read', 'platform', 'Leer usuarios desde plataforma.'),
  ('memberships.read', 'memberships', 'read', 'platform', 'Leer memberships desde plataforma.'),
  ('memberships.manage', 'memberships', 'manage', 'platform', 'Gestionar memberships desde plataforma.')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

insert into public.roles (id, tenant_id, code, name, description, level, is_system) values
  ('10000000-0000-4000-8000-000000000008', null, 'free_member', 'Usuario Free', 'Cuenta gratuita sin permisos administrativos.', 'operational', true),
  ('10000000-0000-4000-8000-000000000009', null, 'viewer', 'Visualizador', 'Lectura basica sin administracion.', 'operational', true)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  description = excluded.description,
  level = excluded.level,
  is_system = excluded.is_system,
  updated_at = now();

with role_targets as (
  select r.id as role_id, p.id as permission_id
  from public.roles r
  join public.permissions p on p.id = any(
    case r.code
      when 'free_member' then array[
        'patients.read',
        'patients.create',
        'patients.update',
        'appointments.read',
        'appointments.create'
      ]
      when 'viewer' then array[
        'patients.read',
        'appointments.read'
      ]
      else array[]::text[]
    end
  )
  where r.tenant_id is null
    and r.code in ('free_member', 'viewer')
)
insert into public.role_permissions (role_id, permission_id)
select role_id, permission_id
from role_targets
on conflict (role_id, permission_id) do nothing;

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
    'saas.manage',
    'platform.manage',
    'users.read',
    'users.manage',
    'memberships.read',
    'memberships.manage',
    'roles.manage',
    'permissions.manage',
    'tenants.manage',
    'subscriptions.manage',
    'plans.manage',
    'invites.manage',
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
  (
    'free',
    'free',
    'Free',
    'Cuenta gratuita basica',
    'Cuenta individual de entrada con limites bajos y sin administracion SaaS.',
    0,
    0,
    'BOB',
    false,
    true,
    1,
    25,
    1,
    25,
    256,
    1,
    2,
    false,
    false,
    '["Dashboard basico","Pacientes limitados","Antropometria basica","Agenda basica","Upgrade solicitado"]'::jsonb
  ),
  (
    'pro',
    'pro',
    'Pro',
    'Profesional individual',
    'Acceso funcional completo para nutricionista o profesional individual, sin administracion institucional avanzada.',
    49,
    340,
    'BOB',
    true,
    true,
    3,
    500,
    3,
    500,
    5120,
    1,
    6,
    true,
    false,
    '["Pacientes","Agenda","Labs","Reportes","Copilot contextual","Nutricion operativa","Deportivo","Pediatria"]'::jsonb
  ),
  (
    'clinic_hospital',
    'clinic_hospital',
    'Clinic/Hospital',
    'Institucional multiusuario',
    'Plan institucional para clinicas y hospitales con roles, auditoria y soporte nutricional hospitalario.',
    199,
    1380,
    'BOB',
    true,
    true,
    25,
    5000,
    25,
    5000,
    102400,
    6,
    10,
    true,
    true,
    '["Multiusuario","Roles","Auditoria","Enteral","Parenteral basico","Labs","Alertas","Reportes institucionales"]'::jsonb
  ),
  (
    'courtesy',
    'courtesy',
    'Courtesy',
    'Concesion temporal',
    'Concesion temporal otorgada por plataforma. No es plan comercial principal y requiere fecha de vencimiento.',
    0,
    0,
    'BOB',
    false,
    true,
    25,
    5000,
    25,
    5000,
    102400,
    6,
    10,
    true,
    true,
    '["Acceso temporal","Equivalente operativo configurable","Vencimiento obligatorio","Sin cobro"]'::jsonb
  )
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

update public.subscription_plans
set is_active = false,
    updated_at = now()
where id in ('starter', 'professional', 'clinic', 'hospital', 'enterprise', 'trial', 'hospital_enterprise', 'sports_performance', 'custom');

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
    ('pro', 'dashboard.read', true, null),
    ('pro', 'patients.read', true, 500),
    ('pro', 'patients.manage', true, 500),
    ('pro', 'labs.read', true, null),
    ('pro', 'labs.manage', true, null),
    ('pro', 'reports.read', true, 100),
    ('pro', 'reports.generate', true, 100),
    ('pro', 'copilot.read', true, 300),
    ('pro', 'agenda.manage', true, 150),
    ('pro', 'nutrition.operational', true, null),
    ('pro', 'sports.read', true, null),
    ('pro', 'pediatric.read', true, null),
    ('pro', 'users.manage', false, 0),
    ('pro', 'audit.read', false, 0),
    ('pro', 'enteral.read', true, null),
    ('pro', 'parenteral.read', false, 0),
    ('clinic_hospital', 'dashboard.read', true, null),
    ('clinic_hospital', 'patients.read', true, 5000),
    ('clinic_hospital', 'patients.manage', true, 5000),
    ('clinic_hospital', 'labs.manage', true, null),
    ('clinic_hospital', 'reports.generate', true, 500),
    ('clinic_hospital', 'copilot.read', true, 2000),
    ('clinic_hospital', 'agenda.manage', true, null),
    ('clinic_hospital', 'nutrition.operational', true, null),
    ('clinic_hospital', 'enteral.manage', true, null),
    ('clinic_hospital', 'parenteral.manage', true, null),
    ('clinic_hospital', 'sports.read', true, null),
    ('clinic_hospital', 'pediatric.read', true, null),
    ('clinic_hospital', 'users.manage', true, 25),
    ('clinic_hospital', 'audit.read', true, null),
    ('courtesy', 'dashboard.read', true, null),
    ('courtesy', 'patients.read', true, 5000),
    ('courtesy', 'patients.manage', true, 5000),
    ('courtesy', 'labs.manage', true, null),
    ('courtesy', 'reports.generate', true, 500),
    ('courtesy', 'copilot.read', true, 2000),
    ('courtesy', 'agenda.manage', true, null),
    ('courtesy', 'nutrition.operational', true, null),
    ('courtesy', 'enteral.manage', true, null),
    ('courtesy', 'parenteral.manage', true, null),
    ('courtesy', 'sports.read', true, null),
    ('courtesy', 'pediatric.read', true, null),
    ('courtesy', 'users.manage', true, 25),
    ('courtesy', 'audit.read', true, null)
)
insert into public.plan_entitlements (plan_code, feature_key, enabled, limit_value)
select plan_code, feature_key, enabled, limit_value
from entitlements
on conflict (plan_code, feature_key) do update set
  enabled = excluded.enabled,
  limit_value = excluded.limit_value;

delete from public.plan_entitlements
where plan_code in ('free', 'pro', 'clinic_hospital', 'courtesy')
  and feature_key not in (
    select feature_key
    from (values
      ('free', 'dashboard.read'), ('free', 'patients.read'), ('free', 'patients.manage'), ('free', 'anthropometry.basic'),
      ('free', 'agenda.read'), ('free', 'agenda.manage'), ('free', 'reports.read'), ('free', 'reports.generate'),
      ('free', 'copilot.read'), ('free', 'users.manage'), ('free', 'audit.read'), ('free', 'enteral.read'),
      ('free', 'parenteral.read'), ('free', 'sports.read'), ('free', 'pediatric.read'),
      ('pro', 'dashboard.read'), ('pro', 'patients.read'), ('pro', 'patients.manage'), ('pro', 'labs.read'),
      ('pro', 'labs.manage'), ('pro', 'reports.read'), ('pro', 'reports.generate'), ('pro', 'copilot.read'),
      ('pro', 'agenda.manage'), ('pro', 'nutrition.operational'), ('pro', 'sports.read'), ('pro', 'pediatric.read'),
      ('pro', 'users.manage'), ('pro', 'audit.read'), ('pro', 'enteral.read'), ('pro', 'parenteral.read'),
      ('clinic_hospital', 'dashboard.read'), ('clinic_hospital', 'patients.read'), ('clinic_hospital', 'patients.manage'),
      ('clinic_hospital', 'labs.manage'), ('clinic_hospital', 'reports.generate'), ('clinic_hospital', 'copilot.read'),
      ('clinic_hospital', 'agenda.manage'), ('clinic_hospital', 'nutrition.operational'), ('clinic_hospital', 'enteral.manage'),
      ('clinic_hospital', 'parenteral.manage'), ('clinic_hospital', 'sports.read'), ('clinic_hospital', 'pediatric.read'),
      ('clinic_hospital', 'users.manage'), ('clinic_hospital', 'audit.read'),
      ('courtesy', 'dashboard.read'), ('courtesy', 'patients.read'), ('courtesy', 'patients.manage'), ('courtesy', 'labs.manage'),
      ('courtesy', 'reports.generate'), ('courtesy', 'copilot.read'), ('courtesy', 'agenda.manage'), ('courtesy', 'nutrition.operational'),
      ('courtesy', 'enteral.manage'), ('courtesy', 'parenteral.manage'), ('courtesy', 'sports.read'), ('courtesy', 'pediatric.read'),
      ('courtesy', 'users.manage'), ('courtesy', 'audit.read')
    ) as allowed(plan_code, feature_key)
    where allowed.plan_code = public.plan_entitlements.plan_code
  );

alter table public.tenant_membership_grants
  drop constraint if exists tenant_membership_grants_plan_code_check;

alter table public.tenant_membership_grants
  add constraint tenant_membership_grants_plan_code_check
  check (plan_code in ('free', 'courtesy', 'pro', 'clinic_hospital', 'trial', 'professional', 'clinic', 'hospital', 'enterprise', 'paid', 'internal'));

create or replace function public.ensure_free_subscription_for_current_user(
  p_full_name text default null,
  p_title text default null
)
returns table (
  tenant_id uuid,
  tenant_slug text,
  tenant_name text,
  membership_id uuid,
  plan_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_name text;
  v_initials text;
  v_slug text;
  v_tenant_id uuid;
  v_tenant_name text;
  v_membership_id uuid;
  v_role_id uuid;
  v_subscription_id uuid;
  v_org_id uuid;
  v_branch_id uuid;
  v_department_id uuid;
begin
  if v_user_id is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  if nullif(v_email, '') is null then
    raise exception 'El usuario autenticado no tiene email.';
  end if;

  v_name := coalesce(nullif(trim(p_full_name), ''), split_part(v_email, '@', 1), 'Usuario Free');
  v_initials := upper(left(split_part(v_name, ' ', 1), 1) || left(split_part(v_name, ' ', 2), 1));
  v_initials := coalesce(nullif(v_initials, ''), upper(left(v_email, 2)));

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (v_user_id, v_name, lower(v_email), v_initials, nullif(trim(coalesce(p_title, '')), ''))
  on conflict (id) do update set
    full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
    email = excluded.email,
    initials = coalesce(nullif(public.user_profiles.initials, ''), excluded.initials),
    title = coalesce(nullif(trim(coalesce(excluded.title, '')), ''), public.user_profiles.title),
    updated_at = now();

  select tm.tenant_id, tm.id
  into v_tenant_id, v_membership_id
  from public.tenant_memberships tm
  where tm.user_id = v_user_id
    and tm.status = 'active'
  order by tm.created_at asc
  limit 1;

  if v_tenant_id is null then
    v_slug := 'free-' || left(replace(v_user_id::text, '-', ''), 12);
    v_tenant_name := 'Cuenta Free ' || split_part(v_email, '@', 1);

    insert into public.tenants (slug, name, status, plan_id, institution_type, region)
    values (v_slug, v_tenant_name, 'active', 'free', 'private_clinic', 'LatAm')
    on conflict (slug) do update set
      name = excluded.name,
      status = 'active',
      plan_id = 'free',
      updated_at = now()
    returning id, name into v_tenant_id, v_tenant_name;

    insert into public.tenant_settings (tenant_id, language, timezone, unit_system, default_follow_up_days, strict_formula_versioning, ai_assist_enabled, require_plan_approval)
    values (v_tenant_id, 'es', 'America/La_Paz', 'metric', 14, true, false, true)
    on conflict (tenant_id) do nothing;

    insert into public.branding_settings (tenant_id, commercial_name, logo_initials, primary_color, accent_color)
    values (v_tenant_id, v_tenant_name, 'FR', '#13c8df', '#a6e13a')
    on conflict (tenant_id) do nothing;

    insert into public.organizations (tenant_id, name, type, status)
    values (v_tenant_id, v_tenant_name, 'private_clinic', 'active')
    on conflict (tenant_id, name) do update set
      status = 'active',
      updated_at = now()
    returning id into v_org_id;

    insert into public.branches (tenant_id, organization_id, name, city, timezone, status)
    values (v_tenant_id, v_org_id, 'Sede principal', 'La Paz', 'America/La_Paz', 'active')
    returning id into v_branch_id;

    insert into public.departments (tenant_id, organization_id, branch_id, name, clinical_area)
    values (v_tenant_id, v_org_id, v_branch_id, 'Consulta nutricional', 'Ambulatorio')
    returning id into v_department_id;

    insert into public.services (tenant_id, department_id, name, default_pack_id, care_setting)
    values (v_tenant_id, v_department_id, 'Consulta nutricional', 'clinical', 'outpatient');

    insert into public.tenant_enabled_packs (tenant_id, pack_id, enabled, config)
    select v_tenant_id, sp.id, true, '{}'::jsonb
    from public.specialty_packs sp
    where sp.id in ('clinical')
    on conflict (tenant_id, pack_id) do nothing;

    select id into v_role_id
    from public.roles
    where tenant_id is null
      and code = 'free_member'
    limit 1;

    if v_role_id is null then
      select id into v_role_id
      from public.roles
      where tenant_id is null
        and code = 'clinical_nutritionist'
      limit 1;
    end if;

    insert into public.tenant_memberships (tenant_id, user_id, status, title)
    values (v_tenant_id, v_user_id, 'active', coalesce(nullif(trim(coalesce(p_title, '')), ''), 'Cuenta Free'))
    on conflict (tenant_id, user_id) do update set
      status = 'active',
      title = coalesce(public.tenant_memberships.title, excluded.title),
      updated_at = now()
    returning id into v_membership_id;

    if v_role_id is not null then
      insert into public.membership_roles (membership_id, role_id)
      values (v_membership_id, v_role_id)
      on conflict (membership_id, role_id) do nothing;
    end if;
  else
    select name into v_tenant_name
    from public.tenants
    where id = v_tenant_id;
  end if;

  select id into v_subscription_id
  from public.tenant_subscriptions
  where tenant_id = v_tenant_id
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
      payment_provider,
      granted_by,
      notes
    )
    values (
      v_tenant_id,
      'free',
      'free',
      'active',
      now(),
      now(),
      'none',
      v_user_id,
      'auto-free-default'
    )
    returning id into v_subscription_id;
  else
    update public.tenant_subscriptions
    set plan_id = case when status in ('expired', 'cancelled') then 'free' else plan_id end,
        plan_code = case when status in ('expired', 'cancelled') then 'free' else coalesce(plan_code, plan_id, 'free') end,
        status = case when status in ('expired', 'cancelled') then 'active' else status end,
        starts_at = coalesce(starts_at, current_period_start, created_at, now()),
        current_period_start = coalesce(current_period_start, starts_at, created_at, now()),
        payment_provider = coalesce(payment_provider, 'none'),
        updated_at = now()
    where id = v_subscription_id;
  end if;

  update public.tenants
  set plan_id = coalesce(plan_id, 'free'),
      status = case when status = 'suspended' then 'active' else status end,
      updated_at = now()
  where id = v_tenant_id;

  insert into public.subscription_events (tenant_id, subscription_id, event_type, actor_id, metadata)
  values (
    v_tenant_id,
    v_subscription_id,
    'free_subscription.ensured',
    v_user_id,
    jsonb_build_object('source', 'ensure_free_subscription_for_current_user')
  );

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    v_tenant_id,
    v_user_id,
    'free_subscription.ensured',
    'tenant_subscription',
    v_subscription_id,
    jsonb_build_object('plan_code', 'free')
  );

  return query
  select
    t.id,
    t.slug,
    t.name,
    v_membership_id,
    coalesce(ts.plan_code, ts.plan_id, 'free'),
    ts.status
  from public.tenants t
  join public.tenant_subscriptions ts on ts.id = v_subscription_id
  where t.id = v_tenant_id;
end;
$$;

revoke all on function public.ensure_free_subscription_for_current_user(text, text) from public;
grant execute on function public.ensure_free_subscription_for_current_user(text, text) to authenticated;

create or replace function public.admin_create_invite_code(
  p_tenant_id uuid,
  p_code text,
  p_role_code text,
  p_plan_code text default 'free',
  p_max_uses integer default 1,
  p_expires_at timestamptz default null
)
returns table (
  invite_id uuid,
  tenant_id uuid,
  invite_code text,
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
  v_invite_id uuid;
  v_code text := upper(trim(p_code));
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_tenant_id is null or nullif(v_code, '') is null or nullif(trim(p_role_code), '') is null then
    raise exception 'Tenant, codigo y rol son obligatorios.';
  end if;

  if not exists (select 1 from public.subscription_plans where id = trim(p_plan_code) and is_active) then
    raise exception 'Plan no encontrado o inactivo.';
  end if;

  if p_max_uses is not null and p_max_uses < 1 then
    raise exception 'max_uses debe ser mayor a cero.';
  end if;

  if not exists (
    select 1
    from public.roles
    where code = trim(p_role_code)
      and (tenant_id is null or tenant_id = p_tenant_id)
  ) then
    raise exception 'Rol no encontrado.';
  end if;

  insert into public.tenant_invites (
    tenant_id,
    email,
    invite_code,
    role_code,
    status,
    expires_at,
    plan_code,
    max_uses,
    used_count,
    is_active,
    created_by
  )
  values (
    p_tenant_id,
    null,
    v_code,
    trim(p_role_code),
    'active',
    p_expires_at,
    trim(p_plan_code),
    p_max_uses,
    0,
    true,
    v_actor
  )
  on conflict (invite_code) do update set
    tenant_id = excluded.tenant_id,
    role_code = excluded.role_code,
    status = 'active',
    expires_at = excluded.expires_at,
    plan_code = excluded.plan_code,
    max_uses = excluded.max_uses,
    is_active = true,
    updated_at = now()
  returning id into v_invite_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    p_tenant_id,
    v_actor,
    'invite.created',
    'tenant_invite',
    v_invite_id,
    jsonb_build_object('role_code', p_role_code, 'plan_code', p_plan_code, 'max_uses', p_max_uses)
  );

  return query
  select v_invite_id, p_tenant_id, v_code, trim(p_role_code), trim(p_plan_code), 'active'::text;
end;
$$;

create or replace function public.admin_grant_courtesy_membership(
  p_tenant_id uuid,
  p_user_email text,
  p_role_code text default 'clinical_nutritionist',
  p_plan_code text default 'courtesy',
  p_ends_at timestamptz default null,
  p_grant_reason text default null
)
returns table (
  grant_id uuid,
  membership_id uuid,
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
  v_user auth.users%rowtype;
  v_role_id uuid;
  v_membership_id uuid;
  v_grant_id uuid;
  v_profile_name text;
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_tenant_id is null or nullif(trim(p_user_email), '') is null then
    raise exception 'Tenant y email son obligatorios.';
  end if;

  if not exists (select 1 from public.subscription_plans where id = trim(p_plan_code) and is_active) then
    raise exception 'Plan no encontrado o inactivo.';
  end if;

  if trim(p_plan_code) = 'courtesy' and (p_ends_at is null or p_ends_at <= now()) then
    raise exception 'La cortesia requiere una fecha futura.';
  end if;

  select * into v_user
  from auth.users au
  where lower(au.email) = lower(trim(p_user_email))
  limit 1;

  if v_user.id is null then
    raise exception 'El usuario debe existir en Supabase Auth antes de asignar membresia.';
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

  v_profile_name := coalesce(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', v_user.email, 'Usuario');

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (
    v_user.id,
    v_profile_name,
    coalesce(v_user.email, lower(trim(p_user_email))),
    upper(left(v_profile_name, 2)),
    null
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
    initials = coalesce(nullif(public.user_profiles.initials, ''), excluded.initials),
    updated_at = now();

  insert into public.tenant_memberships (tenant_id, user_id, status, invited_by)
  values (p_tenant_id, v_user.id, 'active', v_actor)
  on conflict (tenant_id, user_id) do update set
    status = 'active',
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
    nullif(trim(coalesce(p_grant_reason, '')), '')
  )
  returning id into v_grant_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    p_tenant_id,
    v_actor,
    'membership.granted',
    'tenant_membership',
    v_membership_id,
    jsonb_build_object('email', coalesce(v_user.email, p_user_email), 'grant_id', v_grant_id, 'plan_code', p_plan_code)
  );

  return query
  select v_grant_id, v_membership_id, p_tenant_id, v_user.id, coalesce(v_user.email, p_user_email), trim(p_role_code), trim(p_plan_code), 'active'::text;
end;
$$;

create or replace function public.redeem_tenant_invite(
  p_invite_code text,
  p_full_name text,
  p_title text default null
)
returns table (
  tenant_id uuid,
  tenant_slug text,
  tenant_name text,
  membership_id uuid,
  role_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invite public.tenant_invites%rowtype;
  v_membership_id uuid;
  v_role_id uuid;
  v_initials text;
  v_next_used_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email into v_user_email
  from auth.users
  where id = v_user_id;

  select *
  into v_invite
  from public.tenant_invites
  where invite_code = upper(trim(p_invite_code))
    and status = 'active'
    and coalesce(is_active, true)
    and (expires_at is null or expires_at > now())
    and (max_uses is null or coalesce(used_count, 0) < max_uses)
  limit 1;

  if v_invite.id is null then
    raise exception 'Invite code is invalid or expired';
  end if;

  if v_invite.email is not null and lower(v_invite.email) <> lower(coalesce(v_user_email, '')) then
    raise exception 'Invite email does not match authenticated user';
  end if;

  v_initials := upper(left(split_part(trim(p_full_name), ' ', 1), 1) || left(split_part(trim(p_full_name), ' ', 2), 1));
  v_initials := coalesce(nullif(v_initials, ''), upper(left(coalesce(v_user_email, 'U'), 2)));

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (v_user_id, p_full_name, coalesce(v_user_email, ''), v_initials, p_title)
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    initials = excluded.initials,
    title = coalesce(excluded.title, public.user_profiles.title),
    updated_at = now();

  insert into public.tenant_memberships (tenant_id, user_id, status, title)
  values (v_invite.tenant_id, v_user_id, 'active', p_title)
  on conflict (tenant_id, user_id) do update set
    status = 'active',
    title = coalesce(excluded.title, public.tenant_memberships.title),
    updated_at = now()
  returning id into v_membership_id;

  if v_membership_id is null then
    select id into v_membership_id
    from public.tenant_memberships
    where tenant_id = v_invite.tenant_id
      and user_id = v_user_id
    limit 1;
  end if;

  select id into v_role_id
  from public.roles
  where tenant_id is null
    and code = v_invite.role_code
  limit 1;

  if v_role_id is null then
    raise exception 'Role code % not found', v_invite.role_code;
  end if;

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_role_id)
  on conflict (membership_id, role_id) do nothing;

  if v_invite.plan_code in ('free', 'courtesy', 'pro', 'clinic_hospital', 'trial', 'professional', 'clinic', 'hospital', 'enterprise', 'paid', 'internal') then
    insert into public.tenant_membership_grants (
      tenant_id,
      user_id,
      membership_id,
      plan_code,
      status,
      granted_by,
      grant_reason
    )
    values (
      v_invite.tenant_id,
      v_user_id,
      v_membership_id,
      v_invite.plan_code,
      'active',
      coalesce(v_invite.created_by, v_user_id),
      'redeem_tenant_invite'
    );
  end if;

  v_next_used_count := coalesce(v_invite.used_count, 0) + 1;

  update public.tenant_invites
  set status = case
        when v_invite.max_uses is null or v_next_used_count < v_invite.max_uses then 'active'
        else 'redeemed'
      end,
      used_count = v_next_used_count,
      redeemed_by = v_user_id,
      redeemed_at = now(),
      updated_at = now()
  where id = v_invite.id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    v_invite.tenant_id,
    v_user_id,
    'invite.redeemed',
    'tenant_invite',
    v_invite.id,
    jsonb_build_object('membership_id', v_membership_id, 'role_code', v_invite.role_code, 'plan_code', v_invite.plan_code)
  );

  return query
  select t.id, t.slug, t.name, v_membership_id, v_invite.role_code
  from public.tenants t
  where t.id = v_invite.tenant_id;
end;
$$;

revoke all on function public.admin_create_invite_code(uuid, text, text, text, integer, timestamptz) from public;
revoke all on function public.admin_grant_courtesy_membership(uuid, text, text, text, timestamptz, text) from public;
revoke all on function public.redeem_tenant_invite(text, text, text) from public;

grant execute on function public.admin_create_invite_code(uuid, text, text, text, integer, timestamptz) to authenticated;
grant execute on function public.admin_grant_courtesy_membership(uuid, text, text, text, timestamptz, text) to authenticated;
grant execute on function public.redeem_tenant_invite(text, text, text) to authenticated;

do $$
declare
  v_user_id uuid;
  v_tenant_id uuid := '11111111-1111-4111-8111-111111111111';
  v_role_id uuid;
  v_membership_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = 'ysalek@gmail.com'
  limit 1;

  if v_user_id is not null then
    select id into v_role_id
    from public.roles
    where tenant_id is null
      and code = 'platform_superadmin'
    limit 1;

    insert into public.user_profiles (id, full_name, email, initials, title)
    values (v_user_id, 'Ysalek', 'ysalek@gmail.com', 'YS', 'Administrador SaaS')
    on conflict (id) do update set
      email = excluded.email,
      full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
      initials = coalesce(nullif(public.user_profiles.initials, ''), excluded.initials),
      title = coalesce(public.user_profiles.title, excluded.title),
      updated_at = now();

    insert into public.tenant_memberships (tenant_id, user_id, status, title)
    values (v_tenant_id, v_user_id, 'active', 'Administrador SaaS')
    on conflict (tenant_id, user_id) do update set
      status = 'active',
      title = coalesce(public.tenant_memberships.title, excluded.title),
      updated_at = now()
    returning id into v_membership_id;

    if v_role_id is not null then
      insert into public.membership_roles (membership_id, role_id)
      values (v_membership_id, v_role_id)
      on conflict (membership_id, role_id) do nothing;
    end if;

    insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
    values (
      v_tenant_id,
      null,
      'platform_admin.ensure',
      'tenant_membership',
      v_membership_id,
      jsonb_build_object('email', 'ysalek@gmail.com', 'role', 'platform_superadmin', 'source', 'commercial_saas_consolidation')
    );
  end if;
end;
$$;
