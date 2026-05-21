import { describe, expect, it } from "vitest";
import { getSitesByProtocol } from "@/data/clinical";
import {
  calculateBmi,
  calculateYuhaszBodyFat,
  deriveAnthropometryResults,
  qualityIndex,
  validateMeasurements,
  type MeasurementValues,
} from "./anthropometryEngine";

const sites = getSitesByProtocol("protocol-isak-restricted");

const values: MeasurementValues = {
  "site-weight": { attempt1: 69.2, attempt2: 69.2 },
  "site-height": { attempt1: 178.5, attempt2: 178.4 },
  "site-triceps": { attempt1: 8.2, attempt2: 8.4 },
  "site-subscapular": { attempt1: 9.1, attempt2: 9.3 },
  "site-supraspinale": { attempt1: 6.8, attempt2: 7.0 },
  "site-abdominal": { attempt1: 12.1, attempt2: 12.4 },
  "site-front-thigh": { attempt1: 10.8, attempt2: 11.0 },
  "site-medial-calf": { attempt1: 6.7, attempt2: 6.9 },
  "site-waist": { attempt1: 75.4, attempt2: 75.6 },
  "site-hip": { attempt1: 96.2, attempt2: 96.1 },
};

describe("anthropometryEngine", () => {
  it("calculates BMI", () => {
    expect(calculateBmi(69.2, 178.5)).toBe(21.7);
  });

  it("calculates Yuhasz body fat from sum of six skinfolds", () => {
    expect(calculateYuhaszBodyFat(51.7, "male")).toBe(8);
  });

  it("validates repeated measurements against site tolerance", () => {
    const validations = validateMeasurements(sites, values);

    expect(validations.every((item) => item.withinTolerance || item.severity === "missing")).toBe(true);
    expect(qualityIndex(validations)).toBe(83);
  });

  it("derives anthropometry results from measured sites", () => {
    const results = deriveAnthropometryResults(sites, values, [], { sex: "male", ageYears: 25 });
    const bmi = results.find((item) => item.key === "bmi");
    const sum6 = results.find((item) => item.key === "sum6");

    expect(bmi.value).toBe(21.7);
    expect(sum6.value).toBe(54.3);
  });
});
