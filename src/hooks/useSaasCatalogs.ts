import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTenantBlueprint,
  getClinicalModuleCatalog,
  getPlatformTenantSummaries,
  getSpecialtyPackCatalog,
  getSubscriptionPlansCatalog,
  getTenantCatalog,
} from "@/services/saasService";

export function useTenantCatalog() {
  return useQuery({
    queryKey: ["saas", "tenants"],
    queryFn: getTenantCatalog,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSubscriptionPlansCatalog() {
  return useQuery({
    queryKey: ["saas", "plans"],
    queryFn: getSubscriptionPlansCatalog,
    staleTime: 60_000,
    retry: 1,
  });
}

export function usePlatformTenantSummaries() {
  return useQuery({
    queryKey: ["saas", "platform-summaries"],
    queryFn: getPlatformTenantSummaries,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSpecialtyPackCatalog() {
  return useQuery({
    queryKey: ["saas", "specialty-packs"],
    queryFn: getSpecialtyPackCatalog,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useClinicalModuleCatalog() {
  return useQuery({
    queryKey: ["saas", "clinical-modules"],
    queryFn: getClinicalModuleCatalog,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCreateTenantBlueprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTenantBlueprint,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["saas", "tenants"] }),
        queryClient.invalidateQueries({ queryKey: ["saas", "platform-summaries"] }),
        queryClient.invalidateQueries({ queryKey: ["identity-context"] }),
      ]);
    },
  });
}
