import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { getPediatricGrowthPatients, getPediatricGrowthRecords, savePediatricGrowthRecord } from "@/services/pediatricGrowthService";

export function usePediatricGrowthPatients() {
  const { activeTenantId } = useTenantRuntime();

  return useQuery({
    queryKey: ["clinical", "pediatric-growth", "patients", activeTenantId],
    queryFn: () => getPediatricGrowthPatients(activeTenantId),
    staleTime: 30_000,
  });
}

export function usePediatricGrowthRecords(patientId: string | null) {
  const { activeTenantId } = useTenantRuntime();

  return useQuery({
    queryKey: ["clinical", "pediatric-growth", "records", activeTenantId, patientId],
    queryFn: () => getPediatricGrowthRecords(activeTenantId, patientId),
    enabled: Boolean(patientId),
    staleTime: 20_000,
  });
}

export function useSavePediatricGrowthRecord() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePediatricGrowthRecord,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["clinical", "pediatric-growth", "records", activeTenantId, variables.patient.id] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "pediatric-growth", "patients", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
