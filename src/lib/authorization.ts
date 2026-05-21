export type AuthorizationRole = {
  id: string;
  permissions: string[];
};

export type AuthorizationMembership = {
  tenantId: string;
  roleCodes: string[];
};

export function getCurrentMembership<T extends AuthorizationMembership>(
  memberships: T[],
  activeTenantId: string | null | undefined,
): T | null {
  if (!activeTenantId) return null;
  return memberships.find((membership) => membership.tenantId === activeTenantId) ?? null;
}

export function getEffectivePermissionIds(roles: AuthorizationRole[], roleCodes: string[] = []) {
  const currentRoleCodes = new Set(roleCodes);
  return roles
    .filter((role) => currentRoleCodes.has(role.id))
    .flatMap((role) => role.permissions)
    .filter((permissionId, index, array) => array.indexOf(permissionId) === index);
}

export function isPlatformSuperadminMembership(memberships: AuthorizationMembership[]) {
  return memberships.some((membership) => membership.roleCodes.includes("platform_superadmin"));
}

export function hasAnyPermission(
  permissionIds: string[],
  context: { isAuthenticated: boolean; isPlatformSuperadmin: boolean; effectivePermissionIds: string[] },
) {
  if (!context.isAuthenticated) return false;
  if (context.isPlatformSuperadmin) return true;
  return permissionIds.some((permissionId) => context.effectivePermissionIds.includes(permissionId));
}

export function hasEveryPermission(
  permissionIds: string[],
  context: { isAuthenticated: boolean; isPlatformSuperadmin: boolean; effectivePermissionIds: string[] },
) {
  if (!context.isAuthenticated) return false;
  if (context.isPlatformSuperadmin) return true;
  return permissionIds.every((permissionId) => context.effectivePermissionIds.includes(permissionId));
}
