import { useQuery } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { listLabPatients } from "@/services/labService";

export function labKeys(tenantId: string | null) {
  return {
    patients: ["labs", "patients", tenantId] as const,
  };
}

export function useLabs() {
  const { activeTenantId, isDemoMode, isLoading: tenantLoading } = useTenantRuntime();

  const query = useQuery({
    queryKey: labKeys(activeTenantId).patients,
    queryFn: () => listLabPatients(activeTenantId),
    enabled: !tenantLoading && !isDemoMode && Boolean(activeTenantId),
    staleTime: 30_000,
    retry: 1,
  });

  return {
    ...query,
    activeTenantId,
    isDemoMode,
    tenantLoading,
  };
}
