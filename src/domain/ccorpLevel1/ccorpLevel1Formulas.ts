import type { CcorpVariableDefinition } from "./ccorpLevel1Types";

export const CCORP_LEVEL1_FORMULA_VERSION = "ccorp-level-1-excel-2026-04-24";

export const CCORP_LEVEL1_VARIABLES: CcorpVariableDefinition[] = [
  { code: "weight_kg", label: "Peso bruto", category: "basic", unit: "kg", excelRow: 6 },
  { code: "height_cm", label: "Talla corporal", category: "basic", unit: "cm", excelRow: 7 },
  { code: "humeral_biepicondylar_cm", label: "Humeral biepicondilar", category: "diameter", unit: "cm", excelRow: 9 },
  { code: "femoral_biepicondylar_cm", label: "Femoral biepicondilar", category: "diameter", unit: "cm", excelRow: 10 },
  { code: "relaxed_arm_cm", label: "Brazo relajado", category: "girth", unit: "cm", excelRow: 12 },
  { code: "flexed_arm_cm", label: "Brazo flexionado en tensión", category: "girth", unit: "cm", excelRow: 13 },
  { code: "waist_min_cm", label: "Cintura mínima", category: "girth", unit: "cm", excelRow: 14 },
  { code: "hip_max_cm", label: "Cadera máxima", category: "girth", unit: "cm", excelRow: 15 },
  { code: "calf_max_cm", label: "Pantorrilla máxima", category: "girth", unit: "cm", excelRow: 16 },
  { code: "triceps_mm", label: "Tríceps", category: "skinfold", unit: "mm", excelRow: 18 },
  { code: "subscapular_mm", label: "Subescapular", category: "skinfold", unit: "mm", excelRow: 19 },
  { code: "biceps_mm", label: "Bíceps", category: "skinfold", unit: "mm", excelRow: 20 },
  { code: "iliac_crest_mm", label: "Cresta ilíaca", category: "skinfold", unit: "mm", excelRow: 21 },
  { code: "supraspinale_mm", label: "Supraespinal", category: "skinfold", unit: "mm", excelRow: 22 },
  { code: "abdominal_mm", label: "Abdominal", category: "skinfold", unit: "mm", excelRow: 23 },
  { code: "medial_thigh_mm", label: "Muslo medial", category: "skinfold", unit: "mm", excelRow: 24 },
  { code: "calf_skinfold_mm", label: "Pantorrilla", category: "skinfold", unit: "mm", excelRow: 25 },
];

export function getCcorpVariable(code: string) {
  return CCORP_LEVEL1_VARIABLES.find((variable) => variable.code === code);
}
