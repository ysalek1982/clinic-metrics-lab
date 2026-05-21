import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  createNutritionPlan,
  createReportRun,
  acknowledgeAlert,
  acknowledgeAlertsBulk,
  createEncounter,
  createPatient,
  getAlertsForTenant,
  getClinicalAssessmentsForTenant,
  getAuditEventsForTenant,
  getEncountersForTenant,
  getNutritionPlansForTenant,
  getPatientDetailBundle,
  getPatientsForTenant,
  getReportRunsForTenant,
  getRolePermissionCatalog,
  getScreeningResultsForTenant,
  getTeamForTenant,
  getTenantInvites,
  getTenantReferenceBundle,
  saveAnthropometrySession,
  saveClinicalAssessment,
  saveScreeningResult,
  updateEncounter,
  updateNutritionPlan,
  updatePatient,
} from "@/services/clinicalService";
import {
  createTenantInvite,
  inviteAuthUserSecure,
  listAdminMemberships,
  updateAdminMembershipStatus,
  upsertAdminMembership,
} from "@/services/identityService";

function tenantClinicalKeys(tenantId: string | null) {
  return {
    patients: ["clinical", "patients", tenantId] as const,
    encounters: ["clinical", "encounters", tenantId] as const,
    team: ["clinical", "team", tenantId] as const,
    references: ["clinical", "references", tenantId] as const,
    screenings: ["clinical", "screenings", tenantId] as const,
    audit: ["clinical", "audit", tenantId] as const,
    invites: ["identity", "invites", tenantId] as const,
    plans: ["clinical", "plans", tenantId] as const,
    alerts: ["clinical", "alerts", tenantId] as const,
    reports: ["clinical", "reports", tenantId] as const,
    assessments: ["clinical", "assessments", tenantId] as const,
  };
}

function useClinicalQueryGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    allowDemo: isDemoMode,
    enabled: isDemoMode || Boolean(activeTenantId),
  };
}

export function useTenantPatients() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).patients,
    queryFn: () => getPatientsForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 30_000,
  });
}

export function useTenantEncounters() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).encounters,
    queryFn: () => getEncountersForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 30_000,
  });
}

export function useTenantTeam() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).team,
    queryFn: () => getTeamForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 30_000,
  });
}

export function useTenantReferences() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).references,
    queryFn: () => getTenantReferenceBundle(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 60_000,
  });
}

export function usePatientDetail(patientId: string | null) {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: ["clinical", "patient-detail", activeTenantId, patientId],
    queryFn: () => getPatientDetailBundle(activeTenantId, patientId, { allowDemo }),
    enabled: enabled && Boolean(patientId),
    staleTime: 30_000,
  });
}

export function useRolePermissionCatalog() {
  const { allowDemo } = useClinicalQueryGate();
  return useQuery({
    queryKey: ["identity", "role-permission-catalog"],
    queryFn: () => getRolePermissionCatalog({ allowDemo }),
    staleTime: 60_000,
  });
}

export function useTenantInvites() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).invites,
    queryFn: () => getTenantInvites(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 15_000,
  });
}

export function useTenantScreenings() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).screenings,
    queryFn: () => getScreeningResultsForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 15_000,
  });
}

export function useTenantAudit() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).audit,
    queryFn: () => getAuditEventsForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 15_000,
  });
}

export function useTenantNutritionPlans() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).plans,
    queryFn: () => getNutritionPlansForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 15_000,
  });
}

export function useTenantAlerts() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).alerts,
    queryFn: () => getAlertsForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 15_000,
  });
}

export function useTenantReports() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).reports,
    queryFn: () => getReportRunsForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 15_000,
  });
}

export function useTenantClinicalAssessments() {
  const { activeTenantId, allowDemo, enabled } = useClinicalQueryGate();
  return useQuery({
    queryKey: tenantClinicalKeys(activeTenantId).assessments,
    queryFn: () => getClinicalAssessmentsForTenant(activeTenantId, { allowDemo }),
    enabled,
    staleTime: 15_000,
  });
}

export function useCreatePatient() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPatient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).patients });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useUpdatePatient() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePatient,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).patients });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useCreateEncounter() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEncounter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).encounters });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).patients });
    },
  });
}

export function useUpdateEncounter() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEncounter,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).encounters });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).patients });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useCreateTenantInvite() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTenantInvite,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).invites });
    },
  });
}

export function useAdminMemberships(targetTenantId?: string | null) {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  const tenantId = targetTenantId ?? activeTenantId;

  return useQuery({
    queryKey: ["identity", "admin-memberships", tenantId],
    queryFn: () => listAdminMemberships(tenantId),
    enabled: !isDemoMode && Boolean(tenantId),
    staleTime: 15_000,
  });
}

export function useUpsertAdminMembership() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertAdminMembership,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["identity", "admin-memberships", variables.tenantId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(variables.tenantId).team });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(variables.tenantId).audit });
      await queryClient.invalidateQueries({ queryKey: ["identity-context"] });
      if (variables.tenantId !== activeTenantId) {
        await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).team });
      }
    },
  });
}

export function useUpdateAdminMembershipStatus() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminMembershipStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["identity", "admin-memberships"] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).team });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
      await queryClient.invalidateQueries({ queryKey: ["identity-context"] });
    },
  });
}

export function useAdminInviteUser() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteAuthUserSecure,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["identity", "admin-memberships", variables.tenantId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(variables.tenantId).team });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(variables.tenantId).audit });
      await queryClient.invalidateQueries({ queryKey: ["identity-context"] });
      if (variables.tenantId !== activeTenantId) {
        await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).team });
      }
    },
  });
}

export function useSaveClinicalAssessment() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveClinicalAssessment,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).patients });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).encounters });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useSaveScreeningResult() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveScreeningResult,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).screenings });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).patients });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).alerts });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useSaveAnthropometrySession() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveAnthropometrySession,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).alerts });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useCreateNutritionPlan() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNutritionPlan,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).plans });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).alerts });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useUpdateNutritionPlan() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNutritionPlan,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).plans });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).alerts });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useCreateReportRun() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReportRun,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).reports });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useAcknowledgeAlert() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).alerts });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}

export function useBulkAcknowledgeAlerts() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acknowledgeAlertsBulk,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).alerts });
      await queryClient.invalidateQueries({ queryKey: tenantClinicalKeys(activeTenantId).audit });
    },
  });
}
