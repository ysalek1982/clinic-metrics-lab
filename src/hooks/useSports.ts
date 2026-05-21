import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  createSportsAssessment,
  createSportsProfile,
  getSportsPerformanceForTenant,
  updateSportsProfile,
} from "@/services/sportsService";

function sportsKeys(tenantId: string | null) {
  return {
    performance: ["sports", "performance", tenantId] as const,
  };
}

function useSportsQueryGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    enabled: isDemoMode || Boolean(activeTenantId),
  };
}

export function useSportsPerformance() {
  const { activeTenantId, enabled } = useSportsQueryGate();
  return useQuery({
    queryKey: sportsKeys(activeTenantId).performance,
    queryFn: () => getSportsPerformanceForTenant(activeTenantId),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateSportsProfile() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSportsProfile,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: sportsKeys(activeTenantId).performance });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useUpdateSportsProfile() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSportsProfile,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: sportsKeys(activeTenantId).performance });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCreateSportsAssessment() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSportsAssessment,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: sportsKeys(activeTenantId).performance });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
