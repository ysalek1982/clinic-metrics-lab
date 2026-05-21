import { describe, expect, it } from "vitest";
import { MODULE_REGISTRY } from "@/config/moduleRegistry";
import { assertUniqueActiveRoutes, assertUniqueModuleIds, groupModulesByArea, searchModules } from "@/lib/moduleAccess";

describe("moduleRegistry", () => {
  it("no duplica ids", () => {
    expect(assertUniqueModuleIds(MODULE_REGISTRY)).toEqual([]);
  });

  it("mantiene rutas unicas en modulos activos navegables", () => {
    expect(assertUniqueActiveRoutes(MODULE_REGISTRY)).toEqual([]);
  });

  it("no define rutas vacias en modulos activos que prometen navegacion", () => {
    const invalid = MODULE_REGISTRY.filter(
      (module) => module.status === "active" && module.showInSidebar && !module.route,
    );
    expect(invalid).toEqual([]);
  });

  it("agrupa modulos por area", () => {
    const groups = groupModulesByArea(MODULE_REGISTRY);
    expect(groups.some((group) => group.area === "clinical")).toBe(true);
    expect(groups.some((group) => group.area === "hospital")).toBe(true);
    expect(groups.some((group) => group.area === "system")).toBe(true);
  });

  it("permite buscar por etiqueta o descripcion", () => {
    expect(searchModules(MODULE_REGISTRY, "enteral").map((module) => module.id)).toContain("enteral");
    expect(searchModules(MODULE_REGISTRY, "WHO").map((module) => module.id)).toContain("who-importer");
  });
});
