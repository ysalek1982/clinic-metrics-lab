import { describe, expect, it } from "vitest";
import {
  filterPlatformUsers,
  isValidMembershipPlanCode,
  normalizeInviteCode,
  summarizePlatformUsers,
  summarizeSaasAdminKpis,
  validateAccessRequestInput,
  validateApprovalInput,
  validateInviteCodeInput,
} from "./saasAdmin";

describe("saasAdmin helpers", () => {
  it("normalizes invite codes safely", () => {
    expect(normalizeInviteCode(" hsm foundation 2026 ")).toBe("HSM-FOUNDATION-2026");
  });

  it("validates access request input", () => {
    expect(validateAccessRequestInput({ fullName: "", jobTitle: "", message: "" })).toContain("Nombre completo requerido.");
    expect(validateAccessRequestInput({ fullName: "Marcela Cruz" })).toEqual([]);
  });

  it("validates approval plan codes", () => {
    expect(isValidMembershipPlanCode("courtesy")).toBe(true);
    expect(isValidMembershipPlanCode("pro")).toBe(true);
    expect(isValidMembershipPlanCode("clinic_hospital")).toBe(true);
    expect(isValidMembershipPlanCode("free_forever")).toBe(false);
    expect(validateApprovalInput({ tenantId: "", roleCode: "", planCode: "free_forever" })).toHaveLength(3);
  });

  it("validates invite code inputs", () => {
    expect(
      validateInviteCodeInput({
        tenantId: "tenant-a",
        code: "HSM-2026",
        roleCode: "clinical_nutritionist",
        planCode: "courtesy",
        maxUses: 1,
      }),
    ).toEqual([]);
    expect(
      validateInviteCodeInput({
        tenantId: "tenant-a",
        code: "HSM-2026",
        roleCode: "clinical_nutritionist",
        planCode: "courtesy",
        maxUses: 0,
      }),
    ).toContain("Usos maximos debe ser mayor a cero.");
  });

  it("summarizes SaaS admin KPIs", () => {
    expect(
      summarizeSaasAdminKpis({
        requests: [{ status: "pending" }, { status: "approved" }, { status: "rejected" }],
        grants: [{ status: "active", planCode: "courtesy" }, { status: "cancelled", planCode: "courtesy" }],
        invites: [{ status: "active", isActive: true }, { status: "revoked", isActive: false }],
      }),
    ).toEqual({
      activeCourtesy: 1,
      activeInvites: 1,
      approvedRequests: 1,
      pendingRequests: 1,
      rejectedRequests: 1,
    });
  });

  it("filters platform users by email, name, tenant or role", () => {
    const users = [
      { email: "marcela@example.com", fullName: "Marcela Cruz", tenantName: "HSM", roleCodes: ["free_member"] },
      { email: "ysalek@example.com", fullName: "Ysalek Admin", tenantName: "Platform", roleCodes: ["platform_superadmin"] },
    ];

    expect(filterPlatformUsers(users, "marcela")).toEqual([users[0]]);
    expect(filterPlatformUsers(users, "platform_superadmin")).toEqual([users[1]]);
    expect(filterPlatformUsers(users, "hsm")).toEqual([users[0]]);
    expect(filterPlatformUsers(users, "")).toEqual(users);
  });

  it("summarizes platform users without granting admin by default", () => {
    expect(
      summarizePlatformUsers([
        { status: "active", roleCodes: ["free_member"] },
        { status: "inactive", roleCodes: ["viewer"] },
        { status: "active", roleCodes: ["platform_superadmin"] },
      ]),
    ).toEqual({
      active: 2,
      inactive: 1,
      platformAdmins: 1,
      total: 3,
    });
  });
});
