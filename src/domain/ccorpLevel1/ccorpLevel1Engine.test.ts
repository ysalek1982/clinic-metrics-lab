import { describe, expect, it } from "vitest";
import { calculateCcorpLevel1, calculateMedian } from "./ccorpLevel1Engine";
import type { CcorpLevel1Input, CcorpVariableCode } from "./ccorpLevel1Types";

const values: Partial<Record<CcorpVariableCode, number>> = {
  weight_kg: 80,
  height_cm: 180,
  humeral_biepicondylar_cm: 7,
  femoral_biepicondylar_cm: 9.5,
  relaxed_arm_cm: 32,
  flexed_arm_cm: 35,
  waist_min_cm: 78,
  hip_max_cm: 96,
  calf_max_cm: 38,
  triceps_mm: 8,
  subscapular_mm: 10,
  biceps_mm: 5,
  iliac_crest_mm: 12,
  supraspinale_mm: 9,
  abdominal_mm: 14,
  medial_thigh_mm: 11,
  calf_skinfold_mm: 7,
};

function input(sex: "male" | "female" = "male"): CcorpLevel1Input {
  return {
    measuredAt: "2026-04-24",
    birthDate: "1996-04-24",
    sex,
    measurements: Object.entries(values).map(([variableCode, value]) => ({
      variableCode: variableCode as CcorpVariableCode,
      series: [value ?? null, value ? value + 0.2 : null, value ? value - 0.2 : null, null, null],
    })),
    durninTargetBodyFatPercent: 10,
    durninTargetFfmi: 22,
    withersTargetBodyFatPercent: 9,
    withersTargetFfmi: 22.5,
  };
}

describe("ccorpLevel1Engine", () => {
  it("calcula mediana ignorando celdas vacias", () => {
    expect(calculateMedian([10, null, 12, 11, undefined])).toBe(11);
    expect(calculateMedian([null, undefined])).toBeNull();
  });

  it("calcula IMC, ICC y sumatoria de pliegues", () => {
    const result = calculateCcorpLevel1(input());
    expect(result.bmi).toBeCloseTo(24.69, 2);
    expect(result.waistHipRatio).toBeCloseTo(0.813, 3);
    expect(result.sum6Skinfolds).toBeCloseTo(59, 2);
  });

  it("calcula composicion corporal Durnin y masas derivadas", () => {
    const result = calculateCcorpLevel1(input("male"));
    expect(result.durninBodyFatPercent).toBeGreaterThan(0);
    expect(result.durninFatMassKg).toBeCloseTo((80 * (result.durninBodyFatPercent ?? 0)) / 100, 1);
    expect(result.durninFatFreeMassKg).toBeCloseTo(80 - (result.durninFatMassKg ?? 0), 2);
    expect(result.durninFmi).toBeGreaterThan(0);
    expect(result.durninFfmi).toBeGreaterThan(0);
  });

  it("calcula somatotipo y coordenadas de somatocarta", () => {
    const result = calculateCcorpLevel1(input());
    expect(result.endomorphy).toBeGreaterThan(0);
    expect(result.mesomorphy).toBeGreaterThan(0);
    expect(result.ectomorphy).toBeGreaterThanOrEqual(0.1);
    expect(result.somatoX).toBeCloseTo((result.ectomorphy ?? 0) - (result.endomorphy ?? 0), 1);
    expect(result.somatoY).toBeCloseTo(2 * (result.mesomorphy ?? 0) - ((result.endomorphy ?? 0) + (result.ectomorphy ?? 0)), 1);
  });

  it("calcula peso ideal y objetivo de masa magra", () => {
    const result = calculateCcorpLevel1(input());
    const durnin = result.idealTargets.find((target) => target.method === "durnin");
    expect(durnin.idealWeightKg).toBeGreaterThan(0);
    expect(durnin.targetFatMassKg).toBeGreaterThan(0);
    expect(durnin.targetFatFreeMassKg).toBeCloseTo(1.8 ** 2 * 22, 2);
  });
});
