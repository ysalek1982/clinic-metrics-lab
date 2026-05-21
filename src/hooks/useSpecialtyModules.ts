import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  auditEnteralReportExport,
  closeParenteralPlan,
  createEnteralPlan,
  createEnteralDailyLog,
  createParenteralMonitoringLog,
  createParenteralPlan,
  createPregnancyRecord,
  createSportsBodycompSnapshot,
  getEnteralCareForTenant,
  getParenteralCareForTenant,
  getPregnancyRecordsForTenant,
  getSportsPerformanceForTenant,
  updateEnteralPlan,
  updateEnteralPlanStatus,
  updateParenteralPlan,
} from "@/services/specialtyService";

function useSpecialtyQueryGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    enabled: isDemoMode || Boolean(activeTenantId),
  };
}

export function usePregnancyRecords() {
  const { activeTenantId, enabled } = useSpecialtyQueryGate();
  return useQuery({
    queryKey: ["specialty", "pregnancy-records", activeTenantId],
    queryFn: () => getPregnancyRecordsForTenant(activeTenantId),
    enabled,
    staleTime: 30_000,
  });
}

export function useEnteralCare() {
  const { activeTenantId, enabled } = useSpecialtyQueryGate();
  return useQuery({
    queryKey: ["specialty", "enteral-care", activeTenantId],
    queryFn: () => getEnteralCareForTenant(activeTenantId),
    enabled,
    staleTime: 30_000,
  });
}

export function useParenteralCare() {
  const { activeTenantId, enabled } = useSpecialtyQueryGate();
  return useQuery({
    queryKey: ["specialty", "parenteral-care", activeTenantId],
    queryFn: () => getParenteralCareForTenant(activeTenantId),
    enabled,
    staleTime: 30_000,
  });
}

export function useSportsPerformance() {
  const { activeTenantId, enabled } = useSpecialtyQueryGate();
  return useQuery({
    queryKey: ["specialty", "sports-performance", activeTenantId],
    queryFn: () => getSportsPerformanceForTenant(activeTenantId),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateParenteralPlan() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createParenteralPlan,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "parenteral-care", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useUpdateParenteralPlan() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateParenteralPlan,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "parenteral-care", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCreateParenteralMonitoringLog() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createParenteralMonitoringLog,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "parenteral-care", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, result.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCloseParenteralPlan() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeParenteralPlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "parenteral-care", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCreatePregnancyRecord() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPregnancyRecord,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "pregnancy-records", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCreateEnteralPlan() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEnteralPlan,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "enteral-care", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "alerts", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCreateEnteralDailyLog() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEnteralDailyLog,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "enteral-care", activeTenantId] });
      if (result.patientId) {
        await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, result.patientId] });
      }
      await queryClient.invalidateQueries({ queryKey: ["clinical", "alerts", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useUpdateEnteralPlan() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEnteralPlan,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "enteral-care", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "alerts", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useUpdateEnteralPlanStatus() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEnteralPlanStatus,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "enteral-care", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, result.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "alerts", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useExportEnteralReportAudit() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: auditEnteralReportExport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCreateSportsBodycompSnapshot() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSportsBodycompSnapshot,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["specialty", "sports-performance", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
