create table if not exists public.clinical_modules (
  id text primary key,
  pack_id text not null references public.specialty_packs(id) on delete cascade,
  slug text not null,
  name text not null,
  short_name text not null,
  description text not null,
  route_key text not null,
  default_enabled boolean not null default true,
  sort_order integer not null default 100,
  system_enabled boolean not null default true,
  config_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pack_id, slug)
);

create table if not exists public.tenant_enabled_modules (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  module_id text not null references public.clinical_modules(id) on delete cascade,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  enabled_at timestamptz not null default now(),
  primary key (tenant_id, module_id)
);

create table if not exists public.pediatric_growth_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  sex text not null check (sex in ('female', 'male', 'other')),
  age_months integer not null check (age_months >= 0),
  metric text not null,
  value numeric(10,3) not null,
  z_score numeric(10,3),
  percentile numeric(10,3),
  standard_ref text not null default 'OMS 2006',
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.pregnancy_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  gestational_week integer not null check (gestational_week between 1 and 45),
  trimester text not null,
  pre_pregnancy_weight numeric(10,3),
  current_weight numeric(10,3),
  expected_gain_min numeric(10,3),
  expected_gain_max numeric(10,3),
  actual_gain numeric(10,3),
  flags text[] not null default '{}',
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.enteral_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  access_type text not null,
  formula_name text not null,
  kcal numeric(10,2),
  protein_g numeric(10,2),
  volume_ml numeric(10,2),
  rate_ml_h numeric(10,2),
  flush_water_ml numeric(10,2),
  schedule jsonb not null default '[]'::jsonb,
  tolerance_status text,
  complications text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enteral_daily_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.enteral_plans(id) on delete cascade,
  logged_at timestamptz not null default now(),
  residual_ml numeric(10,2),
  diarrhea boolean not null default false,
  vomiting boolean not null default false,
  distension boolean not null default false,
  adherence_pct numeric(5,2),
  observations text,
  created_at timestamptz not null default now()
);

create table if not exists public.sports_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  discipline text not null,
  category text not null,
  position text,
  objective text,
  staff_owner_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sports_bodycomp_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  anthropometry_session_id uuid references public.anthropometry_sessions(id) on delete set null,
  endomorphy numeric(10,3),
  mesomorphy numeric(10,3),
  ectomorphy numeric(10,3),
  fat_pct numeric(10,3),
  lean_mass_kg numeric(10,3),
  skeletal_muscle_kg numeric(10,3),
  notes text,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  pack_id text references public.specialty_packs(id),
  module_id text references public.clinical_modules(id),
  name text not null,
  description text not null,
  format_capabilities text[] not null default array['preview','print','pdf'],
  layout_config jsonb not null default '{}'::jsonb,
  system_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clinical_modules_pack_sort on public.clinical_modules(pack_id, sort_order);
create index if not exists idx_tenant_enabled_modules_tenant on public.tenant_enabled_modules(tenant_id, enabled);
create index if not exists idx_pediatric_growth_tenant_patient on public.pediatric_growth_records(tenant_id, patient_id, measured_at desc);
create index if not exists idx_pregnancy_records_tenant_patient on public.pregnancy_records(tenant_id, patient_id, measured_at desc);
create index if not exists idx_enteral_plans_tenant_patient on public.enteral_plans(tenant_id, patient_id, created_at desc);
create index if not exists idx_enteral_logs_tenant_plan on public.enteral_daily_logs(tenant_id, plan_id, logged_at desc);
create index if not exists idx_sports_profiles_tenant_patient on public.sports_profiles(tenant_id, patient_id);
create index if not exists idx_sports_snapshots_tenant_patient on public.sports_bodycomp_snapshots(tenant_id, patient_id, measured_at desc);
create index if not exists idx_report_templates_scope on public.report_templates(tenant_id, pack_id, module_id);

alter table public.clinical_modules enable row level security;
alter table public.tenant_enabled_modules enable row level security;
alter table public.pediatric_growth_records enable row level security;
alter table public.pregnancy_records enable row level security;
alter table public.enteral_plans enable row level security;
alter table public.enteral_daily_logs enable row level security;
alter table public.sports_profiles enable row level security;
alter table public.sports_bodycomp_snapshots enable row level security;
alter table public.report_templates enable row level security;

drop policy if exists "clinical modules readable" on public.clinical_modules;
create policy "clinical modules readable" on public.clinical_modules for select to authenticated using (true);

drop policy if exists "clinical modules publicly readable" on public.clinical_modules;
create policy "clinical modules publicly readable" on public.clinical_modules for select to anon using (system_enabled = true);

drop policy if exists "tenant modules isolated" on public.tenant_enabled_modules;
create policy "tenant modules isolated" on public.tenant_enabled_modules for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "pediatric growth isolated" on public.pediatric_growth_records;
create policy "pediatric growth isolated" on public.pediatric_growth_records for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "pregnancy records isolated" on public.pregnancy_records;
create policy "pregnancy records isolated" on public.pregnancy_records for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "enteral plans isolated" on public.enteral_plans;
create policy "enteral plans isolated" on public.enteral_plans for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "enteral logs isolated" on public.enteral_daily_logs;
create policy "enteral logs isolated" on public.enteral_daily_logs for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "sports profiles isolated" on public.sports_profiles;
create policy "sports profiles isolated" on public.sports_profiles for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "sports snapshots isolated" on public.sports_bodycomp_snapshots;
create policy "sports snapshots isolated" on public.sports_bodycomp_snapshots for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "report templates isolated" on public.report_templates;
create policy "report templates isolated" on public.report_templates for all to authenticated
using (tenant_id is null or tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id is null or tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

drop policy if exists "report templates publicly readable" on public.report_templates;
create policy "report templates publicly readable" on public.report_templates for select to anon
using (tenant_id is null and system_enabled = true);

insert into public.clinical_modules (
  id, pack_id, slug, name, short_name, description, route_key, default_enabled, sort_order, system_enabled, config_schema
)
values
  ('clinical_caseboard', 'clinical', 'caseboard', 'Caseboard clinico', 'Caseboard', 'Carga operativa, riesgo, seguimientos y casos abiertos del pack clinico.', 'clinical/caseboard', true, 10, true, '{}'::jsonb),
  ('pediatric_curves', 'pediatric', 'curves', 'Curvas pediatricas', 'Curvas', 'Peso/edad, talla/edad, IMC/edad y trayectoria longitudinal.', 'pediatric/curves', true, 20, true, '{}'::jsonb),
  ('gineco_follow_up', 'gineco', 'follow-up', 'Seguimiento gineco', 'Seguimiento', 'Control por trimestre, ganancia gestacional y micronutrientes.', 'gineco/follow-up', true, 30, true, '{}'::jsonb),
  ('enteral_cockpit', 'enteral', 'cockpit', 'Cockpit enteral', 'Cockpit', 'Acceso, formula, volumen, velocidad, tolerancia y checklist diario.', 'enteral/cockpit', true, 40, true, '{}'::jsonb),
  ('sport_somatocarta', 'sport', 'somatocarta', 'Somatocarta', 'Somatocarta', 'Somatotipo, composicion corporal y tendencia deportiva.', 'sport/somatocarta', true, 50, true, '{}'::jsonb)
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
  updated_at = now();

update public.specialty_packs
set default_modules =
  case id
    when 'clinical' then '["clinical_caseboard"]'::jsonb
    when 'pediatric' then '["pediatric_curves"]'::jsonb
    when 'gineco' then '["gineco_follow_up"]'::jsonb
    when 'enteral' then '["enteral_cockpit"]'::jsonb
    when 'sport' then '["sport_somatocarta"]'::jsonb
    else default_modules
  end
where id in ('clinical', 'pediatric', 'gineco', 'enteral', 'sport');

create or replace function public.sync_tenant_module_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.enabled then
    insert into public.tenant_enabled_modules (tenant_id, module_id, enabled, config)
    select new.tenant_id, cm.id, true, '{}'::jsonb
    from public.clinical_modules cm
    where cm.pack_id = new.pack_id
      and cm.default_enabled = true
      and cm.system_enabled = true
    on conflict (tenant_id, module_id) do update
    set enabled = true,
        enabled_at = now();
  else
    update public.tenant_enabled_modules tem
    set enabled = false
    where tem.tenant_id = new.tenant_id
      and tem.module_id in (
        select cm.id
        from public.clinical_modules cm
        where cm.pack_id = new.pack_id
      );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_tenant_modules on public.tenant_enabled_packs;
create trigger trg_sync_tenant_modules
after insert or update of enabled on public.tenant_enabled_packs
for each row
execute function public.sync_tenant_module_defaults();

insert into public.tenant_enabled_modules (tenant_id, module_id, enabled, config)
select tep.tenant_id, cm.id, true, '{}'::jsonb
from public.tenant_enabled_packs tep
join public.clinical_modules cm
  on cm.pack_id = tep.pack_id
 and cm.default_enabled = true
 and cm.system_enabled = true
where tep.enabled = true
on conflict (tenant_id, module_id) do update
set enabled = excluded.enabled,
    enabled_at = now();

insert into public.report_templates (tenant_id, pack_id, module_id, name, description, format_capabilities, layout_config, system_enabled)
values
  (null, 'clinical', 'clinical_caseboard', 'Reporte clinico hospitalario', 'Screening, evaluacion, plan y diagnostico.', array['preview','print','pdf'], '{"theme":"clinical"}'::jsonb, true),
  (null, 'pediatric', 'pediatric_curves', 'Reporte pediatrico con curvas', 'Curvas OMS, percentiles, z-scores y recomendaciones.', array['preview','print','pdf'], '{"theme":"pediatric"}'::jsonb, true),
  (null, 'enteral', 'enteral_cockpit', 'Reporte enteral diario', 'Volumen, tolerancia, checklist y signos digestivos.', array['preview','print','pdf'], '{"theme":"enteral"}'::jsonb, true),
  (null, 'sport', 'sport_somatocarta', 'Reporte antropometrico premium', 'Somatotipo, composicion corporal y tendencia deportiva.', array['preview','print','pdf'], '{"theme":"sport"}'::jsonb, true),
  (null, null, null, 'Reporte ejecutivo institucional', 'KPIs globales, riesgo y carga clinica del tenant.', array['preview','print','pdf'], '{"theme":"executive"}'::jsonb, true)
on conflict do nothing;

insert into public.pediatric_growth_records (
  tenant_id, patient_id, encounter_id, sex, age_months, metric, value, z_score, percentile, standard_ref, measured_at
)
select
  p.tenant_id,
  p.id,
  e.id,
  p.sex,
  v.age_months,
  'weight_for_age',
  v.value,
  v.z_score,
  v.percentile,
  'OMS 2006',
  now() - make_interval(days => 30 * (6 - v.row_no))
from public.patients p
left join public.encounters e on e.patient_id = p.id and e.tenant_id = p.tenant_id
cross join (
  values
    (30, 16.1::numeric, -0.26::numeric, 39.0::numeric, 1),
    (36, 18.4::numeric, 0.72::numeric, 76.0::numeric, 2),
    (42, 21.0::numeric, 1.74::numeric, 91.0::numeric, 3),
    (48, 24.2::numeric, 2.96::numeric, 98.0::numeric, 4),
    (54, 27.8::numeric, 4.21::numeric, 99.5::numeric, 5),
    (60, 31.5::numeric, 5.32::numeric, 99.9::numeric, 6)
) as v(age_months, value, z_score, percentile, row_no)
where p.mrn = 'HSM-48292'
  and not exists (
    select 1
    from public.pediatric_growth_records pgr
    where pgr.patient_id = p.id
      and pgr.metric = 'weight_for_age'
      and pgr.age_months = v.age_months
  );

insert into public.enteral_plans (
  tenant_id, patient_id, encounter_id, access_type, formula_name, kcal, protein_g, volume_ml, rate_ml_h, flush_water_ml, schedule, tolerance_status, complications
)
select
  p.tenant_id,
  p.id,
  e.id,
  'SNG',
  'Formula hiperproteica hiperenergetica',
  1850,
  92,
  1500,
  62,
  300,
  '[{"hour":"06:00","volume_ml":375},{"hour":"12:00","volume_ml":375},{"hour":"18:00","volume_ml":375},{"hour":"00:00","volume_ml":375}]'::jsonb,
  'monitor',
  array['residual_risk']
from public.patients p
left join public.encounters e on e.patient_id = p.id and e.tenant_id = p.tenant_id
where p.mrn = 'HSM-48291'
  and not exists (
    select 1
    from public.enteral_plans ep
    where ep.patient_id = p.id
      and ep.formula_name = 'Formula hiperproteica hiperenergetica'
  );

insert into public.enteral_daily_logs (
  tenant_id, plan_id, logged_at, residual_ml, diarrhea, vomiting, distension, adherence_pct, observations
)
select
  ep.tenant_id,
  ep.id,
  now() - make_interval(hours => v.offset_hours),
  v.residual_ml,
  false,
  false,
  v.distension,
  v.adherence_pct,
  v.observations
from public.enteral_plans ep
join public.patients p on p.id = ep.patient_id
cross join (
  values
    (6, 280::numeric, true, 82::numeric, 'Residuo gastrico elevado, revisar velocidad.'),
    (18, 140::numeric, false, 94::numeric, 'Buena tolerancia durante turno diurno.'),
    (30, 90::numeric, false, 96::numeric, 'Sin eventos digestivos relevantes.')
) as v(offset_hours, residual_ml, distension, adherence_pct, observations)
where p.mrn = 'HSM-48291'
  and not exists (
    select 1
    from public.enteral_daily_logs edl
    where edl.plan_id = ep.id
  );

insert into public.pregnancy_records (
  tenant_id, patient_id, encounter_id, gestational_week, trimester, pre_pregnancy_weight, current_weight, expected_gain_min, expected_gain_max, actual_gain, flags, measured_at
)
select
  p.tenant_id,
  p.id,
  e.id,
  28,
  'T2-T3',
  57.0,
  65.4,
  7.5,
  9.2,
  8.4,
  array['monitor_weight_gain'],
  now() - interval '2 days'
from public.patients p
left join public.encounters e on e.patient_id = p.id and e.tenant_id = p.tenant_id
where p.primary_pack_id = 'gineco'
  and not exists (
    select 1
    from public.pregnancy_records pr
    where pr.patient_id = p.id
  );

insert into public.sports_profiles (
  tenant_id, patient_id, discipline, category, position, objective
)
select
  p.tenant_id,
  p.id,
  'Triatlon',
  'Elite',
  'Endurance',
  'Reducir paniculo adiposo y sostener masa magra'
from public.patients p
where p.mrn = 'EP-777'
  and not exists (
    select 1
    from public.sports_profiles sp
    where sp.patient_id = p.id
  );

insert into public.sports_bodycomp_snapshots (
  tenant_id, patient_id, endomorphy, mesomorphy, ectomorphy, fat_pct, lean_mass_kg, skeletal_muscle_kg, notes, measured_at
)
select
  p.tenant_id,
  p.id,
  1.8,
  5.7,
  3.1,
  8.7,
  64.1,
  35.8,
  'Recomposicion exitosa con reduccion sostenida del componente adiposo.',
  now() - interval '1 day'
from public.patients p
where p.mrn = 'EP-777'
  and not exists (
    select 1
    from public.sports_bodycomp_snapshots sbs
    where sbs.patient_id = p.id
  );
