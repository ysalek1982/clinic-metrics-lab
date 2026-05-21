insert into public.permissions (id, resource, action, scope, description)
values
  ('patients.read', 'patients', 'read', 'tenant', 'Leer pacientes del tenant'),
  ('patients.create', 'patients', 'create', 'tenant', 'Crear pacientes del tenant'),
  ('patients.update', 'patients', 'update', 'tenant', 'Actualizar pacientes del tenant'),
  ('patients.delete', 'patients', 'delete', 'tenant', 'Eliminar logicamente pacientes del tenant'),
  ('encounters.manage', 'encounters', 'manage', 'tenant', 'Crear y gestionar episodios del tenant'),
  ('anthropometry.create', 'anthropometry', 'create', 'tenant', 'Registrar sesiones antropometricas'),
  ('anthropometry.validate', 'anthropometry', 'validate', 'tenant', 'Validar sesiones antropometricas'),
  ('screening.create', 'screening', 'create', 'tenant', 'Registrar screenings nutricionales'),
  ('nutrition_plans.approve', 'nutrition_plans', 'approve', 'tenant', 'Crear y aprobar planes nutricionales'),
  ('reports.export', 'reports', 'export', 'tenant', 'Generar y exportar reportes'),
  ('audit.read', 'audit', 'read', 'tenant', 'Leer auditoria del tenant'),
  ('settings.manage', 'settings', 'manage', 'tenant', 'Administrar configuracion institucional'),
  ('users.manage', 'users', 'manage', 'tenant', 'Administrar usuarios e invitaciones'),
  ('billing.manage', 'billing', 'manage', 'tenant', 'Administrar suscripcion y limites'),
  ('ai.assist', 'ai', 'assist', 'tenant', 'Usar asistencia IA')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

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

-- Patients
drop policy if exists "patients isolated" on public.patients;
drop policy if exists "patients read isolated" on public.patients;
drop policy if exists "patients insert permitted" on public.patients;
drop policy if exists "patients update permitted" on public.patients;
drop policy if exists "patients delete permitted" on public.patients;
create policy "patients read isolated" on public.patients
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "patients insert permitted" on public.patients
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'patients.create'));
create policy "patients update permitted" on public.patients
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'patients.update'))
with check (public.has_tenant_permission(tenant_id, 'patients.update'));
create policy "patients delete permitted" on public.patients
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'patients.delete'));

-- Patient contacts
drop policy if exists "patient contacts isolated" on public.patient_contacts;
drop policy if exists "patient contacts read isolated" on public.patient_contacts;
drop policy if exists "patient contacts insert permitted" on public.patient_contacts;
drop policy if exists "patient contacts update permitted" on public.patient_contacts;
drop policy if exists "patient contacts delete permitted" on public.patient_contacts;
create policy "patient contacts read isolated" on public.patient_contacts
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "patient contacts insert permitted" on public.patient_contacts
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'patients.create'));
create policy "patient contacts update permitted" on public.patient_contacts
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'patients.update'))
with check (public.has_tenant_permission(tenant_id, 'patients.update'));
create policy "patient contacts delete permitted" on public.patient_contacts
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'patients.delete'));

-- Encounters and notes
drop policy if exists "encounters isolated" on public.encounters;
drop policy if exists "encounters read isolated" on public.encounters;
drop policy if exists "encounters insert permitted" on public.encounters;
drop policy if exists "encounters update permitted" on public.encounters;
drop policy if exists "encounters delete permitted" on public.encounters;
create policy "encounters read isolated" on public.encounters
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "encounters insert permitted" on public.encounters
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "encounters update permitted" on public.encounters
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'))
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "encounters delete permitted" on public.encounters
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'));

drop policy if exists "clinical notes isolated" on public.clinical_notes;
drop policy if exists "clinical notes read isolated" on public.clinical_notes;
drop policy if exists "clinical notes insert permitted" on public.clinical_notes;
drop policy if exists "clinical notes update permitted" on public.clinical_notes;
drop policy if exists "clinical notes delete permitted" on public.clinical_notes;
create policy "clinical notes read isolated" on public.clinical_notes
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "clinical notes insert permitted" on public.clinical_notes
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "clinical notes update permitted" on public.clinical_notes
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'))
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "clinical notes delete permitted" on public.clinical_notes
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'));

-- Anthropometry
drop policy if exists "anthro sessions isolated" on public.anthropometry_sessions;
drop policy if exists "anthro sessions read isolated" on public.anthropometry_sessions;
drop policy if exists "anthro sessions insert permitted" on public.anthropometry_sessions;
drop policy if exists "anthro sessions update permitted" on public.anthropometry_sessions;
drop policy if exists "anthro sessions delete permitted" on public.anthropometry_sessions;
create policy "anthro sessions read isolated" on public.anthropometry_sessions
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "anthro sessions insert permitted" on public.anthropometry_sessions
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'anthropometry.create'));
create policy "anthro sessions update permitted" on public.anthropometry_sessions
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'anthropometry.validate'))
with check (public.has_tenant_permission(tenant_id, 'anthropometry.validate'));
create policy "anthro sessions delete permitted" on public.anthropometry_sessions
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'anthropometry.validate'));

drop policy if exists "anthro measurements isolated" on public.anthropometric_measurements;
drop policy if exists "anthro measurements read isolated" on public.anthropometric_measurements;
drop policy if exists "anthro measurements insert permitted" on public.anthropometric_measurements;
drop policy if exists "anthro measurements update permitted" on public.anthropometric_measurements;
drop policy if exists "anthro measurements delete permitted" on public.anthropometric_measurements;
create policy "anthro measurements read isolated" on public.anthropometric_measurements
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "anthro measurements insert permitted" on public.anthropometric_measurements
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'anthropometry.create'));
create policy "anthro measurements update permitted" on public.anthropometric_measurements
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'anthropometry.validate'))
with check (public.has_tenant_permission(tenant_id, 'anthropometry.validate'));
create policy "anthro measurements delete permitted" on public.anthropometric_measurements
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'anthropometry.validate'));

drop policy if exists "derived anthro isolated" on public.derived_anthropometry_results;
drop policy if exists "derived anthro read isolated" on public.derived_anthropometry_results;
drop policy if exists "derived anthro insert permitted" on public.derived_anthropometry_results;
drop policy if exists "derived anthro update permitted" on public.derived_anthropometry_results;
drop policy if exists "derived anthro delete permitted" on public.derived_anthropometry_results;
create policy "derived anthro read isolated" on public.derived_anthropometry_results
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "derived anthro insert permitted" on public.derived_anthropometry_results
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'anthropometry.create'));
create policy "derived anthro update permitted" on public.derived_anthropometry_results
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'anthropometry.validate'))
with check (public.has_tenant_permission(tenant_id, 'anthropometry.validate'));
create policy "derived anthro delete permitted" on public.derived_anthropometry_results
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'anthropometry.validate'));

-- Screening
drop policy if exists "screening results isolated" on public.screening_results;
drop policy if exists "screening results read isolated" on public.screening_results;
drop policy if exists "screening results insert permitted" on public.screening_results;
drop policy if exists "screening results update permitted" on public.screening_results;
drop policy if exists "screening results delete permitted" on public.screening_results;
create policy "screening results read isolated" on public.screening_results
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "screening results insert permitted" on public.screening_results
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'screening.create'));
create policy "screening results update permitted" on public.screening_results
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'screening.create'))
with check (public.has_tenant_permission(tenant_id, 'screening.create'));
create policy "screening results delete permitted" on public.screening_results
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'screening.create'));

drop policy if exists "screening answers isolated" on public.screening_answers;
drop policy if exists "screening answers read isolated" on public.screening_answers;
drop policy if exists "screening answers insert permitted" on public.screening_answers;
drop policy if exists "screening answers update permitted" on public.screening_answers;
drop policy if exists "screening answers delete permitted" on public.screening_answers;
create policy "screening answers read isolated" on public.screening_answers
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "screening answers insert permitted" on public.screening_answers
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'screening.create'));
create policy "screening answers update permitted" on public.screening_answers
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'screening.create'))
with check (public.has_tenant_permission(tenant_id, 'screening.create'));
create policy "screening answers delete permitted" on public.screening_answers
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'screening.create'));

-- Clinical assessments and diagnoses
drop policy if exists "clinical assessments isolated" on public.clinical_assessments;
drop policy if exists "clinical assessments read isolated" on public.clinical_assessments;
drop policy if exists "clinical assessments insert permitted" on public.clinical_assessments;
drop policy if exists "clinical assessments update permitted" on public.clinical_assessments;
drop policy if exists "clinical assessments delete permitted" on public.clinical_assessments;
create policy "clinical assessments read isolated" on public.clinical_assessments
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "clinical assessments insert permitted" on public.clinical_assessments
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "clinical assessments update permitted" on public.clinical_assessments
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'))
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "clinical assessments delete permitted" on public.clinical_assessments
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'));

drop policy if exists "nutrition diagnoses isolated" on public.nutrition_diagnoses;
drop policy if exists "nutrition diagnoses read isolated" on public.nutrition_diagnoses;
drop policy if exists "nutrition diagnoses insert permitted" on public.nutrition_diagnoses;
drop policy if exists "nutrition diagnoses update permitted" on public.nutrition_diagnoses;
drop policy if exists "nutrition diagnoses delete permitted" on public.nutrition_diagnoses;
create policy "nutrition diagnoses read isolated" on public.nutrition_diagnoses
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "nutrition diagnoses insert permitted" on public.nutrition_diagnoses
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "nutrition diagnoses update permitted" on public.nutrition_diagnoses
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'))
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "nutrition diagnoses delete permitted" on public.nutrition_diagnoses
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'));

-- Nutrition plans
drop policy if exists "nutrition plans isolated" on public.nutrition_plans;
drop policy if exists "nutrition plans read isolated" on public.nutrition_plans;
drop policy if exists "nutrition plans insert permitted" on public.nutrition_plans;
drop policy if exists "nutrition plans update permitted" on public.nutrition_plans;
drop policy if exists "nutrition plans delete permitted" on public.nutrition_plans;
create policy "nutrition plans read isolated" on public.nutrition_plans
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "nutrition plans insert permitted" on public.nutrition_plans
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'nutrition_plans.approve'));
create policy "nutrition plans update permitted" on public.nutrition_plans
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'nutrition_plans.approve'))
with check (public.has_tenant_permission(tenant_id, 'nutrition_plans.approve'));
create policy "nutrition plans delete permitted" on public.nutrition_plans
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'nutrition_plans.approve'));

-- Evolution and report trace
drop policy if exists "evolution entries isolated" on public.evolution_entries;
drop policy if exists "evolution entries read isolated" on public.evolution_entries;
drop policy if exists "evolution entries insert permitted" on public.evolution_entries;
drop policy if exists "evolution entries update permitted" on public.evolution_entries;
drop policy if exists "evolution entries delete permitted" on public.evolution_entries;
create policy "evolution entries read isolated" on public.evolution_entries
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "evolution entries insert permitted" on public.evolution_entries
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "evolution entries update permitted" on public.evolution_entries
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'))
with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy "evolution entries delete permitted" on public.evolution_entries
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'encounters.manage'));

drop policy if exists "report runs isolated" on public.report_runs;
drop policy if exists "report runs read isolated" on public.report_runs;
drop policy if exists "report runs insert permitted" on public.report_runs;
drop policy if exists "report runs update permitted" on public.report_runs;
drop policy if exists "report runs delete permitted" on public.report_runs;
create policy "report runs read isolated" on public.report_runs
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
create policy "report runs insert permitted" on public.report_runs
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'reports.export'));
create policy "report runs update permitted" on public.report_runs
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'reports.export'))
with check (public.has_tenant_permission(tenant_id, 'reports.export'));
create policy "report runs delete permitted" on public.report_runs
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'reports.export'));

-- Audit logs are written client-side in v1, so insert is tenant-isolated; read requires audit permission.
drop policy if exists "audit logs isolated" on public.audit_logs;
drop policy if exists "audit logs read permitted" on public.audit_logs;
drop policy if exists "audit logs insert isolated" on public.audit_logs;
create policy "audit logs read permitted" on public.audit_logs
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'audit.read'));
create policy "audit logs insert isolated" on public.audit_logs
for insert to authenticated
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());
