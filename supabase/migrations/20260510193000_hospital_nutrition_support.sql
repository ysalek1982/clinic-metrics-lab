alter table public.enteral_plans
  add column if not exists nutrition_plan_id uuid references public.nutrition_plans(id),
  add column if not exists formula_type text,
  add column if not exists route text,
  add column if not exists administration_mode text,
  add column if not exists target_volume_ml numeric,
  add column if not exists target_kcal numeric,
  add column if not exists target_protein_g numeric,
  add column if not exists water_flush_ml numeric,
  add column if not exists infusion_rate_ml_h numeric,
  add column if not exists start_date date,
  add column if not exists status text default 'active',
  add column if not exists notes text,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_at timestamptz;

update public.enteral_plans
set
  route = coalesce(route, access_type),
  administration_mode = coalesce(administration_mode, 'continua'),
  target_volume_ml = coalesce(target_volume_ml, volume_ml),
  target_kcal = coalesce(target_kcal, kcal),
  target_protein_g = coalesce(target_protein_g, protein_g),
  water_flush_ml = coalesce(water_flush_ml, flush_water_ml),
  infusion_rate_ml_h = coalesce(infusion_rate_ml_h, rate_ml_h),
  start_date = coalesce(start_date, created_at::date),
  status = coalesce(status, 'active');

alter table public.enteral_daily_logs
  add column if not exists patient_id uuid references public.patients(id),
  add column if not exists delivered_volume_ml numeric,
  add column if not exists delivered_kcal numeric,
  add column if not exists delivered_protein_g numeric,
  add column if not exists gastric_residual_ml numeric,
  add column if not exists abdominal_distension boolean default false,
  add column if not exists aspiration_event boolean default false,
  add column if not exists interruptions text,
  add column if not exists tolerance_status text,
  add column if not exists notes text,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz default now();

update public.enteral_daily_logs l
set
  patient_id = coalesce(l.patient_id, p.patient_id),
  gastric_residual_ml = coalesce(l.gastric_residual_ml, l.residual_ml),
  abdominal_distension = coalesce(l.abdominal_distension, l.distension, false),
  notes = coalesce(l.notes, l.observations),
  tolerance_status = coalesce(l.tolerance_status, p.tolerance_status)
from public.enteral_plans p
where p.id = l.plan_id;

create index if not exists idx_enteral_plans_tenant_patient_status
  on public.enteral_plans(tenant_id, patient_id, status)
  where deleted_at is null;

create index if not exists idx_enteral_logs_tenant_patient_logged
  on public.enteral_daily_logs(tenant_id, patient_id, logged_at desc);

create table if not exists public.parenteral_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  patient_id uuid not null references public.patients(id),
  start_date date,
  status text not null default 'draft',
  total_volume_ml numeric,
  glucose_g numeric,
  amino_acids_g numeric,
  lipids_g numeric,
  electrolytes_notes text,
  micronutrients_notes text,
  monitoring_notes text,
  prescribing_physician text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.parenteral_monitoring_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  parenteral_plan_id uuid not null references public.parenteral_plans(id),
  patient_id uuid not null references public.patients(id),
  logged_at timestamptz not null default now(),
  glucose_mg_dl numeric,
  triglycerides_mg_dl numeric,
  liver_notes text,
  catheter_notes text,
  complications text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_parenteral_plans_tenant_patient_status
  on public.parenteral_plans(tenant_id, patient_id, status)
  where deleted_at is null;

create index if not exists idx_parenteral_logs_tenant_patient_logged
  on public.parenteral_monitoring_logs(tenant_id, patient_id, logged_at desc);

alter table public.parenteral_plans enable row level security;
alter table public.parenteral_monitoring_logs enable row level security;

insert into public.permissions (id, resource, action, scope, description) values
  ('enteral.read', 'enteral', 'read', 'specialty_pack', 'Leer soporte enteral del tenant.'),
  ('enteral.create', 'enteral', 'create', 'specialty_pack', 'Crear planes enterales del tenant.'),
  ('enteral.update', 'enteral', 'update', 'specialty_pack', 'Editar planes enterales del tenant.'),
  ('enteral.log', 'enteral', 'log', 'specialty_pack', 'Registrar controles diarios enterales.'),
  ('enteral.close', 'enteral', 'close', 'specialty_pack', 'Pausar o cerrar planes enterales.'),
  ('parenteral.read', 'parenteral', 'read', 'specialty_pack', 'Leer soporte parenteral del tenant.'),
  ('parenteral.create', 'parenteral', 'create', 'specialty_pack', 'Crear planes parenterales del tenant.'),
  ('parenteral.update', 'parenteral', 'update', 'specialty_pack', 'Editar planes parenterales del tenant.'),
  ('parenteral.log', 'parenteral', 'log', 'specialty_pack', 'Registrar monitoreo parenteral.'),
  ('parenteral.close', 'parenteral', 'close', 'specialty_pack', 'Cerrar planes parenterales.')
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
    ('platform_superadmin', 'enteral.read'),
    ('platform_superadmin', 'enteral.create'),
    ('platform_superadmin', 'enteral.update'),
    ('platform_superadmin', 'enteral.log'),
    ('platform_superadmin', 'enteral.close'),
    ('platform_superadmin', 'parenteral.read'),
    ('platform_superadmin', 'parenteral.create'),
    ('platform_superadmin', 'parenteral.update'),
    ('platform_superadmin', 'parenteral.log'),
    ('platform_superadmin', 'parenteral.close'),
    ('tenant_owner', 'enteral.read'),
    ('tenant_owner', 'enteral.create'),
    ('tenant_owner', 'enteral.update'),
    ('tenant_owner', 'enteral.log'),
    ('tenant_owner', 'enteral.close'),
    ('tenant_owner', 'parenteral.read'),
    ('tenant_owner', 'parenteral.create'),
    ('tenant_owner', 'parenteral.update'),
    ('tenant_owner', 'parenteral.log'),
    ('tenant_owner', 'parenteral.close'),
    ('nutrition_director', 'enteral.read'),
    ('nutrition_director', 'enteral.create'),
    ('nutrition_director', 'enteral.update'),
    ('nutrition_director', 'enteral.log'),
    ('nutrition_director', 'enteral.close'),
    ('nutrition_director', 'parenteral.read'),
    ('nutrition_director', 'parenteral.create'),
    ('nutrition_director', 'parenteral.update'),
    ('nutrition_director', 'parenteral.log'),
    ('nutrition_director', 'parenteral.close'),
    ('clinical_nutritionist', 'enteral.read'),
    ('clinical_nutritionist', 'enteral.create'),
    ('clinical_nutritionist', 'enteral.update'),
    ('clinical_nutritionist', 'enteral.log'),
    ('clinical_nutritionist', 'enteral.close'),
    ('clinical_nutritionist', 'parenteral.read'),
    ('clinical_nutritionist', 'parenteral.create'),
    ('clinical_nutritionist', 'parenteral.update'),
    ('clinical_nutritionist', 'parenteral.log'),
    ('clinical_nutritionist', 'parenteral.close'),
    ('auditor', 'enteral.read'),
    ('auditor', 'parenteral.read')
) as p(role_code, permission_id) on p.role_code = r.code
on conflict (role_id, permission_id) do nothing;

drop policy if exists "enteral plans insert by permission" on public.enteral_plans;
drop policy if exists "enteral plans update by permission" on public.enteral_plans;
drop policy if exists "enteral plans delete by permission" on public.enteral_plans;
drop policy if exists "enteral logs insert by permission" on public.enteral_daily_logs;
drop policy if exists "enteral logs update by permission" on public.enteral_daily_logs;
drop policy if exists "enteral logs delete by permission" on public.enteral_daily_logs;

create policy "enteral plans insert by granular permission" on public.enteral_plans
for insert to authenticated
with check (
  public.has_tenant_permission(tenant_id, 'enteral.create')
  or public.has_tenant_permission(tenant_id, 'enteral.manage')
);

create policy "enteral plans update by granular permission" on public.enteral_plans
for update to authenticated
using (
  public.has_tenant_permission(tenant_id, 'enteral.update')
  or public.has_tenant_permission(tenant_id, 'enteral.close')
  or public.has_tenant_permission(tenant_id, 'enteral.manage')
)
with check (
  public.has_tenant_permission(tenant_id, 'enteral.update')
  or public.has_tenant_permission(tenant_id, 'enteral.close')
  or public.has_tenant_permission(tenant_id, 'enteral.manage')
);

create policy "enteral plans delete by granular permission" on public.enteral_plans
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'enteral.manage'));

create policy "enteral logs insert by granular permission" on public.enteral_daily_logs
for insert to authenticated
with check (
  public.has_tenant_permission(tenant_id, 'enteral.log')
  or public.has_tenant_permission(tenant_id, 'enteral.manage')
);

create policy "enteral logs update by granular permission" on public.enteral_daily_logs
for update to authenticated
using (
  public.has_tenant_permission(tenant_id, 'enteral.log')
  or public.has_tenant_permission(tenant_id, 'enteral.manage')
)
with check (
  public.has_tenant_permission(tenant_id, 'enteral.log')
  or public.has_tenant_permission(tenant_id, 'enteral.manage')
);

create policy "enteral logs delete by granular permission" on public.enteral_daily_logs
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'enteral.manage'));

drop policy if exists "parenteral plans readable by tenant" on public.parenteral_plans;
drop policy if exists "parenteral plans insert by permission" on public.parenteral_plans;
drop policy if exists "parenteral plans update by permission" on public.parenteral_plans;
drop policy if exists "parenteral logs readable by tenant" on public.parenteral_monitoring_logs;
drop policy if exists "parenteral logs insert by permission" on public.parenteral_monitoring_logs;
drop policy if exists "parenteral logs update by permission" on public.parenteral_monitoring_logs;

create policy "parenteral plans readable by tenant" on public.parenteral_plans
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "parenteral plans insert by permission" on public.parenteral_plans
for insert to authenticated
with check (
  public.has_tenant_permission(tenant_id, 'parenteral.create')
  or public.has_tenant_permission(tenant_id, 'parenteral.manage')
);

create policy "parenteral plans update by permission" on public.parenteral_plans
for update to authenticated
using (
  public.has_tenant_permission(tenant_id, 'parenteral.update')
  or public.has_tenant_permission(tenant_id, 'parenteral.close')
)
with check (
  public.has_tenant_permission(tenant_id, 'parenteral.update')
  or public.has_tenant_permission(tenant_id, 'parenteral.close')
);

create policy "parenteral logs readable by tenant" on public.parenteral_monitoring_logs
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "parenteral logs insert by permission" on public.parenteral_monitoring_logs
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'parenteral.log'));

create policy "parenteral logs update by permission" on public.parenteral_monitoring_logs
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'parenteral.log'))
with check (public.has_tenant_permission(tenant_id, 'parenteral.log'));
