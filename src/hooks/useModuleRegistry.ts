import { useMemo } from "react";
import { MODULE_REGISTRY } from "@/config/moduleRegistry";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { getModuleAccess, groupModulesByArea, searchModules } from "@/lib/moduleAccess";

export function useModuleRegistry(searchQuery = "") {
  const { hasPermission } = useAuthorization();
  const { activeTenant, enabledPacks, enabledModules } = useTenantRuntime();

  const modules = useMemo(() => {
    const filtered = searchModules(MODULE_REGISTRY, searchQuery);
    return filtered.map((module) => ({
      ...module,
      access: getModuleAccess(module, {
        enabledModules,
        enabledPacks,
        hasPermission,
        hasTenant: Boolean(activeTenant),
      }),
    }));
  }, [activeTenant, enabledModules, enabledPacks, hasPermission, searchQuery]);

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
