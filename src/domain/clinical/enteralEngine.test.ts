import { describe, expect, it } from "vitest";
import { calculateEnteralPlanMetrics, enteralToleranceLabel } from "./enteralEngine";

describe("enteralEngine", () => {
  it("calcula porcentaje de volumen entregado desde volumen real", () => {
    const result = calculateEnteralPlanMetrics({
      targetVolumeMl: 1500,
      targetKcal: 1800,
      targetProteinG: 90,
      deliveredVolumeMl: 1200,
      deliveredKcal: 1400,
      deliveredProteinG: 70,
      adherencePct: null,
      vomiting: false,
      diarrhea: false,
      abdominalDistension: false,
      aspirationEvent: false,
    });

    expect(result.volumeDeliveredPct).toBe(80);
    expect(result.kcalDeliveredPct).toBe(77.8);
    expect(result.proteinDeliveredPct).toBe(77.8);
    expect(result.kcalGap).toBe(400);
    expect(result.toleranceStatus).toBe("good");
  });

  it("marca observacion cuando el volumen entregado es menor a 80%", () => {
    const result = calculateEnteralPlanMetrics({
      targetVolumeMl: 1500,
      targetKcal: null,
      targetProteinG: null,
      deliveredVolumeMl: null,
      deliveredKcal: null,
      deliveredProteinG: null,
      adherencePct: 62,
      vomiting: false,
      diarrhea: false,
      abdominalDistension: false,
      aspirationEvent: false,
    });

    expect(result.flags).toContain("volumen_bajo");
    expect(result.toleranceStatus).toBe("watch");
  });

  it("prioriza eventos de intolerancia y aspiracion", () => {
    const poor = calculateEnteralPlanMetrics({
      targetVolumeMl: 1500,
      targetKcal: null,
      targetProteinG: null,
      deliveredVolumeMl: 1500,
      deliveredKcal: null,
      deliveredProteinG: null,
      adherencePct: null,
      vomiting: true,
      diarrhea: false,
      abdominalDistension: false,
      aspirationEvent: false,
    });

    const critical = calculateEnteralPlanMetrics({
      targetVolumeMl: 1500,
      targetKcal: null,
      targetProteinG: null,
      deliveredVolumeMl: 1500,
      deliveredKcal: null,
      deliveredProteinG: null,
      adherencePct: null,
      vomiting: false,
      diarrhea: false,
      abdominalDistension: false,
      aspirationEvent: true,
    });

    expect(poor.toleranceStatus).toBe("poor");
    expect(poor.flags).toContain("vomitos");
    expect(critical.toleranceStatus).toBe("critical");
    expect(critical.flags).toContain("aspiracion");
  });

  it("calcula brecha de proteina y mala tolerancia por sintomas combinados", () => {
    const result = calculateEnteralPlanMetrics({
      targetVolumeMl: 1600,
      targetKcal: 1800,
      targetProteinG: 92,
      deliveredVolumeMl: 900,
      deliveredKcal: 950,
      deliveredProteinG: 45,
      adherencePct: null,
      vomiting: true,
      diarrhea: true,
      abdominalDistension: true,
      aspirationEvent: false,
    });

    expect(result.volumeDeliveredPct).toBeCloseTo(56.3, 1);
    expect(result.kcalGap).toBe(850);
    expect(result.proteinGap).toBe(47);
    expect(result.toleranceStatus).toBe("poor");
    expect(result.flags).toEqual(["volumen_bajo", "vomitos", "diarrea", "distension_abdominal"]);
  });

  it("normaliza estado manual y expone etiquetas clinicas visibles", () => {
    const result = calculateEnteralPlanMetrics({
      targetVolumeMl: 1000,
      targetKcal: null,
      targetProteinG: null,
      deliveredVolumeMl: 1000,
      deliveredKcal: null,
      deliveredProteinG: null,
      adherencePct: null,
      vomiting: false,
      diarrhea: false,
      abdominalDistension: false,
      aspirationEvent: false,
      manualToleranceStatus: "observacion clinica",
    });

    expect(result.toleranceStatus).toBe("watch");
    expect(enteralToleranceLabel(result.toleranceStatus)).toBe("En observación");
    expect(enteralToleranceLabel("critical")).toBe("Crítica");
  });
});
