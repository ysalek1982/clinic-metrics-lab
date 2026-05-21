import { useQuery } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { getGrowthReferencesForTenant } from "@/services/growthReferenceService";

export function useGrowthReferences(packCode = "pediatric") {
  const { activeTenantId } = useTenantRuntime();

  return useQuery({
    queryKey: ["clinical", "growth-references", activeTenantId, packCode],
    queryFn: () => getGrowthReferencesForTenant(activeTenantId, packCode),
    staleTime: 60_000,
  });
}
