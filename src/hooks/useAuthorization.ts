import { useMemo } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useRolePermissionCatalog } from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  getCurrentMembership,
  getEffectivePermissionIds,
  hasAnyPermission,
  hasEveryPermission,
  isPlatformSuperadminMembership,
} from "@/lib/authorization";

export function useAuthorization() {
  const { isAuthenticated, memberships } = useAuth();
  const { activeTenantId } = useTenantRuntime();
  const { data: roleCatalog } = useRolePermissionCatalog();

  const roles = useMemo(() => roleCatalog?.data?.roles ?? [], [roleCatalog?.data?.roles]);
  const permissions = useMemo(() => roleCatalog?.data?.permissions ?? [], [roleCatalog?.data?.permissions]);

  const currentMembership = useMemo(
    () => getCurrentMembership(memberships, activeTenantId),
    [activeTenantId, memberships],
  );

  const effectivePermissionIds = useMemo(() => {
    return getEffectivePermissionIds(roles, currentMembership?.roleCodes ?? []);
  }, [currentMembership?.roleCodes, roles]);

  const isPlatformSuperadmin = useMemo(() => isPlatformSuperadminMembership(memberships), [memberships]);
  const permissionContext = { isAuthenticated, isPlatformSuperadmin, effectivePermissionIds };

  return {
    currentMembership,
    effectivePermissionIds,
    hasPermission: (...permissionIds: string[]) => hasAnyPermission(permissionIds, permissionContext),
    hasAllPermissions: (...permissionIds: string[]) => hasEveryPermission(permissionIds, permissionContext),
    isAuthenticated,
    isPlatformSuperadmin,
    permissions,
    roles,
  };
}
