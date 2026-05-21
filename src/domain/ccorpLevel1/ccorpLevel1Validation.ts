import type { CcorpLevel1Input } from "./ccorpLevel1Types";

export function validateCcorpLevel1Input(input: CcorpLevel1Input) {
  const errors: string[] = [];
  const hasValue = (code: string) =>
    input.measurements.some(
      (measurement) =>
        measurement.variableCode === code &&
        measurement.series.some((value) => typeof value === "number" && Number.isFinite(value) && value > 0),
    );

  if (!input.measuredAt) errors.push("La fecha de medición es obligatoria.");
  if (!input.sex) errors.push("El sexo de referencia es obligatorio.");
  if (!hasValue("weight_kg")) errors.push("El peso bruto es obligatorio.");
  if (!hasValue("height_cm")) errors.push("La talla corporal es obligatoria.");

  return errors;
}
