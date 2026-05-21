create table if not exists public.measurement_sites (
  id text primary key,
  code text not null unique,
  name text not null,
  category text not null,
  unit text not null,
  bilateral boolean not null default false,
  required_attempts integer not null default 2,
  tolerance numeric(10,3) not null default 0,
  anatomical_hint text,
  packs text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.measurement_protocols (
  id text primary key,
  name text not null,
  short_name text not null,
  description text not null,
  level text not null,
  site_ids text[] not null default '{}',
  required_attempts integer not null default 2,
  quality_rules jsonb not null default '[]'::jsonb,
  packs text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_measurement_protocols (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  protocol_id text not null references public.measurement_protocols(id),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  primary key (tenant_id, protocol_id)
);

create table if not exists public.formula_library (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  owner text not null default 'system',
  audit_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formula_versions (
  id text primary key,
  formula_id text not null references public.formula_library(id) on delete cascade,
  version text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'deprecated')),
  expression_label text not null,
  input_site_ids text[] not null default '{}',
  outputs text[] not null default '{}',
  applicability jsonb not null default '{}'::jsonb,
  source text,
  clinical_notes text,
  activated_at timestamptz,
  deprecated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (formula_id, version)
);

create table if not exists public.tenant_formula_settings (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  formula_version_id text not null references public.formula_versions(id),
  enabled boolean not null default true,
  pack_id text references public.specialty_packs(id),
  priority integer not null default 100,
  config jsonb not null default '{}'::jsonb,
  primary key (tenant_id, formula_version_id)
);

create table if not exists public.anthropometry_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  protocol_id text not null references public.measurement_protocols(id),
  evaluator_user_id uuid references auth.users(id),
  measured_at timestamptz not null default now(),
  quality_index numeric(5,2),
  formula_version_ids text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anthropometric_measurements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  session_id uuid not null references public.anthropometry_sessions(id) on delete cascade,
  site_id text not null references public.measurement_sites(id),
  attempt integer not null default 1,
  side text check (side in ('left', 'right', 'midline')),
  value numeric(10,3) not null,
  unit text not null,
  delta_from_previous numeric(10,3),
  quality_flag text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.derived_anthropometry_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  session_id uuid not null references public.anthropometry_sessions(id) on delete cascade,
  formula_version_id text not null references public.formula_versions(id),
  output_type text not null,
  value numeric(12,4),
  value_json jsonb,
  unit text,
  interpretation text,
  created_at timestamptz not null default now()
);

create table if not exists public.screening_templates (
  id text primary key,
  name text not null,
  description text not null,
  pack_ids text[] not null default '{}',
  context text not null,
  version text not null,
  scoring jsonb not null,
  items jsonb not null default '[]'::jsonb,
  rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_screening_templates (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template_id text not null references public.screening_templates(id),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  primary key (tenant_id, template_id)
);

create table if not exists public.screening_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  template_id text not null references public.screening_templates(id),
  template_version text not null,
  performed_at timestamptz not null default now(),
  score numeric(10,2) not null,
  risk_level text not null,
  flags text[] not null default '{}',
  recommendation text,
  next_review_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.screening_answers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  screening_result_id uuid not null references public.screening_results(id) on delete cascade,
  item_id text not null,
  answer_value jsonb not null,
  score numeric(10,2) not null default 0,
  flags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  sections jsonb not null default '[]'::jsonb,
  diagnosis_problem text,
  diagnosis_etiology text,
  diagnosis_signs_symptoms text,
  conduct text,
  status text not null default 'draft',
  created_by uuid references auth.users(id),
  signed_by uuid references auth.users(id),
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_diagnoses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  assessment_id uuid references public.clinical_assessments(id) on delete set null,
  problem text not null,
  etiology text,
  signs_symptoms text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  type text not null,
  kcal numeric(10,2),
  protein_g numeric(10,2),
  carbs_g numeric(10,2),
  fat_g numeric(10,2),
  fluids_ml numeric(10,2),
  diet text,
  restrictions text[] not null default '{}',
  goals jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  version integer not null default 1,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evolution_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  entry_type text not null,
  occurred_at timestamptz not null default now(),
  summary text not null,
  structured_data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_rules (
  id text primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text not null,
  scope text not null,
  trigger_expression text not null,
  action_expression text not null,
  severity text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anthro_sessions_tenant_patient on public.anthropometry_sessions(tenant_id, patient_id, measured_at desc);
create index if not exists idx_anthro_measurements_tenant_session on public.anthropometric_measurements(tenant_id, session_id, site_id);
create index if not exists idx_derived_results_tenant_session on public.derived_anthropometry_results(tenant_id, session_id);
create index if not exists idx_screening_results_tenant_patient on public.screening_results(tenant_id, patient_id, performed_at desc);
create index if not exists idx_clinical_assessments_tenant_patient on public.clinical_assessments(tenant_id, patient_id, created_at desc);
create index if not exists idx_nutrition_plans_tenant_patient on public.nutrition_plans(tenant_id, patient_id, status);
create index if not exists idx_evolution_entries_tenant_patient on public.evolution_entries(tenant_id, patient_id, occurred_at desc);

alter table public.measurement_sites enable row level security;
alter table public.measurement_protocols enable row level security;
alter table public.tenant_measurement_protocols enable row level security;
alter table public.formula_library enable row level security;
alter table public.formula_versions enable row level security;
alter table public.tenant_formula_settings enable row level security;
alter table public.anthropometry_sessions enable row level security;
alter table public.anthropometric_measurements enable row level security;
alter table public.derived_anthropometry_results enable row level security;
alter table public.screening_templates enable row level security;
alter table public.tenant_screening_templates enable row level security;
alter table public.screening_results enable row level security;
alter table public.screening_answers enable row level security;
alter table public.clinical_assessments enable row level security;
alter table public.nutrition_diagnoses enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.evolution_entries enable row level security;
alter table public.clinical_rules enable row level security;

drop policy if exists "measurement sites readable" on public.measurement_sites;
create policy "measurement sites readable" on public.measurement_sites for select to authenticated using (true);

drop policy if exists "measurement protocols readable" on public.measurement_protocols;
create policy "measurement protocols readable" on public.measurement_protocols for select to authenticated using (true);

drop policy if exists "formula library readable" on public.formula_library;
create policy "formula library readable" on public.formula_library for select to authenticated using (true);

drop policy if exists "formula versions readable" on public.formula_versions;
create policy "formula versions readable" on public.formula_versions for select to authenticated using (true);

drop policy if exists "screening templates readable" on public.screening_templates;
create policy "screening templates readable" on public.screening_templates for select to authenticated using (true);

drop policy if exists "tenant measurement protocols isolated" on public.tenant_measurement_protocols;
create policy "tenant measurement protocols isolated" on public.tenant_measurement_protocols for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant formula settings isolated" on public.tenant_formula_settings;
create policy "tenant formula settings isolated" on public.tenant_formula_settings for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant screening templates isolated" on public.tenant_screening_templates;
create policy "tenant screening templates isolated" on public.tenant_screening_templates for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "anthro sessions isolated" on public.anthropometry_sessions;
create policy "anthro sessions isolated" on public.anthropometry_sessions for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "anthro measurements isolated" on public.anthropometric_measurements;
create policy "anthro measurements isolated" on public.anthropometric_measurements for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "derived anthro isolated" on public.derived_anthropometry_results;
create policy "derived anthro isolated" on public.derived_anthropometry_results for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "screening results isolated" on public.screening_results;
create policy "screening results isolated" on public.screening_results for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "screening answers isolated" on public.screening_answers;
create policy "screening answers isolated" on public.screening_answers for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "clinical assessments isolated" on public.clinical_assessments;
create policy "clinical assessments isolated" on public.clinical_assessments for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "nutrition diagnoses isolated" on public.nutrition_diagnoses;
create policy "nutrition diagnoses isolated" on public.nutrition_diagnoses for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "nutrition plans isolated" on public.nutrition_plans;
create policy "nutrition plans isolated" on public.nutrition_plans for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "evolution entries isolated" on public.evolution_entries;
create policy "evolution entries isolated" on public.evolution_entries for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "clinical rules isolated" on public.clinical_rules;
create policy "clinical rules isolated" on public.clinical_rules for all to authenticated
using (tenant_id is null or tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id is null or tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
