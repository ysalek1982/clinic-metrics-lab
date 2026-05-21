insert into public.subscription_plans (
  id, name, market_position, monthly_price_usd, included_users, active_patient_limit,
  branch_limit, enabled_pack_limit, ai_enabled, white_label_enabled, features
) values
  ('starter', 'Starter', 'Consulta privada y equipos pequenos', 89, 3, 250, 1, 3, false, false, '["Pacientes","Episodios","Planes basicos","Reportes PDF"]'),
  ('professional', 'Professional', 'Clinicas y centros con multiples profesionales', 249, 12, 1500, 3, 8, true, false, '["Packs configurables","Antropometria avanzada","Screening","IA asistida"]'),
  ('enterprise', 'Enterprise', 'Instituciones regionales y redes clinicas', 799, 60, 10000, 12, null, true, true, '["Multi-sede","Roles granulares","Auditoria avanzada","Dashboards ejecutivos"]'),
  ('hospital_enterprise', 'Hospital Enterprise', 'Hospitales de alta complejidad', null, null, null, null, null, true, true, '["UCI","Enteral","Parenteral","Integraciones HIS","SLA enterprise"]'),
  ('sports_performance', 'Sports Performance', 'Alto rendimiento, clubes y federaciones', 399, 20, 1200, 4, 5, true, true, '["Atletas","Somatotipo","Ciclos de entrenamiento","Reportes staff"]'),
  ('custom', 'Custom', 'Implementaciones a medida', null, null, null, null, null, true, true, '["White-label","Integraciones","Soporte dedicado","Data residency"]')
on conflict (id) do update set
  name = excluded.name,
  market_position = excluded.market_position,
  monthly_price_usd = excluded.monthly_price_usd,
  included_users = excluded.included_users,
  active_patient_limit = excluded.active_patient_limit,
  branch_limit = excluded.branch_limit,
  enabled_pack_limit = excluded.enabled_pack_limit,
  ai_enabled = excluded.ai_enabled,
  white_label_enabled = excluded.white_label_enabled,
  features = excluded.features,
  updated_at = now();

insert into public.specialty_packs (id, name, category, description, default_modules) values
  ('clinical', 'Hospital general', 'clinical', 'Nucleo clinico para hospitalizacion y consulta.', '["patients","encounters","screening","plans"]'),
  ('critical_care', 'UCI / paciente critico', 'clinical', 'Soporte nutricional para alta complejidad.', '["screening","enteral","parenteral","alerts"]'),
  ('internal_medicine', 'Medicina interna', 'clinical', 'Seguimiento clinico longitudinal.', '["clinical_assessment","plans","evolution"]'),
  ('surgery', 'Cirugia', 'clinical', 'Pre y postoperatorio nutricional.', '["screening","plans","alerts"]'),
  ('onco', 'Oncologia', 'clinical', 'Riesgo nutricional, caquexia y soporte.', '["screening","plans","reports"]'),
  ('nephro', 'Nefrologia', 'clinical', 'Enfermedad renal y restricciones especializadas.', '["labs","plans","alerts"]'),
  ('gastro', 'Gastroenterologia', 'clinical', 'Sintomas GI, tolerancia e intervenciones.', '["clinical_assessment","enteral","plans"]'),
  ('endocrine', 'Endocrinologia / diabetes / obesidad', 'clinical', 'Control metabolico y recomposicion.', '["anthropometry","plans","analytics"]'),
  ('geriatric', 'Geriatria', 'clinical', 'Fragilidad, sarcopenia y MNA.', '["screening","anthropometry","alerts"]'),
  ('pediatric', 'Pediatria', 'specialty', 'Crecimiento, percentiles y z-scores.', '["growth","screening","reports"]'),
  ('neonatal', 'Neonatologia', 'specialty', 'Prematurez, lactantes y crecimiento temprano.', '["growth","enteral","alerts"]'),
  ('gineco', 'Ginecologia y obstetricia', 'specialty', 'Embarazo, lactancia y micronutrientes.', '["pregnancy","plans","alerts"]'),
  ('enteral', 'Nutricion enteral / sondas', 'support', 'Accesos, formulas, tolerancia y control diario.', '["enteral","monitoring","alerts"]'),
  ('parenteral', 'Nutricion parenteral', 'support', 'Prescripcion, composicion y checklist de seguridad.', '["parenteral","monitoring","audit"]'),
  ('sport', 'Nutricion deportiva y alto rendimiento', 'performance', 'Atletas, ciclos, somatotipo y composicion corporal.', '["sports_profile","anthropometry","reports"]'),
  ('private_practice', 'Consulta privada', 'business', 'Agenda, seguimiento ambulatorio y reportes.', '["patients","plans","reports"]'),
  ('wellness', 'Wellness / recomposicion corporal', 'performance', 'Cambio corporal, adherencia y objetivos.', '["anthropometry","plans","analytics"]'),
  ('occupational_health', 'Salud ocupacional', 'business', 'Programas corporativos y riesgo poblacional.', '["screening","analytics","reports"]'),
  ('rehabilitation', 'Rehabilitacion', 'clinical', 'Recuperacion funcional y soporte nutricional.', '["plans","evolution","alerts"]'),
  ('tele', 'Teleconsulta', 'business', 'Seguimiento remoto y flujos asincronicos.', '["telehealth","tasks","reports"]')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  default_modules = excluded.default_modules;

insert into public.permissions (id, resource, action, scope, description) values
  ('platform.tenants.manage', 'platform.tenants', 'manage', 'platform', 'Administrar tenants de la plataforma'),
  ('billing.manage', 'billing', 'manage', 'tenant', 'Gestionar suscripcion y limites'),
  ('settings.manage', 'tenant.settings', 'manage', 'tenant', 'Configurar branding, packs y protocolos'),
  ('users.manage', 'users', 'manage', 'tenant', 'Invitar usuarios y administrar roles'),
  ('patients.read', 'patients', 'read', 'service', 'Ver pacientes segun alcance asignado'),
  ('patients.create', 'patients', 'create', 'service', 'Crear pacientes'),
  ('patients.update', 'patients', 'update', 'service', 'Editar ficha de paciente'),
  ('encounters.manage', 'encounters', 'manage', 'service', 'Crear y cerrar episodios o casos'),
  ('anthropometry.create', 'anthropometry', 'create', 'specialty_pack', 'Registrar mediciones antropometricas'),
  ('anthropometry.validate', 'anthropometry', 'approve', 'specialty_pack', 'Validar calidad intra/interevaluador'),
  ('screening.create', 'screening', 'create', 'specialty_pack', 'Ejecutar screenings nutricionales'),
  ('nutrition_plans.approve', 'nutrition_plans', 'approve', 'service', 'Aprobar planes nutricionales'),
  ('reports.export', 'reports', 'export', 'tenant', 'Exportar PDF/Excel con branding'),
  ('audit.read', 'audit_logs', 'read', 'tenant', 'Consultar auditoria institucional'),
  ('ai.assist', 'ai_assist', 'create', 'tenant', 'Usar asistente IA con guardrails')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

insert into public.tenants (
  id, slug, name, status, plan_id, institution_type, region, trial_ends_at, renewal_date
) values
  ('11111111-1111-4111-8111-111111111111', 'san-mateo', 'Hospital Universitario San Mateo', 'active', 'hospital_enterprise', 'general_hospital', 'LatAm', null, '2026-12-31'),
  ('22222222-2222-4222-8222-222222222222', 'elite-performance', 'Centro Elite Performance', 'active', 'sports_performance', 'sports_center', 'Global', null, '2027-01-15')
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  status = excluded.status,
  plan_id = excluded.plan_id,
  institution_type = excluded.institution_type,
  region = excluded.region,
  renewal_date = excluded.renewal_date,
  updated_at = now();

insert into public.tenant_settings (
  tenant_id, language, timezone, unit_system, default_follow_up_days,
  strict_formula_versioning, ai_assist_enabled, require_plan_approval
) values
  ('11111111-1111-4111-8111-111111111111', 'es', 'America/Bogota', 'metric', 7, true, true, true),
  ('22222222-2222-4222-8222-222222222222', 'es', 'America/La_Paz', 'metric', 14, true, true, false)
on conflict (tenant_id) do update set
  timezone = excluded.timezone,
  default_follow_up_days = excluded.default_follow_up_days,
  strict_formula_versioning = excluded.strict_formula_versioning,
  ai_assist_enabled = excluded.ai_assist_enabled,
  require_plan_approval = excluded.require_plan_approval,
  updated_at = now();

insert into public.branding_settings (
  tenant_id, commercial_name, logo_initials, primary_color, accent_color
) values
  ('11111111-1111-4111-8111-111111111111', 'San Mateo Nutrition Command', 'HSM', '#13c8df', '#a6e13a'),
  ('22222222-2222-4222-8222-222222222222', 'Elite Performance Nutrition', 'EP', '#a6e13a', '#13c8df')
on conflict (tenant_id) do update set
  commercial_name = excluded.commercial_name,
  logo_initials = excluded.logo_initials,
  primary_color = excluded.primary_color,
  accent_color = excluded.accent_color,
  updated_at = now();

insert into public.tenant_enabled_packs (tenant_id, pack_id, enabled) values
  ('11111111-1111-4111-8111-111111111111', 'clinical', true),
  ('11111111-1111-4111-8111-111111111111', 'pediatric', true),
  ('11111111-1111-4111-8111-111111111111', 'gineco', true),
  ('11111111-1111-4111-8111-111111111111', 'enteral', true),
  ('11111111-1111-4111-8111-111111111111', 'parenteral', true),
  ('11111111-1111-4111-8111-111111111111', 'sport', true),
  ('11111111-1111-4111-8111-111111111111', 'onco', true),
  ('11111111-1111-4111-8111-111111111111', 'geriatric', true),
  ('22222222-2222-4222-8222-222222222222', 'sport', true),
  ('22222222-2222-4222-8222-222222222222', 'wellness', true),
  ('22222222-2222-4222-8222-222222222222', 'clinical', true)
on conflict (tenant_id, pack_id) do update set enabled = excluded.enabled;

insert into public.measurement_sites (
  id, code, name, category, unit, bilateral, required_attempts, tolerance, anatomical_hint, packs
) values
  ('site-weight', 'weight', 'Peso', 'basic', 'kg', false, 2, 0.2, 'Balanza calibrada, ropa ligera, sin calzado.', array['clinical','sport','pediatric','gineco','geriatric','wellness']),
  ('site-height', 'height', 'Talla', 'basic', 'cm', false, 2, 0.5, 'Plano de Frankfurt, talones juntos, inspiracion normal.', array['clinical','sport','pediatric','gineco','geriatric','wellness']),
  ('site-triceps', 'triceps', 'Pliegue tricipital', 'skinfold', 'mm', true, 2, 1.0, 'Linea media posterior del brazo, entre acromiale y radiale.', array['sport','pediatric','geriatric','wellness']),
  ('site-subscapular', 'subscapular', 'Pliegue subescapular', 'skinfold', 'mm', false, 2, 1.0, 'Oblicuo, 2 cm bajo angulo inferior de la escapula.', array['sport','pediatric','wellness']),
  ('site-supraspinale', 'supraspinale', 'Pliegue supraespinal', 'skinfold', 'mm', false, 2, 1.5, 'Interseccion entre iliocristale y borde axilar anterior.', array['sport','wellness']),
  ('site-abdominal', 'abdominal', 'Pliegue abdominal', 'skinfold', 'mm', false, 2, 2.0, 'Vertical, 5 cm lateral al ombligo.', array['sport','wellness','endocrine']),
  ('site-front-thigh', 'front_thigh', 'Pliegue muslo frontal', 'skinfold', 'mm', true, 2, 2.0, 'Linea media anterior del muslo.', array['sport','wellness']),
  ('site-medial-calf', 'medial_calf', 'Pliegue pierna medial', 'skinfold', 'mm', true, 2, 1.5, 'Maxima circunferencia de pantorrilla, cara medial.', array['sport','wellness','geriatric']),
  ('site-waist', 'waist', 'Perimetro cintura', 'girth', 'cm', false, 2, 0.5, 'Punto medio entre ultima costilla e iliocrestale.', array['clinical','sport','endocrine','wellness']),
  ('site-hip', 'hip', 'Perimetro cadera', 'girth', 'cm', false, 2, 0.5, 'Mayor prominencia glutea, cinta horizontal.', array['clinical','sport','endocrine','wellness']),
  ('site-humerus', 'humerus_breadth', 'Diametro humero', 'breadth', 'cm', true, 2, 0.2, 'Epicondilos humerales con antropometro pequeno.', array['sport']),
  ('site-femur', 'femur_breadth', 'Diametro femur', 'breadth', 'cm', true, 2, 0.2, 'Epicondilos femorales con rodilla flexionada.', array['sport'])
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  unit = excluded.unit,
  bilateral = excluded.bilateral,
  required_attempts = excluded.required_attempts,
  tolerance = excluded.tolerance,
  anatomical_hint = excluded.anatomical_hint,
  packs = excluded.packs,
  updated_at = now();

insert into public.measurement_protocols (
  id, name, short_name, description, level, site_ids, required_attempts, quality_rules, packs
) values
  ('protocol-isak-restricted', 'ISAK restringido', 'ISAK-R', 'Base de peso, talla, pliegues y perimetros clave.', 'restricted',
   array['site-weight','site-height','site-triceps','site-subscapular','site-supraspinale','site-abdominal','site-front-thigh','site-medial-calf','site-waist','site-hip'],
   2, '["Delta por sitio dentro de tolerancia","TEM intraevaluador < 2.5%","Formula versionada obligatoria"]', array['sport','wellness','clinical']),
  ('protocol-isak-advanced', 'ISAK avanzado', 'ISAK-A', 'Longitudes, diametros, perimetros y pliegues para somatotipo.', 'advanced',
   array['site-weight','site-height','site-triceps','site-subscapular','site-supraspinale','site-abdominal','site-front-thigh','site-medial-calf','site-waist','site-hip','site-humerus','site-femur'],
   2, '["Doble medicion completa","Revision de outliers","Control interevaluador disponible"]', array['sport']),
  ('protocol-pediatric-growth', 'Crecimiento pediatrico', 'PED-G', 'Antropometria pediatrica con z-scores.', 'clinical',
   array['site-weight','site-height','site-triceps','site-subscapular'],
   2, '["Edad exacta obligatoria","Curva y referencia versionadas","Alerta z-score fuera de rango"]', array['pediatric','neonatal'])
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  level = excluded.level,
  site_ids = excluded.site_ids,
  required_attempts = excluded.required_attempts,
  quality_rules = excluded.quality_rules,
  packs = excluded.packs,
  updated_at = now();

insert into public.formula_library (id, name, category, description, owner, audit_required) values
  ('formula-yuhasz-1987', 'Yuhasz', 'Composicion corporal', 'Estimacion de porcentaje de grasa corporal mediante sumatoria de pliegues.', 'system', true),
  ('formula-carter-heath', 'Carter & Heath', 'Somatotipo', 'Metodo antropometrico para endomorfia, mesomorfia y ectomorfia.', 'system', true),
  ('formula-who-growth', 'OMS Growth Standards', 'Crecimiento pediatrico', 'Z-scores y percentiles para peso/edad, talla/edad e IMC/edad.', 'system', true),
  ('formula-mifflin', 'Mifflin-St Jeor', 'Requerimiento energetico', 'Estimacion de tasa metabolica basal en adultos.', 'system', true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  owner = excluded.owner,
  audit_required = excluded.audit_required,
  updated_at = now();

insert into public.formula_versions (
  id, formula_id, version, status, expression_label, input_site_ids, outputs, applicability, source, clinical_notes, activated_at
) values
  ('fv-yuhasz-1987-1-2', 'formula-yuhasz-1987', '1.2', 'active', '% grasa = a + b * sumatoria pliegues segun sexo/poblacion',
   array['site-triceps','site-subscapular','site-supraspinale','site-abdominal','site-front-thigh','site-medial-calf'],
   array['body_fat_percent','fat_free_mass_kg'],
   '{"minAgeYears":18,"maxAgeYears":45,"sex":"any","packs":["sport","wellness"],"populations":["adult athletes"],"contexts":["performance","body composition"],"requiredProtocolIds":["protocol-isak-restricted","protocol-isak-advanced"]}',
   'Yuhasz MS. Physical Fitness Manual. 1987.', 'Usar con cautela fuera de poblacion deportiva adulta.', now()),
  ('fv-carter-heath-1990-1-0', 'formula-carter-heath', '1.0', 'active', 'Somatotipo = endo + meso + ecto segun pliegues, diametros y talla',
   array['site-height','site-triceps','site-subscapular','site-supraspinale','site-humerus','site-femur'],
   array['somatotype'],
   '{"minAgeYears":14,"sex":"any","packs":["sport"],"populations":["athletes","adolescents"],"contexts":["performance"],"requiredProtocolIds":["protocol-isak-advanced"]}',
   'Carter JEL, Heath BH. Somatotyping. 1990.', 'Requiere diametros y perimetros validados.', now()),
  ('fv-who-growth-2-1', 'formula-who-growth', '2.1', 'active', 'LMS z-score segun edad, sexo y medicion',
   array['site-weight','site-height'],
   array['z_score','percentile'],
   '{"minAgeYears":0,"maxAgeYears":19,"sex":"any","packs":["pediatric","neonatal"],"populations":["children","adolescents"],"contexts":["growth monitoring"],"requiredProtocolIds":["protocol-pediatric-growth"]}',
   'WHO Child Growth Standards and Growth Reference.', 'Requiere edad exacta y seleccion de curva.', now()),
  ('fv-mifflin-1-0', 'formula-mifflin', '1.0', 'active', 'BMR = 10W + 6.25H - 5A + S',
   array['site-weight','site-height'],
   array['bmr'],
   '{"minAgeYears":18,"sex":"any","packs":["clinical","endocrine","wellness","gineco"],"populations":["adults"],"contexts":["nutrition planning"]}',
   'Mifflin MD et al. Am J Clin Nutr. 1990.', 'No reemplaza calorimetria indirecta cuando esta disponible.', now())
on conflict (id) do update set
  status = excluded.status,
  expression_label = excluded.expression_label,
  input_site_ids = excluded.input_site_ids,
  outputs = excluded.outputs,
  applicability = excluded.applicability,
  source = excluded.source,
  clinical_notes = excluded.clinical_notes,
  updated_at = now();

insert into public.screening_templates (
  id, name, description, pack_ids, context, version, scoring, items, rules
) values
  ('screening-nrs-2002', 'NRS-2002', 'Tamizaje hospitalario adulto para riesgo nutricional.',
   array['clinical','enteral','onco','geriatric'], 'hospital', '1.0',
   '{"low":[0,1],"moderate":[2,2],"high":[3,4],"critical":[5,7]}',
   '[{"id":"nrs-weight-loss","label":"Perdida de peso involuntaria","type":"single_choice","required":true},{"id":"nrs-intake","label":"Disminucion de ingesta","type":"single_choice","required":true},{"id":"nrs-disease","label":"Severidad de enfermedad","type":"single_choice","required":true}]',
   '[{"id":"nrs-critical","label":"Score critico","when":"score >= 5","severity":"critical","recommendation":"Intervencion nutricional intensiva y reevaluacion en 48 horas."}]'),
  ('screening-mna-sf', 'MNA-SF', 'Mini Nutritional Assessment para geriatria.',
   array['geriatric','clinical'], 'geriatric', '1.0',
   '{"low":[12,14],"moderate":[8,11],"high":[4,7],"critical":[0,3]}',
   '[{"id":"mna-intake","label":"Disminucion de ingesta en 3 meses","type":"single_choice","required":true},{"id":"mna-weight-loss","label":"Perdida de peso","type":"single_choice","required":true},{"id":"mna-mobility","label":"Movilidad","type":"single_choice","required":true}]',
   '[{"id":"mna-high-risk","label":"Malnutricion probable","when":"score <= 7","severity":"high","recommendation":"Plan hiperproteico, evaluacion funcional y seguimiento semanal."}]'),
  ('screening-stamp', 'STAMP', 'Screening pediatrico hospitalario.',
   array['pediatric','neonatal'], 'pediatric', '1.1',
   '{"low":[0,1],"moderate":[2,3],"high":[4,5],"critical":[6,9]}',
   '[{"id":"stamp-diagnosis","label":"Diagnostico con implicacion nutricional","type":"single_choice","required":true},{"id":"stamp-intake","label":"Ingesta reciente","type":"single_choice","required":true},{"id":"stamp-growth","label":"Crecimiento / peso","type":"single_choice","required":true}]',
   '[{"id":"stamp-growth-alert","label":"Crecimiento comprometido","when":"growth_faltering","severity":"moderate","recommendation":"Registrar z-scores y programar control de crecimiento."}]')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  pack_ids = excluded.pack_ids,
  context = excluded.context,
  version = excluded.version,
  scoring = excluded.scoring,
  items = excluded.items,
  rules = excluded.rules,
  updated_at = now();

insert into public.clinical_rules (
  id, tenant_id, name, scope, trigger_expression, action_expression, severity, enabled
) values
  ('rule-followup-overdue', null, 'Seguimiento vencido', 'patient', 'next_follow_up_at < today', 'create_alert:follow_up', 'moderate', true),
  ('rule-enteral-tolerance', null, 'Tolerancia enteral baja', 'pack', 'enteral.tolerance = poor', 'create_alert:tolerance', 'high', true),
  ('rule-anthro-outlier', null, 'Medicion antropometrica atipica', 'formula', 'measurement_delta > site.tolerance', 'require_repetition', 'moderate', true),
  ('rule-refeeding', null, 'Riesgo de realimentacion', 'screening', 'rapid_weight_loss && severe_low_intake', 'clinical_warning', 'high', true)
on conflict (id) do update set
  name = excluded.name,
  scope = excluded.scope,
  trigger_expression = excluded.trigger_expression,
  action_expression = excluded.action_expression,
  severity = excluded.severity,
  enabled = excluded.enabled,
  updated_at = now();
