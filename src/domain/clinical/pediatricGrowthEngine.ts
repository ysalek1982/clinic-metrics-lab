export type PediatricSex = "female" | "male";

export type GrowthIndicatorCode =
  | "weight_for_age"
  | "height_for_age"
  | "weight_for_length_height"
  | "bmi_for_age"
  | "head_circumference_for_age"
  | "arm_circumference_for_age"
  | "triceps_skinfold_for_age"
  | "subscapular_skinfold_for_age";

export type GrowthReferenceStatus = "complete" | "incomplete" | "not_configured";

export interface PediatricPatientContext {
  birthDate: string;
  sex: PediatricSex | "other";
}

export interface PediatricMeasurementInput {
  measuredAt: string;
  weightKg: number | null;
  lengthCm: number | null;
  heightCm: number | null;
  headCircumferenceCm: number | null;
  armCircumferenceCm: number | null;
  tricepsSkinfoldMm: number | null;
  subscapularSkinfoldMm: number | null;
}

export interface GrowthReferenceSet {
  id: string;
  code: string;
  name: string;
  source: string;
  sourceUrl: string | null;
  ageMinMonths: number;
  ageMaxMonths: number;
  sex: PediatricSex | "any";
  indicatorCode: GrowthIndicatorCode;
  version: string;
  status: "active" | "demo" | "draft" | "deprecated";
}

export interface GrowthReferencePoint {
  referenceSetId: string;
  sex: PediatricSex | "any";
  indicatorCode: GrowthIndicatorCode;
  xValue: number;
  xUnit: "months" | "cm";
  lValue: number | null;
  mValue: number | null;
  sValue: number | null;
  p01: number | null;
  p03: number | null;
  p05: number | null;
  p10: number | null;
  p15: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p85: number | null;
  p90: number | null;
  p95: number | null;
  p97: number | null;
  p99: number | null;
  zMinus3: number | null;
  zMinus2: number | null;
  zMinus1: number | null;
  z0: number | null;
  zPlus1: number | null;
  zPlus2: number | null;
  zPlus3: number | null;
}

export interface GrowthReferencePolicy {
  indicatorCode: GrowthIndicatorCode;
  ageMinMonths: number;
  ageMaxMonths: number;
  preferredReferenceSetId: string | null;
  fallbackReferenceSetId: string | null;
  isActive: boolean;
}

export interface GrowthAge {
  ageMonths: number;
  ageDaysTotal: number;
  exactLabel: string;
}

export interface GrowthIndicatorInput {
  code: GrowthIndicatorCode;
  value: number;
  axisValue: number;
  axisUnit: "months" | "cm";
}

export interface GrowthIndicatorResult {
  indicatorCode: GrowthIndicatorCode;
  measurementValue: number;
  axisValue: number;
  axisUnit: "months" | "cm";
  referenceStatus: GrowthReferenceStatus;
  referenceId: string | null;
  referenceVersion: string | null;
  zScore: number | null;
  percentile: number | null;
  classification: string;
  interpretation: string;
  flags: string[];
}

export interface GrowthEvaluationResult {
  age: GrowthAge;
  bmi: number;
  indicators: GrowthIndicatorResult[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateAgeAtDate(birthDate: string, measuredAt: string): GrowthAge {
  const birth = startOfUtcDay(birthDate);
  const measured = startOfUtcDay(measuredAt);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(measured.getTime())) {
    throw new Error("Fecha de nacimiento o medición inválida.");
  }

  if (measured.getTime() < birth.getTime()) {
    throw new Error("La fecha de medición no puede ser anterior al nacimiento.");
  }

  const ageDaysTotal = Math.floor((measured.getTime() - birth.getTime()) / MS_PER_DAY);
  let ageMonths = (measured.getUTCFullYear() - birth.getUTCFullYear()) * 12 + measured.getUTCMonth() - birth.getUTCMonth();

  if (measured.getUTCDate() < birth.getUTCDate()) {
    ageMonths -= 1;
  }

  const remainingDate = addMonthsUtc(birth, ageMonths);
  const remainingDays = Math.floor((measured.getTime() - remainingDate.getTime()) / MS_PER_DAY);

  return {
    ageMonths,
    ageDaysTotal,
    exactLabel: `${ageMonths} meses y ${remainingDays} días`,
  };
}

export function calculatePediatricBmi(weightKg: number | null, lengthOrHeightCm: number | null) {
  if (!isPositiveNumber(weightKg) || !isPositiveNumber(lengthOrHeightCm)) return undefined;
  const heightM = lengthOrHeightCm / 100;
  return round(weightKg / (heightM * heightM), 2);
}

export function buildGrowthIndicators(input: {
  measurement: PediatricMeasurementInput;
  age: GrowthAge;
  bmi: number;
}): GrowthIndicatorInput[] {
  const { measurement, age, bmi } = input;
  const stature = measurement.heightCm ?? measurement.lengthCm ?? null;
  const indicators: GrowthIndicatorInput[] = [];

  if (isPositiveNumber(measurement.weightKg)) {
    indicators.push({
      code: "weight_for_age",
      value: measurement.weightKg,
      axisValue: age.ageMonths,
      axisUnit: "months",
    });
  }

  if (isPositiveNumber(stature)) {
    indicators.push({
      code: "height_for_age",
      value: stature,
      axisValue: age.ageMonths,
      axisUnit: "months",
    });
  }

  if (isPositiveNumber(measurement.weightKg) && isPositiveNumber(stature)) {
    indicators.push({
      code: "weight_for_length_height",
      value: measurement.weightKg,
      axisValue: stature,
      axisUnit: "cm",
    });
  }

  if (isPositiveNumber(bmi)) {
    indicators.push({
      code: "bmi_for_age",
      value: bmi,
      axisValue: age.ageMonths,
      axisUnit: "months",
    });
  }

  if (isPositiveNumber(measurement.headCircumferenceCm)) {
    indicators.push({
      code: "head_circumference_for_age",
      value: measurement.headCircumferenceCm,
      axisValue: age.ageMonths,
      axisUnit: "months",
    });
  }

  if (isPositiveNumber(measurement.armCircumferenceCm)) {
    indicators.push({
      code: "arm_circumference_for_age",
      value: measurement.armCircumferenceCm,
      axisValue: age.ageMonths,
      axisUnit: "months",
    });
  }

  if (isPositiveNumber(measurement.tricepsSkinfoldMm)) {
    indicators.push({
      code: "triceps_skinfold_for_age",
      value: measurement.tricepsSkinfoldMm,
      axisValue: age.ageMonths,
      axisUnit: "months",
    });
  }

  if (isPositiveNumber(measurement.subscapularSkinfoldMm)) {
    indicators.push({
      code: "subscapular_skinfold_for_age",
      value: measurement.subscapularSkinfoldMm,
      axisValue: age.ageMonths,
      axisUnit: "months",
    });
  }

  return indicators;
}

export function evaluatePediatricGrowth(input: {
  patient: PediatricPatientContext;
  measurement: PediatricMeasurementInput;
  referenceSets: GrowthReferenceSet[];
  referencePoints: GrowthReferencePoint[];
  policies: GrowthReferencePolicy[];
}): GrowthEvaluationResult {
  const age = calculateAgeAtDate(input.patient.birthDate, input.measurement.measuredAt);
  const stature = input.measurement.heightCm ?? input.measurement.lengthCm ?? null;
  const bmi = calculatePediatricBmi(input.measurement.weightKg, stature);
  const indicators = buildGrowthIndicators({ measurement: input.measurement, age, bmi });

  return {
    age,
    bmi,
    indicators: indicators.map((indicator) =>
      evaluateIndicator({
        indicator,
        sex: input.patient.sex,
        ageMonths: age.ageMonths,
        referenceSets: input.referenceSets,
        referencePoints: input.referencePoints,
        policies: input.policies,
      }),
    ),
  };
}

export function evaluateIndicator(input: {
  indicator: GrowthIndicatorInput;
  sex: PediatricPatientContext["sex"];
  ageMonths: number;
  referenceSets: GrowthReferenceSet[];
  referencePoints: GrowthReferencePoint[];
  policies: GrowthReferencePolicy[];
}): GrowthIndicatorResult {
  const base = {
    indicatorCode: input.indicator.code,
    measurementValue: input.indicator.value,
    axisValue: input.indicator.axisValue,
    axisUnit: input.indicator.axisUnit,
  };

  if (input.sex === "other") {
    return incompleteResult(base, "Sexo de referencia no definido.", ["sexo_referencia_no_definido"]);
  }

  const referenceSet = selectReferenceSet({
    indicatorCode: input.indicator.code,
    sex: input.sex,
    ageMonths: input.ageMonths,
    referenceSets: input.referenceSets,
    policies: input.policies,
  });

  if (!referenceSet) {
    return {
      ...base,
      referenceStatus: "not_configured",
      referenceId: null,
      referenceVersion: null,
      zScore: null,
      percentile: null,
      classification: "sin_referencia",
      interpretation: "No hay referencia configurada para este indicador.",
      flags: ["sin_referencia_configurada"],
    };
  }

  if (referenceSet.status !== "active") {
    return incompleteResult(
      {
        ...base,
        referenceId: referenceSet.id,
        referenceVersion: referenceSet.version,
      },
      "Referencia incompleta. La referencia configurada no está activa como estándar oficial; no se calcula z-score ni percentil.",
      ["referencia_incompleta", "referencia_no_activa"],
    );
  }

  const points = input.referencePoints
    .filter((point) => point.referenceSetId === referenceSet.id)
    .sort((left, right) => left.xValue - right.xValue);

  if (!hasCompleteReference(points)) {
    return incompleteResult(
      {
        ...base,
        referenceId: referenceSet.id,
        referenceVersion: referenceSet.version,
      },
      "Referencia incompleta. No se calcula z-score ni percentil.",
      ["referencia_incompleta"],
    );
  }

  const nearestPoint = nearestReferencePoint(points, input.indicator.axisValue);
  if (!nearestPoint || !isPositiveNumber(nearestPoint.mValue) || !isPositiveNumber(nearestPoint.sValue)) {
    return incompleteResult(
      {
        ...base,
        referenceId: referenceSet.id,
        referenceVersion: referenceSet.version,
      },
      "Referencia incompleta. No se calcula z-score ni percentil.",
      ["referencia_incompleta"],
    );
  }

  const zScore = round(calculateLmsZScore(input.indicator.value, nearestPoint.lValue ?? 1, nearestPoint.mValue, nearestPoint.sValue), 2);
  const percentile = round(zScoreToPercentile(zScore), 2);
  const classification = classifyIndicatorZScore(input.indicator.code, zScore);
  const flags = detectExtremeFlags(zScore);

  return {
    ...base,
    referenceStatus: "complete",
    referenceId: referenceSet.id,
    referenceVersion: referenceSet.version,
    zScore,
    percentile,
    classification,
    interpretation: interpretationForClassification(classification, input.indicator.code),
    flags,
  };
}

export function selectReferenceSet(input: {
  indicatorCode: GrowthIndicatorCode;
  sex: PediatricSex;
  ageMonths: number;
  referenceSets: GrowthReferenceSet[];
  policies: GrowthReferencePolicy[];
}) {
  const policy = input.policies.find(
    (item) =>
      item.isActive &&
      item.indicatorCode === input.indicatorCode &&
      input.ageMonths >= item.ageMinMonths &&
      input.ageMonths <= item.ageMaxMonths,
  );

  const policyReferenceIds = [policy?.preferredReferenceSetId, policy?.fallbackReferenceSetId].filter(Boolean);
  for (const referenceId of policyReferenceIds) {
    const reference = input.referenceSets.find((item) => item.id === referenceId);
    if (reference && referenceMatches(reference, input)) {
      return reference;
    }
  }

  return input.referenceSets.find((reference) => referenceMatches(reference, input)) ?? null;
}

export function calculateLmsZScore(value: number, lValue: number, mValue: number, sValue: number) {
  if (!isPositiveNumber(value) || !isPositiveNumber(mValue) || !isPositiveNumber(sValue)) {
    throw new Error("Parámetros LMS inválidos.");
  }

  if (Math.abs(lValue) < 0.00001) {
    return Math.log(value / mValue) / sValue;
  }

  return (Math.pow(value / mValue, lValue) - 1) / (lValue * sValue);
}

export function zScoreToPercentile(zScore: number) {
  return normalCdf(zScore) * 100;
}

export function classifyZScore(zScore: number) {
  if (zScore < -3) return "muy_bajo";
  if (zScore < -2) return "bajo";
  if (zScore > 3) return "muy_alto";
  if (zScore > 2) return "alto";
  return "esperado";
}

export function classifyIndicatorZScore(indicatorCode: GrowthIndicatorCode, zScore: number) {
  if (indicatorCode === "bmi_for_age" || indicatorCode === "weight_for_length_height") {
    if (zScore < -3) return "delgadez_severa";
    if (zScore < -2) return "delgadez";
    if (zScore > 3) return "obesidad";
    if (zScore > 2) return "sobrepeso";
    if (zScore > 1) return "riesgo_sobrepeso";
    return "normal";
  }

  if (indicatorCode === "weight_for_age") {
    if (zScore < -3) return "bajo_peso_severo";
    if (zScore < -2) return "bajo_peso";
    if (zScore > 2) return "peso_alto_para_edad";
    return "normal";
  }

  if (indicatorCode === "height_for_age") {
    if (zScore < -3) return "talla_baja_severa";
    if (zScore < -2) return "talla_baja";
    if (zScore > 3) return "talla_alta";
    return "normal";
  }

  if (indicatorCode === "head_circumference_for_age") {
    if (zScore < -3) return "microcefalia_severa";
    if (zScore < -2) return "microcefalia";
    if (zScore > 3) return "macrocefalia_severa";
    if (zScore > 2) return "macrocefalia";
    return "normal";
  }

  return "interpretacion_pendiente";
}

export function detectExtremeFlags(zScore: number) {
  const flags: string[] = [];
  if (Math.abs(zScore) > 3) flags.push("valor_extremo");
  if (Math.abs(zScore) > 5) flags.push("biologicamente_improbable");
  return flags;
}

export function prepareGrowthChartSeries(points: GrowthReferencePoint[], patientPoints: Array<{ x: number; value: number; measuredAt: string }>) {
  return points
    .map((point) => ({
      x: point.xValue,
      p03: point.p03 ?? point.zMinus2 ?? null,
      p15: point.p15 ?? point.zMinus1 ?? null,
      p50: point.p50 ?? point.z0 ?? point.mValue ?? null,
      p85: point.p85 ?? point.zPlus1 ?? null,
      p97: point.p97 ?? point.zPlus2 ?? null,
      patient: patientPoints.find((patientPoint) => patientPoint.x === point.xValue)?.value ?? null,
      measuredAt: patientPoints.find((patientPoint) => patientPoint.x === point.xValue)?.measuredAt ?? null,
    }))
    .sort((left, right) => left.x - right.x);
}

function incompleteResult(
  base: Pick<GrowthIndicatorResult, "indicatorCode" | "measurementValue" | "axisValue" | "axisUnit"> &
    Partial<Pick<GrowthIndicatorResult, "referenceId" | "referenceVersion">>,
  interpretation: string,
  flags: string[],
): GrowthIndicatorResult {
  return {
    ...base,
    referenceStatus: "incomplete",
    referenceId: base.referenceId ?? null,
    referenceVersion: base.referenceVersion ?? null,
    zScore: null,
    percentile: null,
    classification: "referencia_incompleta",
    interpretation,
    flags,
  };
}

function referenceMatches(reference: GrowthReferenceSet, input: { indicatorCode: GrowthIndicatorCode; sex: PediatricSex; ageMonths: number }) {
  return (
    reference.indicatorCode === input.indicatorCode &&
    (reference.sex === input.sex || reference.sex === "any") &&
    input.ageMonths >= reference.ageMinMonths &&
    input.ageMonths <= reference.ageMaxMonths &&
    (reference.status === "active" || reference.status === "demo")
  );
}

function hasCompleteReference(points: GrowthReferencePoint[]) {
  return points.length >= 2 && points.some((point) => isPositiveNumber(point.mValue) && isPositiveNumber(point.sValue));
}

function nearestReferencePoint(points: GrowthReferencePoint[], axisValue: number) {
  return points.reduce<GrowthReferencePoint | null>((nearest, point) => {
    if (!nearest) return point;
    return Math.abs(point.xValue - axisValue) < Math.abs(nearest.xValue - axisValue) ? point : nearest;
  }, null);
}

function interpretationForClassification(classification: string, indicatorCode: GrowthIndicatorCode) {
  switch (classification) {
    case "bajo_peso_severo":
    case "talla_baja_severa":
    case "delgadez_severa":
    case "microcefalia_severa":
      return "Desviación severa respecto a la referencia oficial. Requiere evaluación clínica prioritaria.";
    case "bajo_peso":
    case "talla_baja":
    case "delgadez":
    case "microcefalia":
      return "Por debajo de la referencia oficial. Requiere seguimiento nutricional y clínico.";
    case "riesgo_sobrepeso":
      return "Riesgo de sobrepeso según referencia oficial. Correlacionar con evaluación clínica.";
    case "sobrepeso":
    case "obesidad":
      return "Exceso ponderal según referencia oficial. Requiere evaluación clínica y nutricional.";
    case "macrocefalia":
    case "macrocefalia_severa":
    case "talla_alta":
    case "peso_alto_para_edad":
      return "Por encima de la referencia oficial. Correlacionar con contexto clínico.";
    case "interpretacion_pendiente":
      return `Interpretación pendiente de configurar para el indicador ${indicatorCode}.`;
    case "muy_bajo":
      return "Muy por debajo de la referencia. Requiere evaluación clínica prioritaria.";
    case "bajo":
      return "Por debajo de la referencia. Requiere seguimiento nutricional.";
    case "alto":
      return "Por encima de la referencia. Correlacionar con evaluación clínica.";
    case "muy_alto":
      return "Muy por encima de la referencia. Requiere evaluación clínica prioritaria.";
    default:
      return "Dentro del rango esperado para la referencia seleccionada.";
  }
}

function normalCdf(value: number) {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function erf(value: number) {
  const sign = value >= 0 ? 1 : -1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function startOfUtcDay(date: string) {
  const parsed = new Date(date);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function addMonthsUtc(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function round(value: number, decimals = 1) {
  return Number(value.toFixed(decimals));
}
