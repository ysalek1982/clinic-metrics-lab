import { describe, expect, it } from "vitest";
import {
  getCurrentMembership,
  getEffectivePermissionIds,
  hasAnyPermission,
  hasEveryPermission,
  isPlatformSuperadminMembership,
} from "./authorization";

const roles = [
  { id: "clinical_nutritionist", permissions: ["patients.read", "enteral.read"] },
  { id: "enteral_operator", permissions: ["enteral.read", "enteral.create", "enteral.log"] },
];

describe("authorization helpers", () => {
  it("resuelve el membership activo sin fallback cross-tenant", () => {
    const memberships = [
      { tenantId: "tenant-a", roleCodes: ["clinical_nutritionist"] },
      { tenantId: "tenant-b", roleCodes: ["enteral_operator"] },
    ];

    expect(getCurrentMembership(memberships, "tenant-b")?.roleCodes).toEqual(["enteral_operator"]);
    expect(getCurrentMembership(memberships, "tenant-c")).toBeNull();
    expect(getCurrentMembership(memberships, null)).toBeNull();
  });

  it("deduplica permisos de roles asignados", () => {
    expect(getEffectivePermissionIds(roles, ["clinical_nutritionist", "enteral_operator"])).toEqual([
      "patients.read",
      "enteral.read",
      "enteral.create",
      "enteral.log",
    ]);
  });

  it("niega permisos si no hay autenticacion o permiso efectivo", () => {
    const context = { isAuthenticated: true, isPlatformSuperadmin: false, effectivePermissionIds: ["patients.read"] };

    expect(hasAnyPermission(["patients.read"], context)).toBe(true);
    expect(hasAnyPermission(["reports.generate"], context)).toBe(false);
    expect(hasEveryPermission(["patients.read", "reports.generate"], context)).toBe(false);
    expect(hasAnyPermission(["patients.read"], { ...context, isAuthenticated: false })).toBe(false);
  });

  it("permite plataforma superadmin sin simular permisos locales", () => {
    const memberships = [{ tenantId: "tenant-a", roleCodes: ["platform_superadmin"] }];
    const context = { isAuthenticated: true, isPlatformSuperadmin: true, effectivePermissionIds: [] };

    expect(isPlatformSuperadminMembership(memberships)).toBe(true);
    expect(hasAnyPermission(["users.manage"], context)).toBe(true);
    expect(hasEveryPermission(["users.manage", "memberships.manage"], context)).toBe(true);
  });
});
