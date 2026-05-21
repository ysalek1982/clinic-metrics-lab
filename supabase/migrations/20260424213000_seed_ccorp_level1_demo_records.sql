insert into public.ccorp_level1_assessments (
  id,
  tenant_id,
  organization_id,
  patient_id,
  encounter_id,
  measured_at,
  birth_date_snapshot,
  age_decimal,
  sex,
  formula_version,
  status,
  notes
) values
  (
    'c1010000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '41111111-1111-4111-8111-111111111111',
    '81111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
    '2026-04-24',
    '1957-04-02',
    69.060,
    'male',
    'ccorp-level-1-excel-2026-04-24',
    'completed',
    'Registro seed controlado para validar CCORP Nivel 1 con paciente hospitalario.'
  ),
  (
    'c2020000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '42222222-2222-4222-8222-222222222222',
    '82222222-2222-4222-8222-222222222222',
    'a2222222-2222-4222-8222-222222222222',
    '2026-04-24',
    '2002-06-16',
    23.856,
    'female',
    'ccorp-level-1-excel-2026-04-24',
    'completed',
    'Registro seed controlado para validar CCORP Nivel 1 en contexto deportivo.'
  )
on conflict (id) do update set
  measured_at = excluded.measured_at,
  birth_date_snapshot = excluded.birth_date_snapshot,
  age_decimal = excluded.age_decimal,
  sex = excluded.sex,
  formula_version = excluded.formula_version,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();

insert into public.ccorp_level1_measurements (
  tenant_id, assessment_id, variable_code, variable_label, category, unit,
  series_1, series_2, series_3, series_4, series_5, median_value
) values
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','weight_kg','Peso bruto','basic','kg',63.2,63.4,63.5,null,null,63.4),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','height_cm','Talla corporal','basic','cm',169.1,169.2,169.3,null,null,169.2),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','humeral_biepicondylar_cm','Humeral biepicondilar','diameter','cm',6.7,6.8,6.9,null,null,6.8),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','femoral_biepicondylar_cm','Femoral biepicondilar','diameter','cm',9.1,9.2,9.3,null,null,9.2),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','relaxed_arm_cm','Brazo relajado','girth','cm',27.2,27.4,27.5,null,null,27.4),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','flexed_arm_cm','Brazo flexionado en tension','girth','cm',29.0,29.1,29.3,null,null,29.1),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','waist_min_cm','Cintura minima','girth','cm',83.2,83.5,83.7,null,null,83.5),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','hip_max_cm','Cadera maxima','girth','cm',91.0,91.2,91.4,null,null,91.2),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','calf_max_cm','Pantorrilla maxima','girth','cm',31.6,31.8,31.9,null,null,31.8),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','triceps_mm','Triceps','skinfold','mm',7.6,7.8,8.0,null,null,7.8),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','subscapular_mm','Subescapular','skinfold','mm',10.2,10.4,10.5,null,null,10.4),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','biceps_mm','Biceps','skinfold','mm',4.4,4.6,4.7,null,null,4.6),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','iliac_crest_mm','Cresta iliaca','skinfold','mm',12.0,12.1,12.3,null,null,12.1),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','supraspinale_mm','Supraespinal','skinfold','mm',9.5,9.7,9.8,null,null,9.7),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','abdominal_mm','Abdominal','skinfold','mm',14.6,14.8,15.0,null,null,14.8),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','medial_thigh_mm','Muslo medial','skinfold','mm',11.2,11.4,11.6,null,null,11.4),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','calf_skinfold_mm','Pantorrilla','skinfold','mm',7.0,7.2,7.3,null,null,7.2),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','weight_kg','Peso bruto','basic','kg',58.4,58.6,58.8,null,null,58.6),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','height_cm','Talla corporal','basic','cm',170.3,170.4,170.5,null,null,170.4),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','humeral_biepicondylar_cm','Humeral biepicondilar','diameter','cm',6.1,6.2,6.3,null,null,6.2),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','femoral_biepicondylar_cm','Femoral biepicondilar','diameter','cm',8.7,8.8,8.9,null,null,8.8),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','relaxed_arm_cm','Brazo relajado','girth','cm',25.4,25.6,25.7,null,null,25.6),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','flexed_arm_cm','Brazo flexionado en tension','girth','cm',27.7,27.9,28.0,null,null,27.9),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','waist_min_cm','Cintura minima','girth','cm',66.2,66.4,66.6,null,null,66.4),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','hip_max_cm','Cadera maxima','girth','cm',91.3,91.5,91.7,null,null,91.5),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','calf_max_cm','Pantorrilla maxima','girth','cm',35.0,35.2,35.3,null,null,35.2),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','triceps_mm','Triceps','skinfold','mm',9.2,9.4,9.5,null,null,9.4),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','subscapular_mm','Subescapular','skinfold','mm',8.0,8.1,8.3,null,null,8.1),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','biceps_mm','Biceps','skinfold','mm',4.6,4.8,4.9,null,null,4.8),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','iliac_crest_mm','Cresta iliaca','skinfold','mm',10.4,10.6,10.7,null,null,10.6),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','supraspinale_mm','Supraespinal','skinfold','mm',8.5,8.7,8.8,null,null,8.7),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','abdominal_mm','Abdominal','skinfold','mm',12.0,12.2,12.4,null,null,12.2),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','medial_thigh_mm','Muslo medial','skinfold','mm',13.2,13.4,13.5,null,null,13.4),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','calf_skinfold_mm','Pantorrilla','skinfold','mm',8.7,8.9,9.0,null,null,8.9)
on conflict (assessment_id, variable_code) do update set
  series_1 = excluded.series_1,
  series_2 = excluded.series_2,
  series_3 = excluded.series_3,
  series_4 = excluded.series_4,
  series_5 = excluded.series_5,
  median_value = excluded.median_value,
  updated_at = now();

insert into public.ccorp_level1_results (
  tenant_id, assessment_id, bmi, waist_hip_ratio, sum_6_skinfolds,
  durnin_body_density_male, durnin_body_density_female, durnin_body_fat_percent,
  durnin_fat_mass_kg, durnin_fat_free_mass_kg, durnin_fmi, durnin_ffmi,
  withers_body_fat_percent, withers_fat_mass_kg, withers_fat_free_mass_kg,
  withers_fmi, withers_ffmi, arm_muscle_area_mm2,
  endomorphy, mesomorphy, ectomorphy, hwr, somato_x, somato_y, warnings
) values
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001',22.15,0.916,61.30,1.06171,1.04608,16.23,10.29,53.11,3.59,18.55,11.56,7.33,56.07,2.56,19.58,49.57,2.85,4.03,2.49,42.44,-0.36,2.72,array[]::text[]),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002',20.18,0.726,60.70,1.06362,1.04792,22.37,13.11,45.49,4.51,15.67,15.61,9.15,49.45,3.15,17.03,40.84,2.64,3.38,3.54,43.88,0.90,0.58,array[]::text[])
on conflict (assessment_id) do update set
  bmi = excluded.bmi,
  waist_hip_ratio = excluded.waist_hip_ratio,
  sum_6_skinfolds = excluded.sum_6_skinfolds,
  durnin_body_density_male = excluded.durnin_body_density_male,
  durnin_body_density_female = excluded.durnin_body_density_female,
  durnin_body_fat_percent = excluded.durnin_body_fat_percent,
  durnin_fat_mass_kg = excluded.durnin_fat_mass_kg,
  durnin_fat_free_mass_kg = excluded.durnin_fat_free_mass_kg,
  durnin_fmi = excluded.durnin_fmi,
  durnin_ffmi = excluded.durnin_ffmi,
  withers_body_fat_percent = excluded.withers_body_fat_percent,
  withers_fat_mass_kg = excluded.withers_fat_mass_kg,
  withers_fat_free_mass_kg = excluded.withers_fat_free_mass_kg,
  withers_fmi = excluded.withers_fmi,
  withers_ffmi = excluded.withers_ffmi,
  arm_muscle_area_mm2 = excluded.arm_muscle_area_mm2,
  endomorphy = excluded.endomorphy,
  mesomorphy = excluded.mesomorphy,
  ectomorphy = excluded.ectomorphy,
  hwr = excluded.hwr,
  somato_x = excluded.somato_x,
  somato_y = excluded.somato_y,
  warnings = excluded.warnings,
  updated_at = now();

insert into public.ccorp_level1_ideal_weight_targets (
  tenant_id, assessment_id, method, target_body_fat_percent, target_ffmi,
  ideal_weight_kg, target_fat_mass_kg, fat_to_lose_kg, target_fat_free_mass_kg, lean_mass_to_gain_kg
) values
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','durnin',12,19,60.35,7.24,3.05,54.40,1.29),
  ('11111111-1111-4111-8111-111111111111','c1010000-0000-4000-8000-000000000001','withers',10,20,62.30,6.23,1.10,57.26,1.19),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','durnin',18,19,55.48,9.99,3.12,55.17,9.68),
  ('22222222-2222-4222-8222-222222222222','c2020000-0000-4000-8000-000000000002','withers',16,20,58.87,9.42,-0.27,58.09,8.64)
on conflict (assessment_id, method) do update set
  target_body_fat_percent = excluded.target_body_fat_percent,
  target_ffmi = excluded.target_ffmi,
  ideal_weight_kg = excluded.ideal_weight_kg,
  target_fat_mass_kg = excluded.target_fat_mass_kg,
  fat_to_lose_kg = excluded.fat_to_lose_kg,
  target_fat_free_mass_kg = excluded.target_fat_free_mass_kg,
  lean_mass_to_gain_kg = excluded.lean_mass_to_gain_kg,
  updated_at = now();
