import { describe, expect, it } from "vitest";
import { MODULE_REGISTRY, type ModuleDefinition } from "@/config/moduleRegistry";
import { getModuleAccess, searchModules } from "@/lib/moduleAccess";

const reportsModule = MODULE_REGISTRY.find((module) => module.id === "reports-center") as ModuleDefinition;
const enteralModule = MODULE_REGISTRY.find((module) => module.id === "enteral") as ModuleDefinition;
const whoModule = MODULE_REGISTRY.find((module) => module.id === "who-importer") as ModuleDefinition;
const interpretationsModule = MODULE_REGISTRY.find((module) => module.id === "lab-interpretations") as ModuleDefinition;

describe("moduleAccess", () => {
  it("habilita modulo cuando tiene permiso y ruta real", () => {
    const access = getModuleAccess(reportsModule, {
      hasPermission: (permission) => permission === "reports.export",
      hasTenant: true,
    });

    expect(access.canOpen).toBe(true);
    expect(access.label).toBe("Activo");
  });

  it("oculta modulo cuando falta permiso", () => {
    const access = getModuleAccess(reportsModule, {
      hasPermission: () => false,
      hasTenant: true,
    });

    expect(access.visible).toBe(false);
    expect(access.label).toBe("Requiere permiso");
  });

  it("deshabilita modulo proximamente", () => {
    const access = getModuleAccess(interpretationsModule, { hasTenant: true });

    expect(access.canOpen).toBe(false);
    expect(access.visible).toBe(true);
    expect(access.label).toBe("Proximamente");
  });

  it("deshabilita modulo bloqueado por dependencia", () => {
    const access = getModuleAccess(whoModule, { hasTenant: true });

    expect(access.canOpen).toBe(false);
    expect(access.label).toBe("Bloqueado");
    expect(access.reason).toContain("CSV");
  });

  it("bloquea pack no habilitado sin ocultar el modulo", () => {
    const access = getModuleAccess(enteralModule, {
      enabledPacks: ["clinical"],
      hasTenant: true,
    });

    expect(access.visible).toBe(true);
    expect(access.canOpen).toBe(false);
    expect(access.reason).toContain("enteral");
  });

  it("filtra busqueda sin sensibilidad a mayusculas", () => {
    const result = searchModules(MODULE_REGISTRY, "copilot");
    expect(result.map((module) => module.id)).toContain("copilot");
  });
});
