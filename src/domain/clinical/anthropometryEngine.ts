import type { FormulaVersion, MeasurementSite } from "@/types/clinical";

export type MeasurementValues = Record<string, { attempt1: number; attempt2: number }>;

export interface PatientFormulaContext {
  sex: "female" | "male" | "other";
  ageYears: number;
}

export interface MeasurementValidation {
  siteId: string;
  complete: boolean;
  average: number;
  delta: number;
  withinTolerance: boolean;
  severity: "ok" | "missing" | "repeat" | "outlier";
  message: string;
}

export interface DerivedAnthropometryResult {
  key: string;
  label: string;
  value: number | string;
  unit: string;
  formulaVersionId: string;
  interpretation: string;
}

const round = (value: number, decimals = 1) => Number(value.toFixed(decimals));

export function averageAttempts(values: { attempt1: number; attempt2: number }) {
  if (!values) return undefined;
  const attempts = [values.attempt1, values.attempt2].filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (attempts.length === 0) return undefined;
  return attempts.reduce((sum, value) => sum + value, 0) / attempts.length;
}

export function validateMeasurements(sites: MeasurementSite[], values: MeasurementValues): MeasurementValidation[] {
  return sites.map((site) => {
    const siteValues = values[site.id];
    if (!siteValues) {
      return {
        siteId: site.id,
        complete: false,
        withinTolerance: false,
        severity: "missing",
        message: "Medicion pendiente.",
      };
    }
    const attempt1 = siteValues.attempt1;
    const attempt2 = siteValues.attempt2;
    const complete = typeof attempt1 === "number" && typeof attempt2 === "number";
    const average = averageAttempts(siteValues);
    const delta = complete ? Math.abs(attempt1 - attempt2) : undefined;

    if (!siteValues || average === undefined) {
      return {
        siteId: site.id,
        complete: false,
        withinTolerance: false,
        severity: "missing",
        message: "Medicion pendiente.",
      };
    }

    if (!complete) {
      return {
        siteId: site.id,
        complete: false,
        average,
        withinTolerance: false,
        severity: "repeat",
        message: "Falta segunda medicion.",
      };
    }

    const withinTolerance = (delta ?? 0) <= site.tolerance;

    return {
      siteId: site.id,
      complete: true,
      average,
      delta,
      withinTolerance,
      severity: withinTolerance ? "ok" : "outlier",
      message: withinTolerance ? "Dentro de tolerancia." : `Repetir medicion: delta ${round(delta ?? 0, 2)} > tolerancia ${site.tolerance}.`,
    };
  });
}

export function getAverageByCode(sites: MeasurementSite[], values: MeasurementValues, code: string) {
  const site = sites.find((item) => item.code === code);
  if (!site) return undefined;
  return averageAttempts(values[site.id]);
}

export function sumSkinfolds(sites: MeasurementSite[], values: MeasurementValues, codes: string[]) {
  const measurements = codes.map((code) => getAverageByCode(sites, values, code));
  if (measurements.some((value) => typeof value !== "number")) return undefined;
  return measurements.reduce((sum, value) => sum + (value ?? 0), 0);
}

export function calculateBmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return undefined;
  const heightM = heightCm / 100;
  return round(weightKg / (heightM * heightM), 1);
}

export function calculateWaistHeightRatio(waistCm: number, heightCm: number) {
  if (!waistCm || !heightCm) return undefined;
  return round(waistCm / heightCm, 2);
}

export function calculateWaistHipRatio(waistCm: number, hipCm: number) {
  if (!waistCm || !hipCm) return undefined;
  return round(waistCm / hipCm, 2);
}

export function calculateYuhaszBodyFat(sum6: number, sex: PatientFormulaContext["sex"]) {
  if (!sum6) return undefined;
  const coefficient = sex === "female" ? 0.1548 : 0.1051;
  const intercept = sex === "female" ? 3.58 : 2.585;
  return round(coefficient * sum6 + intercept, 1);
}

export function calculateFatFreeMass(weightKg: number, bodyFatPercent: number) {
  if (!weightKg || bodyFatPercent === undefined) return undefined;
  return round(weightKg * (1 - bodyFatPercent / 100), 1);
}

export function estimateMuscleMass(weightKg: number, fatFreeMassKg: number) {
  if (!weightKg || !fatFreeMassKg) return undefined;
  return round(fatFreeMassKg * 0.55, 1);
}

export function calculateMifflinBmr(context: PatientFormulaContext, weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm || !context.ageYears) return undefined;
  const sexConstant = context.sex === "female" ? -161 : 5;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * context.ageYears + sexConstant);
}

export function calculateSomatotypePlaceholder(sum6: number, humerusBreadth: number, femurBreadth: number, heightCm: number) {
  if (!sum6 || !heightCm) return undefined;
  const endo = round(Math.max(1, sum6 / 30), 1);
  const meso = humerusBreadth && femurBreadth ? round((humerusBreadth + femurBreadth) / 2 - 1.2, 1) : "pending";
  const ecto = round(Math.max(1, heightCm / 60 - 0.2), 1);
  return `${endo}-${meso}-${ecto}`;
}

export function deriveAnthropometryResults(
  sites: MeasurementSite[],
  values: MeasurementValues,
  formulas: FormulaVersion[],
  context: PatientFormulaContext,
): DerivedAnthropometryResult[] {
  const weight = getAverageByCode(sites, values, "weight");
  const height = getAverageByCode(sites, values, "height");
  const waist = getAverageByCode(sites, values, "waist");
  const hip = getAverageByCode(sites, values, "hip");
  const humerus = getAverageByCode(sites, values, "humerus_breadth");
  const femur = getAverageByCode(sites, values, "femur_breadth");
  const sum6 = sumSkinfolds(sites, values, ["triceps", "subscapular", "supraspinale", "abdominal", "front_thigh", "medial_calf"]);
  const bmi = calculateBmi(weight, height);
  const waistHeight = calculateWaistHeightRatio(waist, height);
  const waistHip = calculateWaistHipRatio(waist, hip);
  const yuhasz = formulas.find((formula) => formula.formulaId === "formula-yuhasz-1987");
  const mifflin = formulas.find((formula) => formula.formulaId === "formula-mifflin");
  const somatotypeFormula = formulas.find((formula) => formula.formulaId === "formula-carter-heath");
  const bodyFat = calculateYuhaszBodyFat(sum6, context.sex);
  const fatFreeMass = calculateFatFreeMass(weight, bodyFat);
  const muscleMass = estimateMuscleMass(weight, fatFreeMass);
  const bmr = calculateMifflinBmr(context, weight, height);
  const somatotype = calculateSomatotypePlaceholder(sum6, humerus, femur, height);

  const results: DerivedAnthropometryResult[] = [
    { key: "bmi", label: "IMC", value: bmi ?? "pendiente", unit: "kg/m2", interpretation: bmi ? classifyBmi(bmi) : undefined },
    { key: "sum6", label: "Sumatoria P6", value: sum6 !== undefined ? round(sum6, 1) : "pendiente", unit: "mm" },
    { key: "body_fat", label: "% grasa", value: bodyFat ?? "pendiente", unit: "%", formulaVersionId: yuhasz?.id },
    { key: "ffm", label: "Masa libre grasa", value: fatFreeMass ?? "pendiente", unit: "kg", formulaVersionId: yuhasz?.id },
    { key: "muscle_mass", label: "Masa muscular", value: muscleMass ?? "pendiente", unit: "kg" },
    { key: "waist_height", label: "Cintura / altura", value: waistHeight ?? "pendiente", unit: "" },
    { key: "waist_hip", label: "Cintura / cadera", value: waistHip ?? "pendiente", unit: "" },
    { key: "bmr", label: "TMB Mifflin", value: bmr ?? "pendiente", unit: "kcal", formulaVersionId: mifflin?.id },
    { key: "somatotype", label: "Somatotipo", value: somatotype ?? "pendiente", unit: "", formulaVersionId: somatotypeFormula?.id },
  ];

  return results;
}

export function qualityIndex(validations: MeasurementValidation[]) {
  if (validations.length === 0) return 0;
  const scored = validations.map((validation) => {
    if (validation.severity === "ok") return 1;
    if (validation.severity === "repeat") return 0.55;
    if (validation.severity === "outlier") return 0.25;
    return 0;
  });
  return Math.round((scored.reduce((sum, value) => sum + value, 0) / validations.length) * 100);
}

export function classifyBmi(bmi: number) {
  if (bmi < 18.5) return "Bajo peso";
  if (bmi < 25) return "Normopeso";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidad";
}
