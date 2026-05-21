import { TEAM_MEMBERS } from "@/data/saas";
import { supabase } from "@/integrations/supabase/client";

export interface IdentityMembership {
  membershipId: string;
  tenantId: string;
  userId: string;
  status: string;
  title: string | null;
  roleCodes: string[];
  scopePackIds: string[];
}

export interface IdentityContextResult {
  source: "supabase" | "demo";
  profile: {
    id: string;
    fullName: string;
    email: string;
    initials: string;
    title: string | null;
  } | null;
  memberships: IdentityMembership[];
  activationRequired: boolean;
  activeTenantId: string | null;
}

export interface AdminMembership {
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

export interface UpsertAdminMembershipInput {
  tenantId: string;
  email: string;
  roleCode: string;
  status: "active" | "invited" | "inactive";
  title: string | null;
}

export interface UpdateAdminMembershipStatusInput {
  membershipId: string;
  status: "active" | "invited" | "inactive";
}

export interface InviteAuthUserSecureInput {
  tenantId: string;
  email: string;
  fullName?: string | null;
  roleCode?: string | null;
  title?: string | null;
  status?: "active" | "invited" | "inactive";
  createMembership?: boolean;
  mode?: "invite" | "create_confirmed";
  temporaryPassword?: string | null;
}

export interface InviteAuthUserSecureResult {
  ok: boolean;
  userId: string;
  email: string;
  membershipId: string | null;
  invited: boolean;
}

function defaultIdentityContext(): IdentityContextResult {
  const fallbackMember = TEAM_MEMBERS[0];
  return {
    source: "demo",
    profile: fallbackMember
      ? {
          id: fallbackMember.id,
          fullName: fallbackMember.name,
          email: fallbackMember.email,
          initials: fallbackMember.initials,
          title: fallbackMember.title,
        }
      : null,
    memberships: [],
    activationRequired: false,
    activeTenantId: null,
  };
}

function asRecord(row: unknown): Record<string, unknown> {
  return row && typeof row === "object" ? (row as Record<string, unknown>) : {};
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapAdminMembership(row: unknown): AdminMembership {
  const record = asRecord(row);

  return {
    membershipId: String(record.membership_id ?? ""),
    tenantId: String(record.tenant_id ?? ""),
    tenantName: String(record.tenant_name ?? "Tenant"),
    userId: String(record.user_id ?? ""),
    email: String(record.email ?? ""),
    fullName: String(record.full_name ?? "Usuario"),
    initials: String(record.initials ?? "US"),
    title: typeof record.title === "string" ? record.title : null,
    status: (typeof record.status === "string" ? record.status : "inactive") as AdminMembership["status"],
    roleCodes: stringList(record.role_codes),
    roleNames: stringList(record.role_names),
    updatedAt: String(record.updated_at ?? new Date().toISOString()),
  };
}

function buildFallbackProfile(authUser: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>) {
  const fullName =
    authUser.user_metadata.full_name ??
    authUser.user_metadata.name ??
    authUser.email ??
    "Usuario";

  return {
    id: authUser.id,
    fullName,
    email: authUser.email ?? "",
    initials: fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    title: null,
  };
}

export async function getIdentityContext(): Promise<IdentityContextResult> {
  if (!supabase) {
    return defaultIdentityContext();
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {
      source: "supabase",
      profile: null,
      memberships: [],
      activationRequired: false,
      activeTenantId: null,
    };
  }

  const [profileResult, membershipsResult, membershipRolesResult, rolesResult, scopesResult] = await Promise.allSettled([
    supabase.from("user_profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase.from("tenant_memberships").select("*").eq("user_id", authUser.id).order("created_at"),
    supabase.from("membership_roles").select("*"),
    supabase.from("roles").select("*"),
    supabase.from("membership_scopes").select("*"),
  ]);

  const profileRow =
    profileResult.status === "fulfilled" && !profileResult.value.error ? profileResult.value.data : null;
  const membershipRows =
    membershipsResult.status === "fulfilled" && !membershipsResult.value.error
      ? membershipsResult.value.data ?? []
      : [];
  const membershipRoleRows =
    membershipRolesResult.status === "fulfilled" && !membershipRolesResult.value.error
      ? membershipRolesResult.value.data ?? []
      : [];
  const roleRows =
    rolesResult.status === "fulfilled" && !rolesResult.value.error ? rolesResult.value.data ?? [] : [];
  const scopeRows =
    scopesResult.status === "fulfilled" && !scopesResult.value.error ? scopesResult.value.data ?? [] : [];

  const memberships: IdentityMembership[] = membershipRows.map((membership) => {
    const roleCodes = membershipRoleRows
      .filter((membershipRole) => membershipRole.membership_id === membership.id)
      .map((membershipRole) => roleRows.find((role) => role.id === membershipRole.role_id)?.code)
      .filter((code): code is string => Boolean(code));

    const scopePackIds = scopeRows
      .filter((scope) => scope.membership_id === membership.id && scope.pack_id)
      .map((scope) => scope.pack_id!)
      .filter((packId, index, array) => array.indexOf(packId) === index);

    return {
      membershipId: membership.id,
      tenantId: membership.tenant_id,
      userId: membership.user_id,
      status: membership.status,
      title: membership.title,
      roleCodes,
      scopePackIds,
    };
  });

  return {
    source: "supabase",
    profile: profileRow
      ? {
          id: profileRow.id,
          fullName: profileRow.full_name,
          email: profileRow.email,
          initials: profileRow.initials,
          title: profileRow.title,
        }
      : buildFallbackProfile(authUser),
    memberships,
    activationRequired: memberships.length === 0,
    activeTenantId: memberships.length === 1 ? memberships[0].tenantId : null,
  };
}

export async function createTenantInvite(input: {
  tenantId: string;
  email: string | null;
  roleCode: string;
  expiresAt: string | null;
}) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const { data, error } = await supabase.rpc("create_tenant_invite", {
    p_tenant_id: input.tenantId,
    p_email: input.email ?? null,
    p_role_code: input.roleCode,
    p_expires_at: input.expiresAt ?? null,
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : null;
}

export async function listAdminMemberships(tenantId: string | null): Promise<AdminMembership[]> {
  if (!supabase || !tenantId) {
    return [];
  }

  const { data, error } = await supabase.rpc("admin_list_memberships", {
    p_tenant_id: tenantId,
  });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(mapAdminMembership);
}

export async function upsertAdminMembership(input: UpsertAdminMembershipInput): Promise<AdminMembership | null> {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const { data, error } = await supabase.rpc("admin_upsert_membership", {
    p_tenant_id: input.tenantId,
    p_user_email: input.email,
    p_role_code: input.roleCode,
    p_status: input.status,
    p_title: input.title,
  });

  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  return rows[0] ? mapAdminMembership(rows[0]) : null;
}

export async function updateAdminMembershipStatus(input: UpdateAdminMembershipStatusInput): Promise<AdminMembership | null> {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const { data, error } = await supabase.rpc("admin_update_membership_status", {
    p_membership_id: input.membershipId,
    p_status: input.status,
  });

  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return rows[0] ? mapAdminMembership(rows[0]) : null;
}

export async function inviteAuthUserSecure(input: InviteAuthUserSecureInput): Promise<InviteAuthUserSecureResult> {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const { data, error } = await supabase.functions.invoke("admin-invite-user", {
    body: {
      email: input.email,
      fullName: input.fullName ?? null,
      tenantId: input.tenantId,
      roleCode: input.roleCode ?? null,
      title: input.title ?? null,
      status: input.status ?? "active",
      createMembership: input.createMembership ?? true,
      mode: input.mode ?? "invite",
      temporaryPassword: input.temporaryPassword ?? null,
    },
  });

  if (error) {
    const record = asRecord(error);
    const context = asRecord(record.context);
    const status = typeof context.status === "number" ? context.status : null;
    const message = typeof record.message === "string" ? record.message : error.message;
    if (status === 404 || /not found|404/i.test(message)) {
      throw new Error("Funcion de invitacion pendiente de desplegar.");
    }
    throw new Error(message || "No se pudo invitar el usuario Auth.");
  }

  const record = asRecord(data);
  if (record.ok === false) {
    throw new Error(String(record.error ?? "No se pudo invitar el usuario Auth."));
  }

  return {
    ok: true,
    userId: String(record.userId ?? ""),
    email: String(record.email ?? input.email),
    membershipId: typeof record.membershipId === "string" ? record.membershipId : null,
    invited: Boolean(record.invited),
  };
}
