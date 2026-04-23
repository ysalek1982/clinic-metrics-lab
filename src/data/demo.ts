import type { Patient, Alert, AnthropometrySession, ScreeningResult, EvolutionEntry, NutritionPlan } from "@/types/domain";

// ============================================================
// DEMO DATA — Realistic across multiple specialty packs
// ============================================================

export const DEMO_ORG = {
  id: "org-1",
  name: "Hospital Universitario San Mateo",
  type: "hospital" as const,
  branches: ["Sede Central", "Torre Materno-Infantil", "Centro de Alto Rendimiento"],
  activePacks: ["clinical", "pediatric", "gineco", "enteral", "sport", "geriatric"] as const,
};

export const DEMO_USER = {
  id: "u-1",
  name: "Dra. Camila Restrepo",
  email: "c.restrepo@sanmateo.health",
  role: "nut_director" as const,
  org_id: "org-1",
  initials: "CR",
};

export const PATIENTS: Patient[] = [
  {
    id: "p-001", mrn: "HSM-48291", firstName: "Andrés", lastName: "Mejía Vargas",
    birthDate: "1957-03-12", sex: "male", status: "critical", risk: "critical",
    primaryPack: "enteral", packs: ["clinical", "enteral", "geriatric"],
    diagnoses: ["EPOC reagudizado", "Desnutrición severa", "Disfagia orofaríngea"],
    allergies: ["Lactosa"], ward: "UCI-2", bed: "204", admissionDate: "2025-04-08",
    attendingPhysician: "Dr. M. Ortega", lastEvaluation: "2025-04-22", nextFollowUp: "2025-04-24",
    enteral: { tubeType: "Nasogástrica 12Fr", formula: "Hipercalórica hiperproteica", rateMlH: 65, totalKcal: 1850, tolerance: "moderate" },
  },
  {
    id: "p-002", mrn: "HSM-48292", firstName: "Sofía", lastName: "Caicedo López",
    birthDate: "2018-09-04", sex: "female", status: "monitoring", risk: "moderate",
    primaryPack: "pediatric", packs: ["pediatric", "clinical"],
    diagnoses: ["Retraso pondoestatural leve", "Anemia ferropénica"],
    allergies: ["Huevo"], ward: "Consulta Externa Ped.", lastEvaluation: "2025-04-19", nextFollowUp: "2025-05-17",
    pediatric: { weightForAgeZ: -1.4, heightForAgeZ: -1.1, bmiForAgeZ: -1.0 },
  },
  {
    id: "p-003", mrn: "HSM-48293", firstName: "Mariana", lastName: "Quintero Ríos",
    birthDate: "1994-11-23", sex: "female", status: "stable", risk: "low",
    primaryPack: "gineco", packs: ["gineco", "clinical"],
    diagnoses: ["Embarazo 28sg, evolución normal"],
    allergies: [], ward: "Materno-Infantil", lastEvaluation: "2025-04-15", nextFollowUp: "2025-04-29",
    pregnancy: { weeksGestation: 28, prePregnancyWeight: 58.2, expectedGain: [9, 12], actualGain: 8.4 },
  },
  {
    id: "p-004", mrn: "CAR-00112", firstName: "Diego", lastName: "Alzate Pineda",
    birthDate: "2000-06-30", sex: "male", status: "stable", risk: "low",
    primaryPack: "sport", packs: ["sport", "wellness"],
    diagnoses: ["Atleta de alto rendimiento"], allergies: [],
    ward: "Centro Alto Rendimiento", lastEvaluation: "2025-04-18", nextFollowUp: "2025-05-02",
    sport: { discipline: "Ciclismo de ruta", position: "Escalador", category: "Élite Sub-25", phase: "Mesociclo de competencia", objective: "Recomposición + rendimiento" },
  },
  {
    id: "p-005", mrn: "HSM-48295", firstName: "Beatriz", lastName: "Hoyos Zapata",
    birthDate: "1942-01-18", sex: "female", status: "at_risk", risk: "high",
    primaryPack: "geriatric", packs: ["geriatric", "clinical"],
    diagnoses: ["Sarcopenia confirmada", "Fragilidad", "HTA"], allergies: ["Penicilina"],
    ward: "Hospitalización 4B", bed: "412", admissionDate: "2025-04-14",
    attendingPhysician: "Dra. L. Pardo", lastEvaluation: "2025-04-21", nextFollowUp: "2025-04-23",
  },
  {
    id: "p-006", mrn: "HSM-48296", firstName: "Lucas", lastName: "Bermúdez Ortiz",
    birthDate: "2024-12-05", sex: "male", status: "monitoring", risk: "moderate",
    primaryPack: "neonatal", packs: ["neonatal", "pediatric"],
    diagnoses: ["Prematuro tardío 35sg", "Bajo peso al nacer"], allergies: [],
    ward: "Neonatos", lastEvaluation: "2025-04-22", nextFollowUp: "2025-04-23",
    pediatric: { gestationalAgeWeeks: 35, weightForAgeZ: -1.8 },
  },
  {
    id: "p-007", mrn: "HSM-48297", firstName: "Valentina", lastName: "Salazar Ríos",
    birthDate: "1988-07-14", sex: "female", status: "stable", risk: "low",
    primaryPack: "clinical", packs: ["clinical", "endocrine"],
    diagnoses: ["DM2 controlada", "Sobrepeso grado I"], allergies: [],
    ward: "Consulta Externa", lastEvaluation: "2025-04-10", nextFollowUp: "2025-05-10",
  },
  {
    id: "p-008", mrn: "HSM-48298", firstName: "Jerónimo", lastName: "Cardona Soto",
    birthDate: "1975-02-28", sex: "male", status: "at_risk", risk: "high",
    primaryPack: "clinical", packs: ["clinical", "onco"],
    diagnoses: ["CA gástrico en QT", "Pérdida de peso 8% en 30d"], allergies: [],
    ward: "Oncología", admissionDate: "2025-04-11", lastEvaluation: "2025-04-20", nextFollowUp: "2025-04-25",
  },
  {
    id: "p-009", mrn: "CAR-00118", firstName: "Isabela", lastName: "Tobón Marín",
    birthDate: "2002-08-09", sex: "female", status: "stable", risk: "low",
    primaryPack: "sport", packs: ["sport"],
    diagnoses: ["Atleta resistencia"], allergies: ["Frutos secos"],
    ward: "Centro Alto Rendimiento", lastEvaluation: "2025-04-17", nextFollowUp: "2025-05-01",
    sport: { discipline: "Triatlón", category: "Élite", phase: "Pre-competitivo", objective: "Mantenimiento + hidratación" },
  },
  {
    id: "p-010", mrn: "HSM-48299", firstName: "Tomás", lastName: "Zuluaga Vélez",
    birthDate: "2015-04-22", sex: "male", status: "monitoring", risk: "moderate",
    primaryPack: "pediatric", packs: ["pediatric", "endocrine"],
    diagnoses: ["Obesidad infantil", "Resistencia a insulina"], allergies: [],
    ward: "Consulta Externa Ped.", lastEvaluation: "2025-04-16", nextFollowUp: "2025-05-14",
    pediatric: { weightForAgeZ: 2.1, heightForAgeZ: 0.4, bmiForAgeZ: 2.4 },
  },
];

export const ALERTS: Alert[] = [
  { id: "a-1", patientId: "p-001", patientName: "Andrés Mejía", ward: "UCI-2", type: "tolerance", severity: "critical",
    message: "Residuo gástrico > 250ml en últimas 6h. Revisar velocidad de infusión.", createdAt: "2025-04-22T14:22:00" },
  { id: "a-2", patientId: "p-008", patientName: "Jerónimo Cardona", ward: "Oncología", type: "weight_loss", severity: "high",
    message: "Pérdida ponderal 8.1% en 30 días. Iniciar soporte nutricional.", createdAt: "2025-04-22T09:10:00" },
  { id: "a-3", patientId: "p-005", patientName: "Beatriz Hoyos", ward: "4B-412", type: "nutritional_risk", severity: "high",
    message: "MNA-SF: 6/14. Riesgo alto de malnutrición. Plan hipercalórico.", createdAt: "2025-04-21T18:45:00" },
  { id: "a-4", patientId: "p-003", patientName: "Mariana Quintero", type: "missing_data", severity: "moderate",
    message: "Ferritina pendiente — sem 28 sin laboratorio actualizado.", createdAt: "2025-04-22T11:00:00" },
  { id: "a-5", patientId: "p-006", patientName: "Lucas Bermúdez", ward: "Neonatos", type: "follow_up", severity: "moderate",
    message: "Ganancia ponderal por debajo de p10 últimas 48h.", createdAt: "2025-04-22T07:30:00" },
  { id: "a-6", patientId: "p-002", patientName: "Sofía Caicedo", type: "lab_value", severity: "low",
    message: "Hb 10.8 g/dL — control en 4 semanas.", createdAt: "2025-04-19T16:00:00" },
];

// Anthropometry sessions for sport patient (rich timeline)
export const ANTHRO_SESSIONS: AnthropometrySession[] = [
  {
    id: "ant-1", patientId: "p-004", date: "2025-01-15", evaluator: "Antrop. J. Pulido",
    protocol: "ISAK Restringido", formulaVersionId: "fv-yuhasz-1987", qualityIndex: 96,
    measurements: [
      { site: "Peso", value: 71.2, unit: "kg", category: "basic" },
      { site: "Talla", value: 178.5, unit: "cm", category: "basic" },
      { site: "Tríceps", value: 9.8, unit: "mm", category: "skinfold" },
      { site: "Subescapular", value: 10.2, unit: "mm", category: "skinfold" },
      { site: "Supraespinal", value: 7.5, unit: "mm", category: "skinfold" },
      { site: "Abdominal", value: 14.0, unit: "mm", category: "skinfold" },
      { site: "Muslo frontal", value: 12.5, unit: "mm", category: "skinfold" },
      { site: "Pierna medial", value: 8.2, unit: "mm", category: "skinfold" },
    ],
    derived: { bmi: 22.3, sumSkinfolds6: 62.2, fatMassPct: 9.2, fatFreeMassKg: 64.6, muscleMassKg: 35.1, somatotype: { endo: 2.1, meso: 5.4, ecto: 2.8 } },
  },
  {
    id: "ant-2", patientId: "p-004", date: "2025-02-20", evaluator: "Antrop. J. Pulido",
    protocol: "ISAK Restringido", formulaVersionId: "fv-yuhasz-1987", qualityIndex: 97,
    measurements: [
      { site: "Peso", value: 70.4, unit: "kg", category: "basic" },
      { site: "Talla", value: 178.5, unit: "cm", category: "basic" },
      { site: "Tríceps", value: 8.9, unit: "mm", category: "skinfold" },
      { site: "Subescapular", value: 9.6, unit: "mm", category: "skinfold" },
    ],
    derived: { bmi: 22.1, sumSkinfolds6: 58.4, fatMassPct: 8.6, fatFreeMassKg: 64.4, muscleMassKg: 35.4, somatotype: { endo: 2.0, meso: 5.5, ecto: 2.9 } },
  },
  {
    id: "ant-3", patientId: "p-004", date: "2025-03-25", evaluator: "Antrop. J. Pulido",
    protocol: "ISAK Restringido", formulaVersionId: "fv-yuhasz-1987", qualityIndex: 98,
    measurements: [{ site: "Peso", value: 69.8, unit: "kg", category: "basic" }],
    derived: { bmi: 21.9, sumSkinfolds6: 54.8, fatMassPct: 7.9, fatFreeMassKg: 64.3, muscleMassKg: 35.6, somatotype: { endo: 1.9, meso: 5.6, ecto: 3.0 } },
  },
  {
    id: "ant-4", patientId: "p-004", date: "2025-04-18", evaluator: "Antrop. J. Pulido",
    protocol: "ISAK Restringido", formulaVersionId: "fv-yuhasz-1987", qualityIndex: 98,
    measurements: [{ site: "Peso", value: 69.2, unit: "kg", category: "basic" }],
    derived: { bmi: 21.7, sumSkinfolds6: 51.6, fatMassPct: 7.4, fatFreeMassKg: 64.1, muscleMassKg: 35.8, somatotype: { endo: 1.8, meso: 5.7, ecto: 3.1 } },
  },
];

export const SCREENINGS: ScreeningResult[] = [
  { id: "s-1", patientId: "p-001", date: "2025-04-22", protocol: "NRS-2002", score: 5, level: "critical", flags: ["weight_loss", "low_intake", "severe_disease"], recommendation: "Intervención nutricional intensiva, reevaluar 48h.", nextReview: "2025-04-24" },
  { id: "s-2", patientId: "p-005", date: "2025-04-21", protocol: "MNA-SF", score: 6, level: "high", flags: ["sarcopenia_risk", "low_intake", "weight_loss"], recommendation: "Plan hipercalórico hiperproteico, valoración funcional.", nextReview: "2025-04-28" },
  { id: "s-3", patientId: "p-008", date: "2025-04-20", protocol: "MUST", score: 3, level: "high", flags: ["weight_loss", "low_bmi"], recommendation: "Soporte nutricional especializado oncológico.", nextReview: "2025-04-25" },
  { id: "s-4", patientId: "p-002", date: "2025-04-19", protocol: "STAMP", score: 2, level: "moderate", flags: ["growth_faltering"], recommendation: "Plan recuperación nutricional pediátrica.", nextReview: "2025-05-17" },
];

export const EVOLUTIONS: EvolutionEntry[] = [
  { id: "e-1", patientId: "p-004", date: "2025-04-18", weightKg: 69.2, type: "anthropometry", author: "J. Pulido", notes: "Recomposición exitosa. ΣP6 de 62→52mm en 90 días. Mantener carga calórica." },
  { id: "e-2", patientId: "p-004", date: "2025-03-25", weightKg: 69.8, type: "plan_change", author: "Dra. C. Restrepo", notes: "Ajuste a 4200kcal en bloques de competencia. Suplementación con beta-alanina + cafeína estructurada." },
  { id: "e-3", patientId: "p-004", date: "2025-02-20", weightKg: 70.4, type: "anthropometry", author: "J. Pulido", notes: "Reducción de panículo adiposo de 1.6mm en pliegue tricipital." },
  { id: "e-4", patientId: "p-004", date: "2025-01-15", weightKg: 71.2, type: "anthropometry", author: "J. Pulido", notes: "Evaluación basal mesociclo." },
];

export const PLANS: NutritionPlan[] = [
  { id: "pl-1", patientId: "p-004", type: "oral", kcal: 4200, protein_g: 168, carbs_g: 588, fat_g: 117, fluids_ml: 4500, diet: "Alto rendimiento ciclismo", restrictions: [], startDate: "2025-03-25", status: "active" },
  { id: "pl-2", patientId: "p-001", type: "enteral", kcal: 1850, protein_g: 92, carbs_g: 210, fat_g: 70, fluids_ml: 1500, diet: "Fórmula hipercalórica hiperproteica", restrictions: ["Lactosa"], startDate: "2025-04-09", status: "active" },
];
