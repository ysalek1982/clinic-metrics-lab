import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCcorpAssessment,
  createCcorpReportSnapshot,
  getCcorpAssessment,
  listCcorpAssessments,
} from "@/services/ccorpLevel1Service";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";

function ccorpKeys(tenantId: string | null) {
  return {
    list: ["ccorp-level-1", "list", tenantId] as const,
    detail: (assessmentId: string | null) => ["ccorp-level-1", "detail", tenantId, assessmentId] as const,
  };
}

function useCcorpGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    allowDemo: isDemoMode,
    enabled: isDemoMode || Boolean(activeTenantId),
  };
}

export function useCcorpAssessments() {
  const { activeTenantId, allowDemo, enabled } = useCcorpGate();
  return useQuery({
    queryKey: ccorpKeys(activeTenantId).list,
    queryFn: () => listCcorpAssessments(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 20_000,
  });
}

export function useCcorpAssessment(assessmentId: string | null) {
  const { activeTenantId, allowDemo, enabled } = useCcorpGate();
  return useQuery({
    queryKey: ccorpKeys(activeTenantId).detail(assessmentId),
    queryFn: () => getCcorpAssessment(activeTenantId, assessmentId, { allowDemo }),
    enabled: enabled && Boolean(assessmentId),
    staleTime: 20_000,
  });
}

export function useCreateCcorpAssessment() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCcorpAssessment,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ccorpKeys(activeTenantId).list });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCreateCcorpReportSnapshot() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCcorpReportSnapshot,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ccorpKeys(activeTenantId).detail(variables.assessmentId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
