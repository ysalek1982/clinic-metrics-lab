create table if not exists public.lab_markers (
  id uuid primary key default gen_random_uuid(),
  marker_code text unique not null,
  marker_name text not null,
  category text not null,
  default_unit text not null,
  description text,
  nutritional_relevance text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_marker_reference_ranges (
  id uuid primary key default gen_random_uuid(),
  marker_code text not null references public.lab_markers(marker_code) on delete cascade,
  sex text not null default 'any',
  age_min_years numeric(6,2),
  age_max_years numeric(6,2),
  unit text not null,
  reference_low numeric(12,3),
  reference_high numeric(12,3),
  critical_low numeric(12,3),
  critical_high numeric(12,3),
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_interpretations (
  id uuid primary key default gen_random_uuid(),
  marker_code text not null references public.lab_markers(marker_code) on delete cascade,
  status text not null check (status in ('ok', 'out_of_range', 'critical', 'pending')),
  interpretation text not null,
  recommendation text,
  requires_review boolean not null default true,
  source text,
  created_at timestamptz not null default now(),
  unique (marker_code, status)
);

create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  ordered_at timestamptz not null,
  resulted_at timestamptz,
  status text not null default 'resulted' check (status in ('ordered', 'partial', 'resulted', 'cancelled')),
  provider text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lab_order_id uuid not null references public.lab_orders(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  marker_code text not null references public.lab_markers(marker_code),
  marker_name text not null,
  category text not null,
  value numeric(12,3),
  unit text not null,
  reference_low numeric(12,3),
  reference_high numeric(12,3),
  critical_low numeric(12,3),
  critical_high numeric(12,3),
  status text not null check (status in ('ok', 'out_of_range', 'critical', 'pending')),
  previous_value numeric(12,3),
  delta_value numeric(12,3),
  resulted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lab_orders_tenant on public.lab_orders(tenant_id);
create index if not exists idx_lab_orders_patient on public.lab_orders(patient_id);
create index if not exists idx_lab_orders_tenant_patient on public.lab_orders(tenant_id, patient_id);
create index if not exists idx_lab_results_tenant on public.lab_results(tenant_id);
create index if not exists idx_lab_results_patient on public.lab_results(patient_id);
create index if not exists idx_lab_results_order on public.lab_results(lab_order_id);
create index if not exists idx_lab_results_marker on public.lab_results(marker_code);
create index if not exists idx_lab_results_tenant_patient_marker_time on public.lab_results(tenant_id, patient_id, marker_code, resulted_at);

alter table public.lab_markers enable row level security;
alter table public.lab_marker_reference_ranges enable row level security;
alter table public.lab_interpretations enable row level security;
alter table public.lab_orders enable row level security;
alter table public.lab_results enable row level security;

drop policy if exists "lab markers read authenticated" on public.lab_markers;
drop policy if exists "lab ranges read authenticated" on public.lab_marker_reference_ranges;
drop policy if exists "lab interpretations read authenticated" on public.lab_interpretations;
drop policy if exists "lab orders read isolated" on public.lab_orders;
drop policy if exists "lab orders insert isolated" on public.lab_orders;
drop policy if exists "lab orders update isolated" on public.lab_orders;
drop policy if exists "lab results read isolated" on public.lab_results;
drop policy if exists "lab results insert isolated" on public.lab_results;
drop policy if exists "lab results update isolated" on public.lab_results;

create policy "lab markers read authenticated" on public.lab_markers
for select to authenticated using (true);

create policy "lab ranges read authenticated" on public.lab_marker_reference_ranges
for select to authenticated using (true);

create policy "lab interpretations read authenticated" on public.lab_interpretations
for select to authenticated using (true);

create policy "lab orders read isolated" on public.lab_orders
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "lab orders insert isolated" on public.lab_orders
for insert to authenticated
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "lab orders update isolated" on public.lab_orders
for update to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "lab results read isolated" on public.lab_results
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "lab results insert isolated" on public.lab_results
for insert to authenticated
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

create policy "lab results update isolated" on public.lab_results
for update to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin())
with check (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

insert into public.lab_markers (marker_code, marker_name, category, default_unit, description, nutritional_relevance)
values
  ('albumin', 'Albúmina', 'Proteínas viscerales', 'g/dL', 'Proteína sérica sensible al contexto inflamatorio e hidratación.', 'Interpretar junto con PCR, ingesta y balance hídrico.'),
  ('prealbumin', 'Prealbúmina', 'Proteínas viscerales', 'mg/dL', 'Marcador de vida media corta para seguimiento nutricional.', 'Útil en tendencia, no como marcador aislado de estado nutricional.'),
  ('hemoglobin', 'Hemoglobina', 'Hematología', 'g/dL', 'Indicador hematológico para tamizaje de anemia.', 'Correlacionar con hierro, ferritina, VCM e ingesta.'),
  ('glucose', 'Glucosa', 'Metabólico', 'mg/dL', 'Marcador de control glucémico inmediato.', 'Relevante para diabetes, estrés metabólico y soporte nutricional.'),
  ('sodium', 'Sodio', 'Electrolitos', 'mmol/L', 'Electrolito principal para hidratación y seguridad clínica.', 'Vigilar en soporte enteral/parenteral y balance hídrico.'),
  ('potassium', 'Potasio', 'Electrolitos', 'mmol/L', 'Electrolito crítico para función neuromuscular y cardíaca.', 'Riesgo elevado en realimentación, pérdidas digestivas y falla renal.'),
  ('phosphorus', 'Fósforo', 'Electrolitos', 'mg/dL', 'Mineral clave para riesgo de realimentación y metabolismo energético.', 'Descenso puede indicar riesgo de síndrome de realimentación.'),
  ('crp', 'PCR', 'Inflamación', 'mg/L', 'Proteína C reactiva para actividad inflamatoria.', 'Ayuda a contextualizar albúmina/prealbúmina.'),
  ('vitamin_d', 'Vitamina D', 'Micronutrientes', 'ng/mL', 'Marcador de suficiencia de vitamina D.', 'Relevante para salud ósea, pediatría, geriatría y deporte.'),
  ('ferritin', 'Ferritina', 'Hierro', 'ng/mL', 'Reserva corporal de hierro.', 'Interpretar con inflamación y hemograma.')
on conflict (marker_code) do update set
  marker_name = excluded.marker_name,
  category = excluded.category,
  default_unit = excluded.default_unit,
  description = excluded.description,
  nutritional_relevance = excluded.nutritional_relevance,
  is_active = true;

insert into public.lab_marker_reference_ranges (marker_code, sex, unit, reference_low, reference_high, critical_low, critical_high, source)
values
  ('albumin', 'any', 'g/dL', 3.5, 5.2, 2.5, null, 'Demo clínico interno'),
  ('prealbumin', 'any', 'mg/dL', 16, 35, 10, null, 'Demo clínico interno'),
  ('hemoglobin', 'female', 'g/dL', 11.5, 15.5, 8, null, 'Demo clínico interno'),
  ('hemoglobin', 'male', 'g/dL', 13, 17, 8, null, 'Demo clínico interno'),
  ('glucose', 'any', 'mg/dL', 70, 100, 50, 250, 'Demo clínico interno'),
  ('sodium', 'any', 'mmol/L', 135, 145, 125, 155, 'Demo clínico interno'),
  ('potassium', 'any', 'mmol/L', 3.5, 5.1, 2.8, 6.2, 'Demo clínico interno'),
  ('phosphorus', 'any', 'mg/dL', 2.5, 4.5, 1.5, 6.5, 'Demo clínico interno'),
  ('crp', 'any', 'mg/L', 0, 5, null, 40, 'Demo clínico interno'),
  ('vitamin_d', 'any', 'ng/mL', 30, 100, 10, null, 'Demo clínico interno'),
  ('ferritin', 'female', 'ng/mL', 15, 150, 8, null, 'Demo clínico interno'),
  ('ferritin', 'male', 'ng/mL', 30, 300, 10, null, 'Demo clínico interno')
on conflict do nothing;

insert into public.lab_interpretations (marker_code, status, interpretation, recommendation, source)
values
  ('albumin', 'ok', 'Albúmina dentro del rango esperado para el contexto reportado.', 'Mantener seguimiento según evolución clínica.', 'Demo clínico interno'),
  ('albumin', 'out_of_range', 'Albúmina fuera de rango. Debe interpretarse con inflamación, hidratación e ingesta.', 'Cruzar con PCR, balance hídrico y tolerancia nutricional.', 'Demo clínico interno'),
  ('albumin', 'critical', 'Albúmina en rango crítico o de alto riesgo clínico.', 'Priorizar revisión clínica y soporte nutricional individualizado.', 'Demo clínico interno'),
  ('albumin', 'pending', 'Resultado de albúmina pendiente.', 'No interpretar hasta recibir el valor.', 'Demo clínico interno'),
  ('prealbumin', 'ok', 'Prealbúmina dentro de rango esperado.', 'Usar tendencia para seguimiento de respuesta nutricional.', 'Demo clínico interno'),
  ('prealbumin', 'out_of_range', 'Prealbúmina baja o alterada; puede reflejar inflamación o ingesta insuficiente.', 'Revisar ingesta efectiva, PCR y evolución semanal.', 'Demo clínico interno'),
  ('prealbumin', 'critical', 'Prealbúmina críticamente baja.', 'Escalar seguimiento nutricional y médico.', 'Demo clínico interno'),
  ('prealbumin', 'pending', 'Resultado de prealbúmina pendiente.', 'Completar orden bioquímica.', 'Demo clínico interno'),
  ('hemoglobin', 'ok', 'Hemoglobina en rango esperado.', 'Mantener monitoreo según edad, sexo y diagnóstico.', 'Demo clínico interno'),
  ('hemoglobin', 'out_of_range', 'Hemoglobina baja o fuera de rango, compatible con riesgo de anemia.', 'Cruzar con ferritina, VCM e ingesta de hierro.', 'Demo clínico interno'),
  ('hemoglobin', 'critical', 'Hemoglobina en rango crítico.', 'Requiere revisión clínica prioritaria.', 'Demo clínico interno'),
  ('hemoglobin', 'pending', 'Resultado de hemoglobina pendiente.', 'Esperar resultado antes de clasificar anemia.', 'Demo clínico interno'),
  ('glucose', 'ok', 'Glucosa dentro del rango objetivo.', 'Mantener plan actual y monitoreo.', 'Demo clínico interno'),
  ('glucose', 'out_of_range', 'Glucosa fuera de rango.', 'Revisar carga de carbohidratos, estrés metabólico y medicación.', 'Demo clínico interno'),
  ('glucose', 'critical', 'Glucosa en rango crítico.', 'Requiere intervención clínica inmediata.', 'Demo clínico interno'),
  ('glucose', 'pending', 'Resultado de glucosa pendiente.', 'No ajustar conducta hasta confirmar.', 'Demo clínico interno'),
  ('sodium', 'ok', 'Sodio dentro del rango esperado.', 'Mantener seguimiento de hidratación.', 'Demo clínico interno'),
  ('sodium', 'out_of_range', 'Sodio fuera de rango.', 'Revisar balance hídrico y aporte de líquidos.', 'Demo clínico interno'),
  ('sodium', 'critical', 'Sodio en rango crítico.', 'Escalar evaluación médica.', 'Demo clínico interno'),
  ('sodium', 'pending', 'Resultado de sodio pendiente.', 'Completar electrolitos.', 'Demo clínico interno'),
  ('potassium', 'ok', 'Potasio dentro del rango esperado.', 'Mantener monitoreo según protocolo.', 'Demo clínico interno'),
  ('potassium', 'out_of_range', 'Potasio fuera de rango.', 'Revisar pérdidas, función renal y aporte nutricional.', 'Demo clínico interno'),
  ('potassium', 'critical', 'Potasio en rango crítico.', 'Requiere revisión médica urgente.', 'Demo clínico interno'),
  ('potassium', 'pending', 'Resultado de potasio pendiente.', 'Completar electrolitos.', 'Demo clínico interno'),
  ('phosphorus', 'ok', 'Fósforo dentro del rango esperado.', 'Continuar monitoreo en pacientes de riesgo.', 'Demo clínico interno'),
  ('phosphorus', 'out_of_range', 'Fósforo fuera de rango, relevante para riesgo de realimentación.', 'Revisar aporte energético y reposición según criterio médico.', 'Demo clínico interno'),
  ('phosphorus', 'critical', 'Fósforo en rango crítico.', 'Escalar por riesgo metabólico.', 'Demo clínico interno'),
  ('phosphorus', 'pending', 'Resultado de fósforo pendiente.', 'Completar seguimiento de electrolitos.', 'Demo clínico interno'),
  ('crp', 'ok', 'PCR sin elevación relevante.', 'Interpretar marcadores viscerales con menor interferencia inflamatoria.', 'Demo clínico interno'),
  ('crp', 'out_of_range', 'PCR elevada; hay inflamación activa.', 'Contextualizar albúmina y prealbúmina como reactantes negativos.', 'Demo clínico interno'),
  ('crp', 'critical', 'PCR críticamente elevada.', 'Priorizar lectura clínica integral antes de modificar soporte.', 'Demo clínico interno'),
  ('crp', 'pending', 'Resultado de PCR pendiente.', 'No cerrar interpretación inflamatoria.', 'Demo clínico interno'),
  ('vitamin_d', 'ok', 'Vitamina D suficiente.', 'Mantener recomendaciones vigentes.', 'Demo clínico interno'),
  ('vitamin_d', 'out_of_range', 'Vitamina D insuficiente o fuera de rango.', 'Revisar suplementación y exposición solar.', 'Demo clínico interno'),
  ('vitamin_d', 'critical', 'Vitamina D marcadamente baja.', 'Requiere plan de corrección supervisado.', 'Demo clínico interno'),
  ('vitamin_d', 'pending', 'Resultado de vitamina D pendiente.', 'Completar micronutrientes.', 'Demo clínico interno'),
  ('ferritin', 'ok', 'Ferritina dentro de rango esperado.', 'Mantener seguimiento según hemograma.', 'Demo clínico interno'),
  ('ferritin', 'out_of_range', 'Ferritina fuera de rango; posible déficit o efecto inflamatorio.', 'Cruzar con PCR, hemoglobina y VCM.', 'Demo clínico interno'),
  ('ferritin', 'critical', 'Ferritina críticamente baja.', 'Priorizar evaluación de anemia y estrategia de hierro.', 'Demo clínico interno'),
  ('ferritin', 'pending', 'Resultado de ferritina pendiente.', 'No clasificar reservas de hierro hasta confirmar.', 'Demo clínico interno')
on conflict (marker_code, status) do update set
  interpretation = excluded.interpretation,
  recommendation = excluded.recommendation,
  requires_review = excluded.requires_review,
  source = excluded.source;

insert into public.patients (
  id, tenant_id, organization_id, branch_id, service_id, mrn, first_name, last_name, birth_date, sex, status, risk_level,
  primary_pack_id, active_pack_ids, diagnosis_summary, location_label, last_evaluation_at, next_follow_up_at, metadata
)
select
  '81111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111111',
  '41111111-1111-4111-8111-111111111111',
  '51111111-1111-4111-8111-111111111112',
  '71111111-1111-4111-8111-111111111112',
  'HSM-48293',
  'Mariana',
  'Quintero Rios',
  '1995-08-14',
  'female',
  'active',
  'low',
  'gineco',
  array['gineco','clinical'],
  'Embarazo 28 semanas, evolución normal',
  'Materno-infantil',
  '2026-04-22',
  '2026-05-06',
  '{"location":"Materno-infantil"}'::jsonb
where exists (select 1 from public.tenants where id = '11111111-1111-4111-8111-111111111111')
on conflict (id) do update set
  diagnosis_summary = excluded.diagnosis_summary,
  location_label = excluded.location_label,
  updated_at = now();

insert into public.lab_orders (id, tenant_id, patient_id, ordered_at, resulted_at, status, provider, notes)
values
  ('e1111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111', '2026-04-15T08:00:00Z', '2026-04-15T14:00:00Z', 'resulted', 'Laboratorio central', 'Control de ingreso UCI'),
  ('e1111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111', '2026-04-22T08:00:00Z', '2026-04-22T14:22:00Z', 'resulted', 'Laboratorio central', 'Control post soporte enteral'),
  ('e1111111-1111-4111-8111-111111111201', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111112', '2026-04-12T09:00:00Z', '2026-04-12T16:00:00Z', 'resulted', 'Laboratorio pediátrico', 'Control inicial crecimiento'),
  ('e1111111-1111-4111-8111-111111111202', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111112', '2026-04-19T09:00:00Z', '2026-04-19T16:00:00Z', 'resulted', 'Laboratorio pediátrico', 'Control anemia'),
  ('e1111111-1111-4111-8111-111111111301', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111113', '2026-04-08T10:00:00Z', '2026-04-08T17:00:00Z', 'resulted', 'Laboratorio materno infantil', 'Control prenatal'),
  ('e1111111-1111-4111-8111-111111111302', '11111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111113', '2026-04-22T10:00:00Z', null, 'partial', 'Laboratorio materno infantil', 'Ferritina pendiente')
on conflict (id) do update set
  resulted_at = excluded.resulted_at,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();

insert into public.lab_results (
  id, tenant_id, lab_order_id, patient_id, marker_code, marker_name, category, value, unit,
  reference_low, reference_high, critical_low, critical_high, status, previous_value, delta_value, resulted_at
)
values
  ('f1111111-1111-4111-8111-111111110001','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111101','81111111-1111-4111-8111-111111111111','albumin','Albúmina','Proteínas viscerales',3.3,'g/dL',3.5,5.2,2.5,null,'out_of_range',null,null,'2026-04-15T14:00:00Z'),
  ('f1111111-1111-4111-8111-111111110002','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111101','81111111-1111-4111-8111-111111111111','prealbumin','Prealbúmina','Proteínas viscerales',13,'mg/dL',16,35,10,null,'out_of_range',null,null,'2026-04-15T14:00:00Z'),
  ('f1111111-1111-4111-8111-111111110003','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111101','81111111-1111-4111-8111-111111111111','hemoglobin','Hemoglobina','Hematología',11.2,'g/dL',13,17,8,null,'out_of_range',null,null,'2026-04-15T14:00:00Z'),
  ('f1111111-1111-4111-8111-111111110004','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111101','81111111-1111-4111-8111-111111111111','glucose','Glucosa','Metabólico',118,'mg/dL',70,100,50,250,'out_of_range',null,null,'2026-04-15T14:00:00Z'),
  ('f1111111-1111-4111-8111-111111110005','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111101','81111111-1111-4111-8111-111111111111','sodium','Sodio','Electrolitos',136,'mmol/L',135,145,125,155,'ok',null,null,'2026-04-15T14:00:00Z'),
  ('f1111111-1111-4111-8111-111111110006','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111101','81111111-1111-4111-8111-111111111111','potassium','Potasio','Electrolitos',3.7,'mmol/L',3.5,5.1,2.8,6.2,'ok',null,null,'2026-04-15T14:00:00Z'),
  ('f1111111-1111-4111-8111-111111110007','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111101','81111111-1111-4111-8111-111111111111','phosphorus','Fósforo','Electrolitos',2.4,'mg/dL',2.5,4.5,1.5,6.5,'out_of_range',null,null,'2026-04-15T14:00:00Z'),
  ('f1111111-1111-4111-8111-111111110008','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111101','81111111-1111-4111-8111-111111111111','crp','PCR','Inflamación',24,'mg/L',0,5,null,40,'out_of_range',null,null,'2026-04-15T14:00:00Z'),
  ('f1111111-1111-4111-8111-111111110009','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111102','81111111-1111-4111-8111-111111111111','albumin','Albúmina','Proteínas viscerales',2.9,'g/dL',3.5,5.2,2.5,null,'out_of_range',3.3,-0.4,'2026-04-22T14:22:00Z'),
  ('f1111111-1111-4111-8111-111111110010','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111102','81111111-1111-4111-8111-111111111111','prealbumin','Prealbúmina','Proteínas viscerales',9,'mg/dL',16,35,10,null,'critical',13,-4,'2026-04-22T14:22:00Z'),
  ('f1111111-1111-4111-8111-111111110011','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111102','81111111-1111-4111-8111-111111111111','hemoglobin','Hemoglobina','Hematología',10.8,'g/dL',13,17,8,null,'out_of_range',11.2,-0.4,'2026-04-22T14:22:00Z'),
  ('f1111111-1111-4111-8111-111111110012','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111102','81111111-1111-4111-8111-111111111111','glucose','Glucosa','Metabólico',132,'mg/dL',70,100,50,250,'out_of_range',118,14,'2026-04-22T14:22:00Z'),
  ('f1111111-1111-4111-8111-111111110013','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111102','81111111-1111-4111-8111-111111111111','sodium','Sodio','Electrolitos',137,'mmol/L',135,145,125,155,'ok',136,1,'2026-04-22T14:22:00Z'),
  ('f1111111-1111-4111-8111-111111110014','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111102','81111111-1111-4111-8111-111111111111','potassium','Potasio','Electrolitos',3.1,'mmol/L',3.5,5.1,2.8,6.2,'out_of_range',3.7,-0.6,'2026-04-22T14:22:00Z'),
  ('f1111111-1111-4111-8111-111111110015','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111102','81111111-1111-4111-8111-111111111111','phosphorus','Fósforo','Electrolitos',1.4,'mg/dL',2.5,4.5,1.5,6.5,'critical',2.4,-1.0,'2026-04-22T14:22:00Z'),
  ('f1111111-1111-4111-8111-111111110016','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111102','81111111-1111-4111-8111-111111111111','crp','PCR','Inflamación',42,'mg/L',0,5,null,40,'critical',24,18,'2026-04-22T14:22:00Z'),
  ('f1111111-1111-4111-8111-111111110101','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111201','81111111-1111-4111-8111-111111111112','hemoglobin','Hemoglobina','Hematología',11.5,'g/dL',11.5,15.5,8,null,'ok',null,null,'2026-04-12T16:00:00Z'),
  ('f1111111-1111-4111-8111-111111110102','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111201','81111111-1111-4111-8111-111111111112','ferritin','Ferritina','Hierro',18,'ng/mL',15,150,8,null,'ok',null,null,'2026-04-12T16:00:00Z'),
  ('f1111111-1111-4111-8111-111111110103','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111201','81111111-1111-4111-8111-111111111112','vitamin_d','Vitamina D','Micronutrientes',25,'ng/mL',30,100,10,null,'out_of_range',null,null,'2026-04-12T16:00:00Z'),
  ('f1111111-1111-4111-8111-111111110104','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111201','81111111-1111-4111-8111-111111111112','glucose','Glucosa','Metabólico',86,'mg/dL',70,100,50,250,'ok',null,null,'2026-04-12T16:00:00Z'),
  ('f1111111-1111-4111-8111-111111110105','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111202','81111111-1111-4111-8111-111111111112','hemoglobin','Hemoglobina','Hematología',10.8,'g/dL',11.5,15.5,8,null,'out_of_range',11.5,-0.7,'2026-04-19T16:00:00Z'),
  ('f1111111-1111-4111-8111-111111110106','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111202','81111111-1111-4111-8111-111111111112','ferritin','Ferritina','Hierro',null,'ng/mL',15,150,8,null,'pending',18,null,'2026-04-19T16:00:00Z'),
  ('f1111111-1111-4111-8111-111111110107','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111202','81111111-1111-4111-8111-111111111112','vitamin_d','Vitamina D','Micronutrientes',28,'ng/mL',30,100,10,null,'out_of_range',25,3,'2026-04-19T16:00:00Z'),
  ('f1111111-1111-4111-8111-111111110108','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111202','81111111-1111-4111-8111-111111111112','glucose','Glucosa','Metabólico',88,'mg/dL',70,100,50,250,'ok',86,2,'2026-04-19T16:00:00Z'),
  ('f1111111-1111-4111-8111-111111110201','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111301','81111111-1111-4111-8111-111111111113','hemoglobin','Hemoglobina','Hematología',12.2,'g/dL',11.5,15.5,8,null,'ok',null,null,'2026-04-08T17:00:00Z'),
  ('f1111111-1111-4111-8111-111111110202','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111301','81111111-1111-4111-8111-111111111113','ferritin','Ferritina','Hierro',26,'ng/mL',15,150,8,null,'ok',null,null,'2026-04-08T17:00:00Z'),
  ('f1111111-1111-4111-8111-111111110203','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111301','81111111-1111-4111-8111-111111111113','glucose','Glucosa','Metabólico',90,'mg/dL',70,100,50,250,'ok',null,null,'2026-04-08T17:00:00Z'),
  ('f1111111-1111-4111-8111-111111110204','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111302','81111111-1111-4111-8111-111111111113','hemoglobin','Hemoglobina','Hematología',11.9,'g/dL',11.5,15.5,8,null,'ok',12.2,-0.3,'2026-04-22T17:00:00Z'),
  ('f1111111-1111-4111-8111-111111110205','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111302','81111111-1111-4111-8111-111111111113','ferritin','Ferritina','Hierro',null,'ng/mL',15,150,8,null,'pending',26,null,null),
  ('f1111111-1111-4111-8111-111111110206','11111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111302','81111111-1111-4111-8111-111111111113','glucose','Glucosa','Metabólico',86,'mg/dL',70,100,50,250,'ok',90,-4,'2026-04-22T17:00:00Z')
on conflict (id) do update set
  value = excluded.value,
  status = excluded.status,
  previous_value = excluded.previous_value,
  delta_value = excluded.delta_value,
  resulted_at = excluded.resulted_at,
  updated_at = now();
