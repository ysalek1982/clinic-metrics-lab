import { describe, expect, it } from "vitest";
import {
  buildGrowthIndicators,
  calculateAgeAtDate,
  calculateLmsZScore,
  calculatePediatricBmi,
  classifyIndicatorZScore,
  classifyZScore,
  detectExtremeFlags,
  evaluatePediatricGrowth,
  prepareGrowthChartSeries,
  selectReferenceSet,
  zScoreToPercentile,
  type GrowthReferencePoint,
  type GrowthReferenceSet,
} from "./pediatricGrowthEngine";

const referenceSets: GrowthReferenceSet[] = [
  {
    id: "ref-weight-female",
    code: "who_weight_female",
    name: "WHO peso/edad niñas",
    source: "WHO",
    ageMinMonths: 0,
    ageMaxMonths: 60,
    sex: "female",
    indicatorCode: "weight_for_age",
    version: "test",
    status: "active",
  },
  {
    id: "ref-bmi-female",
    code: "who_bmi_female",
    name: "WHO IMC/edad niñas",
    source: "WHO",
    ageMinMonths: 0,
    ageMaxMonths: 60,
    sex: "female",
    indicatorCode: "bmi_for_age",
    version: "test",
    status: "active",
  },
];

const referencePoints: GrowthReferencePoint[] = [
  {
    referenceSetId: "ref-weight-female",
    sex: "female",
    indicatorCode: "weight_for_age",
    xValue: 59,
    xUnit: "months",
    lValue: 1,
    mValue: 19,
    sValue: 0.1,
    p50: 19,
  },
  {
    referenceSetId: "ref-weight-female",
    sex: "female",
    indicatorCode: "weight_for_age",
    xValue: 60,
    xUnit: "months",
    lValue: 1,
    mValue: 20,
    sValue: 0.1,
    p50: 20,
  },
  {
    referenceSetId: "ref-bmi-female",
    sex: "female",
    indicatorCode: "bmi_for_age",
    xValue: 60,
    xUnit: "months",
    lValue: 1,
    mValue: 15.5,
    sValue: 0.1,
    p50: 15.5,
  },
];

describe("pediatricGrowthEngine", () => {
  it("calculates exact pediatric age in months and days", () => {
    const age = calculateAgeAtDate("2021-04-15", "2026-04-24");

    expect(age.ageMonths).toBe(60);
    expect(age.ageDaysTotal).toBe(1835);
    expect(age.exactLabel).toBe("60 meses y 9 días");
  });

  it("rejects measurements before birth", () => {
    expect(() => calculateAgeAtDate("2026-04-24", "2026-04-23")).toThrow("La fecha de medición");
  });

  it("calculates pediatric BMI", () => {
    expect(calculatePediatricBmi(20, 110)).toBe(16.53);
  });

  it("builds indicators from raw measurements", () => {
    const indicators = buildGrowthIndicators({
      age: { ageMonths: 60, ageDaysTotal: 1835, exactLabel: "60 meses y 9 días" },
      bmi: 16.53,
      measurement: {
        measuredAt: "2026-04-24",
        weightKg: 20,
        heightCm: 110,
        headCircumferenceCm: 51,
      },
    });

    expect(indicators.map((item) => item.code)).toEqual([
      "weight_for_age",
      "height_for_age",
      "weight_for_length_height",
      "bmi_for_age",
      "head_circumference_for_age",
    ]);
  });

  it("selects a configured reference by policy and sex", () => {
    const selected = selectReferenceSet({
      indicatorCode: "weight_for_age",
      sex: "female",
      ageMonths: 60,
      referenceSets,
      policies: [
        {
          indicatorCode: "weight_for_age",
          ageMinMonths: 0,
          ageMaxMonths: 60,
          preferredReferenceSetId: "ref-weight-female",
          isActive: true,
        },
      ],
    });

    expect(selected.id).toBe("ref-weight-female");
  });

  it("calculates LMS z-score and percentile", () => {
    expect(calculateLmsZScore(22, 1, 20, 0.1)).toBeCloseTo(1);
    expect(zScoreToPercentile(0)).toBeCloseTo(50, 1);
    expect(zScoreToPercentile(1)).toBeCloseTo(84.13, 1);
  });

  it("rejects LMS calculations without complete positive parameters", () => {
    expect(() => calculateLmsZScore(20, 1, 0, 0.1)).toThrow("Parámetros LMS inválidos");
    expect(() => calculateLmsZScore(20, 1, 20, 0)).toThrow("Parámetros LMS inválidos");
  });

  it("classifies and flags extreme values", () => {
    expect(classifyZScore(-2.5)).toBe("bajo");
    expect(classifyZScore(3.2)).toBe("muy_alto");
    expect(classifyIndicatorZScore("bmi_for_age", 1.4)).toBe("riesgo_sobrepeso");
    expect(classifyIndicatorZScore("height_for_age", -2.4)).toBe("talla_baja");
    expect(classifyIndicatorZScore("head_circumference_for_age", 2.4)).toBe("macrocefalia");
    expect(detectExtremeFlags(5.4)).toEqual(["valor_extremo", "biologicamente_improbable"]);
  });

  it("evaluates growth without inventing results when references are incomplete", () => {
    const result = evaluatePediatricGrowth({
      patient: { birthDate: "2021-04-15", sex: "female" },
      measurement: { measuredAt: "2026-04-24", weightKg: 20, heightCm: 110 },
      referenceSets,
      referencePoints: [],
      policies: [],
    });

    const weight = result.indicators.find((item) => item.indicatorCode === "weight_for_age");

    expect(weight.referenceStatus).toBe("incomplete");
    expect(weight.zScore).toBeNull();
    expect(weight.interpretation).toBe("Referencia incompleta. No se calcula z-score ni percentil.");
  });

  it("does not calculate z-score from non-active reference sets", () => {
    const result = evaluatePediatricGrowth({
      patient: { birthDate: "2021-04-15", sex: "female" },
      measurement: { measuredAt: "2026-04-24", weightKg: 22, heightCm: 110 },
      referenceSets: referenceSets.map((reference) => ({ ...reference, status: "demo" as const })),
      referencePoints,
      policies: [],
    });

    const weight = result.indicators.find((item) => item.indicatorCode === "weight_for_age");

    expect(weight.referenceStatus).toBe("incomplete");
    expect(weight.zScore).toBeNull();
    expect(weight.percentile).toBeNull();
    expect(weight.flags).toContain("referencia_no_activa");
  });

  it("evaluates growth with complete LMS reference", () => {
    const result = evaluatePediatricGrowth({
      patient: { birthDate: "2021-04-15", sex: "female" },
      measurement: { measuredAt: "2026-04-24", weightKg: 22, heightCm: 110 },
      referenceSets,
      referencePoints,
      policies: [],
    });

    const weight = result.indicators.find((item) => item.indicatorCode === "weight_for_age");

    expect(result.age.ageMonths).toBe(60);
    expect(result.bmi).toBe(18.18);
    expect(weight.referenceStatus).toBe("complete");
    expect(weight.zScore).toBe(1);
    expect(weight.percentile).toBeCloseTo(84.13, 1);
    expect(weight.classification).toBe("normal");
    expect(weight.interpretation).toBe("Dentro del rango esperado para la referencia seleccionada.");
  });

  it("prepares chart series from reference and patient points", () => {
    const series = prepareGrowthChartSeries(referencePoints, [{ x: 60, value: 22, measuredAt: "2026-04-24" }]);

    expect(series.find((item) => item.x === 60).patient).toBe(22);
    expect(series.find((item) => item.x === 60).p50).toBe(20);
  });
});
