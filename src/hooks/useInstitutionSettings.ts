import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { getInstitutionSettings, updateInstitutionSettings } from "@/services/institutionService";

export function useInstitutionSettings() {
  const { activeTenantId } = useTenantRuntime();

  return useQuery({
    queryKey: ["institution-settings", activeTenantId],
    queryFn: () => getInstitutionSettings(activeTenantId),
    staleTime: 30_000,
  });
}

export function useUpdateInstitutionSettings() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInstitutionSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["institution-settings", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["saas", "tenants"] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "references", activeTenantId] });
    },
  });
}
