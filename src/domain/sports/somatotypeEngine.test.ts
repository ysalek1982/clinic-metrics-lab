import { describe, expect, it } from "vitest";
import { calculateSomatotype, conservativeSportsRecommendation } from "./somatotypeEngine";

describe("somatotypeEngine", () => {
  it("calcula coordenadas de somatocarta con datos completos", () => {
    const result = calculateSomatotype({ endomorphy: 2.4, mesomorphy: 5.1, ectomorphy: 2.9 });

    expect(result.status).toBe("ready");
    expect(result.x).toBeCloseTo(0.5, 2);
    expect(result.y).toBeCloseTo(4.9, 2);
    expect(result.label).toBe("Predominio mesomorfo");
  });

  it("bloquea calculo si faltan componentes", () => {
    const result = calculateSomatotype({ endomorphy: 2.4, mesomorphy: null, ectomorphy: 2.9 });

    expect(result.status).toBe("insufficient_data");
    expect(result.x).toBeNull();
    expect(result.y).toBeNull();
    expect(result.message).toContain("insuficientes");
  });

  it("clasifica somatotipo balanceado sin inventar componentes", () => {
    const result = calculateSomatotype({ endomorphy: 3.1, mesomorphy: 3.3, ectomorphy: 3.2 });

    expect(result.status).toBe("ready");
    expect(result.label).toBe("Somatotipo balanceado");
    expect(result.x).toBeCloseTo(0.1, 2);
    expect(result.y).toBeCloseTo(0.3, 2);
  });

  it("emite recomendacion conservadora solo con datos suficientes", () => {
    const insufficient = calculateSomatotype({ endomorphy: null, mesomorphy: 4, ectomorphy: 3 });
    const ready = calculateSomatotype({ endomorphy: 2, mesomorphy: 5.5, ectomorphy: 2.5 });

    expect(conservativeSportsRecommendation(insufficient)).toContain("No emitir recomendación");
    expect(conservativeSportsRecommendation(ready)).toContain("seguimiento longitudinal");
  });
});
