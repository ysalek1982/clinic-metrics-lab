import { CCORP_LEVEL1_VARIABLES } from "./ccorpLevel1Formulas";
import type {
  CcorpIdealWeightTarget,
  CcorpLevel1Input,
  CcorpLevel1Results,
  CcorpMeasurementMap,
  CcorpSex,
  CcorpVariableCode,
} from "./ccorpLevel1Types";

const EMPTY_MEDIANS = Object.fromEntries(CCORP_LEVEL1_VARIABLES.map((variable) => [variable.code, null])) as CcorpMeasurementMap;

function round(value: number | null | undefined, decimals = 3) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function valueOf(values: CcorpMeasurementMap, code: CcorpVariableCode) {
  const value = values[code];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function requireAll(values: Array<number | null>) {
  return values.every((value): value is number => typeof value === "number" && Number.isFinite(value));
}

export function calculateMedian(series: Array<number | null | undefined>) {
  const values = series.filter((value): value is number => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (values.length === 0) return null;
  const midpoint = Math.floor(values.length / 2);
  const median = values.length % 2 === 0 ? (values[midpoint - 1] + values[midpoint]) / 2 : values[midpoint];
  return round(median, 3);
}

export function calculateAgeDecimal(measuredAt: string, birthDate: string | null) {
  if (!birthDate) return null;
  const measured = new Date(measuredAt);
  const birth = new Date(birthDate);
  if (Number.isNaN(measured.getTime()) || Number.isNaN(birth.getTime()) || measured < birth) return null;
  return round((measured.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25), 3);
}

export function buildMedianMap(input: CcorpLevel1Input) {
  const medians = { ...EMPTY_MEDIANS };
  for (const measurement of input.measurements) {
    medians[measurement.variableCode] = calculateMedian(measurement.series);
  }
  return medians;
}

function chooseBySex(sex: CcorpSex, male: number | null, female: number | null) {
  if (sex === "male") return male;
  if (sex === "female") return female;
  return null;
}

function calculateIdealTarget(
  method: "durnin" | "withers",
  weightKg: number | null,
  heightM: number | null,
  fatMassKg: number | null,
  fatFreeMassKg: number | null,
  targetBodyFatPercent: number | null,
  targetFfmi: number | null,
): CcorpIdealWeightTarget {
  const hasBodyFatTarget = typeof targetBodyFatPercent === "number" && targetBodyFatPercent > 0 && targetBodyFatPercent < 100;
  const hasFfmiTarget = typeof targetFfmi === "number" && targetFfmi > 0;
  const idealWeightKg = hasBodyFatTarget && fatFreeMassKg !== null ? fatFreeMassKg * 100 / (100 - targetBodyFatPercent) : null;
  const targetFatMassKg = idealWeightKg !== null && hasBodyFatTarget ? idealWeightKg * targetBodyFatPercent / 100 : null;
  const fatToLoseKg = fatMassKg !== null && targetFatMassKg !== null ? fatMassKg - targetFatMassKg : null;
  const targetFatFreeMassKg = heightM !== null && hasFfmiTarget ? heightM ** 2 * targetFfmi : null;
  const leanMassToGainKg = targetFatFreeMassKg !== null && fatFreeMassKg !== null ? targetFatFreeMassKg - fatFreeMassKg : null;

  return {
    method,
    targetBodyFatPercent: targetBodyFatPercent ?? null,
    targetFfmi: targetFfmi ?? null,
    idealWeightKg: round(idealWeightKg, 2),
    targetFatMassKg: round(targetFatMassKg, 2),
    fatToLoseKg: round(fatToLoseKg, 2),
    targetFatFreeMassKg: round(targetFatFreeMassKg, 2),
    leanMassToGainKg: round(leanMassToGainKg, 2),
  };
}

export function calculateCcorpLevel1(input: CcorpLevel1Input): CcorpLevel1Results {
  const medians = buildMedianMap(input);
  const warnings: string[] = [];
  const weight = valueOf(medians, "weight_kg");
  const height = valueOf(medians, "height_cm");
  const heightM = height !== null ? height / 100 : null;
  const humeral = valueOf(medians, "humeral_biepicondylar_cm");
  const femoral = valueOf(medians, "femoral_biepicondylar_cm");
  const flexedArm = valueOf(medians, "flexed_arm_cm");
  const relaxedArm = valueOf(medians, "relaxed_arm_cm");
  const waist = valueOf(medians, "waist_min_cm");
  const hip = valueOf(medians, "hip_max_cm");
  const calf = valueOf(medians, "calf_max_cm");
  const triceps = valueOf(medians, "triceps_mm");
  const subscapular = valueOf(medians, "subscapular_mm");
  const biceps = valueOf(medians, "biceps_mm");
  const supraspinale = valueOf(medians, "supraspinale_mm");
  const iliacCrest = valueOf(medians, "iliac_crest_mm");
  const abdominal = valueOf(medians, "abdominal_mm");
  const medialThigh = valueOf(medians, "medial_thigh_mm");
  const calfSkinfold = valueOf(medians, "calf_skinfold_mm");

  const bmi = requireAll([weight, heightM]) && heightM > 0 ? weight / (heightM ** 2) : null;
  const waistHipRatio = requireAll([waist, hip]) && hip > 0 ? waist / hip : null;
  const sum6Skinfolds = requireAll([triceps, subscapular, supraspinale, abdominal, medialThigh, calfSkinfold])
    ? triceps + subscapular + supraspinale + abdominal + medialThigh + calfSkinfold
    : null;

  const durninSum4 = requireAll([triceps, subscapular, biceps, iliacCrest]) ? triceps + subscapular + biceps + iliacCrest : null;
  const durninLog = durninSum4 !== null && durninSum4 > 0 ? Math.log10(durninSum4) : null;
  const durninDensityMale = durninLog !== null ? 1.1765 - 0.0744 * durninLog : null;
  const durninDensityFemale = durninLog !== null ? 1.1567 - 0.0717 * durninLog : null;
  const durninDensity = chooseBySex(input.sex, durninDensityMale, durninDensityFemale);
  const durninBodyFatPercent = durninDensity !== null && durninDensity > 0 ? (495 / durninDensity) - 450 : null;
  const durninFatMassKg = requireAll([weight, durninBodyFatPercent]) ? weight * durninBodyFatPercent / 100 : null;
  const durninFatFreeMassKg = requireAll([weight, durninFatMassKg]) ? weight - durninFatMassKg : null;
  const durninFmi = requireAll([durninFatMassKg, heightM]) && heightM > 0 ? durninFatMassKg / (heightM ** 2) : null;
  const durninFfmi = requireAll([durninFatFreeMassKg, heightM]) && heightM > 0 ? durninFatFreeMassKg / (heightM ** 2) : null;

  const withersSum7Male = requireAll([triceps, subscapular, biceps, supraspinale, abdominal, medialThigh, calfSkinfold])
    ? triceps + subscapular + biceps + supraspinale + abdominal + medialThigh + calfSkinfold
    : null;
  const withersSum4Female = requireAll([triceps, subscapular, supraspinale, calfSkinfold])
    ? triceps + subscapular + supraspinale + calfSkinfold
    : null;
  const withersDensityMale = withersSum7Male !== null ? 1.0988 - 0.0004 * withersSum7Male : null;
  const withersDensityFemale = withersSum4Female !== null && withersSum4Female > 0 ? 1.17484 - 0.07229 * Math.log10(withersSum4Female) : null;
  const withersDensity = chooseBySex(input.sex, withersDensityMale, withersDensityFemale);
  const withersBodyFatPercent = withersDensity !== null && withersDensity > 0 ? (495 / withersDensity) - 450 : null;
  const withersFatMassKg = requireAll([weight, withersBodyFatPercent]) ? weight * withersBodyFatPercent / 100 : null;
  const withersFatFreeMassKg = requireAll([weight, withersFatMassKg]) ? weight - withersFatMassKg : null;
  const withersFmi = requireAll([withersFatMassKg, heightM]) && heightM > 0 ? withersFatMassKg / (heightM ** 2) : null;
  const withersFfmi = requireAll([withersFatFreeMassKg, heightM]) && heightM > 0 ? withersFatFreeMassKg / (heightM ** 2) : null;

  const sumSfCorrected = requireAll([triceps, supraspinale, subscapular, height]) && height > 0
    ? (triceps + supraspinale + subscapular) * 170.18 / height
    : null;
  const endomorphy = sumSfCorrected !== null
    ? -0.7182 + 0.1451 * sumSfCorrected - 0.00068 * (sumSfCorrected ** 2) + 0.0000014 * (sumSfCorrected ** 3)
    : null;
  const correctedArm = requireAll([flexedArm, triceps]) ? flexedArm - triceps / 10 : null;
  const correctedCalf = requireAll([calf, calfSkinfold]) ? calf - calfSkinfold / 10 : null;
  const mesomorphy = requireAll([humeral, femoral, correctedArm, correctedCalf, height])
    ? (0.858 * humeral) + (0.601 * femoral) + (0.188 * correctedArm) + (0.161 * correctedCalf) - (height * 0.131) + 4.5
    : null;
  const hwr = requireAll([height, weight]) && weight > 0 ? height / (weight ** 0.3333) : null;
  const ectomorphy = hwr === null ? null : hwr <= 38.25 ? 0.1 : hwr < 40.75 ? (0.463 * hwr - 17.63) : (0.732 * hwr - 28.58);
  const somatoX = requireAll([ectomorphy, endomorphy]) ? ectomorphy - endomorphy : null;
  const somatoY = requireAll([endomorphy, mesomorphy, ectomorphy]) ? 2 * mesomorphy - (endomorphy + ectomorphy) : null;
  const armMuscleAreaMm2 = requireAll([relaxedArm, triceps]) ? ((relaxedArm - triceps * 0.314) ** 2) / (4 * 3.14) : null;

  if (input.sex === "other") warnings.push("El Excel solo define selección de % graso por sexo masculino o femenino.");
  if (durninSum4 === null) warnings.push("Durnin & Womersley requiere tríceps, subescapular, bíceps y cresta ilíaca.");
  if (withersDensity === null) warnings.push("Withers requiere pliegues completos según sexo.");
  if (endomorphy === null || mesomorphy === null || ectomorphy === null) warnings.push("Somatotipo incompleto por falta de medidas requeridas.");

  return {
    ageDecimal: calculateAgeDecimal(input.measuredAt, input.birthDate),
    medians,
    bmi: round(bmi, 2),
    waistHipRatio: round(waistHipRatio, 3),
    sum6Skinfolds: round(sum6Skinfolds, 2),
    durninBodyDensityMale: round(durninDensityMale, 5),
    durninBodyDensityFemale: round(durninDensityFemale, 5),
    durninBodyFatPercent: round(durninBodyFatPercent, 2),
    durninFatMassKg: round(durninFatMassKg, 2),
    durninFatFreeMassKg: round(durninFatFreeMassKg, 2),
    durninFmi: round(durninFmi, 2),
    durninFfmi: round(durninFfmi, 2),
    withersBodyFatPercent: round(withersBodyFatPercent, 2),
    withersFatMassKg: round(withersFatMassKg, 2),
    withersFatFreeMassKg: round(withersFatFreeMassKg, 2),
    withersFmi: round(withersFmi, 2),
    withersFfmi: round(withersFfmi, 2),
    armMuscleAreaMm2: round(armMuscleAreaMm2, 2),
    endomorphy: round(endomorphy, 2),
    mesomorphy: round(mesomorphy, 2),
    ectomorphy: round(ectomorphy, 2),
    hwr: round(hwr, 2),
    somatoX: round(somatoX, 2),
    somatoY: round(somatoY, 2),
    idealTargets: [
      calculateIdealTarget("durnin", weight, heightM, durninFatMassKg, durninFatFreeMassKg, input.durninTargetBodyFatPercent, input.durninTargetFfmi),
      calculateIdealTarget("withers", weight, heightM, withersFatMassKg, withersFatFreeMassKg, input.withersTargetBodyFatPercent, input.withersTargetFfmi),
    ],
    warnings,
  };
}
