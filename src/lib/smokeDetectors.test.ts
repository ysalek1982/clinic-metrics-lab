import { describe, expect, it } from "vitest";
import {
  analyzeRouteSnapshot,
  classifyUiAction,
  detectEmptyDom,
  detectErrorBoundary,
  detectMojibake,
  detectUnsafeCopilotClaims,
  detectUndefinedData,
  isRiskyAction,
  sanitizeRouteName,
  scoreRouteSnapshot,
} from "../../scripts/lib/smoke-detectors.mjs";

describe("smoke route detectors", () => {
  it("detecta mojibake, ErrorBoundary, undefined.data y DOM vacio", () => {
    expect(detectMojibake(`Cr${String.fromCharCode(0x00c3)}tico`)).toBe(true);
    expect(detectErrorBoundary("No se pudo renderizar este módulo")).toBe(true);
    expect(detectUndefinedData("Cannot read properties of undefined (reading 'data')")).toBe(true);
    expect(detectEmptyDom("", 0)).toBe(true);
    expect(detectEmptyDom("Nutri", 4)).toBe(false);
  });

  it("distingue botones de accion riesgosos de botones limitados", () => {
    expect(isRiskyAction({ text: "Exportar PDF", disabled: false, hasHandler: false })).toBe(true);
    expect(isRiskyAction({ text: "PDF Próximamente", disabled: false, hasHandler: false })).toBe(false);
    expect(isRiskyAction({ text: "Guardar", disabled: false, hasHandler: true })).toBe(false);
    expect(isRiskyAction({ text: "Crear", disabled: true, hasHandler: false })).toBe(false);
    expect(classifyUiAction({ text: "Cerrar plan", disabled: false, hasHandler: false }).risk).toBe("high");
    expect(classifyUiAction({ text: "Guardar", type: "submit", formAssociated: true }).kind).toBe("functional_probable");
  });

  it("genera hallazgos de ruta y nombres seguros", () => {
    const result = analyzeRouteSnapshot({
      bodyText: "No se pudo renderizar este módulo",
      elementCount: 2,
      authenticated: true,
      visibleButtons: [{ text: "Exportar Excel", disabled: false, hasHandler: false }],
      pageErrors: ["boom"],
    });

    expect(result.findings).toEqual(["error_boundary_visible", "botones_riesgo_visibles", "pageerror"]);
    expect(sanitizeRouteName("/app/pack/enteral/cockpit")).toBe("app-pack-enteral-cockpit");
  });

  it("calcula score de smoke local por ruta", () => {
    const score = scoreRouteSnapshot({
      bodyText: "Nutri cockpit clinico con contenido suficiente y acciones visibles para revision local",
      elementCount: 24,
      authenticated: false,
      visibleButtons: [{ text: "Guardar", hasHandler: true }],
      pageErrors: [],
    });

    expect(score.finalStatus).toBe("pass");
    expect(score.renderScore).toBe(100);
    expect(score.actionRiskScore).toBe(100);
  });

  it("detecta promesas clinicas o IA generativa activa en Copilot", () => {
    expect(detectUnsafeCopilotClaims("IA generativa activa para diagnostico probable")).toBe(true);
    expect(detectUnsafeCopilotClaims("Asistente contextual, sin IA generativa. No genera diagnostico ni tratamiento.")).toBe(false);

    const score = scoreRouteSnapshot({
      bodyText: "Copilot con IA generativa activa y diagnostico probable",
      elementCount: 24,
      authenticated: false,
      visibleButtons: [],
      pageErrors: [],
    });

    expect(score.finalStatus).toBe("fail");
  });
});
