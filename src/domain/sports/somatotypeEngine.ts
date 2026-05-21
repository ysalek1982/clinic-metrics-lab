export type SomatotypeStatus = "ready" | "insufficient_data";

export interface SomatotypeInput {
  endomorphy: number | null | undefined;
  mesomorphy: number | null | undefined;
  ectomorphy: number | null | undefined;
}

export interface SomatotypeResult {
  status: SomatotypeStatus;
  endomorphy: number | null;
  mesomorphy: number | null;
  ectomorphy: number | null;
  x: number | null;
  y: number | null;
  label: string | null;
  message: string;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function somatotypeLabel(endomorphy: number, mesomorphy: number, ectomorphy: number) {
  const values = [
    { key: "endomorfo", value: endomorphy },
    { key: "mesomorfo", value: mesomorphy },
    { key: "ectomorfo", value: ectomorphy },
  ].sort((left, right) => right.value - left.value);

  const [primary, secondary, tertiary] = values;
  const primaryDelta = primary.value - secondary.value;
  const secondaryDelta = secondary.value - tertiary.value;

  if (primaryDelta <= 0.5 && secondaryDelta <= 0.5) return "Somatotipo balanceado";
  if (primaryDelta <= 0.5) return `${capitalize(primary.key)}-${secondary.key} balanceado`;
  return `Predominio ${primary.key}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function calculateSomatotype(input: SomatotypeInput): SomatotypeResult {
  const { endomorphy, mesomorphy, ectomorphy } = input;

  if (!isFiniteNumber(endomorphy) || !isFiniteNumber(mesomorphy) || !isFiniteNumber(ectomorphy)) {
    return {
      status: "insufficient_data",
      endomorphy: isFiniteNumber(endomorphy) ? endomorphy : null,
      mesomorphy: isFiniteNumber(mesomorphy) ? mesomorphy : null,
      ectomorphy: isFiniteNumber(ectomorphy) ? ectomorphy : null,
      x: null,
      y: null,
      label: null,
      message: "Datos antropométricos insuficientes para calcular somatotipo.",
    };
  }

  const x = ectomorphy - endomorphy;
  const y = 2 * mesomorphy - (endomorphy + ectomorphy);

  return {
    status: "ready",
    endomorphy: round(endomorphy, 1),
    mesomorphy: round(mesomorphy, 1),
    ectomorphy: round(ectomorphy, 1),
    x: round(x, 2),
    y: round(y, 2),
    label: somatotypeLabel(endomorphy, mesomorphy, ectomorphy),
    message: "Somatotipo calculado desde componentes antropométricos completos.",
  };
}

export function conservativeSportsRecommendation(result: SomatotypeResult) {
  if (result.status !== "ready") {
    return "No emitir recomendación deportiva específica hasta completar mediciones antropométricas suficientes.";
  }

  if ((result.endomorphy ?? 0) >= 6) {
    return "Revisar composición corporal y objetivos de rendimiento con seguimiento nutricional individualizado.";
  }

  if ((result.mesomorphy ?? 0) >= 5) {
    return "Mantener seguimiento longitudinal de masa magra, carga de entrenamiento y recuperación.";
  }

  if ((result.ectomorphy ?? 0) >= 5) {
    return "Vigilar disponibilidad energética, recuperación y cambios bruscos de peso.";
  }

  return "Continuar seguimiento periódico y comparar evolución con mediciones reales posteriores.";
}
