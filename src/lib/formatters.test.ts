import { describe, expect, it } from "vitest";
import {
  formatClinicalValue,
  formatCurrencyBs,
  formatDate,
  formatDateTime,
  formatEnergyKcal,
  formatInteger,
  formatMassKg,
  formatNumber,
  formatPercent,
  formatProteinG,
  formatVolumeMl,
} from "./formatters";

describe("formatters", () => {
  it("formatea numeros sin NaN ni undefined visibles", () => {
    expect(formatNumber(1234.56)).toBe("1.234,6");
    expect(formatInteger(1234.56)).toBe("1.235");
    expect(formatNumber(undefined)).toBe("No registrado");
    expect(formatPercent(null)).toBe("No calculado");
  });

  it("formatea valores clinicos con unidades", () => {
    expect(formatClinicalValue(88.25, "mg/dL")).toBe("88,3 mg/dL");
    expect(formatMassKg(70)).toBe("70 kg");
    expect(formatVolumeMl(1600)).toBe("1.600 ml");
    expect(formatEnergyKcal(1850)).toBe("1.850 kcal");
    expect(formatProteinG(92.2)).toBe("92,2 g");
  });

  it("formatea moneda y fechas locales", () => {
    expect(formatCurrencyBs(1250)).toBe("Bs 1.250,00");
    expect(formatDate("2026-05-11T12:30:00.000Z")).toMatch(/2026/);
    expect(formatDateTime("2026-05-11T12:30:00.000Z")).toMatch(/2026/);
    expect(formatDate("no-date")).toBe("No registrado");
  });

  it("usa fallbacks seguros para null, undefined y NaN", () => {
    expect(formatNumber(Number.NaN)).toBe("No registrado");
    expect(formatInteger(undefined, "Sin conteo")).toBe("Sin conteo");
    expect(formatCurrencyBs(null)).toBe("No registrado");
    expect(formatClinicalValue(undefined, "kg", "No calculado")).toBe("No calculado");
    expect(formatDateTime(undefined)).toBe("No registrado");
  });

  it("formatea numeros grandes, decimales y strings numericos", () => {
    expect(formatNumber(1234567.891, { maximumFractionDigits: 2 })).toBe("1.234.567,89");
    expect(formatNumber("1234,5")).toBe("1.234,5");
    expect(formatInteger("9999.4")).toBe("9.999");
    expect(formatPercent("87,25")).toBe("87,3 %");
  });

  it("mantiene caracteres espanoles y evita valores invalidos visibles", () => {
    expect(formatClinicalValue(7.2, "mg/dL")).toBe("7,2 mg/dL");
    expect(formatClinicalValue("acido", "\u00e1cido", "No calculado")).toBe("No calculado");
    expect(formatDate("fecha invalida")).toBe("No registrado");
    expect(formatDate(new Date("invalid"))).toBe("No registrado");
  });
});
