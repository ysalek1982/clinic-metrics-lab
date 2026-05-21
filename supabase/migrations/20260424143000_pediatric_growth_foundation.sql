create or replace function public.has_tenant_permission(
  p_tenant_id uuid,
  p_permission_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_superadmin()
    or exists (
      select 1
      from public.tenant_memberships tm
      join public.membership_roles mr on mr.membership_id = tm.id
      join public.role_permissions rp on rp.role_id = mr.role_id
      where tm.user_id = auth.uid()
        and tm.tenant_id = p_tenant_id
        and tm.status = 'active'
        and rp.permission_id = p_permission_id
    );
$$;

insert into public.permissions (id, resource, action, scope, description)
values
  ('pediatric_growth.read', 'pediatric_growth', 'read', 'specialty_pack', 'Leer curvas y controles de crecimiento pediatrico'),
  ('pediatric_growth.create', 'pediatric_growth', 'create', 'specialty_pack', 'Registrar controles de crecimiento pediatrico'),
  ('pediatric_growth.update', 'pediatric_growth', 'update', 'specialty_pack', 'Editar controles de crecimiento pediatrico'),
  ('pediatric_growth.delete', 'pediatric_growth', 'delete', 'specialty_pack', 'Eliminar logicamente controles de crecimiento pediatrico')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.permission_id
from public.roles r
cross join (
  values
    ('platform_superadmin', 'pediatric_growth.read'),
    ('platform_superadmin', 'pediatric_growth.create'),
    ('platform_superadmin', 'pediatric_growth.update'),
    ('platform_superadmin', 'pediatric_growth.delete'),
    ('tenant_owner', 'pediatric_growth.read'),
    ('tenant_owner', 'pediatric_growth.create'),
    ('tenant_owner', 'pediatric_growth.update'),
    ('tenant_owner', 'pediatric_growth.delete'),
    ('nutrition_director', 'pediatric_growth.read'),
    ('nutrition_director', 'pediatric_growth.create'),
    ('nutrition_director', 'pediatric_growth.update'),
    ('nutrition_director', 'pediatric_growth.delete'),
    ('clinical_nutritionist', 'pediatric_growth.read'),
    ('clinical_nutritionist', 'pediatric_growth.create'),
    ('clinical_nutritionist', 'pediatric_growth.update'),
    ('anthropometrist', 'pediatric_growth.read'),
    ('anthropometrist', 'pediatric_growth.create'),
    ('anthropometrist', 'pediatric_growth.update'),
    ('auditor', 'pediatric_growth.read')
) as p(role_code, permission_id)
where r.tenant_id is null
  and r.code = p.role_code
on conflict (role_id, permission_id) do nothing;

alter table public.pediatric_growth_records
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists age_days_total integer,
  add column if not exists sex_reference text,
  add column if not exists weight_kg numeric(10,3),
  add column if not exists length_cm numeric(10,3),
  add column if not exists height_cm numeric(10,3),
  add column if not exists bmi numeric(10,3),
  add column if not exists head_circumference_cm numeric(10,3),
  add column if not exists arm_circumference_cm numeric(10,3),
  add column if not exists triceps_skinfold_mm numeric(10,3),
  add column if not exists subscapular_skinfold_mm numeric(10,3),
  add column if not exists notes text,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

alter table public.pediatric_growth_records
  alter column metric drop not null,
  alter column value drop not null;

update public.pediatric_growth_records pgr
set
  organization_id = coalesce(pgr.organization_id, p.organization_id),
  sex_reference = coalesce(pgr.sex_reference, pgr.sex),
  age_days_total = coalesce(pgr.age_days_total, pgr.age_months * 30),
  weight_kg = case
    when pgr.metric = 'weight_for_age' and pgr.weight_kg is null then pgr.value
    else pgr.weight_kg
  end
from public.patients p
where p.id = pgr.patient_id
  and p.tenant_id = pgr.tenant_id;

create table if not exists public.pediatric_growth_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  growth_record_id uuid not null references public.pediatric_growth_records(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  indicator_code text not null,
  reference_id uuid,
  reference_version text,
  measurement_value numeric(10,3),
  z_score numeric(10,4),
  percentile numeric(10,4),
  classification text,
  interpretation text,
  flags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.growth_reference_sets (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  source text not null,
  source_url text,
  age_min_months integer not null,
  age_max_months integer not null,
  sex text not null check (sex in ('female', 'male', 'any')),
  indicator_code text not null,
  version text not null,
  status text not null default 'draft' check (status in ('draft', 'demo', 'active', 'deprecated')),
  created_at timestamptz not null default now(),
  unique (code, version, sex, indicator_code)
);

create table if not exists public.growth_reference_points (
  id uuid primary key default gen_random_uuid(),
  reference_set_id uuid not null references public.growth_reference_sets(id) on delete cascade,
  sex text not null check (sex in ('female', 'male', 'any')),
  indicator_code text not null,
  x_value numeric(10,4) not null,
  x_unit text not null,
  l_value numeric(14,8),
  m_value numeric(14,8),
  s_value numeric(14,8),
  p01 numeric(14,6),
  p03 numeric(14,6),
  p05 numeric(14,6),
  p10 numeric(14,6),
  p15 numeric(14,6),
  p25 numeric(14,6),
  p50 numeric(14,6),
  p75 numeric(14,6),
  p85 numeric(14,6),
  p90 numeric(14,6),
  p95 numeric(14,6),
  p97 numeric(14,6),
  p99 numeric(14,6),
  z_minus_3 numeric(14,6),
  z_minus_2 numeric(14,6),
  z_minus_1 numeric(14,6),
  z_0 numeric(14,6),
  z_plus_1 numeric(14,6),
  z_plus_2 numeric(14,6),
  z_plus_3 numeric(14,6),
  created_at timestamptz not null default now(),
  unique (reference_set_id, x_value)
);

create table if not exists public.tenant_growth_reference_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  pack_code text not null default 'pediatric',
  indicator_code text not null,
  age_min_months integer not null,
  age_max_months integer not null,
  preferred_reference_set_id uuid references public.growth_reference_sets(id) on delete set null,
  fallback_reference_set_id uuid references public.growth_reference_sets(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, pack_code, indicator_code, age_min_months, age_max_months)
);

create index if not exists idx_pediatric_growth_records_tenant_patient_active
  on public.pediatric_growth_records(tenant_id, patient_id, measured_at desc)
  where deleted_at is null;
create index if not exists idx_pediatric_growth_results_tenant_patient
  on public.pediatric_growth_results(tenant_id, patient_id, indicator_code, created_at desc);
create index if not exists idx_growth_reference_sets_lookup
  on public.growth_reference_sets(indicator_code, sex, age_min_months, age_max_months, status);
create index if not exists idx_growth_reference_points_lookup
  on public.growth_reference_points(reference_set_id, x_value);
create index if not exists idx_tenant_growth_reference_policies_lookup
  on public.tenant_growth_reference_policies(tenant_id, pack_code, indicator_code, is_active);

alter table public.pediatric_growth_results enable row level security;
alter table public.growth_reference_sets enable row level security;
alter table public.growth_reference_points enable row level security;
alter table public.tenant_growth_reference_policies enable row level security;

drop policy if exists "pediatric growth isolated" on public.pediatric_growth_records;
drop policy if exists "pediatric growth read isolated" on public.pediatric_growth_records;
create policy "pediatric growth read isolated" on public.pediatric_growth_records
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "pediatric growth insert permitted" on public.pediatric_growth_records;
create policy "pediatric growth insert permitted" on public.pediatric_growth_records
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'pediatric_growth.create'));

drop policy if exists "pediatric growth update permitted" on public.pediatric_growth_records;
create policy "pediatric growth update permitted" on public.pediatric_growth_records
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'pediatric_growth.update'))
with check (public.has_tenant_permission(tenant_id, 'pediatric_growth.update'));

drop policy if exists "pediatric growth delete permitted" on public.pediatric_growth_records;
create policy "pediatric growth delete permitted" on public.pediatric_growth_records
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'pediatric_growth.delete'));

drop policy if exists "pediatric growth results read isolated" on public.pediatric_growth_results;
create policy "pediatric growth results read isolated" on public.pediatric_growth_results
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "pediatric growth results insert permitted" on public.pediatric_growth_results;
create policy "pediatric growth results insert permitted" on public.pediatric_growth_results
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'pediatric_growth.create'));

drop policy if exists "pediatric growth results update permitted" on public.pediatric_growth_results;
create policy "pediatric growth results update permitted" on public.pediatric_growth_results
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'pediatric_growth.update'))
with check (public.has_tenant_permission(tenant_id, 'pediatric_growth.update'));

drop policy if exists "growth reference sets publicly readable" on public.growth_reference_sets;
create policy "growth reference sets publicly readable" on public.growth_reference_sets
for select to anon, authenticated
using (status in ('active', 'demo'));

drop policy if exists "growth reference points publicly readable" on public.growth_reference_points;
create policy "growth reference points publicly readable" on public.growth_reference_points
for select to anon, authenticated
using (
  exists (
    select 1
    from public.growth_reference_sets grs
    where grs.id = growth_reference_points.reference_set_id
      and grs.status in ('active', 'demo')
  )
);

drop policy if exists "tenant growth reference policies read isolated" on public.tenant_growth_reference_policies;
create policy "tenant growth reference policies read isolated" on public.tenant_growth_reference_policies
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "tenant growth reference policies manage permitted" on public.tenant_growth_reference_policies;
create policy "tenant growth reference policies manage permitted" on public.tenant_growth_reference_policies
for all to authenticated
using (public.has_tenant_permission(tenant_id, 'settings.manage'))
with check (public.has_tenant_permission(tenant_id, 'settings.manage'));

insert into public.growth_reference_sets (
  code, name, source, source_url, age_min_months, age_max_months, sex, indicator_code, version, status
)
select
  concat('demo_who_2006_', indicator_code, '_', sex),
  concat('Referencia demo no clinica - WHO 2006 ', indicator_code, ' ', sex),
  'WHO Child Growth Standards',
  'https://www.who.int/tools/child-growth-standards',
  0,
  60,
  sex,
  indicator_code,
  'demo-0.1',
  'demo'
from (
  values
    ('female', 'weight_for_age'),
    ('male', 'weight_for_age'),
    ('female', 'height_for_age'),
    ('male', 'height_for_age'),
    ('female', 'weight_for_length_height'),
    ('male', 'weight_for_length_height'),
    ('female', 'bmi_for_age'),
    ('male', 'bmi_for_age'),
    ('female', 'head_circumference_for_age'),
    ('male', 'head_circumference_for_age'),
    ('female', 'arm_circumference_for_age'),
    ('male', 'arm_circumference_for_age')
) as refs(sex, indicator_code)
on conflict (code, version, sex, indicator_code) do update set
  name = excluded.name,
  source = excluded.source,
  source_url = excluded.source_url,
  age_min_months = excluded.age_min_months,
  age_max_months = excluded.age_max_months,
  status = excluded.status;

insert into public.tenant_growth_reference_policies (
  tenant_id, pack_code, indicator_code, age_min_months, age_max_months, preferred_reference_set_id, is_active
)
select
  tep.tenant_id,
  'pediatric',
  grs.indicator_code,
  0,
  60,
  grs.id,
  true
from public.tenant_enabled_packs tep
join public.growth_reference_sets grs
  on grs.status = 'demo'
 and grs.sex = 'female'
where tep.pack_id = 'pediatric'
  and tep.enabled = true
on conflict (tenant_id, pack_code, indicator_code, age_min_months, age_max_months) do update set
  preferred_reference_set_id = excluded.preferred_reference_set_id,
  is_active = true,
  updated_at = now();

insert into public.pediatric_growth_results (
  tenant_id, growth_record_id, patient_id, indicator_code, reference_version,
  measurement_value, z_score, percentile, classification, interpretation, flags
)
select
  pgr.tenant_id,
  pgr.id,
  pgr.patient_id,
  coalesce(pgr.metric, 'weight_for_age'),
  pgr.standard_ref,
  pgr.value,
  pgr.z_score,
  pgr.percentile,
  case
    when pgr.z_score is null then 'referencia_incompleta'
    when pgr.z_score < -3 then 'muy_bajo'
    when pgr.z_score < -2 then 'bajo'
    when pgr.z_score > 3 then 'muy_alto'
    when pgr.z_score > 2 then 'alto'
    else 'esperado'
  end,
  'Resultado seed heredado. No usar como referencia clinica hasta cargar tablas oficiales completas.',
  array['seed_heredado', 'referencia_demo_no_clinica']
from public.pediatric_growth_records pgr
where not exists (
  select 1
  from public.pediatric_growth_results pgrs
  where pgrs.growth_record_id = pgr.id
    and pgrs.indicator_code = coalesce(pgr.metric, 'weight_for_age')
);
