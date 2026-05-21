create table if not exists public.report_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  report_type text not null,
  report_name text not null,
  format text not null default 'csv',
  status text not null default 'completed',
  filters jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_report_runs_tenant_created on public.report_runs(tenant_id, created_at desc);

alter table public.report_runs enable row level security;

drop policy if exists "report runs isolated" on public.report_runs;
create policy "report runs isolated" on public.report_runs for all to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

insert into public.nutrition_plans (
  id,
  tenant_id,
  patient_id,
  encounter_id,
  type,
  kcal,
  protein_g,
  carbs_g,
  fat_g,
  fluids_ml,
  diet,
  restrictions,
  goals,
  status,
  version,
  created_by
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '81111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
    'hospitalario',
    1850,
    96,
    210,
    54,
    2200,
    'Hiperproteica',
    array['baja lactosa'],
    '["Optimizar ingesta","Reevaluar en 72 horas"]'::jsonb,
    'draft',
    1,
    'de4f5ec1-2f4d-4b46-9b5b-2e66f35d6f10'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '82222222-2222-4222-8222-222222222222',
    'a2222222-2222-4222-8222-222222222222',
    'deportivo',
    2550,
    145,
    310,
    72,
    3000,
    'Alto rendimiento',
    array[]::text[],
    '["Mantener masa magra","Control semanal"]'::jsonb,
    'active',
    1,
    'de4f5ec1-2f4d-4b46-9b5b-2e66f35d6f10'
  )
on conflict (id) do nothing;

insert into public.report_runs (
  id,
  tenant_id,
  report_type,
  report_name,
  format,
  status,
  filters,
  payload,
  created_by
)
values
  (
    '71000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'clinical',
    'Reporte clinico hospitalario',
    'csv',
    'completed',
    '{"scope":"tenant"}'::jsonb,
    '{"activePatients":2,"highRiskPatients":1,"alerts":3}'::jsonb,
    'de4f5ec1-2f4d-4b46-9b5b-2e66f35d6f10'
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'anthropometry',
    'Reporte antropometrico premium',
    'csv',
    'completed',
    '{"scope":"tenant"}'::jsonb,
    '{"activePatients":1,"highRiskPatients":0,"alerts":1}'::jsonb,
    'de4f5ec1-2f4d-4b46-9b5b-2e66f35d6f10'
  )
on conflict (id) do nothing;

update public.tenant_usage_counters counters
set monthly_reports_count = reports.report_count,
    updated_at = now()
from (
  select tenant_id, count(*)::integer as report_count
  from public.report_runs
  group by tenant_id
) reports
where counters.tenant_id = reports.tenant_id;
