insert into public.permissions (id, resource, action, scope, description)
values
  ('ccorp_level1.read', 'ccorp_level1', 'read', 'tenant', 'Leer evaluaciones CCORP Nivel 1'),
  ('ccorp_level1.create', 'ccorp_level1', 'create', 'tenant', 'Crear evaluaciones CCORP Nivel 1'),
  ('ccorp_level1.update', 'ccorp_level1', 'update', 'tenant', 'Actualizar evaluaciones CCORP Nivel 1'),
  ('ccorp_level1.delete', 'ccorp_level1', 'delete', 'tenant', 'Eliminar logicamente evaluaciones CCORP Nivel 1'),
  ('ccorp_level1.print', 'ccorp_level1', 'export', 'tenant', 'Imprimir informes CCORP Nivel 1'),
  ('ccorp_level1.export', 'ccorp_level1', 'export', 'tenant', 'Exportar informes CCORP Nivel 1')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role_id, permission_id
from (
  values
    ('10000000-0000-4000-8000-000000000002'::uuid, 'ccorp_level1.read'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'ccorp_level1.create'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'ccorp_level1.update'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'ccorp_level1.delete'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'ccorp_level1.print'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'ccorp_level1.export'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'ccorp_level1.read'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'ccorp_level1.create'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'ccorp_level1.update'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'ccorp_level1.print'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'ccorp_level1.export'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'ccorp_level1.read'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'ccorp_level1.create'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'ccorp_level1.update'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'ccorp_level1.read'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'ccorp_level1.create'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'ccorp_level1.update'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'ccorp_level1.print'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'ccorp_level1.export'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'ccorp_level1.read'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'ccorp_level1.create'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'ccorp_level1.update'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'ccorp_level1.print'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'ccorp_level1.export'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'ccorp_level1.read'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'ccorp_level1.print')
) as grants(role_id, permission_id)
on conflict (role_id, permission_id) do nothing;

create table if not exists public.ccorp_level1_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  clinical_assessment_id uuid references public.clinical_assessments(id) on delete set null,
  measured_at timestamptz not null,
  birth_date_snapshot date,
  age_decimal numeric(8,3),
  sex text not null check (sex in ('male', 'female', 'other')),
  formula_version text not null default 'ccorp-level-1-excel-2026-04-24',
  status text not null default 'completed' check (status in ('draft', 'completed', 'void')),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.ccorp_level1_measurements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assessment_id uuid not null references public.ccorp_level1_assessments(id) on delete cascade,
  variable_code text not null,
  variable_label text not null,
  category text not null,
  unit text not null,
  series_1 numeric(12,3),
  series_2 numeric(12,3),
  series_3 numeric(12,3),
  series_4 numeric(12,3),
  series_5 numeric(12,3),
  median_value numeric(12,3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, variable_code)
);

create table if not exists public.ccorp_level1_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assessment_id uuid not null references public.ccorp_level1_assessments(id) on delete cascade unique,
  bmi numeric(10,3),
  waist_hip_ratio numeric(10,3),
  sum_6_skinfolds numeric(10,3),
  durnin_body_density_male numeric(10,5),
  durnin_body_density_female numeric(10,5),
  durnin_body_fat_percent numeric(10,3),
  durnin_fat_mass_kg numeric(10,3),
  durnin_fat_free_mass_kg numeric(10,3),
  durnin_fmi numeric(10,3),
  durnin_ffmi numeric(10,3),
  withers_body_fat_percent numeric(10,3),
  withers_fat_mass_kg numeric(10,3),
  withers_fat_free_mass_kg numeric(10,3),
  withers_fmi numeric(10,3),
  withers_ffmi numeric(10,3),
  arm_muscle_area_mm2 numeric(12,3),
  endomorphy numeric(10,3),
  mesomorphy numeric(10,3),
  ectomorphy numeric(10,3),
  hwr numeric(10,3),
  somato_x numeric(10,3),
  somato_y numeric(10,3),
  warnings text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ccorp_level1_ideal_weight_targets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assessment_id uuid not null references public.ccorp_level1_assessments(id) on delete cascade,
  method text not null check (method in ('durnin', 'withers')),
  target_body_fat_percent numeric(10,3),
  target_ffmi numeric(10,3),
  ideal_weight_kg numeric(10,3),
  target_fat_mass_kg numeric(10,3),
  fat_to_lose_kg numeric(10,3),
  target_fat_free_mass_kg numeric(10,3),
  lean_mass_to_gain_kg numeric(10,3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, method)
);

create table if not exists public.ccorp_level1_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assessment_id uuid not null references public.ccorp_level1_assessments(id) on delete cascade,
  report_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users(id)
);

create index if not exists idx_ccorp_l1_assessments_tenant_patient on public.ccorp_level1_assessments(tenant_id, patient_id, measured_at desc) where deleted_at is null;
create index if not exists idx_ccorp_l1_assessments_tenant_encounter on public.ccorp_level1_assessments(tenant_id, encounter_id) where deleted_at is null;
create index if not exists idx_ccorp_l1_measurements_assessment on public.ccorp_level1_measurements(tenant_id, assessment_id);
create index if not exists idx_ccorp_l1_results_assessment on public.ccorp_level1_results(tenant_id, assessment_id);
create index if not exists idx_ccorp_l1_targets_assessment on public.ccorp_level1_ideal_weight_targets(tenant_id, assessment_id);
create index if not exists idx_ccorp_l1_snapshots_assessment on public.ccorp_level1_report_snapshots(tenant_id, assessment_id, generated_at desc);

alter table public.ccorp_level1_assessments enable row level security;
alter table public.ccorp_level1_measurements enable row level security;
alter table public.ccorp_level1_results enable row level security;
alter table public.ccorp_level1_ideal_weight_targets enable row level security;
alter table public.ccorp_level1_report_snapshots enable row level security;

drop policy if exists "ccorp l1 assessments read permitted" on public.ccorp_level1_assessments;
drop policy if exists "ccorp l1 assessments insert permitted" on public.ccorp_level1_assessments;
drop policy if exists "ccorp l1 assessments update permitted" on public.ccorp_level1_assessments;
drop policy if exists "ccorp l1 assessments delete permitted" on public.ccorp_level1_assessments;
create policy "ccorp l1 assessments read permitted" on public.ccorp_level1_assessments
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.read'));
create policy "ccorp l1 assessments insert permitted" on public.ccorp_level1_assessments
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.create'));
create policy "ccorp l1 assessments update permitted" on public.ccorp_level1_assessments
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.update'))
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.update'));
create policy "ccorp l1 assessments delete permitted" on public.ccorp_level1_assessments
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.delete'));

drop policy if exists "ccorp l1 measurements read permitted" on public.ccorp_level1_measurements;
drop policy if exists "ccorp l1 measurements insert permitted" on public.ccorp_level1_measurements;
drop policy if exists "ccorp l1 measurements update permitted" on public.ccorp_level1_measurements;
drop policy if exists "ccorp l1 measurements delete permitted" on public.ccorp_level1_measurements;
create policy "ccorp l1 measurements read permitted" on public.ccorp_level1_measurements
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.read'));
create policy "ccorp l1 measurements insert permitted" on public.ccorp_level1_measurements
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.create'));
create policy "ccorp l1 measurements update permitted" on public.ccorp_level1_measurements
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.update'))
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.update'));
create policy "ccorp l1 measurements delete permitted" on public.ccorp_level1_measurements
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.delete'));

drop policy if exists "ccorp l1 results read permitted" on public.ccorp_level1_results;
drop policy if exists "ccorp l1 results insert permitted" on public.ccorp_level1_results;
drop policy if exists "ccorp l1 results update permitted" on public.ccorp_level1_results;
drop policy if exists "ccorp l1 results delete permitted" on public.ccorp_level1_results;
create policy "ccorp l1 results read permitted" on public.ccorp_level1_results
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.read'));
create policy "ccorp l1 results insert permitted" on public.ccorp_level1_results
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.create'));
create policy "ccorp l1 results update permitted" on public.ccorp_level1_results
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.update'))
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.update'));
create policy "ccorp l1 results delete permitted" on public.ccorp_level1_results
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.delete'));

drop policy if exists "ccorp l1 targets read permitted" on public.ccorp_level1_ideal_weight_targets;
drop policy if exists "ccorp l1 targets insert permitted" on public.ccorp_level1_ideal_weight_targets;
drop policy if exists "ccorp l1 targets update permitted" on public.ccorp_level1_ideal_weight_targets;
drop policy if exists "ccorp l1 targets delete permitted" on public.ccorp_level1_ideal_weight_targets;
create policy "ccorp l1 targets read permitted" on public.ccorp_level1_ideal_weight_targets
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.read'));
create policy "ccorp l1 targets insert permitted" on public.ccorp_level1_ideal_weight_targets
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.create'));
create policy "ccorp l1 targets update permitted" on public.ccorp_level1_ideal_weight_targets
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.update'))
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.update'));
create policy "ccorp l1 targets delete permitted" on public.ccorp_level1_ideal_weight_targets
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.delete'));

drop policy if exists "ccorp l1 snapshots read permitted" on public.ccorp_level1_report_snapshots;
drop policy if exists "ccorp l1 snapshots insert permitted" on public.ccorp_level1_report_snapshots;
create policy "ccorp l1 snapshots read permitted" on public.ccorp_level1_report_snapshots
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'ccorp_level1.read'));
create policy "ccorp l1 snapshots insert permitted" on public.ccorp_level1_report_snapshots
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'ccorp_level1.print') or public.has_tenant_permission(tenant_id, 'ccorp_level1.export'));

insert into public.clinical_modules (
  id, pack_id, slug, name, short_name, description, route_key, default_enabled, sort_order, system_enabled, config_schema
)
values (
  'ccorp_level1',
  'sport',
  'ccorp-level-1',
  'Composicion Corporal Nivel 1',
  'CCORP Nivel 1',
  'Evaluacion antropometrica Nivel 1 basada en hoja de trabajo, composicion corporal y somatotipo.',
  'sport/ccorp-level-1',
  true,
  55,
  true,
  '{"requires":["patients","encounters"],"formulaVersion":"ccorp-level-1-excel-2026-04-24"}'::jsonb
)
on conflict (id) do update set
  pack_id = excluded.pack_id,
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  route_key = excluded.route_key,
  default_enabled = excluded.default_enabled,
  sort_order = excluded.sort_order,
  system_enabled = excluded.system_enabled,
  config_schema = excluded.config_schema,
  updated_at = now();

update public.specialty_packs
set default_modules = (
  select jsonb_agg(distinct module_id)
  from jsonb_array_elements_text(coalesce(default_modules, '[]'::jsonb) || '["ccorp_level1"]'::jsonb) as module_id
)
where id = 'sport';

insert into public.tenant_enabled_modules (tenant_id, module_id, enabled, config)
select tep.tenant_id, 'ccorp_level1', true, '{}'::jsonb
from public.tenant_enabled_packs tep
where tep.pack_id = 'sport'
  and tep.enabled = true
on conflict (tenant_id, module_id) do update
set enabled = true,
    enabled_at = now();

insert into public.report_templates (tenant_id, pack_id, module_id, name, description, format_capabilities, layout_config, system_enabled)
values (
  null,
  'sport',
  'ccorp_level1',
  'Informe de Composicion Corporal Nivel 1',
  'Reporte Nivel 1 con mediciones, indices, composicion corporal, somatotipo y peso ideal.',
  array['preview','print','pdf'],
  '{"theme":"sport","source":"INFORME CCORP Y STIPO NIVEL 1.xlsx"}'::jsonb,
  true
)
on conflict do nothing;
