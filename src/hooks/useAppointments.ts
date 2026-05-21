import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  cancelAppointment,
  completeAppointment,
  createAppointment,
  listAppointments,
  listPatientAppointments,
  listUpcomingAppointments,
  updateAppointment,
} from "@/services/appointmentService";

export function appointmentKeys(tenantId: string | null) {
  return {
    all: ["appointments", tenantId] as const,
    week: (weekStart: string, weekEnd: string) => ["appointments", tenantId, "week", weekStart, weekEnd] as const,
    upcoming: ["appointments", tenantId, "upcoming"] as const,
    patient: (patientId: string | null) => ["appointments", tenantId, "patient", patientId] as const,
  };
}

function useAppointmentGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    enabled: Boolean(activeTenantId) && !isDemoMode,
  };
}

export function useAppointments(weekStart: string, weekEnd: string) {
  const { activeTenantId, enabled } = useAppointmentGate();

  return useQuery({
    queryKey: appointmentKeys(activeTenantId).week(weekStart, weekEnd),
    queryFn: () => listAppointments(activeTenantId as string, weekStart, weekEnd),
    enabled,
    staleTime: 15_000,
  });
}

export function useUpcomingAppointments() {
  const { activeTenantId, enabled } = useAppointmentGate();

  return useQuery({
    queryKey: appointmentKeys(activeTenantId).upcoming,
    queryFn: () => listUpcomingAppointments(activeTenantId as string),
    enabled,
    staleTime: 15_000,
  });
}

export function usePatientAppointments(patientId: string | null) {
  const { activeTenantId, enabled } = useAppointmentGate();

  return useQuery({
    queryKey: appointmentKeys(activeTenantId).patient(patientId),
    queryFn: () => listPatientAppointments(activeTenantId as string, patientId as string),
    enabled: enabled && Boolean(patientId),
    staleTime: 15_000,
  });
}

export function useCreateAppointment() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: appointmentKeys(activeTenantId).patient(variables.patientId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useUpdateAppointment() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppointment,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys(activeTenantId).all });
      if (variables.patientId) {
        await queryClient.invalidateQueries({ queryKey: appointmentKeys(activeTenantId).patient(variables.patientId) });
        await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      }
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCompleteAppointment() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeAppointment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCancelAppointment() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
