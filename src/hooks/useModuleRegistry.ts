import { useMemo } from "react";
import { MODULE_REGISTRY } from "@/config/moduleRegistry";
import { useAuthorization } from "@/hooks/useAuthorization";
import { usePlanEntitlements, useTenantSubscription } from "@/hooks/useSubscription";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { normalizePlanCode } from "@/lib/subscriptionAccess";
import { getModuleAccess, groupModulesByArea, searchModules } from "@/lib/moduleAccess";

export function useModuleRegistry(searchQuery = "") {
  const { hasPermission, isPlatformSuperadmin } = useAuthorization();
  const { activeTenant, enabledPacks, enabledModules } = useTenantRuntime();
  const tenantSubscription = useTenantSubscription(activeTenant?.id);
  const planEntitlements = usePlanEntitlements();
  const subscription = useMemo(
    () => {
      const planCode = normalizePlanCode(tenantSubscription.data?.planCode ?? "free");
      return {
        planCode,
        status: tenantSubscription.data?.status ?? (tenantSubscription.data ? "active" : "missing"),
        startsAt: tenantSubscription.data?.startsAt,
        endsAt: tenantSubscription.data?.endsAt,
        trialEndsAt: tenantSubscription.data?.trialEndsAt,
        courtesyEndsAt: tenantSubscription.data?.courtesyEndsAt,
        entitlements: (planEntitlements.data ?? [])
          .filter((item) => normalizePlanCode(item.planCode) === planCode)
          .map(({ featureKey, enabled, limitValue }) => ({ featureKey, enabled, limitValue })),
      };
    },
    [planEntitlements.data, tenantSubscription.data],
  );

  const modules = useMemo(() => {
    const filtered = searchModules(MODULE_REGISTRY, searchQuery);
    return filtered.map((module) => ({
      ...module,
      access: getModuleAccess(module, {
        enabledModules,
        enabledPacks,
        hasPermission,
        hasTenant: Boolean(activeTenant),
        subscription,
        bypassPlanGate: isPlatformSuperadmin,
      }),
    }));
  }, [activeTenant, enabledModules, enabledPacks, hasPermission, isPlatformSuperadmin, searchQuery, subscription]);

  const visibleModules = useMemo(() => modules.filter((module) => module.access.visible), [modules]);
  const sidebarModules = useMemo(
    () => visibleModules.filter((module) => module.showInSidebar),
    [visibleModules],
  );
  const groups = useMemo(() => groupModulesByArea(visibleModules), [visibleModules]);
  const sidebarGroups = useMemo(() => groupModulesByArea(sidebarModules), [sidebarModules]);

  return {
    groups,
    modules,
    sidebarGroups,
    sidebarModules,
    visibleModules,
  };
}
