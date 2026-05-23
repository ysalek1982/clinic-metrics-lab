import { describe, expect, it } from "vitest";
import { MODULE_REGISTRY, type ModuleDefinition } from "@/config/moduleRegistry";
import { getModuleAccess, searchModules } from "@/lib/moduleAccess";

const reportsModule = MODULE_REGISTRY.find((module) => module.id === "reports-center") as ModuleDefinition;
const enteralModule = MODULE_REGISTRY.find((module) => module.id === "enteral") as ModuleDefinition;
const whoModule = MODULE_REGISTRY.find((module) => module.id === "who-importer") as ModuleDefinition;
const interpretationsModule = MODULE_REGISTRY.find((module) => module.id === "lab-interpretations") as ModuleDefinition;
const organizationModule = MODULE_REGISTRY.find((module) => module.id === "organization") as ModuleDefinition;
const saasAdminModule = MODULE_REGISTRY.find((module) => module.id === "saas-admin") as ModuleDefinition;
const accountModule = MODULE_REGISTRY.find((module) => module.id === "account") as ModuleDefinition;

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

  it("oculta administracion cuando el plan Free no incluye la funcion aunque exista permiso", () => {
    const access = getModuleAccess(organizationModule, {
      hasPermission: (permission) => permission === "settings.manage",
      hasTenant: true,
      subscription: { planCode: "free", status: "active" },
    });

    expect(access.visible).toBe(false);
    expect(access.canOpen).toBe(false);
    expect(access.label).toBe("Requiere plan");
  });

  it("muestra Mi cuenta para plan Free", () => {
    const access = getModuleAccess(accountModule, {
      hasTenant: true,
      subscription: { planCode: "free", status: "active" },
    });

    expect(access.visible).toBe(true);
    expect(access.canOpen).toBe(true);
    expect(access.label).toBe("Activo");
  });

  it("permite administracion institucional con Clinic/Hospital y permiso real", () => {
    const access = getModuleAccess(organizationModule, {
      hasPermission: (permission) => permission === "settings.manage",
      hasTenant: true,
      subscription: { planCode: "clinic_hospital", status: "active" },
    });

    expect(access.visible).toBe(true);
    expect(access.canOpen).toBe(true);
    expect(access.label).toBe("Activo");
  });

  it("mantiene bypass de plan para platform superadmin", () => {
    const access = getModuleAccess(saasAdminModule, {
      hasPermission: (permission) => permission === "saas.manage",
      hasTenant: false,
      subscription: { planCode: "free", status: "active" },
      bypassPlanGate: true,
    });

    expect(access.visible).toBe(true);
    expect(access.canOpen).toBe(true);
    expect(access.label).toBe("Activo");
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
      hasPermission: (permission) => permission === "enteral.read",
      hasTenant: true,
      subscription: { planCode: "pro", status: "active" },
    });

    expect(access.visible).toBe(true);
    expect(access.canOpen).toBe(false);
    expect(access.reason).toContain("enteral");
  });

  it("oculta Enteral para Free aunque el rol tenga permiso heredado", () => {
    const access = getModuleAccess(enteralModule, {
      enabledPacks: ["enteral"],
      hasPermission: (permission) => permission === "enteral.read",
      hasTenant: true,
      subscription: { planCode: "free", status: "active" },
    });

    expect(access.visible).toBe(false);
    expect(access.canOpen).toBe(false);
    expect(access.label).toBe("Requiere plan");
  });

  it("filtra busqueda sin sensibilidad a mayusculas", () => {
    const result = searchModules(MODULE_REGISTRY, "copilot");
    expect(result.map((module) => module.id)).toContain("copilot");
  });
});
