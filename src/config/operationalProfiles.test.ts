import { describe, expect, it } from "vitest";
import { MODULE_REGISTRY } from "@/config/moduleRegistry";
import {
  getProfileModules,
  OPERATIONAL_PROFILES,
  suggestOperationalProfile,
} from "@/config/operationalProfiles";

describe("operational profiles", () => {
  it("define perfiles unicos", () => {
    const ids = OPERATIONAL_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("referencian modulos existentes en el registry", () => {
    const moduleIds = new Set(MODULE_REGISTRY.map((module) => module.id));
    const missing = OPERATIONAL_PROFILES.flatMap((profile) => profile.modules.filter((moduleId) => !moduleIds.has(moduleId)));
    expect(missing).toEqual([]);
  });

  it("usan landing routes validas", () => {
    const activeRoutes = new Set(MODULE_REGISTRY.filter((module) => module.route).map((module) => module.route));
    expect(OPERATIONAL_PROFILES.every((profile) => activeRoutes.has(profile.defaultLandingRoute))).toBe(true);
  });

  it("declaran permisos requeridos", () => {
    expect(OPERATIONAL_PROFILES.every((profile) => profile.requiredPermissions.length > 0)).toBe(true);
  });

  it("hospital incluye enteral y parenteral", () => {
    const hospital = OPERATIONAL_PROFILES.find((profile) => profile.id === "hospital");
    expect(hospital?.modules).toEqual(expect.arrayContaining(["enteral", "parenteral"]));
  });

  it("deportivo incluye somatocarta", () => {
    const sports = OPERATIONAL_PROFILES.find((profile) => profile.id === "sports");
    expect(sports?.modules).toContain("somatocarta");
  });

  it("pediatria incluye curvas pediatricas", () => {
    const pediatric = OPERATIONAL_PROFILES.find((profile) => profile.id === "pediatric");
    expect(pediatric?.modules).toContain("pediatric-curves");
  });

  it("administracion incluye usuarios y auditoria", () => {
    const admin = OPERATIONAL_PROFILES.find((profile) => profile.id === "administration");
    expect(admin?.modules).toEqual(expect.arrayContaining(["users-roles", "audit"]));
  });

  it("resuelve modulos del perfil sin undefined", () => {
    const modules = getProfileModules(OPERATIONAL_PROFILES[0]);
    expect(modules.length).toBe(OPERATIONAL_PROFILES[0].modules.length);
  });

  it("sugiere perfil por senales locales", () => {
    expect(suggestOperationalProfile({ enabledPacks: ["enteral"] }).id).toBe("hospital");
    expect(suggestOperationalProfile({ enabledPacks: ["sport"] }).id).toBe("sports");
    expect(suggestOperationalProfile({ enabledPacks: ["pediatric"] }).id).toBe("pediatric");
    expect(suggestOperationalProfile({ isAdmin: true }).id).toBe("administration");
    expect(suggestOperationalProfile({}).id).toBe("clinical-consult");
  });
});
