import { supabase } from "@/integrations/supabase/client";
import { normalizeInviteCode, type AccessRequestStatus, type MembershipPlanCode } from "@/lib/saasAdmin";

export interface AccessRequest {
  requestId: string;
  userId: string | null;
  email: string;
  fullName: string | null;
  jobTitle: string | null;
  requestedTenantId: string | null;
  requestedTenantName: string | null;
  requestedInviteCode: string | null;
  message: string | null;
  status: AccessRequestStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantInviteCode {
  id: string;
  tenantId: string;
  inviteCode: string;
  roleCode: string;
  planCode: MembershipPlanCode;
  status: string;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourtesyMembership {
  grantId: string;
  tenantId: string;
  tenantName: string;
  userId: string | null;
  email: string;
  fullName: string;
  membershipId: string | null;
  planCode: MembershipPlanCode;
  status: string;
  startsAt: string;
  endsAt: string | null;
  grantedBy: string | null;
  grantReason: string | null;
  createdAt: string;
}

export interface PlatformUser {
  membershipId: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  email: string;
  fullName: string;
  initials: string;
  title: string | null;
  status: "active" | "invited" | "inactive";
  roleCodes: string[];
  roleNames: string[];
  updatedAt: string;
}

export interface EffectivePermission {
  tenantId: string;
  membershipId: string;
  roleCode: string;
  permissionId: string;
}

export interface SubmitAccessRequestInput {
  fullName: string;
  jobTitle?: string | null;
  requestedInviteCode?: string | null;
  message?: string | null;
  requestedTenantId?: string | null;
}

export interface ApproveAccessRequestInput {
  requestId: string;
  tenantId: string;
  roleCode: string;
  planCode: MembershipPlanCode;
  endsAt?: string | null;
  reviewNote?: string | null;
}

export interface RejectAccessRequestInput {
  requestId: string;
  reviewNote?: string | null;
}

export interface CreateInviteCodeInput {
  tenantId: string;
  code: string;
  roleCode: string;
  planCode: MembershipPlanCode;
  maxUses?: number | null;
  expiresAt?: string | null;
}

export interface GrantCourtesyMembershipInput {
  tenantId: string;
  userEmail: string;
  roleCode: string;
  planCode: MembershipPlanCode;
  endsAt?: string | null;
  grantReason?: string | null;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }
  return supabase;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toAccessRequest(row: unknown): AccessRequest {
  const record = asRecord(row);
  return {
    requestId: String(record.request_id ?? record.id ?? ""),
    userId: stringOrNull(record.user_id),
    email: String(record.email ?? ""),
    fullName: stringOrNull(record.full_name),
    jobTitle: stringOrNull(record.job_title),
    requestedTenantId: stringOrNull(record.requested_tenant_id),
    requestedTenantName: stringOrNull(record.requested_tenant_name),
    requestedInviteCode: stringOrNull(record.requested_invite_code),
    message: stringOrNull(record.message),
    status: String(record.status ?? "pending") as AccessRequestStatus,
    reviewedBy: stringOrNull(record.reviewed_by),
    reviewedAt: stringOrNull(record.reviewed_at),
    reviewNote: stringOrNull(record.review_note),
    createdAt: String(record.created_at ?? new Date().toISOString()),
    updatedAt: String(record.updated_at ?? new Date().toISOString()),
  };
}

function toInviteCode(row: unknown): TenantInviteCode {
  const record = asRecord(row);
  return {
    id: String(record.id ?? ""),
    tenantId: String(record.tenant_id ?? ""),
    inviteCode: String(record.invite_code ?? ""),
    roleCode: String(record.role_code ?? ""),
    planCode: String(record.plan_code ?? "courtesy") as MembershipPlanCode,
    status: String(record.status ?? "active"),
    maxUses: typeof record.max_uses === "number" ? record.max_uses : null,
    usedCount: typeof record.used_count === "number" ? record.used_count : 0,
    isActive: record.is_active !== false,
    expiresAt: stringOrNull(record.expires_at),
    createdAt: String(record.created_at ?? new Date().toISOString()),
    updatedAt: String(record.updated_at ?? new Date().toISOString()),
  };
}

function toCourtesyMembership(row: unknown): CourtesyMembership {
  const record = asRecord(row);
  return {
    grantId: String(record.grant_id ?? record.id ?? ""),
    tenantId: String(record.tenant_id ?? ""),
    tenantName: String(record.tenant_name ?? "Tenant"),
    userId: stringOrNull(record.user_id),
    email: String(record.email ?? ""),
    fullName: String(record.full_name ?? "Usuario"),
    membershipId: stringOrNull(record.membership_id),
    planCode: String(record.plan_code ?? "courtesy") as MembershipPlanCode,
    status: String(record.status ?? "active"),
    startsAt: String(record.starts_at ?? new Date().toISOString()),
    endsAt: stringOrNull(record.ends_at),
    grantedBy: stringOrNull(record.granted_by),
    grantReason: stringOrNull(record.grant_reason),
    createdAt: String(record.created_at ?? new Date().toISOString()),
  };
}

function toPlatformUser(row: unknown): PlatformUser {
  const record = asRecord(row);
  return {
    membershipId: String(record.membership_id ?? ""),
    tenantId: String(record.tenant_id ?? ""),
    tenantName: String(record.tenant_name ?? "Tenant"),
    userId: String(record.user_id ?? ""),
    email: String(record.email ?? ""),
    fullName: String(record.full_name ?? "Usuario"),
    initials: String(record.initials ?? "US"),
    title: stringOrNull(record.title),
    status: String(record.status ?? "inactive") as PlatformUser["status"],
    roleCodes: stringList(record.role_codes),
    roleNames: stringList(record.role_names),
    updatedAt: String(record.updated_at ?? new Date().toISOString()),
  };
}

function toEffectivePermission(row: unknown): EffectivePermission {
  const record = asRecord(row);
  return {
    tenantId: String(record.tenant_id ?? ""),
    membershipId: String(record.membership_id ?? ""),
    roleCode: String(record.role_code ?? ""),
    permissionId: String(record.permission_id ?? ""),
  };
}

export async function submitAccessRequest(input: SubmitAccessRequestInput) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("submit_access_request", {
    p_full_name: input.fullName.trim(),
    p_job_title: input.jobTitle?.trim() || null,
    p_requested_invite_code: input.requestedInviteCode ? normalizeInviteCode(input.requestedInviteCode) : null,
    p_message: input.message?.trim() || null,
    p_requested_tenant_id: input.requestedTenantId || null,
  });

  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function listAccessRequests(status: AccessRequestStatus | "all" = "all"): Promise<AccessRequest[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_list_access_requests", {
    p_status: status,
  });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []).map(toAccessRequest);
}

export async function listPlatformUsers(): Promise<PlatformUser[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_list_memberships", {
    p_tenant_id: null,
  });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []).map(toPlatformUser);
}

export async function listEffectivePermissions(userId: string, tenantId?: string | null): Promise<EffectivePermission[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_list_effective_permissions", {
    p_user_id: userId,
    p_tenant_id: tenantId || null,
  });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []).map(toEffectivePermission);
}

export async function assignRoleToUser(input: { membershipId: string; roleCode: string }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_assign_role_to_user", {
    p_membership_id: input.membershipId,
    p_role_code: input.roleCode,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function removeRoleFromUser(input: { membershipId: string; roleCode: string }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_remove_role_from_user", {
    p_membership_id: input.membershipId,
    p_role_code: input.roleCode,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function updatePlatformMembershipStatus(input: { membershipId: string; status: PlatformUser["status"] }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_update_membership_status", {
    p_membership_id: input.membershipId,
    p_status: input.status,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function approveAccessRequest(input: ApproveAccessRequestInput) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_approve_access_request", {
    p_request_id: input.requestId,
    p_tenant_id: input.tenantId,
    p_role_code: input.roleCode,
    p_plan_code: input.planCode,
    p_ends_at: input.endsAt || null,
    p_review_note: input.reviewNote?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function rejectAccessRequest(input: RejectAccessRequestInput) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_reject_access_request", {
    p_request_id: input.requestId,
    p_review_note: input.reviewNote?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function listInviteCodes(): Promise<TenantInviteCode[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("tenant_invites")
    .select("id, tenant_id, invite_code, role_code, status, expires_at, created_at, updated_at, plan_code, max_uses, used_count, is_active")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toInviteCode);
}

export async function createInviteCode(input: CreateInviteCodeInput) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_create_invite_code", {
    p_tenant_id: input.tenantId,
    p_code: normalizeInviteCode(input.code),
    p_role_code: input.roleCode,
    p_plan_code: input.planCode,
    p_max_uses: input.maxUses ?? 1,
    p_expires_at: input.expiresAt || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function deactivateInviteCode(inviteId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_deactivate_invite_code", {
    p_invite_id: inviteId,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function listCourtesyMemberships(status: "all" | "active" | "expired" | "cancelled" = "all"): Promise<CourtesyMembership[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_list_courtesy_memberships", {
    p_status: status,
  });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []).map(toCourtesyMembership);
}

export async function grantCourtesyMembership(input: GrantCourtesyMembershipInput) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_grant_courtesy_membership", {
    p_tenant_id: input.tenantId,
    p_user_email: input.userEmail.trim().toLowerCase(),
    p_role_code: input.roleCode,
    p_plan_code: input.planCode,
    p_ends_at: input.endsAt || null,
    p_grant_reason: input.grantReason?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function revokeCourtesyMembership(grantId: string, reason?: string | null) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_revoke_courtesy_membership", {
    p_grant_id: grantId,
    p_reason: reason?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}
