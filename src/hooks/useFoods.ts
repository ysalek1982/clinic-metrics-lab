import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { createTenantFoodItem, listFoodGroups, listFoodItems, type FoodFilters } from "@/services/foodService";

export function foodKeys(tenantId: string | null) {
  return {
    groups: ["foods", "groups"] as const,
    items: (filters: FoodFilters = {}) => ["foods", tenantId, "items", filters] as const,
  };
}

function useFoodGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    enabled: Boolean(activeTenantId) && !isDemoMode,
  };
}

export function useFoodGroups() {
  const { enabled } = useFoodGate();
  return useQuery({
    queryKey: foodKeys(null).groups,
    queryFn: listFoodGroups,
    enabled,
    staleTime: 60_000,
  });
}

export function useFoodItems(filters: FoodFilters = {}) {
  const { activeTenantId, enabled } = useFoodGate();
  return useQuery({
    queryKey: foodKeys(activeTenantId).items(filters),
    queryFn: () => listFoodItems(activeTenantId as string, filters),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateTenantFoodItem() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantFoodItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["foods", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
