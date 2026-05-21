drop policy if exists "audit logs insert isolated" on public.audit_logs;
create policy "audit logs insert isolated" on public.audit_logs
for insert to authenticated
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create or replace function public.create_tenant_invite(
  p_tenant_id uuid,
  p_email text default null,
  p_role_code text default 'clinical_nutritionist',
  p_expires_at timestamptz default null
)
returns table (
  id uuid,
  invite_code text,
  role_code text,
  email text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_actor_membership_id uuid;
  v_is_allowed boolean := false;
  v_invite_id uuid := gen_random_uuid();
  v_invite_code text := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)) || '-' || upper(substr(md5(random()::text || p_tenant_id::text), 1, 6));
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required';
  end if;

  if public.is_platform_superadmin() then
    v_is_allowed := true;
  else
    select tm.id
    into v_actor_membership_id
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = v_actor_user_id
      and tm.status = 'active'
    limit 1;

    if v_actor_membership_id is not null then
      select exists (
        select 1
        from public.membership_roles mr
        join public.roles r on r.id = mr.role_id
        where mr.membership_id = v_actor_membership_id
          and r.code in ('tenant_owner', 'nutrition_director', 'platform_superadmin')
      )
      into v_is_allowed;
    end if;
  end if;

  if not v_is_allowed then
    raise exception 'You do not have permission to create invites for this tenant';
  end if;

  insert into public.tenant_invites (id, tenant_id, email, invite_code, role_code, status, expires_at)
  values (v_invite_id, p_tenant_id, nullif(trim(coalesce(p_email, '')), ''), v_invite_code, p_role_code, 'active', p_expires_at)
  returning tenant_invites.id, tenant_invites.invite_code, tenant_invites.role_code, tenant_invites.email, tenant_invites.expires_at
  into id, invite_code, role_code, email, expires_at;

  return next;
end;
$$;

insert into public.organizations (id, tenant_id, name, type, legal_name, status) values
  ('41111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Hospital Universitario San Mateo', 'general_hospital', 'Hospital Universitario San Mateo S.A.S.', 'active'),
  ('42222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'Centro Elite Performance', 'sports_center', 'Elite Performance Nutrition Lab', 'active')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  legal_name = excluded.legal_name,
  status = excluded.status,
  updated_at = now();

insert into public.branches (id, tenant_id, organization_id, name, city, timezone, status) values
  ('51111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '41111111-1111-4111-8111-111111111111', 'Sede Central', 'Bogota', 'America/Bogota', 'active'),
  ('51111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '41111111-1111-4111-8111-111111111111', 'Torre Materno Infantil', 'Bogota', 'America/Bogota', 'active'),
  ('52222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '42222222-2222-4222-8222-222222222222', 'Performance Lab', 'La Paz', 'America/La_Paz', 'active')
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  timezone = excluded.timezone,
  status = excluded.status,
  updated_at = now();

insert into public.departments (id, tenant_id, organization_id, branch_id, name, clinical_area) values
  ('61111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '41111111-1111-4111-8111-111111111111', '51111111-1111-4111-8111-111111111111', 'UCI y paciente critico', 'Hospitalizacion'),
  ('61111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '41111111-1111-4111-8111-111111111111', '51111111-1111-4111-8111-111111111112', 'Pediatria y crecimiento', 'Materno infantil'),
  ('62222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '42222222-2222-4222-8222-222222222222', '52222222-2222-4222-8222-222222222222', 'Performance nutrition', 'Deportivo')
on conflict (id) do update set
  name = excluded.name,
  clinical_area = excluded.clinical_area,
  updated_at = now();

insert into public.services (id, tenant_id, department_id, name, default_pack_id, care_setting) values
  ('71111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '61111111-1111-4111-8111-111111111111', 'Nutricion clinica UCI', 'enteral', 'inpatient'),
  ('71111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '61111111-1111-4111-8111-111111111112', 'Crecimiento pediatrico', 'pediatric', 'outpatient'),
  ('72222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '62222222-2222-4222-8222-222222222222', 'Nutricion deportiva', 'sport', 'sports')
on conflict (id) do update set
  name = excluded.name,
  default_pack_id = excluded.default_pack_id,
  care_setting = excluded.care_setting,
  updated_at = now();

insert into public.patients (
  id, tenant_id, organization_id, branch_id, service_id, mrn, first_name, last_name, birth_date, sex, status, risk_level,
  primary_pack_id, active_pack_ids, diagnosis_summary, location_label, last_evaluation_at, next_follow_up_at, metadata
) values
  ('81111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '41111111-1111-4111-8111-111111111111', '51111111-1111-4111-8111-111111111111', '71111111-1111-4111-8111-111111111111', 'HSM-48291', 'Andres', 'Mejia Vargas', '1957-04-02', 'male', 'critical', 'critical', 'enteral', array['clinical','enteral','geriatric'], 'EPOC reagudizado, desnutricion severa, disfagia', 'UCI-2 / cama 204', '2026-04-22', '2026-04-24', '{"location":"UCI-2 / cama 204"}'),
  ('81111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '41111111-1111-4111-8111-111111111111', '51111111-1111-4111-8111-111111111112', '71111111-1111-4111-8111-111111111112', 'HSM-48292', 'Sofia', 'Caicedo Lopez', '2018-02-11', 'female', 'monitoring', 'moderate', 'pediatric', array['pediatric','clinical'], 'Retraso pondoestatural leve, anemia ferropenica', 'Consulta externa pediatrica', '2026-04-19', '2026-05-17', '{"location":"Consulta externa pediatrica"}'),
  ('82222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '42222222-2222-4222-8222-222222222222', '52222222-2222-4222-8222-222222222222', '72222222-2222-4222-8222-222222222222', 'EP-777', 'Isabela', 'Tobon Marin', '2002-06-16', 'female', 'active', 'low', 'sport', array['sport'], 'Triatleta elite, fase precompetitiva, hidratacion avanzada', 'Performance Lab', '2026-04-17', '2026-05-01', '{"location":"Performance Lab"}')
on conflict (id) do update set
  diagnosis_summary = excluded.diagnosis_summary,
  location_label = excluded.location_label,
  last_evaluation_at = excluded.last_evaluation_at,
  next_follow_up_at = excluded.next_follow_up_at,
  updated_at = now();

insert into public.patient_contacts (id, tenant_id, patient_id, type, name, value, relationship, is_primary) values
  ('91111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111', 'phone', 'Contacto UCI', '+57-300-000-0001', 'nurse_station', true),
  ('91111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111112', 'phone', 'Madre', '+57-300-000-0002', 'mother', true),
  ('92222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '82222222-2222-4222-8222-222222222222', 'email', 'Staff tecnico', 'staff@eliteperformance.com', 'staff', true)
on conflict (id) do nothing;

insert into public.encounters (id, tenant_id, patient_id, type, title, status, opened_at, owner_user_id, metadata) values
  ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111', 'admission', 'Soporte nutricional enteral UCI', 'open', '2026-04-08T08:00:00Z', null, '{"ward":"UCI"}'),
  ('a1111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111112', 'outpatient', 'Crecimiento pediatrico longitudinal', 'open', '2026-04-19T10:30:00Z', null, '{"clinic":"growth"}'),
  ('a2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '82222222-2222-4222-8222-222222222222', 'sports_season', 'Bloque precompetitivo triatlon', 'open', '2026-03-01T07:00:00Z', null, '{"phase":"pre-competition"}')
on conflict (id) do update set
  title = excluded.title,
  status = excluded.status,
  updated_at = now();

insert into public.clinical_notes (id, tenant_id, patient_id, encounter_id, note_type, title, body, created_by) values
  ('b1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'assessment', 'Evolucion inicial UCI', 'Paciente con mala tolerancia previa. Se reinicia enteral continua con vigilancia cada 24 horas.', null),
  ('b1111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111112', 'a1111111-1111-4111-8111-111111111112', 'growth', 'Control pediatrico', 'Se documenta recuperacion parcial del apetito y plan de suplementacion oral.', null),
  ('b2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '82222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'sports', 'Check precompetitivo', 'Se ajusta hidratacion y estrategia de carbohidratos.', null)
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  updated_at = now();

insert into public.screening_results (
  id, tenant_id, patient_id, encounter_id, template_id, template_version, performed_at, score, risk_level, flags, recommendation, next_review_at, created_by
) values
  ('c1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'screening-nrs-2002', '1.0', '2026-04-22T09:00:00Z', 5, 'critical', array['weight_loss','intake_low'], 'Intervencion intensiva y reevaluacion en 48 horas.', '2026-04-24T09:00:00Z', null),
  ('c1111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111112', 'a1111111-1111-4111-8111-111111111112', 'screening-stamp', '1.1', '2026-04-19T11:00:00Z', 3, 'moderate', array['growth_faltering'], 'Registrar z-scores y seguimiento en 4 semanas.', '2026-05-17T11:00:00Z', null),
  ('c2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '82222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'screening-nrs-2002', '1.0', '2026-04-17T08:00:00Z', 1, 'low', array['hydration_monitoring'], 'Seguimiento de hidratacion y composicion corporal.', '2026-05-01T08:00:00Z', null)
on conflict (id) do nothing;

insert into public.screening_answers (id, tenant_id, screening_result_id, item_id, answer_value, score, flags) values
  ('d1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', 'nrs-weight-loss', '{"value":"severe"}', 2, array['weight_loss']),
  ('d1111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', 'nrs-intake', '{"value":"poor"}', 2, array['intake_low']),
  ('d1111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111112', 'stamp-growth', '{"value":"mild"}', 2, array['growth_faltering']),
  ('d2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'c2222222-2222-4222-8222-222222222222', 'nrs-intake', '{"value":"adequate"}', 1, array[]::text[])
on conflict (id) do nothing;

insert into public.anthropometry_sessions (
  id, tenant_id, patient_id, encounter_id, protocol_id, evaluator_user_id, measured_at, quality_index, formula_version_ids, notes
) values
  ('e1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111112', 'a1111111-1111-4111-8111-111111111112', 'protocol-pediatric-growth', null, '2026-04-19T10:45:00Z', 96.4, array['fv-who-growth-2-1'], 'Control pediatrico seriado'),
  ('e2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '82222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'protocol-isak-restricted', null, '2026-04-17T07:45:00Z', 98.1, array['fv-yuhasz-1987-1-2','fv-carter-heath-1990-1-0'], 'Sesion de composicion corporal precompetitiva')
on conflict (id) do nothing;

insert into public.anthropometric_measurements (id, tenant_id, session_id, site_id, attempt, value, unit, quality_flag) values
  ('f1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111', 'site-weight', 1, 21.300, 'kg', null),
  ('f1111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111', 'site-height', 1, 116.400, 'cm', null),
  ('f2222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222222', 'e2222222-2222-4222-8222-222222222222', 'site-weight', 1, 58.200, 'kg', null),
  ('f2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'e2222222-2222-4222-8222-222222222222', 'site-height', 1, 168.000, 'cm', null),
  ('f2222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222222', 'e2222222-2222-4222-8222-222222222222', 'site-triceps', 1, 8.100, 'mm', null),
  ('f2222222-2222-4222-8222-222222222224', '22222222-2222-4222-8222-222222222222', 'e2222222-2222-4222-8222-222222222222', 'site-subscapular', 1, 9.000, 'mm', null)
on conflict (id) do nothing;

insert into public.derived_anthropometry_results (id, tenant_id, session_id, formula_version_id, output_type, value, value_json, unit, interpretation) values
  ('a3111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111', 'fv-who-growth-2-1', 'z_score', null, '{"weight_for_age":-1.2,"height_for_age":-0.8}', null, 'Seguimiento estrecho'),
  ('a3222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222222', 'e2222222-2222-4222-8222-222222222222', 'fv-yuhasz-1987-1-2', 'body_fat_percent', 14.6000, null, '%', 'Composicion corporal objetivo'),
  ('a3222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'e2222222-2222-4222-8222-222222222222', 'fv-carter-heath-1990-1-0', 'somatotype', null, '{"endo":2.4,"meso":3.8,"ecto":2.1}', null, 'Mesomorfo balanceado')
on conflict (id) do nothing;

insert into public.clinical_assessments (
  id, tenant_id, patient_id, encounter_id, sections, diagnosis_problem, diagnosis_etiology, diagnosis_signs_symptoms, conduct, status, created_by
) values
  ('b3111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', '[{"id":"history","status":"complete"},{"id":"gi","status":"complete"}]', 'Desnutricion severa asociada a enfermedad respiratoria', 'Ingesta insuficiente y disfagia', 'Perdida de peso reciente, intolerancia oral', 'Continuar enteral continua y monitorizar tolerancia.', 'draft', null),
  ('b3222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '82222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', '[{"id":"hydration","status":"complete"},{"id":"performance","status":"complete"}]', 'Ajuste fino de composicion corporal precompetitiva', 'Incremento de carga y objetivo competitivo', 'Peso estable y necesidad de estrategia de CHO', 'Mantener protocolo de hidratacion y redistribucion de macros.', 'draft', null)
on conflict (id) do nothing;

insert into public.audit_logs (id, tenant_id, actor_user_id, event_type, entity_type, entity_id, before_data, after_data) values
  ('c3111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', null, 'patient.seed', 'patients', '81111111-1111-4111-8111-111111111111', null, '{"mrn":"HSM-48291"}'),
  ('c3111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', null, 'screening.seed', 'screening_results', 'c1111111-1111-4111-8111-111111111111', null, '{"score":5,"risk_level":"critical"}'),
  ('c3222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', null, 'anthropometry.seed', 'anthropometry_sessions', 'e2222222-2222-4222-8222-222222222222', null, '{"quality_index":98.1}')
on conflict (id) do nothing;

update public.tenant_usage_counters
set active_patients_count = case
  when tenant_id = '11111111-1111-4111-8111-111111111111' then 2
  when tenant_id = '22222222-2222-4222-8222-222222222222' then 1
  else active_patients_count
end,
updated_at = now()
where tenant_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
