export type EnteralToleranceStatus = "good" | "watch" | "poor" | "critical";

export interface EnteralPlanMetricsInput {
  targetVolumeMl: number | null;
  targetKcal: number | null;
  targetProteinG: number | null;
  deliveredVolumeMl: number | null;
  deliveredKcal: number | null;
  deliveredProteinG: number | null;
  adherencePct: number | null;
  vomiting: boolean;
  diarrhea: boolean;
  abdominalDistension: boolean;
  aspirationEvent: boolean;
  manualToleranceStatus?: string | null;
}

export interface EnteralPlanMetrics {
  volumeDeliveredPct: number | null;
  kcalDeliveredPct: number | null;
  proteinDeliveredPct: number | null;
  kcalGap: number | null;
  proteinGap: number | null;
  toleranceStatus: EnteralToleranceStatus;
  flags: string[];
}

function pct(numerator: number | null, denominator: number | null) {
  if (numerator == null || denominator == null || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function gap(target: number | null, delivered: number | null) {
  if (target == null || delivered == null) return null;
  return Math.round((target - delivered) * 10) / 10;
}

function normalizeManualTolerance(value: string | null | undefined): EnteralToleranceStatus | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (["critical", "critico", "crítico", "aspiracion", "aspiración"].some((item) => normalized.includes(item))) return "critical";
  if (["poor", "mala", "malo", "intolerancia"].some((item) => normalized.includes(item))) return "poor";
  if (["watch", "observacion", "observación", "moderada"].some((item) => normalized.includes(item))) return "watch";
  if (["good", "buena", "bien", "tolerado"].some((item) => normalized.includes(item))) return "good";
  return null;
}

export function calculateEnteralPlanMetrics(input: EnteralPlanMetricsInput): EnteralPlanMetrics {
  const volumeDeliveredPct = input.adherencePct ?? pct(input.deliveredVolumeMl, input.targetVolumeMl);
  const kcalDeliveredPct = pct(input.deliveredKcal, input.targetKcal);
  const proteinDeliveredPct = pct(input.deliveredProteinG, input.targetProteinG);
  const kcalGap = gap(input.targetKcal, input.deliveredKcal);
  const proteinGap = gap(input.targetProteinG, input.deliveredProteinG);
  const flags: string[] = [];

  if (volumeDeliveredPct != null && volumeDeliveredPct < 80) flags.push("volumen_bajo");
  if (input.aspirationEvent) flags.push("aspiracion");
  if (input.vomiting) flags.push("vomitos");
  if (input.diarrhea) flags.push("diarrea");
  if (input.abdominalDistension) flags.push("distension_abdominal");

  const manual = normalizeManualTolerance(input.manualToleranceStatus);
  const toleranceStatus: EnteralToleranceStatus =
    input.aspirationEvent || manual === "critical"
      ? "critical"
      : input.vomiting || input.diarrhea || input.abdominalDistension || manual === "poor"
        ? "poor"
        : (volumeDeliveredPct != null && volumeDeliveredPct < 80) || manual === "watch"
          ? "watch"
          : "good";

  return {
    volumeDeliveredPct,
    kcalDeliveredPct,
    proteinDeliveredPct,
    kcalGap,
    proteinGap,
    toleranceStatus,
    flags,
  };
}

export function enteralToleranceLabel(status: EnteralToleranceStatus) {
  const labels: Record<EnteralToleranceStatus, string> = {
    good: "Buena",
    watch: "En observación",
    poor: "Mala tolerancia",
    critical: "Crítica",
  };
  return labels[status];
}
