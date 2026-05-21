import { useEffect, useMemo } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useClinicalModuleCatalog, useSubscriptionPlansCatalog, useTenantCatalog } from "@/hooks/useSaasCatalogs";
import { resolveViewSource } from "@/lib/view-source";
import { useAppStore } from "@/store/app";

export function useTenantRuntime() {
  const { isAuthenticated, loading: authLoading, memberships, activeTenantId: authActiveTenantId } = useAuth();
  const { data: tenantCatalog, isLoading: tenantLoading, error: tenantError } = useTenantCatalog();
  const { data: plansCatalog } = useSubscriptionPlansCatalog();
  const { data: moduleCatalog } = useClinicalModuleCatalog();
  const activePack = useAppStore((state) => state.activePack);
  const selectedTenantId = useAppStore((state) => state.activeTenantId);
  const setActivePack = useAppStore((state) => state.setActivePack);
  const setActiveTenant = useAppStore((state) => state.setActiveTenant);

  const membershipTenantIds = useMemo(
    () => new Set(memberships.map((membership) => membership.tenantId)),
    [memberships],
  );

  const tenants = useMemo(() => {
    const catalogTenants = tenantCatalog?.data ?? [];
    return isAuthenticated
      ? catalogTenants.filter((tenant) => membershipTenantIds.has(tenant.id))
      : catalogTenants;
  }, [isAuthenticated, membershipTenantIds, tenantCatalog?.data]);

  const selectedTenantIsAllowed = selectedTenantId ? tenants.some((tenant) => tenant.id === selectedTenantId) : false;
  const resolvedActiveTenantId = authLoading
    ? selectedTenantId
    : isAuthenticated
      ? selectedTenantIsAllowed
        ? selectedTenantId
        : authActiveTenantId
      : selectedTenantId ?? tenants[0]?.id ?? null;
  const activeTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === resolvedActiveTenantId) ?? null,
    [resolvedActiveTenantId, tenants],
  );
  const activePlan = useMemo(
    () => plansCatalog?.data?.find((plan) => plan.id === activeTenant?.planId) ?? null,
    [activeTenant?.planId, plansCatalog?.data],
  );
  const enabledPacks = useMemo(() => activeTenant?.enabledPacks ?? [], [activeTenant?.enabledPacks]);
  const enabledModules = useMemo(() => activeTenant?.enabledModules ?? [], [activeTenant?.enabledModules]);
  const activePackModules = useMemo(() => {
    if (!activePack || activePack === "all") return [];
    return enabledModules
      .filter((module) => module.packId === activePack && module.enabled)
      .sort((left, right) => {
        const leftOrder = moduleCatalog?.data?.find((item) => item.id === left.moduleId)?.sortOrder ?? 999;
        const rightOrder = moduleCatalog?.data?.find((item) => item.id === right.moduleId)?.sortOrder ?? 999;
        return leftOrder - rightOrder;
      });
  }, [activePack, enabledModules, moduleCatalog?.data]);
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [tenantCatalog?.source, moduleCatalog?.source],
  });

  useEffect(() => {
    if (authLoading || tenantLoading) return;

    if (resolvedActiveTenantId && resolvedActiveTenantId !== selectedTenantId) {
      setActiveTenant(resolvedActiveTenantId);
      return;
    }

    if ((!resolvedActiveTenantId || !selectedTenantIsAllowed) && selectedTenantId && isAuthenticated) {
      setActiveTenant(null);
    }
  }, [authLoading, isAuthenticated, resolvedActiveTenantId, selectedTenantId, selectedTenantIsAllowed, setActiveTenant, tenantLoading]);

  useEffect(() => {
    if (activePack !== "all" && !enabledPacks.includes(activePack)) {
      setActivePack("all");
    }
  }, [activePack, enabledPacks, setActivePack]);

  return {
    activePack,
    activePackModules,
    activePlan,
    activeTenant,
    activeTenantId: activeTenant?.id ?? resolvedActiveTenantId ?? null,
    enabledModules,
    enabledPacks,
    hasTenantSelection: Boolean(activeTenant),
    isDemoMode: !authLoading && !isAuthenticated,
    isAuthenticated,
    isLoading: authLoading || tenantLoading,
    memberships,
    moduleCatalog: moduleCatalog?.data ?? [],
    plans: plansCatalog?.data ?? [],
    requiresActivation: isAuthenticated && !authLoading && memberships.length === 0,
    setActivePack,
    setActiveTenant,
    source: tenantCatalog?.source ?? "demo",
    tenantError,
    tenants,
    viewSource,
  };
}
