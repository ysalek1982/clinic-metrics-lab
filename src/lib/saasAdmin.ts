export const ACCESS_REQUEST_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export const MEMBERSHIP_PLAN_CODES = [
  "free",
  "courtesy",
  "pro",
  "clinic_hospital",
] as const;
export const GRANT_STATUSES = ["active", "expired", "cancelled"] as const;

export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number];
export type MembershipPlanCode = (typeof MEMBERSHIP_PLAN_CODES)[number];
export type GrantStatus = (typeof GRANT_STATUSES)[number];

export interface PlatformUserSearchItem {
  email: string;
  fullName: string;
  tenantName: string;
  roleCodes: string[];
}

export function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export function isValidAccessRequestStatus(value: string): value is AccessRequestStatus {
  return ACCESS_REQUEST_STATUSES.includes(value as AccessRequestStatus);
}

export function isValidMembershipPlanCode(value: string): value is MembershipPlanCode {
  return MEMBERSHIP_PLAN_CODES.includes(value as MembershipPlanCode);
}

export function isValidGrantStatus(value: string): value is GrantStatus {
  return GRANT_STATUSES.includes(value as GrantStatus);
}

export function validateAccessRequestInput(input: {
  fullName: string;
  jobTitle?: string | null;
  message?: string | null;
}) {
  const errors: string[] = [];
  if (!input.fullName.trim()) errors.push("Nombre completo requerido.");
  if ((input.jobTitle ?? "").length > 120) errors.push("Cargo demasiado largo.");
  if ((input.message ?? "").length > 600) errors.push("Mensaje demasiado largo.");
  return errors;
}

export function validateApprovalInput(input: {
  tenantId: string;
  roleCode: string;
  planCode: string;
}) {
  const errors: string[] = [];
  if (!input.tenantId.trim()) errors.push("Tenant requerido.");
  if (!input.roleCode.trim()) errors.push("Rol requerido.");
  if (!isValidMembershipPlanCode(input.planCode)) errors.push("Tipo de membresia invalido.");
  return errors;
}

export function validateInviteCodeInput(input: {
  tenantId: string;
  code: string;
  roleCode: string;
  planCode: string;
  maxUses?: number | null;
}) {
  const errors: string[] = [];
  if (!input.tenantId.trim()) errors.push("Tenant requerido.");
  if (!normalizeInviteCode(input.code)) errors.push("Codigo requerido.");
  if (!input.roleCode.trim()) errors.push("Rol requerido.");
  if (!isValidMembershipPlanCode(input.planCode)) errors.push("Tipo de membresia invalido.");
  if (input.maxUses != null && input.maxUses < 1) errors.push("Usos maximos debe ser mayor a cero.");
  return errors;
}

export function summarizeSaasAdminKpis(input: {
  requests: Array<{ status: string }>;
  grants: Array<{ status: string; planCode?: string | null }>;
  invites: Array<{ status: string; isActive?: boolean | null }>;
}) {
  const pendingRequests = input.requests.filter((item) => item.status === "pending").length;
  const approvedRequests = input.requests.filter((item) => item.status === "approved").length;
  const rejectedRequests = input.requests.filter((item) => item.status === "rejected").length;
  const activeCourtesy = input.grants.filter((item) => item.status === "active" && item.planCode === "courtesy").length;
  const activeInvites = input.invites.filter((item) => item.status === "active" && item.isActive !== false).length;

  return {
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    activeCourtesy,
    activeInvites,
  };
}

export function filterPlatformUsers<T extends PlatformUserSearchItem>(users: T[], search: string): T[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return users;

  return users.filter((user) => {
    const searchable = [
      user.email,
      user.fullName,
      user.tenantName,
      ...user.roleCodes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(needle);
  });
}

export function summarizePlatformUsers(users: Array<{ status: string; roleCodes: string[] }>) {
  return {
    total: users.length,
    active: users.filter((user) => user.status === "active").length,
    inactive: users.filter((user) => user.status === "inactive").length,
    platformAdmins: users.filter((user) => user.roleCodes.includes("platform_superadmin")).length,
  };
}
