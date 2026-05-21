export type CcorpSex = "male" | "female" | "other";

export type CcorpVariableCategory = "basic" | "diameter" | "girth" | "skinfold";

export type CcorpVariableCode =
  | "weight_kg"
  | "height_cm"
  | "humeral_biepicondylar_cm"
  | "femoral_biepicondylar_cm"
  | "relaxed_arm_cm"
  | "flexed_arm_cm"
  | "waist_min_cm"
  | "hip_max_cm"
  | "calf_max_cm"
  | "triceps_mm"
  | "subscapular_mm"
  | "biceps_mm"
  | "iliac_crest_mm"
  | "supraspinale_mm"
  | "abdominal_mm"
  | "medial_thigh_mm"
  | "calf_skinfold_mm";

export interface CcorpVariableDefinition {
  code: CcorpVariableCode;
  label: string;
  category: CcorpVariableCategory;
  unit: "kg" | "cm" | "mm";
  excelRow: number;
}

export interface CcorpMeasurementInput {
  variableCode: CcorpVariableCode;
  series: Array<number | null>;
}

export type CcorpMeasurementMap = Record<CcorpVariableCode, number | null>;

export interface CcorpLevel1Input {
  measuredAt: string;
  birthDate: string | null;
  sex: CcorpSex;
  measurements: CcorpMeasurementInput[];
  durninTargetBodyFatPercent: number | null;
  durninTargetFfmi: number | null;
  withersTargetBodyFatPercent: number | null;
  withersTargetFfmi: number | null;
}

export interface CcorpIdealWeightTarget {
  method: "durnin" | "withers";
  targetBodyFatPercent: number | null;
  targetFfmi: number | null;
  idealWeightKg: number | null;
  targetFatMassKg: number | null;
  fatToLoseKg: number | null;
  targetFatFreeMassKg: number | null;
  leanMassToGainKg: number | null;
}

export interface CcorpLevel1Results {
  ageDecimal: number | null;
  medians: CcorpMeasurementMap;
  bmi: number | null;
  waistHipRatio: number | null;
  sum6Skinfolds: number | null;
  durninBodyDensityMale: number | null;
  durninBodyDensityFemale: number | null;
  durninBodyFatPercent: number | null;
  durninFatMassKg: number | null;
  durninFatFreeMassKg: number | null;
  durninFmi: number | null;
  durninFfmi: number | null;
  withersBodyFatPercent: number | null;
  withersFatMassKg: number | null;
  withersFatFreeMassKg: number | null;
  withersFmi: number | null;
  withersFfmi: number | null;
  armMuscleAreaMm2: number | null;
  endomorphy: number | null;
  mesomorphy: number | null;
  ectomorphy: number | null;
  hwr: number | null;
  somatoX: number | null;
  somatoY: number | null;
  idealTargets: CcorpIdealWeightTarget[];
  warnings: string[];
}
