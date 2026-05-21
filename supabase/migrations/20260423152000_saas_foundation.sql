create extension if not exists pgcrypto;

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  market_position text not null,
  monthly_price_usd numeric(10,2),
  included_users integer,
  active_patient_limit integer,
  branch_limit integer,
  enabled_pack_limit integer,
  ai_enabled boolean not null default false,
  white_label_enabled boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'suspended')),
  plan_id text not null references public.subscription_plans(id),
  institution_type text not null,
  region text not null default 'LatAm',
  trial_ends_at timestamptz,
  renewal_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  billing_customer_ref text,
  billing_subscription_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_usage_limits (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  users_limit integer,
  branches_limit integer,
  active_patients_limit integer,
  enabled_packs_limit integer,
  monthly_reports_limit integer,
  ai_events_limit integer,
  storage_gb_limit integer,
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_usage_counters (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  users_count integer not null default 0,
  branches_count integer not null default 0,
  active_patients_count integer not null default 0,
  enabled_packs_count integer not null default 0,
  monthly_reports_count integer not null default 0,
  ai_events_count integer not null default 0,
  storage_gb numeric(10,2) not null default 0,
  period_start date not null default date_trunc('month', now())::date,
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  type text not null,
  legal_name text,
  tax_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  city text,
  timezone text not null default 'America/La_Paz',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  clinical_area text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  name text not null,
  default_pack_id text,
  care_setting text not null default 'mixed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  language text not null default 'es',
  timezone text not null default 'America/La_Paz',
  unit_system text not null default 'metric',
  default_follow_up_days integer not null default 14,
  strict_formula_versioning boolean not null default true,
  ai_assist_enabled boolean not null default false,
  require_plan_approval boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.branding_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  commercial_name text not null,
  logo_url text,
  logo_initials text not null,
  primary_color text not null,
  accent_color text not null,
  report_theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.specialty_packs (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  system_enabled boolean not null default true,
  default_modules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_enabled_packs (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  pack_id text not null references public.specialty_packs(id),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  enabled_at timestamptz not null default now(),
  primary key (tenant_id, pack_id)
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  initials text not null,
  title text,
  locale text not null default 'es',
  timezone text not null default 'America/La_Paz',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  description text not null,
  level text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.permissions (
  id text primary key,
  resource text not null,
  action text not null,
  scope text not null,
  description text not null
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id text not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'invited', 'inactive')),
  title text,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.membership_roles (
  membership_id uuid not null references public.tenant_memberships(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (membership_id, role_id)
);

create table if not exists public.membership_scopes (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.tenant_memberships(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  pack_id text references public.specialty_packs(id),
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id),
  service_id uuid references public.services(id),
  mrn text not null,
  first_name text not null,
  last_name text not null,
  birth_date date,
  sex text not null check (sex in ('female', 'male', 'other')),
  status text not null default 'active',
  risk_level text not null default 'low',
  primary_pack_id text references public.specialty_packs(id),
  active_pack_ids text[] not null default '{}',
  diagnosis_summary text,
  location_label text,
  last_evaluation_at date,
  next_follow_up_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, mrn)
);

create table if not exists public.patient_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  type text not null,
  name text,
  value text not null,
  relationship text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  type text not null,
  title text not null,
  status text not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  owner_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete cascade,
  note_type text not null,
  title text not null,
  body text not null,
  signed_at timestamptz,
  signed_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_organizations_tenant on public.organizations(tenant_id);
create index if not exists idx_branches_tenant_org on public.branches(tenant_id, organization_id);
create index if not exists idx_departments_tenant_branch on public.departments(tenant_id, branch_id);
create index if not exists idx_services_tenant_department on public.services(tenant_id, department_id);
create index if not exists idx_tenant_memberships_user on public.tenant_memberships(user_id, status);
create index if not exists idx_patients_tenant_status on public.patients(tenant_id, status, risk_level) where deleted_at is null;
create index if not exists idx_patients_tenant_pack on public.patients(tenant_id, primary_pack_id) where deleted_at is null;
create index if not exists idx_encounters_tenant_patient on public.encounters(tenant_id, patient_id, status);
create index if not exists idx_activity_logs_tenant_created on public.activity_logs(tenant_id, created_at desc);
create index if not exists idx_audit_logs_tenant_created on public.audit_logs(tenant_id, created_at desc);

create or replace function public.current_tenant_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(tm.tenant_id), '{}')::uuid[]
  from public.tenant_memberships tm
  where tm.user_id = auth.uid()
    and tm.status = 'active';
$$;

create or replace function public.is_platform_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    join public.membership_roles mr on mr.membership_id = tm.id
    join public.roles r on r.id = mr.role_id
    where tm.user_id = auth.uid()
      and tm.status = 'active'
      and r.code = 'platform_superadmin'
  );
$$;

alter table public.subscription_plans enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_subscriptions enable row level security;
alter table public.tenant_usage_limits enable row level security;
alter table public.tenant_usage_counters enable row level security;
alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.departments enable row level security;
alter table public.services enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.branding_settings enable row level security;
alter table public.specialty_packs enable row level security;
alter table public.tenant_enabled_packs enable row level security;
alter table public.user_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.membership_roles enable row level security;
alter table public.membership_scopes enable row level security;
alter table public.patients enable row level security;
alter table public.patient_contacts enable row level security;
alter table public.encounters enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.activity_logs enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "plans are readable" on public.subscription_plans;
create policy "plans are readable" on public.subscription_plans for select to authenticated using (true);

drop policy if exists "packs are readable" on public.specialty_packs;
create policy "packs are readable" on public.specialty_packs for select to authenticated using (true);

drop policy if exists "permissions are readable" on public.permissions;
create policy "permissions are readable" on public.permissions for select to authenticated using (true);

drop policy if exists "profiles own profile" on public.user_profiles;
create policy "profiles own profile" on public.user_profiles for select to authenticated using (id = auth.uid());

drop policy if exists "tenants isolated" on public.tenants;
create policy "tenants isolated" on public.tenants for all to authenticated
using (id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant subscriptions isolated" on public.tenant_subscriptions;
create policy "tenant subscriptions isolated" on public.tenant_subscriptions for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant limits isolated" on public.tenant_usage_limits;
create policy "tenant limits isolated" on public.tenant_usage_limits for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant counters isolated" on public.tenant_usage_counters;
create policy "tenant counters isolated" on public.tenant_usage_counters for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant orgs isolated" on public.organizations;
create policy "tenant orgs isolated" on public.organizations for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant branches isolated" on public.branches;
create policy "tenant branches isolated" on public.branches for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant departments isolated" on public.departments;
create policy "tenant departments isolated" on public.departments for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant services isolated" on public.services;
create policy "tenant services isolated" on public.services for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant settings isolated" on public.tenant_settings;
create policy "tenant settings isolated" on public.tenant_settings for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant branding isolated" on public.branding_settings;
create policy "tenant branding isolated" on public.branding_settings for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant packs isolated" on public.tenant_enabled_packs;
create policy "tenant packs isolated" on public.tenant_enabled_packs for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "roles isolated" on public.roles;
create policy "roles isolated" on public.roles for select to authenticated
using (tenant_id is null or tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "role permissions readable" on public.role_permissions;
create policy "role permissions readable" on public.role_permissions for select to authenticated using (true);

drop policy if exists "memberships isolated" on public.tenant_memberships;
create policy "memberships isolated" on public.tenant_memberships for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "membership roles readable" on public.membership_roles;
create policy "membership roles readable" on public.membership_roles for select to authenticated using (true);

drop policy if exists "membership scopes isolated" on public.membership_scopes;
create policy "membership scopes isolated" on public.membership_scopes for select to authenticated
using (
  exists (
    select 1
    from public.tenant_memberships tm
    where tm.id = membership_scopes.membership_id
      and (tm.tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
  )
);

drop policy if exists "patients isolated" on public.patients;
create policy "patients isolated" on public.patients for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "patient contacts isolated" on public.patient_contacts;
create policy "patient contacts isolated" on public.patient_contacts for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "encounters isolated" on public.encounters;
create policy "encounters isolated" on public.encounters for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "clinical notes isolated" on public.clinical_notes;
create policy "clinical notes isolated" on public.clinical_notes for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "activity logs isolated" on public.activity_logs;
create policy "activity logs isolated" on public.activity_logs for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "audit logs isolated" on public.audit_logs;
create policy "audit logs isolated" on public.audit_logs for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
